# app/services/candidate_service.py
import logging
import os

from app.models.candidate import Candidate

from app.services.resume_parser import (
    extract_resume_data
)

from app.services.llm_candidate_analyzer import (
    analyze_candidate_resume
)


logger = logging.getLogger(__name__)


def create_candidate(
    db,
    user_id: int,
    file_path: str,
    file_name: str
):

    try:
        resume_data = extract_resume_data(
            file_path
        )

        resume_text = resume_data["text"]

        resume_links = resume_data["links"]

        parsed_resume = analyze_candidate_resume(
            resume_text,
            resume_links
        )

    except ValueError:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

    except Exception as exc:
        logger.exception("Critical parser failure while processing resume")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise ValueError("Resume could not be processed") from exc

    candidate = get_candidate_by_user_id(
        db=db,
        user_id=user_id
    )

    if candidate:
        candidate.resume_file_name = file_name
        candidate.raw_resume_text = resume_text
        candidate.parsed_candidate_json = parsed_resume

    else:
        candidate = Candidate(
            user_id=user_id,
            resume_file_name=file_name,
            raw_resume_text=resume_text,
            parsed_candidate_json=parsed_resume
        )

        db.add(candidate)

    try:
        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Database write failed while saving candidate")
        raise

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    db.refresh(candidate)

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


def get_candidate_by_user_id(
    db,
    user_id: int
):

    return (
        db.query(Candidate)
        .filter(
            Candidate.user_id == user_id
        )
        .first()
    )


def delete_candidate(
    db,
    candidate_id: int,
    user_id: int | None = None
):

    query = db.query(Candidate).filter(
        Candidate.id == candidate_id
    )

    if user_id is not None:
        query = query.filter(
            Candidate.user_id == user_id
        )

    candidate = query.first()

    if not candidate:
        return None

    try:
        db.delete(candidate)

        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Database write failed while deleting candidate")
        raise

    return candidate


def update_candidate_github_profile(
    db,
    user_id: int,
    github_profile: dict
):

    candidate = get_candidate_by_user_id(
        db=db,
        user_id=user_id
    )

    if not candidate:
        return None

    candidate.github_profile_json = github_profile

    try:
        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Database write failed while saving GitHub profile")
        raise

    db.refresh(candidate)

    return candidate


def update_candidate_linkedin_profile(
    db,
    user_id: int,
    linkedin_profile: dict
):

    candidate = get_candidate_by_user_id(
        db=db,
        user_id=user_id
    )

    if not candidate:
        return None

    candidate.linkedin_profile_json = linkedin_profile

    try:
        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Database write failed while saving LinkedIn profile")
        raise

    db.refresh(candidate)

    return candidate
