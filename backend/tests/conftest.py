import os
import sys
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.database import Base, get_db
from app.main import app
from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.user import User


@pytest.fixture()
def db_session() -> Iterator:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    try:
        yield session
    finally:
        app.dependency_overrides.clear()
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session) -> TestClient:
    return TestClient(app)


def create_user(db, email: str, user_type: int) -> User:
    user = User(
        name=email.split("@")[0],
        email=email,
        password_hash="not-used",
        user_type=user_type,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_headers(client: TestClient, email: str, user_type: int) -> dict[str, str]:
    password = "Password123!"
    response = client.post(
        "/auth/register",
        json={
            "name": email.split("@")[0],
            "email": email,
            "password": password,
            "user_type": user_type,
        },
    )
    assert response.status_code == 200, response.text

    response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    client.cookies.clear()
    return {"Authorization": f"Bearer {token}"}


def create_job(db, recruiter: User, title: str = "Backend Engineer") -> Job:
    job = Job(
        recruiter_id=recruiter.id,
        title=title,
        company="CertiFit",
        raw_jd="Python PostgreSQL APIs",
        parsed_jd_json={
            "required_skills": ["Python", "Postgres"],
            "inferred_skills": ["REST APIs"],
            "tech_stack": {
                "languages": ["Python"],
                "frameworks": [],
                "databases": ["Postgres"],
                "infrastructure": [],
                "tools": [],
            },
            "experience_years": 2,
        },
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def create_candidate(db, user: User) -> Candidate:
    candidate = Candidate(
        user_id=user.id,
        resume_file_name="resume.pdf",
        raw_resume_text="Python PostgreSQL REST APIs",
        parsed_candidate_json={
            "skills": ["Python", "PostgreSQL", "REST APIs"],
            "tech_stack": {
                "languages": ["Python"],
                "frameworks": [],
                "databases": ["PostgreSQL"],
                "cloud": [],
                "tools": [],
            },
            "years_experience": 3,
        },
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


def create_application(db, job: Job, candidate: Candidate) -> Application:
    application = Application(
        job_id=job.id,
        candidate_id=candidate.id,
        status="applied",
        match_score=95,
        match_summary="strong match",
        strengths_json=["Python"],
        gaps_json=[],
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application
