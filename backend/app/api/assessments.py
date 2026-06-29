from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.dependencies import get_current_candidate, get_current_recruiter, get_db
from app.models.user import User
from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.assessment import Assessment, AssessmentQuestion, AssessmentRecording
from app.services.interview_service import generate_interview_plan
from app.services.storage_service import generate_presigned_upload_url, get_public_url
from app.services.assessment_evaluator import generate_final_assessment_report

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.post("/start/{application_id}")
def start_assessment(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate)
):
    # Verify candidate owns application
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.candidate_id == candidate.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.id == application.job_id).first()

    # Check if assessment exists
    assessment = db.query(Assessment).filter(Assessment.application_id == application.id).first()
    if not assessment:
        # Create new assessment
        assessment = Assessment(
            application_id=application.id,
            status="in_progress"
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        
        # Generate questions
        plan = generate_interview_plan(job, candidate, application)
        questions = []
        
        # Select 2 tech, 1 behavioral, 1 project for MVP
        tech_qs = plan.get("technical_questions", [])[:2]
        beh_qs = plan.get("behavioral_questions", [])[:1]
        proj_qs = plan.get("project_questions", [])[:1]
        
        order = 0
        for q in tech_qs:
            questions.append(AssessmentQuestion(assessment_id=assessment.id, order_index=order, question_text=q, question_type="technical"))
            order += 1
        for q in beh_qs:
            questions.append(AssessmentQuestion(assessment_id=assessment.id, order_index=order, question_text=q, question_type="behavioral"))
            order += 1
        for q in proj_qs:
            questions.append(AssessmentQuestion(assessment_id=assessment.id, order_index=order, question_text=q, question_type="project"))
            order += 1
            
        db.add_all(questions)
        db.commit()
        
    return {
        "assessment_id": assessment.id,
        "status": assessment.status,
        "current_question_index": assessment.current_question_index
    }


@router.get("/me/{assessment_id}/current-question")
def get_current_question(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # Security check (ensure candidate owns the app)
    app = db.query(Application).filter(Application.id == assessment.application_id).first()
    cand = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not app or not cand or app.candidate_id != cand.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if assessment.status == "completed":
        return {"status": "completed", "question": None}

    question = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.assessment_id == assessment.id,
        AssessmentQuestion.order_index == assessment.current_question_index
    ).first()
    
    if not question:
        # Reached the end
        assessment.status = "completed"
        # Generate final report
        recordings = db.query(AssessmentRecording).join(AssessmentQuestion).filter(AssessmentQuestion.assessment_id == assessment.id).all()
        evals = [r.ai_evaluation_json for r in recordings if r.ai_evaluation_json]
        assessment.evaluation_summary_json = generate_final_assessment_report(evals)
        if assessment.evaluation_summary_json.get("overall_score"):
            assessment.overall_score = assessment.evaluation_summary_json["overall_score"]
        db.commit()
        return {"status": "completed", "question": None}
        
    return {
        "status": "in_progress",
        "question": {
            "id": question.id,
            "text": question.question_text,
            "type": question.question_type,
            "index": question.order_index
        }
    }


@router.post("/me/{assessment_id}/question/{question_id}/presigned-url")
def get_presigned_url(
    assessment_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate)
):
    url_data = generate_presigned_upload_url(".webm", "video/webm")
    if not url_data:
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")
    return url_data


from pydantic import BaseModel

class SubmitRecordingRequest(BaseModel):
    object_key: str
    tab_switches: int = 0


def process_recording_background(db: Session, recording_id: int, object_key: str):
    from app.services.storage_service import download_file
    from app.services.media_service import extract_audio_from_video, transcribe_audio
    from app.services.assessment_evaluator import evaluate_question_answer
    import os
    import tempfile
    
    recording = db.query(AssessmentRecording).filter(AssessmentRecording.id == recording_id).first()
    if not recording:
        return
        
    question = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == recording.question_id).first()
    
    # We need a fresh DB session for the background task if not properly detached, but passing db works for basic test
    try:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_video:
            video_path = temp_video.name
            
        success = download_file(object_key, video_path)
        if success:
            audio_path = extract_audio_from_video(video_path)
            transcript = transcribe_audio(audio_path)
            recording.transcript_text = transcript
            
            evaluation = evaluate_question_answer(transcript, question.question_text, question.question_type)
            recording.ai_evaluation_json = evaluation
            
            # Clean up
            os.remove(video_path)
            if os.path.exists(audio_path):
                os.remove(audio_path)
                
            db.commit()
    except Exception as e:
        print(f"Background processing failed: {e}")
        # In a real app we'd mark the recording as failed


@router.post("/me/{assessment_id}/question/{question_id}/submit")
def submit_recording(
    assessment_id: int,
    question_id: int,
    data: SubmitRecordingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    # Ensure a recording entry exists
    recording = db.query(AssessmentRecording).filter(AssessmentRecording.question_id == question_id).first()
    if not recording:
        recording = AssessmentRecording(
            question_id=question_id,
            video_url=get_public_url(data.object_key)
        )
        db.add(recording)
        db.commit()
        db.refresh(recording)
    else:
        recording.video_url = get_public_url(data.object_key)
        db.commit()
        
    background_tasks.add_task(process_recording_background, db, recording.id, data.object_key)
    
    # Advance question index
    assessment.current_question_index += 1
    
    # Track integrity signals (tab switches)
    signals = assessment.integrity_signals or []
    signals.append({
        "question_id": question_id,
        "tab_switches": data.tab_switches
    })
    assessment.integrity_signals = signals
    
    db.commit()
    
    return {"status": "processing"}


@router.get("/{assessment_id}")
def get_assessment_for_recruiter(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # Verify recruiter owns the job
    app = db.query(Application).filter(Application.id == assessment.application_id).first()
    job = db.query(Job).filter(Job.id == app.job_id).first()
    if job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.assessment_id == assessment_id).order_by(AssessmentQuestion.order_index).all()
    
    result = []
    for q in questions:
        rec = db.query(AssessmentRecording).filter(AssessmentRecording.question_id == q.id).first()
        result.append({
            "question": {
                "id": q.id,
                "text": q.question_text,
                "type": q.question_type,
                "index": q.order_index
            },
            "recording": {
                "video_url": rec.video_url if rec else None,
                "transcript": rec.transcript_text if rec else None,
                "evaluation": rec.ai_evaluation_json if rec else None
            } if rec else None
        })
        
    return {
        "assessment": {
            "id": assessment.id,
            "status": assessment.status,
            "overall_score": assessment.overall_score,
            "evaluation_summary": assessment.evaluation_summary_json
        },
        "questions": result
    }

@router.get("/application/{application_id}")
def get_assessment_by_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    job = db.query(Job).filter(Job.id == app.job_id).first()
    if job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    assessment = db.query(Assessment).filter(Assessment.application_id == application_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    return get_assessment_for_recruiter(assessment.id, db, current_user)
