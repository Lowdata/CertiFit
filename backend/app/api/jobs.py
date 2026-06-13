from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException
)

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.models.user import User

from app.core.dependencies import (
    get_current_candidate,
    get_current_recruiter
)

from app.schemas.job import (
    JobInput,
    CreateJobRequest
)

from app.services.jd_parser import (
    parse_job_description
)

from app.services.job_service import (
    create_job,
    get_jobs,
    get_jobs_by_recruiter,
    get_job_by_id,
    delete_job,
    reparse_job
)
from app.services.candidate_service import (
    get_candidate_by_user_id
)
from app.services.application_service import (
    create_application,
    get_applications_for_owned_job
)

router = APIRouter()


@router.post("/parse")
def parse_job(
    data: JobInput,
    current_user: User = Depends(
        get_current_recruiter
    )
):

    return parse_job_description(
        data.jd
    )


@router.post("/")
def create_new_job(
    data: CreateJobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_recruiter
    )
):

    job = create_job(
        db=db,
        recruiter_id=current_user.id,
        title=data.title,
        company=data.company,
        jd=data.jd
    )

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company
    }


@router.get("/my-jobs")
def list_my_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_recruiter
    )
):

    jobs, total = get_jobs_by_recruiter(
        db=db,
        recruiter_id=current_user.id,
        page=page,
        page_size=page_size
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

        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

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
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_recruiter
    )
):

    job = delete_job(
        db=db,
        job_id=job_id,
        recruiter_id=current_user.id
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
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_recruiter
    )
):

    job = reparse_job(
        db=db,
        job_id=job_id,
        recruiter_id=current_user.id
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


@router.post("/{job_id}/apply")
def apply_to_job(
    job_id: int,
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
            status_code=400,
            detail="Upload a resume before applying"
        )

    try:
        application = create_application(
            db=db,
            job_id=job_id,
            candidate=candidate
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return {
        "id": application.id,
        "job_id": application.job_id,
        "candidate_id": application.candidate_id,
        "status": application.status,
        "match_score": application.match_score,
        "match_summary": application.match_summary,
        "strengths": application.strengths_json,
        "gaps": application.gaps_json,
        "applied_at": application.applied_at
    }


@router.get("/{job_id}/applications")
def list_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_recruiter
    )
):

    applications = get_applications_for_owned_job(
        db=db,
        job_id=job_id,
        recruiter_id=current_user.id
    )

    job = get_job_by_id(
        db=db,
        job_id=job_id
    )

    if not job or job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return {
        "job_id": job_id,
        "data": [
            {
                "id": application.id,
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
