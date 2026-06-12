from app.services.llm_job_analyzer import (
    analyze_job_with_llm
)


def parse_job_description(jd: str):

    result = analyze_job_with_llm(jd)

    return result