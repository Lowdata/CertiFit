from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.application import Application
from app.models.job import Job
from app.models.candidate import Candidate
from app.core.dependencies import get_current_recruiter
from app.services.interview_service import generate_interview_plan

router = APIRouter()


def _verify_recruiter_owns_application(
    db: Session,
    application_id: int,
    recruiter_id: int,
) -> tuple[Application, Candidate, Job]:
    """
    Load application + candidate + job, verify the recruiter owns the job.
    Raises 404 if not found or not owned.
    """
    row = (
        db.query(Application, Candidate, Job)
        .join(Job, Application.job_id == Job.id)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .filter(
            Application.id == application_id,
            Job.recruiter_id == recruiter_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(
            status_code=404,
            detail="Application not found or access denied",
        )
    return row


@router.post("/{application_id}/interview-plan")
def create_interview_plan(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    """
    Generate a structured interview plan for a candidate application.
    Recruiter must own the job linked to the application.
    """
    application, candidate, job = _verify_recruiter_owns_application(
        db=db,
        application_id=application_id,
        recruiter_id=current_user.id,
    )

    plan = generate_interview_plan(
        job=job,
        candidate=candidate,
        application=application,
    )

    return {
        "application_id": application_id,
        "job_id": job.id,
        "candidate_id": candidate.id,
        "interview_plan": plan,
    }
