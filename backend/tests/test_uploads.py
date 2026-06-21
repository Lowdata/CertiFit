from pathlib import Path
from types import SimpleNamespace

from tests.conftest import auth_headers


def test_upload_rejects_unsupported_resume_type(client):
    headers = auth_headers(client, "candidate@example.com", 2)

    response = client.post(
        "/candidates/upload",
        headers=headers,
        files={"resume": ("resume.txt", b"hello", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Resume must be a PDF or DOCX file"


def test_upload_uses_generated_filename(client, monkeypatch):
    headers = auth_headers(client, "candidate@example.com", 2)
    captured = {}

    def fake_create_candidate(db, user_id, file_path, file_name):
        captured["file_path"] = file_path
        captured["file_name"] = file_name
        Path(file_path).unlink(missing_ok=True)
        return SimpleNamespace(id=123, resume_file_name=file_name)

    monkeypatch.setattr(
        "app.api.candidates.create_candidate",
        fake_create_candidate,
    )

    response = client.post(
        "/candidates/upload",
        headers=headers,
        files={"resume": ("../../resume.pdf", b"%PDF valid enough", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json()["resume_file_name"].endswith(".pdf")
    assert ".." not in captured["file_name"]
    assert "/" not in captured["file_name"]
    assert captured["file_name"] != "resume.pdf"


def test_upload_parser_failure_returns_api_error(client, monkeypatch):
    headers = auth_headers(client, "candidate@example.com", 2)

    def fake_create_candidate(db, user_id, file_path, file_name):
        raise ValueError("Resume could not be processed")

    monkeypatch.setattr(
        "app.api.candidates.create_candidate",
        fake_create_candidate,
    )

    response = client.post(
        "/candidates/upload",
        headers=headers,
        files={"resume": ("resume.pdf", b"%PDF valid enough", "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Resume could not be processed"
