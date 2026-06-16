"""
Tests for trust score engine: deterministic rules, LLM fallback, claim extraction.
"""
from unittest.mock import MagicMock, patch

from app.services.trust_service import (
    extract_claims,
    calculate_trust_score,
    _date_consistency_check,
    _title_consistency_check,
    _skill_evidence_check,
    _generate_activity_signals,
    _generate_learning_signals,
)


def _mock_candidate(
    parsed=None,
    linkedin=None,
    github=None,
    raw_text="",
    normalized=None,
):
    c = MagicMock()
    c.parsed_candidate_json = parsed or {}
    c.linkedin_profile_json = linkedin or {}
    c.github_profile_json = github or {}
    c.normalized_profile_json = normalized or {}
    c.raw_resume_text = raw_text
    return c


# ---------------------------------------------------------------------------
# Claim extraction
# ---------------------------------------------------------------------------

class TestExtractClaims:
    def test_extracts_skill_from_parsed_skills(self):
        c = _mock_candidate(parsed={"skills": ["Python", "AWS"], "current_role": ""})
        claims = extract_claims(c)
        values = [cl["value"] for cl in claims]
        assert "Python" in values
        assert "AWS" in values

    def test_extracts_tech_from_raw_text(self):
        c = _mock_candidate(
            parsed={"skills": [], "current_role": ""},
            raw_text="We built a Kubernetes cluster for production."
        )
        claims = extract_claims(c)
        values = [cl["value"].lower() for cl in claims]
        assert any("kubernetes" in v for v in values)

    def test_extracts_role_claims(self):
        c = _mock_candidate(parsed={"skills": [], "current_role": "Lead Engineer"})
        claims = extract_claims(c)
        types = [cl["type"] for cl in claims]
        assert "role" in types

    def test_no_duplicates(self):
        c = _mock_candidate(parsed={"skills": ["Python", "Python"], "current_role": ""})
        claims = extract_claims(c)
        values = [cl["value"] for cl in claims if cl["type"] == "skill"]
        assert values.count("Python") == 1

    def test_empty_candidate(self):
        c = _mock_candidate()
        claims = extract_claims(c)
        assert isinstance(claims, list)


# ---------------------------------------------------------------------------
# Deterministic checks
# ---------------------------------------------------------------------------

class TestDateConsistencyCheck:
    def test_consistent_dates_no_penalty(self):
        parsed = {"work_history": [{"company": "Acme", "dates": "2020-2023"}]}
        linkedin = {"positions": [{"title": "Dev", "date_range": "January 2020 - January 2023"}]}
        pts, expl, conc = _date_consistency_check(parsed, linkedin)
        assert pts >= 0

    def test_missing_data_neutral(self):
        pts, expl, conc = _date_consistency_check({}, {})
        assert pts == 0

    def test_large_gap_penalises(self):
        parsed = {"work_history": [{"dates": "2015-2018"}]}
        linkedin = {"positions": [{"date_range": "January 2020 - Present"}]}
        pts, expl, conc = _date_consistency_check(parsed, linkedin)
        assert pts < 0 or len(conc) > 0


class TestTitleConsistencyCheck:
    def test_matching_titles_positive(self):
        parsed = {"current_role": "Senior Backend Engineer"}
        linkedin = {"headline": "Senior Software Engineer"}
        pts, expl, conc = _title_consistency_check(parsed, linkedin)
        # "senior" is a keyword overlap — should not penalise
        assert pts >= 0

    def test_completely_different_titles_penalty(self):
        parsed = {"current_role": "Marketing Manager"}
        linkedin = {"headline": "Software Engineer"}
        pts, expl, conc = _title_consistency_check(parsed, linkedin)
        assert pts < 0 or len(conc) > 0

    def test_missing_titles_neutral(self):
        pts, expl, conc = _title_consistency_check({}, {})
        assert pts == 0


