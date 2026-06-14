"""
Tests for composite ranking formula and score_explanations.
"""
import pytest
from unittest.mock import patch, MagicMock
from app.services.application_service import (
    _composite_score,
    _build_score_explanations,
    calculate_match,
    build_claims_report,
)


class TestCompositeScore:
    def test_formula_basic(self):
        # fit=80, trust=50 → 80 * (0.6 + 0.4 * 0.5) = 80 * 0.8 = 64
        result = _composite_score(80.0, 50.0)
        assert result == pytest.approx(64.0, rel=1e-3)

    def test_both_max(self):
        result = _composite_score(100.0, 100.0)
        assert result == pytest.approx(100.0, rel=1e-3)

    def test_zero_trust(self):
        # fit=80, trust=0 → 80 * 0.6 = 48
        result = _composite_score(80.0, 0.0)
        assert result == pytest.approx(48.0, rel=1e-3)

    def test_zero_fit(self):
        result = _composite_score(0.0, 100.0)
        assert result == pytest.approx(0.0, rel=1e-3)

    def test_clamp_to_100(self):
        result = _composite_score(200.0, 100.0)
        assert result <= 100.0

    def test_trust_clamped_at_100(self):
        # trust > 100 should not produce composite > fit
        result = _composite_score(80.0, 200.0)
        assert result <= 100.0

    def test_negative_trust_clamped_to_zero(self):
        result = _composite_score(80.0, -50.0)
        assert result == pytest.approx(48.0, rel=1e-3)  # same as trust=0

    def test_spec_example(self):
        # From plan: fit=82, trust=74 → 82 * (0.6 + 0.4*0.74) = 82 * 0.896 = 73.472
        result = _composite_score(82.0, 74.0)
        expected = 82.0 * (0.6 + 0.4 * 0.74)
        assert result == pytest.approx(expected, rel=1e-3)


class TestBuildScoreExplanations:
    def test_output_shape(self):
        exp = _build_score_explanations(
            fit_score=80.0,
            trust_score=70.0,
            composite_score=73.6,
            strengths=["Python", "AWS"],
            trust_data={
                "strengths": ["Strong GitHub activity"],
                "concerns": ["Title mismatch"],
                "unsupported_claims": ["Kubernetes"],
            },
        )
        assert "fit" in exp
        assert "trust" in exp
        assert "composite" in exp
        assert "why" in exp
        assert isinstance(exp["why"], list)

    def test_why_includes_unsupported_claims(self):
        exp = _build_score_explanations(
            fit_score=60.0,
            trust_score=40.0,
            composite_score=52.0,
            strengths=[],
            trust_data={
                "strengths": [],
                "concerns": [],
                "unsupported_claims": ["Kubernetes", "Machine Learning"],
            },
        )
        why_text = " ".join(exp["why"])
        assert "Kubernetes" in why_text or "Machine Learning" in why_text

    def test_why_includes_trust_strengths(self):
        exp = _build_score_explanations(
            fit_score=90.0,
            trust_score=85.0,
            composite_score=87.0,
            strengths=[],
            trust_data={
                "strengths": ["Strong AWS evidence across 3 sources"],
                "concerns": [],
                "unsupported_claims": [],
            },
        )
        assert any("AWS" in w for w in exp["why"])

    def test_scores_stored_correctly(self):
        exp = _build_score_explanations(82.0, 74.0, 73.47, [], {})
        assert exp["fit"] == 82.0
        assert exp["trust"] == 74.0
        assert exp["composite"] == 73.47

    def test_empty_trust_data(self):
        exp = _build_score_explanations(50.0, 50.0, 50.0, [], {})
        assert isinstance(exp["why"], list)

    def test_matched_skills_annotated_with_confidence(self):
        exp = _build_score_explanations(
            fit_score=80.0,
            trust_score=70.0,
            composite_score=73.6,
            strengths=["Python", "AWS"],
            trust_data={},
            profile={"skill_confidence": {"Python": 100, "AWS": 70}},
        )
        why_text = " ".join(exp["why"])
        assert "Python (100% confidence)" in why_text
        assert "AWS (70% confidence)" in why_text

    def test_matched_skills_without_profile_unannotated(self):
        exp = _build_score_explanations(
            fit_score=80.0,
            trust_score=70.0,
            composite_score=73.6,
            strengths=["Python", "AWS"],
            trust_data={},
        )
        why_text = " ".join(exp["why"])
        assert "Matched skills: Python, AWS" in why_text


