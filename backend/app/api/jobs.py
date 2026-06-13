from fastapi import APIRouter , Depends, Query
from typing import Optional
from app.schemas.job import JobInput
from app.services.jd_parser import (
    parse_job_description
)
from sqlalchemy.orm import Session


from app.db.database import get_db

from app.schemas.job import (
    CreateJobRequest
)

from app.services.job_service import (
    create_job,
    get_jobs,
    get_job_by_id,
    delete_job,
    reparse_job
)


router = APIRouter()


@router.post("/parse")
def parse_job(data: JobInput):

    return parse_job_description(
        data.jd
    )

@router.post("/")
def create_new_job(
    data: CreateJobRequest,
    db: Session = Depends(get_db)
):

    job = create_job(
        db=db,
        title=data.title,
        company=data.company,
        jd=data.jd
    )

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company
    }

@router.get("/")
def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    company: Optional[str] = None,
    title: Optional[str] = None,
    db: Session = Depends(get_db)
):

    jobs, total = get_jobs(
        db=db,
        page=page,
        page_size=page_size,
        company=company,
        title=title
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": [
            {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "created_at": job.created_at
            }
            for job in jobs
        ]
    }

@router.get("/{job_id}")
def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):

    job = get_job_by_id(
        db=db,
        job_id=job_id
    )

    if not job:
        return {
            "message": "Job not found"
        }

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "raw_jd": job.raw_jd,
        "parsed_jd": job.parsed_jd_json,
        "created_at": job.created_at,
        "updated_at": job.updated_at
    }

@router.delete("/{job_id}")
def remove_job(
    job_id: int,
    db: Session = Depends(get_db)
):

    job = delete_job(
        db=db,
        job_id=job_id
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return {
        "message": "Job deleted successfully",
        "job_id": job_id
    }

@router.post("/{job_id}/reparse")
def reparse_existing_job(
    job_id: int,
    db: Session = Depends(get_db)
):

    job = reparse_job(
        db=db,
        job_id=job_id
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "parsed_jd": job.parsed_jd_json
    }
