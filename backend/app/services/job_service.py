from app.models.job import Job
from app.services.jd_parser import (
    parse_job_description
)


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