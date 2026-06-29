# main.py
from fastapi import FastAPI
import threading
from contextlib import asynccontextmanager
from app.services.candidate_evaluation_service import process_pending_evaluations
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

def _run_ai_evaluator():
    import time
    while True:
        try:
            process_pending_evaluations()
        except Exception:
            pass # Logger handles it inside the service
        time.sleep(30) # Poll every 30 seconds

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the AI evaluator background thread
    worker_thread = threading.Thread(target=_run_ai_evaluator, daemon=True)
    worker_thread.start()
    yield
    # No explicit shutdown needed since it's a daemon thread

app = FastAPI(title="CertiFit", lifespan=lifespan)

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
