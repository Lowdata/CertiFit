# job_service.py
import logging

from app.models.job import Job
from app.services.jd_parser import (
    parse_job_description
)


logger = logging.getLogger(__name__)


def create_job(
    db,
    recruiter_id: int,
    title: str,
    company: str,
    jd: str
):

    try:
        parsed_jd = parse_job_description(
            jd
        )

    except Exception:
        logger.exception("Parser failed while creating job")
        raise

    job = Job(
        recruiter_id=recruiter_id,
        title=title,
        company=company,
        raw_jd=jd,
        parsed_jd_json=parsed_jd
    )

    try:
        db.add(job)
        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Database write failed while creating job")
        raise

    db.refresh(job)

    return job


def get_jobs(
    db,
    page: int,
    page_size: int,
    company: str | None = None,
    title: str | None = None
):

    query = db.query(Job)

    if company:
        query = query.filter(
            Job.company.ilike(f"%{company}%")
        )

    if title:
        query = query.filter(
            Job.title.ilike(f"%{title}%")
        )

    total = query.count()

    jobs = (
        query
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return jobs, total


def get_jobs_by_recruiter(
    db,
    recruiter_id: int,
    page: int,
    page_size: int
):

    query = db.query(Job).filter(
        Job.recruiter_id == recruiter_id
    )

    total = query.count()

    jobs = (
        query
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return jobs, total

def get_job_by_id(
    db,
    job_id: int
):

    return (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )


def delete_job(
    db,
    job_id: int,
    recruiter_id: int
):

    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.recruiter_id == recruiter_id
        )
        .first()
    )

    if not job:
        return None

    try:
        db.delete(job)
        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Database write failed while deleting job")
        raise

    return job

def reparse_job(
    db,
    job_id: int,
    recruiter_id: int
):

    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.recruiter_id == recruiter_id
        )
        .first()
    )

    if not job:
        return None

    try:
        parsed_jd = parse_job_description(
            job.raw_jd
        )

    except Exception:
        logger.exception("Parser failed while reparsing job")
        raise

    job.parsed_jd_json = parsed_jd

    try:
        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Database write failed while reparsing job")
        raise

    db.refresh(job)

    return job
