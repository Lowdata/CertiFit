from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    status: str
    match_score: float
    match_summary: str
    strengths: list[Any]
    gaps: list[Any]
    applied_at: datetime | None = None
    updated_at: datetime | None = None


class CandidateApplicationResponse(ApplicationResponse):
    candidate: dict[str, Any]


class ApplicationListResponse(BaseModel):
    data: list[ApplicationResponse]


class JobApplicationListResponse(BaseModel):
    job_id: int
    data: list[CandidateApplicationResponse]
