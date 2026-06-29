from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.services.company_service import get_company_by_recruiter, create_company, update_company

router = APIRouter()

def get_current_recruiter(current_user: User = Depends(get_current_user)) -> User:
    if current_user.user_type != 1:  # 1 = Recruiter
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can access company profiles"
        )
    return current_user

@router.get("/me", response_model=CompanyResponse)
def read_company_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    """
    Get the company profile for the currently authenticated recruiter.
    """
    company = get_company_by_recruiter(db, recruiter_id=current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found"
        )
    return company

@router.put("/me", response_model=CompanyResponse)
def update_company_me(
    company_in: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    """
    Update or create the company profile for the currently authenticated recruiter.
    """
    company = get_company_by_recruiter(db, recruiter_id=current_user.id)
    if not company:
        # Create it
        company_create = CompanyCreate(**company_in.model_dump())
        company = create_company(db, recruiter_id=current_user.id, company_in=company_create)
    else:
        # Update it
        company = update_company(db, company=company, company_in=company_in)
    return company
