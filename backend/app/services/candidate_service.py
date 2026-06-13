import os

from app.models.candidate import Candidate

from app.services.resume_parser import (
    extract_resume_text
)

from app.services.llm_candidate_analyzer import (
    analyze_candidate_resume
)


def create_candidate(
    db,
    file_path: str,
    file_name: str
):

    resume_text = extract_resume_text(
        file_path
    )

    parsed_resume = analyze_candidate_resume(
        resume_text
    )

    candidate = Candidate(
        resume_file_name=file_name,
        raw_resume_text=resume_text,
        parsed_candidate_json=parsed_resume
    )

    db.add(candidate)

    db.commit()

    db.refresh(candidate)

    return candidate