from fastapi import APIRouter , Depends

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
    create_job
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