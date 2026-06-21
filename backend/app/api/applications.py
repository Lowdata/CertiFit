from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.core.dependencies import get_current_candidate
from app.core.dependencies import get_current_recruiter
from app.db.database import get_db
from app.models.user import User
from app.schemas.application import ApplicationResponse
from app.schemas.application import ApplicationListResponse
from app.schemas.application import ApplicationStatusUpdateRequest
from app.schemas.application import CandidateReportResponse
from app.services.application_service import (
    ApplicationNotFoundError,
    InvalidApplicationStatusTransitionError,
    get_applications_for_candidate
)
from app.services.application_service import update_application_status
from app.services.candidate_service import (
    get_candidate_by_user_id
)


router = APIRouter()


def _application_summary(application):

    return {
        "id": application.id,
        "job_id": application.job_id,
        "candidate_id": application.candidate_id,
        "status": application.status,
        "match_score": application.match_score,
        "match_summary": application.match_summary,
        "strengths": application.strengths_json,
        "gaps": application.gaps_json,
        "applied_at": application.applied_at,
        "updated_at": application.updated_at
    }


@router.get("/me", response_model=ApplicationListResponse)
def list_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_candidate
    )
):

    candidate = get_candidate_by_user_id(
        db=db,
        user_id=current_user.id
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    applications = get_applications_for_candidate(
        db=db,
        candidate_id=candidate.id
    )

    return {
        "data": [
            _application_summary(application)
            for application in applications
        ]
    }


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def change_application_status(
    application_id: int,
    data: ApplicationStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_recruiter
    )
):

    try:
        application = update_application_status(
            db=db,
            application_id=application_id,
            recruiter_id=current_user.id,
            status=data.status
        )

    except ApplicationNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

    except InvalidApplicationStatusTransitionError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    return _application_summary(application)


@router.get("/{application_id}/candidate-report", response_model=CandidateReportResponse)
def get_candidate_report(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    """
    Demo endpoint — returns the full candidate intelligence report in one call.
    Recruiter must own the job linked to this application.
    """
    from app.models.application import Application
    from app.models.candidate import Candidate
    from app.models.job import Job
    from app.services.application_service import build_claims_report
    from app.services.interview_service import generate_interview_plan

    row = (
        db.query(Application, Candidate, Job)
        .join(Job, Application.job_id == Job.id)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .filter(
            Application.id == application_id,
            Job.recruiter_id == current_user.id,
        )
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Application not found or access denied",
        )

    application, candidate, job = row
    profile = candidate.normalized_profile_json or {}
    trust = candidate.trust_score_json or {}

    interview_plan = generate_interview_plan(
        job=job,
        candidate=candidate,
        application=application,
    )

    claims = build_claims_report(candidate)
    verified_claims = [c for c in claims if c["verified"]]
    unverified_claims = [c for c in claims if not c["verified"]]

    return {
        "application_id": application.id,
        "candidate_id": candidate.id,
        "job_id": job.id,
        "status": application.status,
        "fit_score": application.fit_score,
        "trust_score": application.trust_score,
        "composite_score": application.composite_score,
        "score_explanations": application.score_explanations or {},
        "strengths": application.strengths_json or [],
        "concerns": trust.get("concerns") or [],
        "unsupported_claims": trust.get("unsupported_claims") or [],
        "evidence_map": profile.get("evidence_map") or {},
        "skill_confidence": profile.get("skill_confidence") or {},
        "verified_skills": profile.get("verified_skills") or [],
        "confidence_score": profile.get("confidence_score", 0),
        "claims": claims,
        "claims_summary": {
            "total_claims": len(claims),
            "verified_count": len(verified_claims),
            "unverified_count": len(unverified_claims),
            "verified_skills": [c["skill"] for c in verified_claims],
            "unverified_skills": [c["skill"] for c in unverified_claims],
        },
        "interview_plan": interview_plan,
    }