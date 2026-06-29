from typing import Optional
from sqlalchemy.orm import Session
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate

def get_company_by_recruiter(db: Session, recruiter_id: int) -> Optional[Company]:
    return db.query(Company).filter(Company.recruiter_id == recruiter_id).first()

def get_company_by_id(db: Session, company_id: int) -> Optional[Company]:
    return db.query(Company).filter(Company.id == company_id).first()

def create_company(db: Session, recruiter_id: int, company_in: CompanyCreate) -> Company:
    company = Company(
        recruiter_id=recruiter_id,
        name=company_in.name,
        logo_url=company_in.logo_url,
        website=company_in.website,
        industry=company_in.industry,
        size=company_in.size,
        culture=company_in.culture,
        benefits=company_in.benefits
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

def update_company(db: Session, company: Company, company_in: CompanyUpdate) -> Company:
    update_data = company_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    db.commit()
    db.refresh(company)
    return company
