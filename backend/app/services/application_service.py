import logging

from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job


logger = logging.getLogger(__name__)


def _as_set(values):

    if not values:
        return set()

    return {
        str(value).strip().lower()
        for value in values
        if str(value).strip()
    }


def _tech_values(tech_stack: dict):

    values = []

    if not isinstance(tech_stack, dict):
        return values

    for item in tech_stack.values():
        if isinstance(item, list):
            values.extend(item)

    return values


def calculate_match(
    job: Job,
    candidate: Candidate
):

    job_data = job.parsed_jd_json or {}
    candidate_data = candidate.parsed_candidate_json or {}

    required_skills = _as_set(
        job_data.get("required_skills", [])
    )
    candidate_skills = _as_set(
        candidate_data.get("skills", [])
    )

    job_tech = _as_set(
        _tech_values(job_data.get("tech_stack", {}))
    )
    candidate_tech = _as_set(
        _tech_values(candidate_data.get("tech_stack", {}))
    )

    required_matches = required_skills.intersection(
        candidate_skills
    )
    tech_matches = job_tech.intersection(
        candidate_tech
    )

    skill_score = 0
    if required_skills:
        skill_score = (
            len(required_matches) / len(required_skills)
        ) * 60

    tech_score = 0
    if job_tech:
        tech_score = (
            len(tech_matches) / len(job_tech)
        ) * 30

    required_years = job_data.get(
        "experience_years",
        0
    ) or 0
    candidate_years = candidate_data.get(
        "years_experience",
        0
    ) or 0

    experience_score = 10
    if required_years:
        experience_score = min(
            candidate_years / required_years,
            1
        ) * 10

    score = round(
        min(skill_score + tech_score + experience_score, 100),
        2
    )

    strengths = sorted(
        required_matches.union(tech_matches)
    )
    gaps = sorted(
        required_skills.difference(candidate_skills)
    )

    summary = (
        f"Matched {len(required_matches)} of "
        f"{len(required_skills)} required skills"
    )

    return {
        "score": score,
        "summary": summary,
        "strengths": strengths,
        "gaps": gaps
    }


def create_application(
    db,
    job_id: int,
    candidate: Candidate
):

    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        return None

    existing = (
        db.query(Application)
        .filter(
            Application.job_id == job_id,
            Application.candidate_id == candidate.id
        )
        .first()
    )

    if existing:
        raise ValueError("Candidate has already applied to this job")

    match = calculate_match(
        job=job,
        candidate=candidate
    )

    application = Application(
        job_id=job.id,
        candidate_id=candidate.id,
        status="applied",
        match_score=match["score"],
        match_summary=match["summary"],
        strengths_json=match["strengths"],
        gaps_json=match["gaps"]
    )

    try:
        db.add(application)
        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Application creation failed")
        raise

    db.refresh(application)

    return application


def get_applications_for_candidate(
    db,
    candidate_id: int
):

    return (
        db.query(Application)
        .filter(Application.candidate_id == candidate_id)
        .all()
    )


def get_applications_for_owned_job(
    db,
    job_id: int,
    recruiter_id: int
):

    return (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(
            Application.job_id == job_id,
            Job.recruiter_id == recruiter_id
        )
        .order_by(Application.match_score.desc())
        .all()
    )
