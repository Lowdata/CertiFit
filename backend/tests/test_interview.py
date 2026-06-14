"""
Tests for interview copilot: plan shape, trust-driven questions, Gemini failure fallback.
"""
from unittest.mock import MagicMock, patch

from app.services.interview_service import (
    generate_interview_plan,
    _deterministic_technical,
    _deterministic_behavioral,
    _deterministic_verification,
    _deterministic_project,
)


def _mock_job(required_skills=None, seniority="senior", role="Backend Engineer"):
    j = MagicMock()
    j.title = role
    j.parsed_jd_json = {
        "role": role,
        "required_skills": required_skills or ["Python", "AWS"],
        "inferred_skills": [],
        "seniority": seniority,
        "tech_stack": {"languages": ["Python"], "frameworks": [], "databases": [], "infrastructure": [], "tools": []},
    }
    return j


def _mock_candidate(profile=None, trust=None):
    c = MagicMock()
    c.normalized_profile_json = profile or {}
    c.trust_score_json = trust or {}
    c.parsed_candidate_json = {}
    return c


def _mock_application(fit=75.0, composite=68.0, trust=70.0):
    a = MagicMock()
    a.fit_score = fit
    a.composite_score = composite
    a.trust_score = trust
    return a


# ---------------------------------------------------------------------------
# Deterministic generators
# ---------------------------------------------------------------------------

class TestDeterministicTechnical:
    def test_generates_questions_for_required_skills(self):
        profile = {"evidence_map": {"Python": ["resume", "github"]}}
        qs = _deterministic_technical(["Python", "AWS"], profile)
        assert len(qs) >= 1
        assert all(isinstance(q, str) for q in qs)

    def test_uses_template_for_known_skills(self):
        qs = _deterministic_technical(["Kubernetes"], {})
        assert len(qs) >= 1
        assert any("kubernetes" in q.lower() or "Kubernetes" in q for q in qs)

    def test_fallback_question_for_unknown_skill(self):
        qs = _deterministic_technical(["SomeObscureSkill123"], {})
        assert len(qs) >= 1
        assert "SomeObscureSkill123" in qs[0]

    def test_empty_skills(self):
        qs = _deterministic_technical([], {})
        assert qs == []

    def test_max_eight_questions(self):
        skills = [f"Skill{i}" for i in range(20)]
        qs = _deterministic_technical(skills, {})
        assert len(qs) <= 8


class TestDeterministicBehavioral:
    def test_lead_questions(self):
        job = {"seniority": "lead"}
        qs = _deterministic_behavioral(job)
        assert len(qs) >= 1
        assert any("architecture" in q.lower() or "technical" in q.lower() for q in qs)

    def test_senior_questions(self):
        job = {"seniority": "senior"}
        qs = _deterministic_behavioral(job)
        assert len(qs) >= 1

    def test_default_questions(self):
        job = {}
        qs = _deterministic_behavioral(job)
        assert len(qs) >= 1


class TestDeterministicVerification:
    def test_concerns_become_questions(self):
        trust = {
            "concerns": ["Title mismatch: resume says Lead, LinkedIn says Senior"],
            "unsupported_claims": [],
        }
        qs = _deterministic_verification(trust)
        assert len(qs) >= 1
        assert any("mismatch" in q.lower() or "noticed" in q.lower() for q in qs)

    def test_unsupported_claims_become_questions(self):
        trust = {
            "concerns": [],
            "unsupported_claims": ["Kubernetes", "Machine Learning"],
        }
        qs = _deterministic_verification(trust)
        assert len(qs) >= 1
        assert any("Kubernetes" in q or "kubernetes" in q.lower() for q in qs)

    def test_both_concerns_and_claims(self):
        trust = {
            "concerns": ["Date gap in 2020"],
            "unsupported_claims": ["AWS"],
        }
        qs = _deterministic_verification(trust)
        assert len(qs) >= 2

    def test_empty_trust_data(self):
        qs = _deterministic_verification({})
        assert qs == []

    def test_max_six_questions(self):
        trust = {
            "concerns": [f"Concern {i}" for i in range(10)],
            "unsupported_claims": [f"Skill{i}" for i in range(10)],
        }
        qs = _deterministic_verification(trust)
        assert len(qs) <= 6


class TestDeterministicProject:
    def test_github_repos_generate_questions(self):
        profile = {
            "projects": [
                {
                    "source": "github",
                    "name": "myapp",
                    "url": "https://github.com/u/myapp",
                    "description": "A cool web app",
                    "language": "Python",
                    "stars": 5,
                },
            ]
        }
        qs = _deterministic_project(profile)
        assert len(qs) >= 1
        assert any("myapp" in q for q in qs)

    def test_fallback_question_when_no_projects(self):
        qs = _deterministic_project({})
        assert len(qs) >= 1


# ---------------------------------------------------------------------------
# Full generate_interview_plan
# ---------------------------------------------------------------------------

