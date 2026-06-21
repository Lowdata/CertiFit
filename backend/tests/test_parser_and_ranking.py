from types import SimpleNamespace

from app.services.application_service import calculate_match
from app.services.llm_validation import (
    fallback_candidate_analysis,
    normalize_candidate_analysis,
    normalize_job_analysis,
)


def test_candidate_parser_fallback_shape_is_safe():
    fallback = fallback_candidate_analysis("llm_parse_error: bad json")

    assert fallback["skills"] == []
    assert fallback["tech_stack"]["languages"] == []
    assert fallback["parse_warnings"] == ["llm_parse_error: bad json"]


def test_llm_shapes_are_normalized():
    candidate = normalize_candidate_analysis(
        {
            "skills": "Python",
            "years_experience": "4",
            "tech_stack": {"databases": "Postgres"},
        }
    )
    job = normalize_job_analysis(
        {
            "required_skills": "Python",
            "experience_years": "3",
            "tech_stack": {"databases": "Postgres"},
        }
    )

    assert candidate["skills"] == ["Python"]
    assert candidate["tech_stack"]["databases"] == ["Postgres"]
    assert job["required_skills"] == ["Python"]
    assert job["tech_stack"]["databases"] == ["Postgres"]


def test_ranking_normalizes_common_technology_aliases():
    job = SimpleNamespace(
        parsed_jd_json={
            "required_skills": ["JS", "Postgres"],
            "inferred_skills": ["Node"],
            "tech_stack": {
                "languages": ["JS"],
                "frameworks": ["Node"],
                "databases": ["Postgres"],
                "infrastructure": [],
                "tools": [],
            },
            "experience_years": 3,
        }
    )
    candidate = SimpleNamespace(
        parsed_candidate_json={
            "skills": ["JavaScript", "PostgreSQL", "Node.js"],
            "tech_stack": {
                "languages": ["JavaScript"],
                "frameworks": ["Node.js"],
                "databases": ["PostgreSQL"],
                "cloud": [],
                "tools": [],
            },
            "years_experience": 3,
        }
    )

    match = calculate_match(job, candidate)

    assert match["score"] == 100
    assert match["gaps"] == []
    assert "JavaScript" in match["strengths"]
    assert "PostgreSQL" in match["strengths"]
