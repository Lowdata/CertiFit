from pathlib import Path

import pytest

from app.services.linkedin_service import parse_linkedin_pdf
from tests.conftest import auth_headers, create_candidate


def test_parse_reference_linkedin_pdf_when_available():
    path = Path(__file__).with_name("testprofile.pdf")
    if not path.exists():
        pytest.skip("testprofile.pdf reference fixture is not present")

    profile = parse_linkedin_pdf(
        path.read_bytes()
    )
    print(profile)

    assert profile["source"] == "linkedin_pdf"
    assert profile["name"] == "Ayush Pahuja"
    assert "Full-Stack Blockchain Developer" in profile["headline"]
    assert "Google Cloud Platform (GCP)" in profile["skills"]
    assert (
        "Deloitte Australia - Cyber Job Simulation"
        in profile["certifications"]
    )
    assert (
        "Tata - GenAI Powered Data Analytics Job Simulation"
        in profile["certifications"]
    )
    assert any(
        position["company"] == "Iceshard Games"
        and position["title"] == "Full Stack Engineer"
        for position in profile["positions"]
    )
    assert {
        (position["company"], position["title"])
        for position in profile["positions"]
    } >= {
        ("Iceshard Games", "Full Stack Engineer"),
        ("IceShard Games Pvt. Ltd.", "Fullstack Developer"),
        ("Foodverse (OneRare)", "Junior Back End Developer"),
        ("Foodverse (OneRare)", "Full Stack Engineer"),
        ("IndiGG", "Full Stack Blockchain Developer"),
        ("ZyberNetix", "Blockchain Development Intern"),
        ("Drink Beer Save Water", "Chief Operations Officer"),
        ("Cisco", "Cyber Security Student"),
    }
    assert any(
        item["school"] == "Netaji Subhas University of Technology, East Campus"
        for item in profile["education"]
    )


def test_candidate_can_store_linkedin_profile(client, db_session, monkeypatch):
    headers = auth_headers(client, "candidate@example.com", 2)
    candidate_user = client.get("/auth/me", headers=headers).json()
    candidate = create_candidate(
        db_session,
        type("UserRef", (), {"id": candidate_user["id"]})(),
    )

    def fake_parse_linkedin_pdf(content: bytes):
        return {
            "source": "linkedin_pdf",
            "name": "candidate",
            "headline": "Full-Stack Blockchain Developer",
            "positions": [],
            "education": [],
            "certifications": [],
            "skills": ["Google Cloud Platform (GCP)"],
            "raw_text": "LinkedIn profile",
        }

    monkeypatch.setattr(
        "app.api.candidates.parse_linkedin_pdf",
        fake_parse_linkedin_pdf,
    )

    response = client.post(
        "/candidates/linkedin",
        headers=headers,
        files={"profile": ("linkedin.pdf", b"%PDF valid enough", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json()["id"] == candidate.id
    assert response.json()["linkedin_profile"]["name"] == "candidate"

    profile_response = client.get(
        "/candidates/me",
        headers=headers,
    )

    assert profile_response.status_code == 200
    assert profile_response.json()["linkedin_profile"]["headline"] == (
        "Full-Stack Blockchain Developer"
    )


def test_linkedin_profile_requires_candidate_profile(client, monkeypatch):
    headers = auth_headers(client, "candidate@example.com", 2)

    def fail_if_called(content: bytes):
        raise AssertionError("LinkedIn parser should not be called")

    monkeypatch.setattr(
        "app.api.candidates.parse_linkedin_pdf",
        fail_if_called,
    )

    response = client.post(
        "/candidates/linkedin",
        headers=headers,
        files={"profile": ("linkedin.pdf", b"%PDF valid enough", "application/pdf")},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Candidate profile not found"


def test_linkedin_rejects_non_pdf(client, db_session):
    headers = auth_headers(client, "candidate@example.com", 2)
    candidate_user = client.get("/auth/me", headers=headers).json()
    create_candidate(
        db_session,
        type("UserRef", (), {"id": candidate_user["id"]})(),
    )

    response = client.post(
        "/candidates/linkedin",
        headers=headers,
        files={"profile": ("linkedin.txt", b"not a pdf", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "LinkedIn upload must be a valid PDF"
