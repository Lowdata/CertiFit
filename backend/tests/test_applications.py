from tests.conftest import (
    auth_headers,
    create_application,
    create_candidate,
    create_job,
)


def test_candidate_cannot_apply_twice(client, db_session):
    recruiter_headers = auth_headers(client, "recruiter@example.com", 1)
    candidate_headers = auth_headers(client, "candidate@example.com", 2)
    recruiter = client.get("/auth/me", headers=recruiter_headers).json()
    candidate_user = client.get("/auth/me", headers=candidate_headers).json()

    job = create_job(
        db_session,
        type("UserRef", (), {"id": recruiter["id"]})(),
    )
    create_candidate(
        db_session,
        type("UserRef", (), {"id": candidate_user["id"]})(),
    )

    first_response = client.post(
        f"/jobs/{job.id}/apply",
        headers=candidate_headers,
    )
    second_response = client.post(
        f"/jobs/{job.id}/apply",
        headers=candidate_headers,
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Candidate has already applied to this job"


def test_recruiter_can_update_owned_application_status(client, db_session):
    recruiter_headers = auth_headers(client, "owner@example.com", 1)
    candidate_headers = auth_headers(client, "applicant@example.com", 2)
    recruiter = client.get("/auth/me", headers=recruiter_headers).json()
    candidate_user = client.get("/auth/me", headers=candidate_headers).json()

    job = create_job(
        db_session,
        type("UserRef", (), {"id": recruiter["id"]})(),
    )
    candidate = create_candidate(
        db_session,
        type("UserRef", (), {"id": candidate_user["id"]})(),
    )
    application = create_application(db_session, job, candidate)
    previous_updated_at = application.updated_at

    response = client.patch(
        f"/applications/{application.id}/status",
        headers=recruiter_headers,
        json={"status": "reviewed"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == application.id
    assert body["job_id"] == job.id
    assert body["candidate_id"] == candidate.id
    assert body["status"] == "reviewed"

    db_session.refresh(application)
    assert application.status == "reviewed"
    assert application.updated_at != previous_updated_at


def test_candidate_cannot_update_application_status(client, db_session):
    recruiter_headers = auth_headers(client, "recruiter@example.com", 1)
    candidate_headers = auth_headers(client, "candidate-status@example.com", 2)
    recruiter = client.get("/auth/me", headers=recruiter_headers).json()
    candidate_user = client.get("/auth/me", headers=candidate_headers).json()

    job = create_job(
        db_session,
        type("UserRef", (), {"id": recruiter["id"]})(),
    )
    candidate = create_candidate(
        db_session,
        type("UserRef", (), {"id": candidate_user["id"]})(),
    )
    application = create_application(db_session, job, candidate)

    response = client.patch(
        f"/applications/{application.id}/status",
        headers=candidate_headers,
        json={"status": "reviewed"},
    )

    assert response.status_code == 403


def test_recruiter_cannot_update_application_for_unowned_job(client, db_session):
    recruiter_headers = auth_headers(client, "owner-status@example.com", 1)
    other_recruiter_headers = auth_headers(client, "other-status@example.com", 1)
    candidate_headers = auth_headers(client, "candidate-owner@example.com", 2)
    recruiter = client.get("/auth/me", headers=recruiter_headers).json()
    candidate_user = client.get("/auth/me", headers=candidate_headers).json()

    job = create_job(
        db_session,
        type("UserRef", (), {"id": recruiter["id"]})(),
    )
    candidate = create_candidate(
        db_session,
        type("UserRef", (), {"id": candidate_user["id"]})(),
    )
    application = create_application(db_session, job, candidate)

    response = client.patch(
        f"/applications/{application.id}/status",
        headers=other_recruiter_headers,
        json={"status": "reviewed"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Application not found"


def test_recruiter_cannot_skip_application_status_transition(client, db_session):
    recruiter_headers = auth_headers(client, "transition-owner@example.com", 1)
    candidate_headers = auth_headers(client, "transition-candidate@example.com", 2)
    recruiter = client.get("/auth/me", headers=recruiter_headers).json()
    candidate_user = client.get("/auth/me", headers=candidate_headers).json()

    job = create_job(
        db_session,
        type("UserRef", (), {"id": recruiter["id"]})(),
    )
    candidate = create_candidate(
        db_session,
        type("UserRef", (), {"id": candidate_user["id"]})(),
    )
    application = create_application(db_session, job, candidate)

    response = client.patch(
        f"/applications/{application.id}/status",
        headers=recruiter_headers,
        json={"status": "hired"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Cannot move application from applied to hired"


def test_recruiter_can_reject_from_active_application_status(client, db_session):
    recruiter_headers = auth_headers(client, "reject-owner@example.com", 1)
    candidate_headers = auth_headers(client, "reject-candidate@example.com", 2)
    recruiter = client.get("/auth/me", headers=recruiter_headers).json()
    candidate_user = client.get("/auth/me", headers=candidate_headers).json()

    job = create_job(
        db_session,
        type("UserRef", (), {"id": recruiter["id"]})(),
    )
    candidate = create_candidate(
        db_session,
        type("UserRef", (), {"id": candidate_user["id"]})(),
    )
    application = create_application(db_session, job, candidate)

    response = client.patch(
        f"/applications/{application.id}/status",
        headers=recruiter_headers,
        json={"status": "rejected"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "rejected"