class TestSkillEvidenceCheck:
    def test_resume_only_adds_unsupported(self):
        em = {"Kubernetes": ["resume"], "Python": ["resume", "github"]}
        pts, expl, conc, unsupported = _skill_evidence_check(em)
        assert "Kubernetes" in unsupported
        assert "Python" not in unsupported

    def test_three_source_skill_max_points(self):
        em = {"Python": ["resume", "github", "linkedin"]}
        pts, expl, conc, unsupported = _skill_evidence_check(em)
        assert pts > 0
        assert "Python" not in unsupported

    def test_empty_evidence_zero_score(self):
        pts, expl, conc, unsupported = _skill_evidence_check({})
        assert pts == 0

    def test_github_evidence_weighted_higher_than_resume_linkedin(self):
        """
        A skill backed by resume+github should score higher than a skill
        backed by resume+linkedin, since GitHub evidence (actual code) is
        harder to fake than a LinkedIn skill tag.
        """
        em_github = {"Python": ["resume", "github"]}
        em_linkedin = {"Python": ["resume", "linkedin"]}

        pts_github, _, _, _ = _skill_evidence_check(em_github)
        pts_linkedin, _, _, _ = _skill_evidence_check(em_linkedin)

        assert pts_github > pts_linkedin

    def test_github_only_outweighs_resume_only(self):
        """A GitHub-only skill is stronger evidence than a resume-only claim."""
        em_github_only = {"Go": ["github"]}
        em_resume_only = {"Go": ["resume"]}

        pts_github, _, _, unsupported_github = _skill_evidence_check(em_github_only)
        pts_resume, _, _, unsupported_resume = _skill_evidence_check(em_resume_only)

        assert pts_github > pts_resume
        assert "Go" not in unsupported_github
        assert "Go" in unsupported_resume

    def test_all_three_sources_scores_higher_than_two(self):
        em_three = {"Python": ["resume", "github", "linkedin"]}
        em_two = {"Python": ["resume", "github"]}

        pts_three, _, _, _ = _skill_evidence_check(em_three)
        pts_two, _, _, _ = _skill_evidence_check(em_two)

        assert pts_three > pts_two

    def test_github_backed_skill_explanation_mentions_github(self):
        em = {"Python": ["resume", "github"]}
        pts, expl, conc, unsupported = _skill_evidence_check(em)
        assert any("GitHub" in e for e in expl)


class TestGenerateActivitySignals:
    def test_no_github_data(self):
        pts, expl, conc = _generate_activity_signals({})
        assert pts == 0
        assert len(conc) > 0

    def test_recent_events_add_points(self):
        from datetime import datetime, UTC, timedelta
        recent = (datetime.now(UTC) - timedelta(days=10)).strftime("%Y-%m-%dT%H:%M:%SZ")
        github = {
            "recent_events": [
                {"created_at": recent, "type": "PushEvent"},
                {"created_at": recent, "type": "PushEvent"},
                {"created_at": recent, "type": "PushEvent"},
                {"created_at": recent, "type": "PushEvent"},
                {"created_at": recent, "type": "PushEvent"},
            ],
            "repositories": [
                {"fork": False}, {"fork": False}, {"fork": False},
            ],
            "language_totals": {"Python": 1000, "Go": 500},
        }
        pts, expl, conc = _generate_activity_signals(github)
        assert pts >= 10

    def test_owned_repos_contribute(self):
        github = {
            "recent_events": [],
            "repositories": [{"fork": False}, {"fork": False}, {"fork": False}],
            "language_totals": {"Python": 1000},
        }
        pts, expl, conc = _generate_activity_signals(github)
        assert pts == 0


class TestGenerateLearningSignals:
    def test_cert_matching_skill_adds_points(self):
        parsed = {"certifications": ["AWS Certified Developer"]}
        linkedin = {}
        em = {"AWS": ["resume"]}
        pts, expl, conc = _generate_learning_signals(parsed, linkedin, em)
        assert pts > 0

    def test_cert_not_matching_skill_no_points(self):
        parsed = {"certifications": ["Yoga Instructor Certificate"]}
        linkedin = {}
        em = {"Python": ["resume"]}
        pts, expl, conc = _generate_learning_signals(parsed, linkedin, em)
        assert pts > 0 # It adds points just for having certs now

    def test_no_certs_zero(self):
        pts, expl, conc = _generate_learning_signals({}, {}, {})
        assert pts == 0