class TestCalculateMatchUsesNormalizedProfile:
    def _job(self, required_skills, tech_stack=None, inferred_skills=None, experience_years=0):
        job = MagicMock()
        job.parsed_jd_json = {
            "required_skills": required_skills,
            "inferred_skills": inferred_skills or [],
            "tech_stack": tech_stack or {},
            "experience_years": experience_years,
        }
        return job

    def _candidate(self, parsed_skills=None, normalized_profile=None):
        candidate = MagicMock()
        candidate.parsed_candidate_json = {
            "skills": parsed_skills or [],
            "tech_stack": {},
            "years_experience": 0,
        }
        candidate.normalized_profile_json = normalized_profile or {}
        return candidate

    def test_alias_match_via_normalized_profile(self):
        """
        JD requires "Node.js". Resume only said "Node", but the normalized
        profile (built across resume/LinkedIn/GitHub) canonicalizes this to
        "Node.js". Matching against normalized skills should find the hit
        even though the raw resume skill list wouldn't.
        """
        job = self._job(required_skills=["Node.js"])
        candidate = self._candidate(
            parsed_skills=["Node"],
            normalized_profile={"skills": ["Node.js"]},
        )

        match = calculate_match(job=job, candidate=candidate)

        assert "Node.js" in match["strengths"]
        assert "Node.js" not in match["gaps"]
        assert match["score"] > 0

    def test_falls_back_to_raw_skills_without_normalized_profile(self):
        """If no normalized profile exists yet, fall back to raw parsed skills."""
        job = self._job(required_skills=["Python"])
        candidate = self._candidate(
            parsed_skills=["Python"],
            normalized_profile={},
        )

        match = calculate_match(job=job, candidate=candidate)

        assert "Python" in match["strengths"]

    def test_without_normalized_profile_alias_mismatch_creates_gap(self):
        """
        Without a normalized profile, "Node" (raw resume skill) does not
        directly equal "Node.js" unless canonicalized via _as_set — but
        _as_set already canonicalizes via CANONICAL_SKILL_MAP, so this
        should still match. This documents that even the raw fallback
        benefits from canonical term resolution.
        """
        job = self._job(required_skills=["Node.js"])
        candidate = self._candidate(
            parsed_skills=["Node"],
            normalized_profile={},
        )

        match = calculate_match(job=job, candidate=candidate)

        assert "Node.js" in match["strengths"]


class TestBuildClaimsReport:
    def test_empty_profile_returns_no_claims(self):
        candidate = MagicMock()
        candidate.normalized_profile_json = {}
        claims = build_claims_report(candidate)
        assert claims == []

    def test_verified_vs_unverified_claims(self):
        candidate = MagicMock()
        candidate.normalized_profile_json = {
            "evidence_map": {
                "Python": ["resume", "github"],
                "Kubernetes": ["resume"],
            },
            "skill_confidence": {"Python": 100, "Kubernetes": 30},
            "verified_skills": ["Python"],
        }
        claims = build_claims_report(candidate)

        by_skill = {c["skill"]: c for c in claims}
        assert by_skill["Python"]["verified"] is True
        assert by_skill["Python"]["status"] == "verified"
        assert by_skill["Python"]["confidence"] == 100
        assert sorted(by_skill["Python"]["sources"]) == ["github", "resume"]

        assert by_skill["Kubernetes"]["verified"] is False
        assert by_skill["Kubernetes"]["status"] == "unverified"
        assert by_skill["Kubernetes"]["confidence"] == 30

    def test_claims_sorted_by_confidence_descending(self):
        candidate = MagicMock()
        candidate.normalized_profile_json = {
            "evidence_map": {
                "A": ["resume"],
                "B": ["resume", "github", "linkedin"],
                "C": ["resume", "linkedin"],
            },
            "skill_confidence": {"A": 30, "B": 100, "C": 70},
            "verified_skills": ["B", "C"],
        }
        claims = build_claims_report(candidate)
        confidences = [c["confidence"] for c in claims]
        assert confidences == sorted(confidences, reverse=True)
        assert claims[0]["skill"] == "B"


class TestCompositeOnApplication:
    """Integration-style test: application creation stores composite score."""

    def test_application_has_composite_fields(self, db_session):
        from tests.conftest import create_user, create_job, create_candidate
        from app.services.application_service import create_application

        recruiter = create_user(db_session, "rec@test.com", 1)
        cand_user = create_user(db_session, "cand@test.com", 2)
        job = create_job(db_session, recruiter)
        candidate = create_candidate(db_session, cand_user)

        # Patch trust to return deterministic result (no Gemini call)
        # The import happens inside create_application, so patch the source module
        trust_result = {
            "trust_score": 60,
            "strengths": ["Python verified"],
            "concerns": [],
            "unsupported_claims": [],
            "evidence": {},
            "explanations": [],
            "llm_review": {"status": "error", "fallback_used": True},
        }
        with patch("app.services.trust_service.calculate_trust_score",
                   return_value=trust_result):
            app_obj = create_application(db=db_session, job_id=job.id, candidate=candidate)

        assert app_obj.fit_score > 0
        assert app_obj.trust_score == 60.0
        assert app_obj.composite_score > 0
        assert isinstance(app_obj.score_explanations, dict)
        assert "why" in app_obj.score_explanations
        # match_score backward compat
        assert app_obj.match_score == app_obj.fit_score