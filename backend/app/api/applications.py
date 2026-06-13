from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.core.dependencies import get_current_candidate
from app.db.database import get_db
from app.models.user import User
from app.services.application_service import (
    get_applications_for_candidate
)
from app.services.candidate_service import (
    get_candidate_by_user_id
)


router = APIRouter()


@router.get("/me")
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
            {
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
            for application in applications
        ]
    }
