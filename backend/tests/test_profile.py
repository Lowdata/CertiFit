"""
Tests for normalized profile builder and evidence_map.
"""
from unittest.mock import MagicMock

from app.services.profile_service import (
    build_normalized_profile,
    _build_evidence_map,
    _skill_confidence,
    _build_skill_confidence,
)


def _mock_candidate(
    parsed=None,
    linkedin=None,
    github=None,
):
    c = MagicMock()
    c.parsed_candidate_json = parsed or {}
    c.linkedin_profile_json = linkedin or {}
    c.github_profile_json = github or {}
    return c


# ---------------------------------------------------------------------------
# evidence_map
# ---------------------------------------------------------------------------

class TestBuildEvidenceMap:
    def test_resume_only_skill(self):
        em = _build_evidence_map(["Python"], [], [])
        assert em["Python"] == ["resume"]

    def test_all_three_sources(self):
        em = _build_evidence_map(["Python"], ["Python"], ["Python"])
        assert sorted(em["Python"]) == ["github", "linkedin", "resume"]

    def test_deduplication_case_insensitive(self):
        em = _build_evidence_map(["python"], ["Python"], ["PYTHON"])
        assert len(em) == 1
        assert sorted(list(em.values())[0]) == ["github", "linkedin", "resume"]

    def test_stop_words_excluded(self):
        em = _build_evidence_map(["and", "or", "the"], [], [])
        assert len(em) == 0

    def test_empty_sources(self):
        em = _build_evidence_map([], [], [])
        assert em == {}

    def test_multiple_skills(self):
        em = _build_evidence_map(["Python", "AWS"], ["Python"], [])
        assert sorted(em["Python"]) == ["linkedin", "resume"]
        assert em["AWS"] == ["resume"]

    def test_github_only_skill(self):
        em = _build_evidence_map([], [], ["TypeScript"])
        assert em["TypeScript"] == ["github"]


# ---------------------------------------------------------------------------
# skill_confidence
# ---------------------------------------------------------------------------

class TestSkillConfidence:
    def test_all_three_sources_100(self):
        assert _skill_confidence(["resume", "github", "linkedin"]) == 100

    def test_resume_plus_one_70(self):
        assert _skill_confidence(["resume", "linkedin"]) == 70
        assert _skill_confidence(["resume", "github"]) == 70

    def test_resume_only_30(self):
        assert _skill_confidence(["resume"]) == 30

    def test_non_resume_single_50(self):
        assert _skill_confidence(["github"]) == 50
        assert _skill_confidence(["linkedin"]) == 50

    def test_two_non_resume_70(self):
        assert _skill_confidence(["github", "linkedin"]) == 70


# ---------------------------------------------------------------------------
# build_skill_confidence
# ---------------------------------------------------------------------------

class TestBuildSkillConfidence:
    def test_all_skills_get_scores(self):
        em = {
            "Python": ["resume", "github", "linkedin"],
            "AWS": ["resume", "linkedin"],
            "Kubernetes": ["resume"],
        }
        sc = _build_skill_confidence(em)
        assert sc["Python"] == 100
        assert sc["AWS"] == 70
        assert sc["Kubernetes"] == 30


# ---------------------------------------------------------------------------
# build_normalized_profile
# ---------------------------------------------------------------------------

class TestBuildNormalizedProfile:
    def test_resume_only(self):
        c = _mock_candidate(parsed={
            "name": "Alice",
            "current_role": "Backend Engineer",
            "years_experience": 4,
            "skills": ["Python", "PostgreSQL"],
            "tech_stack": {
                "languages": ["Python"],
                "frameworks": ["FastAPI"],
                "databases": ["PostgreSQL"],
                "cloud": [],
                "tools": [],
            },
            "work_history": [],
            "education": [{"degree": "BSc Computer Science"}],
            "certifications": ["AWS Certified Developer"],
            "project_urls": ["https://github.com/alice/myproject"],
        })
        profile = build_normalized_profile(c)

        assert profile["name"] == "Alice"
        assert profile["headline"] == "Backend Engineer"
        assert "Python" in profile["skills"]
        assert "evidence_map" in profile
        assert "Python" in profile["evidence_map"]
        assert profile["evidence_map"]["Python"] == ["resume"]
        assert profile["skill_confidence"]["Python"] == 30
        assert profile["confidence_score"] > 0

    def test_all_sources_merged(self):
        c = _mock_candidate(
            parsed={
                "name": "Bob",
                "current_role": "Full Stack Dev",
                "years_experience": 3,
                "skills": ["Python", "React"],
                "tech_stack": {"languages": ["Python"], "frameworks": [], "databases": [], "cloud": [], "tools": []},
                "work_history": [],
                "education": [],
                "certifications": [],
                "project_urls": [],
            },
            linkedin={
                "name": "Bob Smith",
                "headline": "Full Stack Engineer",
                "skills": ["Python", "TypeScript"],
                "positions": [{"company": "Acme", "title": "Dev", "date_range": "Jan 2022 - Present"}],
                "certifications": [],
                "education": [],
            },
            github={
                "language_totals": {"Python": 10000, "TypeScript": 5000},
                "repositories": [{"name": "myapp", "html_url": "https://github.com/bob/myapp", "topics": [], "description": "My app", "language": "Python", "stargazers_count": 2, "fork": False}],
                "recent_events": [],
            },
        )
        profile = build_normalized_profile(c)

        assert profile["name"] == "Bob Smith"   # LinkedIn preferred
        # Python should be in all 3 sources
        python_sources = profile["evidence_map"].get("Python") or []
        assert "resume" in python_sources
        assert "github" in python_sources
        assert "linkedin" in python_sources
        assert profile["skill_confidence"]["Python"] == 100
        assert "Python" in profile["verified_skills"]
        assert len(profile["projects"]) >= 1

    def test_empty_candidate(self):
        c = _mock_candidate()
        profile = build_normalized_profile(c)
        assert profile["name"] == ""
        assert profile["skills"] == []
        assert profile["evidence_map"] == {}
        assert profile["confidence_score"] == 0

    def test_verified_skills_require_two_sources(self):
        c = _mock_candidate(
            parsed={"skills": ["Python", "AWS"], "tech_stack": {}, "work_history": [], "education": [], "certifications": [], "project_urls": []},
            linkedin={"skills": ["Python"], "positions": [], "certifications": [], "education": []},
        )
        profile = build_normalized_profile(c)
        assert "Python" in profile["verified_skills"]
        assert "AWS" not in profile["verified_skills"]

    def test_github_languages_populated(self):
        c = _mock_candidate(
            github={"language_totals": {"Go": 5000, "Python": 3000}, "repositories": [], "recent_events": []},
        )
        profile = build_normalized_profile(c)
        assert "Go" in profile["github_languages"]
        assert "Python" in profile["github_languages"]
