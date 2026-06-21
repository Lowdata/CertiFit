from app.services.github_service import parse_github_identifier
from tests.conftest import auth_headers, create_candidate


def test_parse_github_username():
    parsed = parse_github_identifier("Lowdata")

    assert parsed.username == "Lowdata"
    assert parsed.repo_owner is None
    assert parsed.repo_name is None


def test_parse_github_profile_url():
    parsed = parse_github_identifier("https://github.com/Lowdata")

    assert parsed.username == "Lowdata"
    assert parsed.repo_owner is None
    assert parsed.repo_name is None


def test_parse_github_repo_url():
    parsed = parse_github_identifier("https://github.com/Lowdata/CertiFit")

    assert parsed.username == "Lowdata"
    assert parsed.repo_owner == "Lowdata"
    assert parsed.repo_name == "CertiFit"


def test_candidate_can_store_github_profile(client, db_session, monkeypatch):
    headers = auth_headers(client, "candidate@example.com", 2)
    candidate_user = client.get("/auth/me", headers=headers).json()
    candidate = create_candidate(
        db_session,
        type("UserRef", (), {"id": candidate_user["id"]})(),
    )

    def fake_analyze_github_profile(identifier: str):
        return {
            "source": "github",
            "input": identifier,
            "username": "Lowdata",
            "profile": {
                "login": "Lowdata",
                "html_url": "https://github.com/Lowdata",
            },
            "repositories": [],
            "selected_repository": None,
            "language_totals": {},
            "recent_events": [],
        }

    monkeypatch.setattr(
        "app.api.candidates.analyze_github_profile",
        fake_analyze_github_profile,
    )

    response = client.post(
        "/candidates/github",
        headers=headers,
        json={"identifier": "https://github.com/Lowdata"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == candidate.id
    assert response.json()["github_profile"]["username"] == "Lowdata"

    profile_response = client.get(
        "/candidates/me",
        headers=headers,
    )

    assert profile_response.status_code == 200
    assert profile_response.json()["github_profile"]["profile"]["login"] == "Lowdata"


def test_github_profile_requires_candidate_profile(client, monkeypatch):
    headers = auth_headers(client, "candidate@example.com", 2)

    def fail_if_called(identifier: str):
        raise AssertionError("GitHub analyzer should not be called")

    monkeypatch.setattr(
        "app.api.candidates.analyze_github_profile",
        fail_if_called,
    )

    response = client.post(
        "/candidates/github",
        headers=headers,
        json={"identifier": "Lowdata"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Candidate profile not found"
