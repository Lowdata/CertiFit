from datetime import datetime
from typing import Any

from pydantic import BaseModel


class CandidateResponse(BaseModel):
    id: int
    resume_file_name: str


class CandidateProfileResponse(CandidateResponse):
    parsed_candidate: dict[str, Any]
    created_at: datetime | None = None
    updated_at: datetime | None = None


class CandidateSummaryResponse(CandidateResponse):
    created_at: datetime | None = None


class CandidateListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    data: list[CandidateSummaryResponse]


class DeleteCandidateResponse(BaseModel):
    message: str
    id: int
