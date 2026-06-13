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
