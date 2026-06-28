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
    get_current_recruiter,
    get_current_user_optional
)

from app.schemas.job import (
    JobInput,
    CreateJobRequest,
    DeleteJobResponse,
    JobCreateResponse,
    JobDetailResponse,
    JobListResponse,
    JobParseResponse,
    JobReparseResponse,
    UpdateJobStatusRequest,
)
from app.schemas.application import (
    ApplicationResponse,
    JobApplicationListResponse,
    ApplyJobRequest
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
    reparse_job,
    update_job_status
)
from app.services.candidate_service import (
    get_candidate_by_user_id
)
from app.services.application_service import (
    create_application,
    get_applications_for_owned_job
)

router = APIRouter()


@router.post("/parse", response_model=JobParseResponse)
def parse_job(
    data: JobInput,
    current_user: User = Depends(
        get_current_recruiter
    )
):

    return {
        "parsed_jd": parse_job_description(
            data.jd
        )
    }


@router.post("/", response_model=JobCreateResponse)
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
        jd=data.jd,
        apply_type=data.apply_type,
        external_apply_url=data.external_apply_url
    )

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "status": job.status
    }


@router.get("/my-jobs", response_model=JobListResponse)
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
                "status": job.status,
                "created_at": job.created_at
            }
            for job in jobs
        ]
    }


@router.get("/", response_model=JobListResponse)
def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    company: Optional[str] = None,
    title: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):

    exclude_applied_by_candidate_id = None
    if current_user and current_user.user_type == 2:
        candidate = get_candidate_by_user_id(db=db, user_id=current_user.id)
        if candidate:
            exclude_applied_by_candidate_id = candidate.id

    jobs, total = get_jobs(
        db=db,
        page=page,
        page_size=page_size,
        company=company,
        title=title,
        exclude_applied_by_candidate_id=exclude_applied_by_candidate_id
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
                "status": job.status,
                "created_at": job.created_at
            }
            for job in jobs
        ]
    }


@router.get("/{job_id}", response_model=JobDetailResponse)
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
        "status": job.status,
        "raw_jd": job.raw_jd,
        "parsed_jd": job.parsed_jd_json,
        "created_at": job.created_at,
        "updated_at": job.updated_at
    }


@router.delete("/{job_id}", response_model=DeleteJobResponse)
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


@router.patch("/{job_id}/status", response_model=JobDetailResponse)
def change_job_status(
    job_id: int,
    data: UpdateJobStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter)
):
    job = update_job_status(
        db=db,
        job_id=job_id,
        recruiter_id=current_user.id,
        status=data.status
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
        "status": job.status,
        "raw_jd": job.raw_jd,
        "parsed_jd": job.parsed_jd_json,
        "created_at": job.created_at,
        "updated_at": job.updated_at
    }


@router.post("/{job_id}/reparse", response_model=JobReparseResponse)
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


from fastapi import BackgroundTasks
from app.services.scoring_task import process_application_scoring_background

@router.post("/{job_id}/apply", response_model=ApplicationResponse)
def apply_to_job(
    job_id: int,
    background_tasks: BackgroundTasks,
    request: ApplyJobRequest,
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
            candidate=candidate,
            screening_answers=request.screening_answers
        )

        background_tasks.add_task(process_application_scoring_background, application.id)

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
        "screening_answers": application.screening_answers,
        "applied_at": application.applied_at
    }


@router.get("/{job_id}/applications", response_model=JobApplicationListResponse)
def list_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_recruiter
    )
):

    application_rows = get_applications_for_owned_job(
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
                "job_id": application.job_id,
                "candidate_id": application.candidate_id,
                "candidate": {
                    "id": candidate.id,
                    "resume_file_name": candidate.resume_file_name,
                    "parsed_candidate": candidate.parsed_candidate_json
                },
                "status": application.status,
                "match_score": application.match_score,
                "match_summary": application.match_summary,
                "strengths": application.strengths_json,
                "gaps": application.gaps_json,
                "applied_at": application.applied_at,
                "updated_at": application.updated_at
            }
            for application, candidate in application_rows
        ]
    }
