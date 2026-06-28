from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.core.dependencies import get_current_user
from app.schemas.analytics import RecruiterDashboardMetrics

router = APIRouter()

def get_current_recruiter(current_user: User = Depends(get_current_user)) -> User:
    if current_user.user_type != 1:  # 1 = Recruiter
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can access analytics"
        )
    return current_user

@router.get("/dashboard", response_model=RecruiterDashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    """
    Get high-level dashboard metrics for the recruiter.
    """
    # 1. Open Jobs
    open_jobs = db.query(Job).filter(
        Job.recruiter_id == current_user.id,
        Job.status == "active"
    ).count()

    # 2. Total Applications (across all jobs for this recruiter)
    total_applications = db.query(Application).join(Job).filter(
        Job.recruiter_id == current_user.id
    ).count()

    # 3. Candidates in pipeline (Distinct candidates across all active applications)
    candidates_in_pipeline = db.query(func.count(func.distinct(Application.candidate_id))).join(Job).filter(
        Job.recruiter_id == current_user.id,
        Application.status.in_(["applied", "reviewed", "shortlisted", "interview"])
    ).scalar() or 0

    # 4. Average Fit Score
    avg_fit_score = db.query(func.avg(Application.match_score)).join(Job).filter(
        Job.recruiter_id == current_user.id
    ).scalar() or 0.0

    # 5. Average Trust Score (mocked for now, pending Trust Score implementation)
    avg_trust_score = 0.0

    return RecruiterDashboardMetrics(
        open_jobs=open_jobs,
        total_applications=total_applications,
        candidates_in_pipeline=candidates_in_pipeline,
        avg_fit_score=round(avg_fit_score, 1),
        avg_trust_score=avg_trust_score
    )