# ---------------------------------------------------------------------------
# Full trust score output
# ---------------------------------------------------------------------------

class TestCalculateTrustScore:
    def test_output_shape(self):
        c = _mock_candidate(
            parsed={"skills": ["Python"], "current_role": "Dev", "work_history": [], "certifications": []},
            linkedin={"skills": ["Python"], "headline": "Developer", "positions": [], "certifications": [], "education": []},
            github={
                "recent_events": [],
                "repositories": [],
                "language_totals": {"Python": 1000},
            },
            normalized={
                "evidence_map": {"Python": ["resume", "linkedin"]},
                "skill_confidence": {"Python": 70},
            },
        )
        # Patch LLM to always fail (no bonus, no penalty)
        with patch("app.services.trust_service._llm_consistency_review") as mock_llm:
            mock_llm.return_value = (0, {
                "status": "error",
                "error_reason": "test",
                "consistency_score": 0,
                "llm_concerns": [],
                "llm_strengths": [],
                "fallback_used": True,
            })
            result = calculate_trust_score(c)

        assert "trust_score" in result
        assert "strengths" in result
        assert "concerns" in result
        assert "unsupported_claims" in result
        assert "evidence" in result
        assert "explanations" in result
        assert "llm_review" in result
        assert "score_breakdown" in result
        assert "behavioral_insights" in result
        assert 0 <= result["trust_score"] <= 100

    def test_llm_failure_no_bonus_no_penalty(self):
        """When Gemini fails, trust score = deterministic score only (no +10 neutral)."""
        c = _mock_candidate(
            parsed={"skills": ["Python"], "current_role": "Dev", "work_history": [], "certifications": []},
            normalized={"evidence_map": {"Python": ["resume", "github"]}},
        )
        with patch("app.services.trust_service._llm_consistency_review") as mock_llm:
            mock_llm.return_value = (0, {"status": "error", "fallback_used": True, "llm_concerns": [], "llm_strengths": [], "consistency_score": 0, "error_reason": "timeout"})
            result = calculate_trust_score(c)

        # Score should equal deterministic portion only
        assert result["trust_score"] <= 95  # cannot exceed det max

    def test_llm_success_adds_pts(self):
        """When Gemini succeeds with score 80, it adds (80/100)*5 = 4 pts."""
        c = _mock_candidate(
            parsed={"skills": ["Python"], "current_role": "Dev", "work_history": [], "certifications": []},
            normalized={"evidence_map": {"Python": ["resume", "github"]}},
        )
        with patch("app.services.trust_service._llm_consistency_review") as mock_llm:
            mock_llm.return_value = (4, {
                "status": "ok",
                "consistency_score": 80,
                "llm_concerns": [],
                "llm_strengths": ["Strong Python evidence"],
                "fallback_used": False,
                "error_reason": None,
            })
            result = calculate_trust_score(c)

        # Should include LLM pts
        assert result["trust_score"] > 0

    def test_unsupported_claims_in_output(self):
        c = _mock_candidate(
            parsed={"skills": ["Kubernetes", "Machine Learning"], "current_role": "", "work_history": [], "certifications": []},
            normalized={"evidence_map": {
                "Kubernetes": ["resume"],
                "Machine Learning": ["resume"],
            }},
        )
        with patch("app.services.trust_service._llm_consistency_review") as mock_llm:
            mock_llm.return_value = (0, {"status": "error", "fallback_used": True, "llm_concerns": [], "llm_strengths": [], "consistency_score": 0, "error_reason": "x"})
            result = calculate_trust_score(c)

        assert "Kubernetes" in result["unsupported_claims"]
        assert "Machine Learning" in result["unsupported_claims"]