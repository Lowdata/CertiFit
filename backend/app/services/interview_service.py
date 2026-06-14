"""
Interview Copilot Service.

Generates a structured interview plan from:
  - job.parsed_jd_json
  - candidate.normalized_profile_json  (evidence_map, verified_skills)
  - candidate.trust_score_json         (concerns, unsupported_claims)
  - application.fit_score / composite_score

Output:
{
    "technical_questions": [],
    "behavioral_questions": [],
    "verification_questions": [],
    "project_questions": []
}

Gemini is used to generate natural question text.
If Gemini fails, deterministic fallback questions are generated from templates.
"""
from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models.candidate import Candidate
    from app.models.job import Job
    from app.models.application import Application

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Deterministic fallback generators
# ---------------------------------------------------------------------------

_TECH_TEMPLATES = {
    "kubernetes": [
        "Walk me through a production Kubernetes deployment — how did you configure resource limits and autoscaling?",
        "Describe how you handled a pod crash or node failure in Kubernetes.",
    ],
    "docker": [
        "Explain how you optimise Docker image size in a production pipeline.",
        "How do you manage secrets in a Dockerised application?",
    ],
    "aws": [
        "Which AWS services have you used most heavily and what problems were you solving?",
        "Describe an incident where an AWS service limit or failure affected your system.",
    ],
    "machine learning": [
        "Describe an ML model you trained in production — what was the dataset size and how did you evaluate it?",
        "How did you handle data drift or model degradation after deployment?",
    ],
    "python": [
        "What is your preferred Python project structure for a production service?",
        "Describe a performance bottleneck in Python you diagnosed and resolved.",
    ],
    "react": [
        "Explain how you manage global state in a large React application.",
        "How do you optimise rendering performance in React?",
    ],
}

_BEHAVIORAL_BY_SENIORITY = {
    "lead": [
        "Tell me about a time you had to make a significant architectural decision under time pressure.",
        "How do you align engineering priorities with business goals when they conflict?",
        "Describe a situation where you had to manage technical debt against feature delivery.",
    ],
    "senior": [
        "Describe a technically complex problem you solved — what was the approach and trade-offs?",
        "Tell me about a time you disagreed with a technical decision and how you handled it.",
        "How do you balance code quality with delivery speed?",
    ],
    "default": [
        "Tell me about the most challenging project you have worked on.",
        "Describe a time you had to learn a new technology quickly — what was your approach?",
        "How do you handle disagreements with teammates on technical approaches?",
    ],
}


def _deterministic_technical(
    required_skills: list[str],
    profile: dict,
) -> list[str]:
    """Generate technical questions from JD required skills + candidate profile."""
    questions: list[str] = []
    evidence_map = profile.get("evidence_map") or {}

    for skill in required_skills[:6]:
        key = skill.lower().strip()
        sources = evidence_map.get(skill) or []
        source_note = f" (claimed in {', '.join(sources)})" if sources else " (claimed in resume)"

        # Check if we have a template for this skill
        matched_template = None
        for template_key, template_qs in _TECH_TEMPLATES.items():
            if template_key in key:
                matched_template = template_qs[0]
                break

        if matched_template:
            questions.append(matched_template)
        else:
            questions.append(
                f"Explain your hands-on experience with {skill}{source_note}. "
                f"Give a specific example from a production context."
            )

    return questions[:8]


def _deterministic_behavioral(job_data: dict) -> list[str]:
    """Generate behavioral questions from job seniority/leadership signals."""
    seniority = (job_data.get("seniority") or "").lower()
    if seniority in {"lead", "staff", "principal"}:
        return _BEHAVIORAL_BY_SENIORITY["lead"]
    if seniority in {"senior"}:
        return _BEHAVIORAL_BY_SENIORITY["senior"]
    return _BEHAVIORAL_BY_SENIORITY["default"]


def _deterministic_verification(trust_data: dict) -> list[str]:
    """Generate verification questions from trust concerns and unsupported claims."""
    questions: list[str] = []

    for concern in (trust_data.get("concerns") or [])[:4]:
        # Convert concern text into a question
        questions.append(f"I noticed: {concern}. Can you clarify this?")

    for claim in (trust_data.get("unsupported_claims") or [])[:4]:
        key = claim.lower()
        matched_template = None
        for template_key, template_qs in _TECH_TEMPLATES.items():
            if template_key in key:
                matched_template = template_qs[-1]  # use second template for verification
                break

        if matched_template:
            questions.append(matched_template)
        else:
            questions.append(
                f"Your profile mentions {claim}. Can you walk me through a specific "
                f"project where you applied this in a meaningful way?"
            )

    return questions[:6]


