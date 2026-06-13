# job_service.py
from app.models.job import Job
from app.services.jd_parser import (
    parse_job_description
)
from sqlalchemy import func


def create_job(
    db,
    title: str,
    company: str,
    jd: str
):

    parsed_jd = parse_job_description(
        jd
    )

    job = Job(
        title=title,
        company=company,
        raw_jd=jd,
        parsed_jd_json=parsed_jd
    )

    db.add(job)
    db.commit()
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

    total = db.query(
    func.count(Job.id)
).scalar()

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
    job_id: int
):

    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        return None

    db.delete(job)
    db.commit()

    return job

def reparse_job(
    db,
    job_id: int
):

    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        return None

    parsed_jd = parse_job_description(
        job.raw_jd
    )

    job.parsed_jd_json = parsed_jd

    db.commit()

    db.refresh(job)

    return job