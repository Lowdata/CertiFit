from datetime import datetime
from typing import Any

from pydantic import BaseModel


class JobInput(BaseModel):
    jd: str


class CreateJobRequest(BaseModel):
    title: str
    company: str
    jd: str
    apply_type: str = "internal"
    external_apply_url: str | None = None


class JobSummaryResponse(BaseModel):
    id: int
    title: str
    company: str
    status: str
    apply_type: str = "internal"
    external_apply_url: str | None = None
    created_at: datetime | None = None


class JobCreateResponse(BaseModel):
    id: int
    title: str
    company: str
    status: str

class UpdateJobStatusRequest(BaseModel):
    status: str


class JobDetailResponse(JobSummaryResponse):
    raw_jd: str
    parsed_jd: dict[str, Any]
    updated_at: datetime | None = None


class JobParseResponse(BaseModel):
    parsed_jd: dict[str, Any]


class JobReparseResponse(JobCreateResponse):
    parsed_jd: dict[str, Any]


class JobListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    data: list[JobSummaryResponse]


class DeleteJobResponse(BaseModel):
    message: str
    job_id: int
