from datetime import datetime
from typing import Any
from typing import Literal

from pydantic import BaseModel


ApplicationStatus = Literal[
    "applied",
    "reviewed",
    "shortlisted",
    "interview",
    "rejected",
    "hired",
]


class ApplicationStatusUpdateRequest(BaseModel):
    status: ApplicationStatus


class ApplyJobRequest(BaseModel):
    screening_answers: dict[str, Any] = {}


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    status: ApplicationStatus
    match_score: float
    match_summary: str
    strengths: list[Any]
    gaps: list[Any]
    fit_score: float = 0.0
    trust_score: float = 0.0
    composite_score: float = 0.0
    score_explanations: dict[str, Any] = {}
    screening_answers: dict[str, Any] = {}
    applied_at: datetime | None = None
    updated_at: datetime | None = None


class CandidateApplicationResponse(ApplicationResponse):
    candidate: dict[str, Any]


class ApplicationListResponse(BaseModel):
    data: list[ApplicationResponse]


class JobApplicationListResponse(BaseModel):
    job_id: int
    data: list[CandidateApplicationResponse]


class CandidateReportResponse(BaseModel):
    """Demo endpoint — everything in one call."""
    application_id: int
    candidate_id: int
    job_id: int
    status: ApplicationStatus
    fit_score: float
    trust_score: float
    composite_score: float
    score_explanations: dict[str, Any]
    strengths: list[Any]
    concerns: list[Any]
    unsupported_claims: list[Any]
    evidence_map: dict[str, Any]
    skill_confidence: dict[str, Any]
    interview_plan: dict[str, Any]

