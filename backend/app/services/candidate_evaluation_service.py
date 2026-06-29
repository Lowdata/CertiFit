import json
import logging
from datetime import datetime, timedelta, UTC
from sqlalchemy.orm import Session, load_only
from app.db.database import SessionLocal
from app.models.application import Application, AIStatus
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.assessment import AssessmentRecording, AssessmentQuestion
from app.services.storage_service import download_file
from app.services.media_service import extract_audio_from_video, transcribe_audio
from app.services.assessment_evaluator import evaluate_question_answer
import os
import tempfile
from app.services.llm_validation import safe_gemini_call
import google.genai as genai
from app.core.config import GEMINI_API_KEY
import hashlib

logger = logging.getLogger(__name__)

from app.services.prompts.evaluation_prompt import build_evaluation_prompt, EVALUATOR_PROMPT_TEMPLATE

SCHEMA_KEYS = [
    "final_fit", "confidence", "fit_reasoning", "matched_skills", "missing_skills",
    "screening", "trust_explanation", "behavioral_insights", "recommendation"
]

def _generate_input_hash(candidate: Candidate, job: Job, application: Application) -> str:
    """Generate a hash based on the core evaluation inputs to allow caching."""
    data = {
        "candidate_id": candidate.id,
        "job_id": job.id,
        "profile": candidate.normalized_profile_json,
        "screening": application.screening_answers
    }
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()

def process_pending_evaluations():
    """
    Poll the database for QUEUED or RETRYING applications and process them.
    This should be run via cron or a lightweight background loop.
    """
    db: Session = SessionLocal()
    try:
        # Fetch up to 3 applications that are ready to be evaluated
        now = datetime.now(UTC)
        applications = (
            db.query(Application)
            .filter(
                (Application.ai_status == AIStatus.QUEUED) |
                ((Application.ai_status == AIStatus.RETRYING) & (Application.ai_retry_after <= now))
            )
            .order_by(Application.applied_at)
            .limit(3)
            .all()
        )

        if not applications:
            return

        client = genai.Client(api_key=GEMINI_API_KEY)

        for application in applications:
            try:
                # Mark as processing
                application.ai_status = AIStatus.PROCESSING
                db.commit()

                # Load only what we need to minimize memory footprint
                candidate = (
                    db.query(Candidate)
                    .options(
                        load_only(
                            Candidate.id, 
                            Candidate.normalized_profile_json,
                            Candidate.trust_score_json
                        )
                    )
                    .filter(Candidate.id == application.candidate_id)
                    .first()
                )
                
                job = (
                    db.query(Job)
                    .options(
                        load_only(Job.id, Job.title, Job.parsed_jd_json)
                    )
                    .filter(Job.id == application.job_id)
                    .first()
                )

                if not candidate or not job:
                    application.ai_status = AIStatus.FAILED
                    application.ai_status_metadata = {"error": "Missing job or candidate data"}
                    db.commit()
                    continue

                # Check cache hash
                input_hash = _generate_input_hash(candidate, job, application)
                if application.ai_input_hash == input_hash and application.ai_status_metadata and "cached" in application.ai_status_metadata:
                    # If somehow it was queued but hash didn't change (e.g. manual requeue)
                    pass 

                prompt = build_evaluation_prompt(
                    candidate_profile=json.dumps(candidate.normalized_profile_json),
                    job_details=json.dumps(job.parsed_jd_json),
                    screening_answers=json.dumps(application.screening_answers),
                    trust_evidence=json.dumps(candidate.trust_score_json.get("evidence", {})) if candidate.trust_score_json else "{}",
                    assessment_results=None # Will be passed when added
                )

                logger.info(f"LLM CALL START Application: {application.id}")

                def fallback_fn(reason):
                    raise RuntimeError(f"LLM Call Failed: {reason}")

                result, used_fallback = safe_gemini_call(
                    client=client,
                    prompt=prompt,
                    schema_keys=SCHEMA_KEYS,
                    fallback_fn=fallback_fn,
                    label="unified_evaluation"
                )

                # Persist results
                application.final_fit = result.get("final_fit", application.baseline_fit)
                application.ai_status_metadata = {
                    "confidence": result.get("confidence", 0.0),
                    "fit_reasoning": result.get("fit_reasoning", []),
                    "matched_skills": result.get("matched_skills", []),
                    "missing_skills": result.get("missing_skills", []),
                    "screening_eval": result.get("screening", {}),
                    "trust_explanation": result.get("trust_explanation", ""),
                    "behavioral_insights": result.get("behavioral_insights", {}),
                    "recommendation": result.get("recommendation", "")
                }
                application.ai_status = AIStatus.COMPLETE
                application.ai_input_hash = input_hash
                application.ai_retry_count = 0
                db.commit()
                logger.info(f"Successfully evaluated application {application.id}")

            except Exception as e:
                db.rollback()
                error_msg = str(e)
                logger.warning(f"Failed to evaluate application {application.id}: {error_msg}")
                
                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                    application.ai_status = AIStatus.RETRYING
                    application.ai_retry_count += 1
                    # Exponential backoff: 30s, 60s, 120s...
                    delay_seconds = 30 * (2 ** (application.ai_retry_count - 1))
                    application.ai_retry_after = datetime.now(UTC) + timedelta(seconds=delay_seconds)
                    application.ai_status_metadata = {
                        "reason": "quota_exceeded",
                        "retry_count": application.ai_retry_count,
                        "delay_seconds": delay_seconds
                    }
                else:
                    application.ai_status = AIStatus.FAILED
                    application.ai_status_metadata = {"error": error_msg}
                db.commit()

    finally:
        db.close()

