# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.jobs import router as jobs_router
from app.api.app import router as health_router
from app.api.candidates import (
    router as candidates_router
)
from app.api.auth import (
    router as auth_router
)
from app.api.applications import (
    router as applications_router
)
from app.api.interview import (
    router as interview_router
)
from app.api.company import (
    router as company_router
)
from app.api.analytics import (
    router as analytics_router
)
from app.api.assessments import (
    router as assessments_router
)

app = FastAPI(title="CertiFit")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    health_router,
    prefix='/health',
    tags=["Health"]
)

app.include_router(
    jobs_router,
    prefix="/jobs",
    tags=["Jobs"]
)

app.include_router(
    company_router,
    prefix="/company",
    tags=["Company"]
)

app.include_router(
    analytics_router,
    prefix="/analytics",
    tags=["Analytics"]
)

app.include_router(
    candidates_router,
    prefix="/candidates",
    tags=["Candidates"]
)

app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Auth"]
)

app.include_router(
    applications_router,
    prefix="/applications",
    tags=["Applications"]
)

app.include_router(
    interview_router,
    prefix="/applications",
    tags=["Interview"]
)

app.include_router(
    assessments_router,
    tags=["Assessments"]
)
