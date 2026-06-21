from tests.conftest import (
    auth_headers,
    create_application,
    create_candidate,
    create_job,
)


def test_recruiter_cannot_list_global_candidates(client, db_session):
    headers = auth_headers(client, "recruiter@example.com", 1)

    response = client.get("/candidates/", headers=headers)

    assert response.status_code == 403


def test_candidate_can_only_read_own_profile(client, db_session):
    candidate_headers = auth_headers(client, "candidate@example.com", 2)
    other_headers = auth_headers(client, "other@example.com", 2)

    own_profile = client.get("/auth/me", headers=candidate_headers).json()
    other_profile = client.get("/auth/me", headers=other_headers).json()

    own_candidate = create_candidate(
        db_session,
        type("UserRef", (), {"id": own_profile["id"]})(),
    )
    other_candidate = create_candidate(
        db_session,
        type("UserRef", (), {"id": other_profile["id"]})(),
    )

    own_response = client.get(
        f"/candidates/{own_candidate.id}",
        headers=candidate_headers,
    )
    other_response = client.get(
        f"/candidates/{other_candidate.id}",
        headers=candidate_headers,
    )

    assert own_response.status_code == 200
    assert other_response.status_code == 403


def test_recruiter_can_only_view_applications_for_owned_jobs(client, db_session):
    recruiter_headers = auth_headers(client, "owner@example.com", 1)
    other_recruiter_headers = auth_headers(client, "other-owner@example.com", 1)
    candidate_headers = auth_headers(client, "applicant@example.com", 2)

    recruiter = client.get("/auth/me", headers=recruiter_headers).json()
    other_recruiter = client.get("/auth/me", headers=other_recruiter_headers).json()
    candidate_user = client.get("/auth/me", headers=candidate_headers).json()

    job = create_job(
        db_session,
        type("UserRef", (), {"id": recruiter["id"]})(),
    )
    candidate = create_candidate(
        db_session,
        type("UserRef", (), {"id": candidate_user["id"]})(),
    )
    create_application(db_session, job, candidate)

    owned_response = client.get(
        f"/jobs/{job.id}/applications",
        headers=recruiter_headers,
    )
    other_response = client.get(
        f"/jobs/{job.id}/applications",
        headers=other_recruiter_headers,
    )

    assert other_recruiter["id"] != recruiter["id"]
    assert owned_response.status_code == 200
    assert owned_response.json()["data"][0]["candidate"]["id"] == candidate.id
    assert other_response.status_code == 404
