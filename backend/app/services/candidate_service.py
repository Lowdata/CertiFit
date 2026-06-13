# app/services/candidate_service.py
import os
from app.models.candidate import Candidate

from app.services.resume_parser import (
    extract_resume_data
)

from app.services.llm_candidate_analyzer import (
    analyze_candidate_resume
)


def create_candidate(
    db,
    file_path: str,
    file_name: str
):

    resume_data = extract_resume_data(
        file_path
    )

    resume_text = resume_data["text"]

    resume_links = resume_data["links"]

    parsed_resume = analyze_candidate_resume(
        resume_text,
        resume_links
    )

    candidate = Candidate(
        resume_file_name=file_name,
        raw_resume_text=resume_text,
        parsed_candidate_json=parsed_resume
    )

    db.add(candidate)

    db.commit()

    db.refresh(candidate)
    if os.path.exists(file_path):
        os.remove(file_path)

    return candidate

def get_candidates(
    db,
    page: int,
    page_size: int
):

    query = db.query(Candidate)

    total = query.count()

    candidates = (
        query
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return candidates, total


def get_candidate_by_id(
    db,
    candidate_id: int
):

    return (
        db.query(Candidate)
        .filter(
            Candidate.id == candidate_id
        )
        .first()
    )

def delete_candidate(
    db,
    candidate_id: int
):

    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.id == candidate_id
        )
        .first()
    )

    if not candidate:
        return None

    db.delete(candidate)

    db.commit()

    return candidate