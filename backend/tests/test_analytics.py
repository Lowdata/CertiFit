import pytest
from app.models.job import Job
from app.models.application import Application

def test_recruiter_analytics_dashboard(client, db_session):
    # Register/Login a recruiter
    response = client.post(
        "/auth/register",
        json={
            "name": "Recruiter Sue",
            "email": "sue@company.com",
            "password": "Password123!",
            "user_type": 1,
        },
    )
    assert response.status_code == 200
    
    response = client.post(
        "/auth/login",
        json={"email": "sue@company.com", "password": "Password123!"},
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    recruiter_id = response.json()["user"]["id"]

    # Register/Login a candidate
    res_cand = client.post(
        "/auth/register",
        json={
            "name": "Candidate Charlie",
            "email": "charlie@cand.com",
            "password": "Password123!",
            "user_type": 2,
        },
    )
    cand_id = res_cand.json()["id"]

    # 1. Create a job
    job = Job(recruiter_id=recruiter_id, title="Test Job", status="active", company="Test Company", raw_jd="test")
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    # 2. Create an application
    # candidate_id in Application refers to Candidate model id, not user id
    from app.models.candidate import Candidate
    cand_record = Candidate(user_id=cand_id, resume_file_name="test.pdf", raw_resume_text="test")
    db_session.add(cand_record)
    db_session.commit()
    db_session.refresh(cand_record)

    app = Application(
        job_id=job.id,
        candidate_id=cand_record.id,
        status="applied",
        match_score=85.0
    )
    db_session.add(app)
    db_session.commit()

    # 3. GET /analytics/dashboard
    res = client.get("/analytics/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["open_jobs"] == 1
    assert data["total_applications"] == 1
    assert data["candidates_in_pipeline"] == 1
    assert data["avg_fit_score"] == 85.0
    assert data["avg_trust_score"] == 0.0