class TestGenerateInterviewPlan:
    def test_output_shape(self):
        job = _mock_job()
        candidate = _mock_candidate()
        application = _mock_application()

        # Patch Gemini to fail — should fall back gracefully
        with patch("app.services.interview_service._llm_enrich_questions") as mock_enrich:
            mock_enrich.side_effect = Exception("Gemini down")
            plan = generate_interview_plan(job, candidate, application)

        assert "technical_questions" in plan
        assert "behavioral_questions" in plan
        assert "verification_questions" in plan
        assert "project_questions" in plan
        assert "optimisation_based_questions" in plan
        assert isinstance(plan["technical_questions"], list)

    def test_verification_questions_from_trust(self):
        job = _mock_job()
        candidate = _mock_candidate(
            trust={
                "concerns": ["Resume says Lead, LinkedIn says Senior Engineer"],
                "unsupported_claims": ["Kubernetes"],
            }
        )
        application = _mock_application()

        # Force LLM to return deterministic questions unchanged
        with patch("app.services.interview_service._llm_enrich_questions") as mock_enrich:
            mock_enrich.side_effect = Exception("test")
            plan = generate_interview_plan(job, candidate, application)

        verif = plan["verification_questions"]
        assert len(verif) >= 1

    def test_gemini_failure_returns_deterministic(self):
        """Even if Gemini completely fails, the plan must be non-empty."""
        job = _mock_job(required_skills=["Python", "Docker"])
        candidate = _mock_candidate()
        application = _mock_application()

        with patch("app.services.interview_service._llm_enrich_questions") as mock_enrich:
            mock_enrich.side_effect = RuntimeError("Network error")
            plan = generate_interview_plan(job, candidate, application)

        assert len(plan["technical_questions"]) > 0
        assert len(plan["behavioral_questions"]) > 0

    def test_llm_enriched_questions_used_when_available(self):
        """When LLM returns valid questions, they are used over deterministic."""
        job = _mock_job()
        candidate = _mock_candidate()
        application = _mock_application()

        enriched = {
            "technical_questions": ["Enriched technical question?"],
            "behavioral_questions": ["Enriched behavioral question?"],
            "verification_questions": [],
            "project_questions": ["Enriched project question?"],
            "optimisation_based_questions": ["Enriched optimisation question?"],
        }

        with patch("app.services.interview_service._llm_enrich_questions",
                   return_value=enriched):
            plan = generate_interview_plan(job, candidate, application)

        assert "Enriched technical question?" in plan["technical_questions"]


# ---------------------------------------------------------------------------
# Gemini reliability (safe_gemini_call)
# ---------------------------------------------------------------------------

class TestSafeGeminiCall:
    """Test the safe_gemini_call wrapper in llm_validation."""

    def test_timeout_returns_fallback(self):
        from app.services.llm_validation import safe_gemini_call

        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("timeout")

        def fallback(reason):
            return {"result": "fallback", "_reason": reason}

        result, meta = safe_gemini_call(
            client=mock_client,
            prompt="test prompt",
            schema_keys=["result"],
            fallback_fn=fallback,
            label="test",
        )
        assert meta["fallback_used"] is True
        assert meta["status"] == "error"
        assert result["result"] == "fallback"

    def test_empty_response_returns_fallback(self):
        from app.services.llm_validation import safe_gemini_call

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = None
        mock_client.models.generate_content.return_value = mock_response

        def fallback(reason):
            return {"data": "empty_fallback"}

        result, meta = safe_gemini_call(
            client=mock_client,
            prompt="test",
            schema_keys=["data"],
            fallback_fn=fallback,
            label="test",
        )
        assert meta["fallback_used"] is True

    def test_invalid_json_returns_fallback(self):
        from app.services.llm_validation import safe_gemini_call

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "not valid json {{{"
        mock_response.candidates = []
        mock_client.models.generate_content.return_value = mock_response

        def fallback(reason):
            return {"data": "json_fallback"}

        result, meta = safe_gemini_call(
            client=mock_client,
            prompt="test",
            schema_keys=["data"],
            fallback_fn=fallback,
            label="test",
        )
        assert meta["fallback_used"] is True

    def test_valid_response_returned(self):
        from app.services.llm_validation import safe_gemini_call
        import json

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({"concerns": [], "strengths": [], "consistency_score": 85})
        mock_response.candidates = []
        mock_client.models.generate_content.return_value = mock_response

        def fallback(reason):
            return {"concerns": [], "strengths": [], "consistency_score": 0}

        result, meta = safe_gemini_call(
            client=mock_client,
            prompt="test",
            schema_keys=["concerns", "strengths", "consistency_score"],
            fallback_fn=fallback,
            label="test",
        )
        assert meta["fallback_used"] is False
        assert result["consistency_score"] == 85

    def test_missing_schema_keys_partial_merge(self):
        from app.services.llm_validation import safe_gemini_call
        import json

        mock_client = MagicMock()
        mock_response = MagicMock()
        # Response missing "strengths"
        mock_response.text = json.dumps({"concerns": ["issue"], "consistency_score": 70})
        mock_response.candidates = []
        mock_client.models.generate_content.return_value = mock_response

        def fallback(reason):
            return {"concerns": [], "strengths": ["fallback strength"], "consistency_score": 0}

        result, meta = safe_gemini_call(
            client=mock_client,
            prompt="test",
            schema_keys=["concerns", "strengths", "consistency_score"],
            fallback_fn=fallback,
            label="test",
        )
        # Partial — should have status partial or ok, not full fallback
        assert meta["fallback_used"] is False
        assert "strengths" in result  # filled from fallback
        assert result["concerns"] == ["issue"]  # from LLM