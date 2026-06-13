from datetime import datetime
from typing import Any

from pydantic import BaseModel


class CandidateResponse(BaseModel):
    id: int
    resume_file_name: str


class CandidateProfileResponse(CandidateResponse):
    parsed_candidate: dict[str, Any]
    github_profile: dict[str, Any] | None = None
    linkedin_profile: dict[str, Any] | None = None
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


class GitHubProfileRequest(BaseModel):
    identifier: str


class GitHubProfileResponse(BaseModel):
    id: int
    github_profile: dict[str, Any]


class LinkedInProfileResponse(BaseModel):
    id: int
    linkedin_profile: dict[str, Any]
