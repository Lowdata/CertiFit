from fastapi import APIRouter

from app.schemas.job import JobInput
from app.services.jd_parser import parse_job_description

router = APIRouter()


@router.post("/parse")
def parse_job(data: JobInput):

    return parse_job_description(
        data.jd
    )