def _deterministic_project(profile: dict) -> list[str]:
    """Generate project walk-through questions from GitHub repos and project URLs."""
    questions: list[str] = []
    projects = profile.get("projects") or []

    for project in projects[:3]:
        if project.get("source") == "github":
            name = project.get("name") or "your repository"
            desc = project.get("description") or ""
            lang = project.get("language") or ""
            lang_note = f" (built in {lang})" if lang else ""
            desc_note = f": {desc[:80]}" if desc else ""
            questions.append(
                f"Walk me through your '{name}' project{lang_note}{desc_note}. "
                f"What problem does it solve and what were the key engineering decisions?"
            )
        elif project.get("source") == "resume":
            url = project.get("url") or ""
            questions.append(
                f"Tell me about the project at {url}. "
                f"What was your specific contribution and what did you learn?"
            )

    if not questions:
        questions.append(
            "Walk me through a personal or open-source project you are most proud of. "
            "What were the hardest engineering challenges?"
        )

    return questions[:5]


# ---------------------------------------------------------------------------
# LLM enrichment
# ---------------------------------------------------------------------------

def _fallback_interview_plan(reason: str) -> dict[str, Any]:
    return {
        "technical_questions": [],
        "behavioral_questions": [],
        "verification_questions": [],
        "project_questions": [],
        "_reason": reason,
    }


def _llm_enrich_questions(
    technical: list[str],
    behavioral: list[str],
    verification: list[str],
    project: list[str],
    job_title: str,
) -> dict[str, Any]:
    """
    Use Gemini to improve question quality and naturalness.
    Falls back to deterministic questions on any failure.
    """
    try:
        from google import genai
        from app.core.config import GEMINI_API_KEY
        from app.services.llm_validation import safe_gemini_call

        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as exc:
        logger.warning("Gemini init failed for interview enrichment: %s", exc)
        return {
            "technical_questions": technical,
            "behavioral_questions": behavioral,
            "verification_questions": verification,
            "project_questions": project,
        }

    prompt = f"""You are an expert technical interviewer helping prepare for a {job_title} interview.

Improve these questions to be more specific, probing, and natural-sounding for a senior engineering interview.
Keep the same intent but make them better.

Technical questions to improve:
{json.dumps(technical, indent=2)}

Behavioral questions to improve:
{json.dumps(behavioral, indent=2)}

Verification questions to improve (these probe inconsistencies — keep them diplomatic but direct):
{json.dumps(verification, indent=2)}

Project questions to improve:
{json.dumps(project, indent=2)}

Return ONLY valid JSON in this exact shape:
{{
  "technical_questions": ["<improved question>"],
  "behavioral_questions": ["<improved question>"],
  "verification_questions": ["<improved question>"],
  "project_questions": ["<improved question>"]
}}

Rules:
- Keep all verification questions — they probe important inconsistencies
- Do NOT add new questions not in the input
- Keep count the same or reduce if question is too similar to another
- Do NOT mention any specific candidate name
"""

    schema_keys = [
        "technical_questions",
        "behavioral_questions",
        "verification_questions",
        "project_questions",
    ]

    def _fallback(reason: str) -> dict:
        return {
            "technical_questions": technical,
            "behavioral_questions": behavioral,
            "verification_questions": verification,
            "project_questions": project,
        }

    result, meta = safe_gemini_call(
        client=client,
        prompt=prompt,
        schema_keys=schema_keys,
        fallback_fn=_fallback,
        label="interview_enrichment",
    )

    # Validate each list is actually a list, fall back to deterministic if not
    out = {}
    for key, fallback_val in [
        ("technical_questions", technical),
        ("behavioral_questions", behavioral),
        ("verification_questions", verification),
        ("project_questions", project),
    ]:
        val = result.get(key)
        out[key] = val if isinstance(val, list) and val else fallback_val

    return out


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_interview_plan(
    job: "Job",
    candidate: "Candidate",
    application: "Application",
) -> dict[str, Any]:
    """
    Generate a structured interview plan.

    Consumes job parsed JD, candidate normalized profile, and trust findings.
    Uses Gemini to polish question text; falls back to deterministic templates.
    """
    job_data = job.parsed_jd_json or {}
    profile = candidate.normalized_profile_json or {}
    trust_data = candidate.trust_score_json or {}

    required_skills = job_data.get("required_skills") or []
    job_title = job_data.get("role") or job.title or "Software Engineer"

    # Generate deterministic base questions
    technical = _deterministic_technical(required_skills, profile)
    behavioral = _deterministic_behavioral(job_data)
    verification = _deterministic_verification(trust_data)
    project = _deterministic_project(profile)

    # Enrich with LLM (graceful fallback to deterministic)
    try:
        enriched = _llm_enrich_questions(
            technical=technical,
            behavioral=behavioral,
            verification=verification,
            project=project,
            job_title=job_title,
        )
    except Exception:
        logger.exception("Interview LLM enrichment failed; using deterministic questions")
        enriched = {
            "technical_questions": technical,
            "behavioral_questions": behavioral,
            "verification_questions": verification,
            "project_questions": project,
        }

    return {
        "technical_questions": enriched.get("technical_questions") or technical,
        "behavioral_questions": enriched.get("behavioral_questions") or behavioral,
        "verification_questions": enriched.get("verification_questions") or verification,
        "project_questions": enriched.get("project_questions") or project,
    }