def process_pending_recordings():
    """
    Poll the database for QUEUED or RETRYING assessment recordings and process them.
    Includes Whisper transcription and Gemini evaluation.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.now(UTC)
        recordings = (
            db.query(AssessmentRecording)
            .filter(
                (AssessmentRecording.ai_status == AIStatus.QUEUED) |
                ((AssessmentRecording.ai_status == AIStatus.RETRYING) & (AssessmentRecording.ai_retry_after <= now))
            )
            .order_by(AssessmentRecording.created_at)
            .limit(3)
            .all()
        )

        if not recordings:
            return

        for recording in recordings:
            try:
                recording.ai_status = AIStatus.PROCESSING
                db.commit()
                
                question = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == recording.question_id).first()
                if not question or not recording.video_url:
                    raise ValueError("Missing question or video_url")
                
                # Assume video_url actually stores object_key as updated earlier
                object_key = recording.video_url
                
                with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_video:
                    video_path = temp_video.name
                    
                success = download_file(object_key, video_path)
                if not success:
                    raise RuntimeError("Failed to download video from R2")
                    
                audio_path = extract_audio_from_video(video_path)
                transcript = transcribe_audio(audio_path)
                recording.transcript_text = transcript
                
                # Evaluate using Gemini (this handles 429 internally in evaluator, or raises it)
                # Note: evaluate_question_answer likely uses its own client, but we will catch 429s below
                evaluation = evaluate_question_answer(transcript, question.question_text, question.question_type)
                recording.ai_evaluation_json = evaluation
                
                # Cleanup
                if os.path.exists(video_path):
                    os.remove(video_path)
                if os.path.exists(audio_path):
                    os.remove(audio_path)
                    
                recording.ai_status = AIStatus.COMPLETE
                recording.ai_retry_count = 0
                db.commit()
                logger.info(f"Successfully evaluated recording {recording.id}")
                
            except Exception as e:
                db.rollback()
                error_msg = str(e)
                logger.warning(f"Failed to evaluate recording {recording.id}: {error_msg}")
                
                # Clean up temp files if they exist on error
                try:
                    if 'video_path' in locals() and os.path.exists(video_path):
                        os.remove(video_path)
                    if 'audio_path' in locals() and os.path.exists(audio_path):
                        os.remove(audio_path)
                except Exception:
                    pass

                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                    recording.ai_status = AIStatus.RETRYING
                    recording.ai_retry_count += 1
                    delay_seconds = 30 * (2 ** (recording.ai_retry_count - 1))
                    recording.ai_retry_after = datetime.now(UTC) + timedelta(seconds=delay_seconds)
                else:
                    recording.ai_status = AIStatus.FAILED
                db.commit()
    finally:
        db.close()
