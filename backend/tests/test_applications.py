from tests.conftest import auth_headers, create_candidate, create_job


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
