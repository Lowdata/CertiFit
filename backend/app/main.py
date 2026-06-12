# main.py
from fastapi import FastAPI
from app.api.jobs import router as jobs_router
from app.api.app import router as health_router

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