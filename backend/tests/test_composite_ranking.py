"""
Tests for composite ranking formula and score_explanations.
"""
import pytest
from unittest.mock import patch
from app.services.application_service import (
    _composite_score,
    _build_score_explanations,
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
