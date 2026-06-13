# main.py
from fastapi import FastAPI
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

app = FastAPI(title="CertiFit")

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
