import json
import logging
from collections.abc import Mapping
from typing import Any

from google.genai import types

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_TIMEOUT_MS = 12_000
GEMINI_RETRY_ATTEMPTS = 2


def gemini_json_config() -> dict[str, Any]:
    return {
        "temperature": 0.1,
        "response_mime_type": "application/json",
        "http_options": types.HttpOptions(
            timeout=GEMINI_TIMEOUT_MS,
            retry_options=types.HttpRetryOptions(
                attempts=GEMINI_RETRY_ATTEMPTS,
                initial_delay=0.5,
                max_delay=2,
                http_status_codes=[429, 500, 502, 503, 504],
            ),
        ),
    }


def fallback_job_analysis(reason: str) -> dict[str, Any]:
    return {
        "role": "unknown",
        "domain": "unknown",
        "required_skills": [],
        "inferred_skills": [],
        "tech_stack": {
            "languages": [],
            "frameworks": [],
            "databases": [],
            "infrastructure": [],
            "tools": [],
        },
        "experience_years": 0,
        "seniority": "unknown",
        "leadership": False,
        "ownership": "unknown",
        "environment": "unknown",
        "hiring_signals": {
            "ownership": False,
            "mentorship": False,
            "stakeholder_management": False,
            "startup_mindset": False,
            "ai_tooling_expected": False,
        },
        "red_flags": [reason],
        "confidence": "low",
    }


def fallback_candidate_analysis(reason: str) -> dict[str, Any]:
    return {
        "name": "",
        "email": "",
        "phone": "",
        "github_url": "",
        "linkedin_url": "",
        "portfolio_urls": [],
        "project_urls": [],
        "current_role": "",
        "years_experience": 0,
        "skills": [],
        "tech_stack": {
            "languages": [],
            "frameworks": [],
            "databases": [],
            "cloud": [],
            "tools": [],
        },
        "work_history": [],
        "education": [],
        "certifications": [],
        "leadership_signals": [],
        "ownership_signals": [],
        "impact_claims": [],
        "parse_warnings": [reason],
    }


def parse_json_object(text: str | None) -> dict[str, Any]:
    if not text or not text.strip():
        raise ValueError("empty_llm_response")

    data = json.loads(text.strip())
    if not isinstance(data, dict):
        raise ValueError("llm_response_not_object")

    return data


def _as_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if value in (None, ""):
        return []
    return [value]


def _as_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, Mapping):
        return dict(value)
    return {}


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return False


def _as_number(value: Any) -> int | float:
    if isinstance(value, int | float):
        return value
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


def normalize_job_analysis(data: dict[str, Any]) -> dict[str, Any]:
    fallback = fallback_job_analysis("llm_response_missing_fields")
    merged = {**fallback, **data}
    merged["required_skills"] = _as_list(merged.get("required_skills"))
    merged["inferred_skills"] = _as_list(merged.get("inferred_skills"))
    merged["red_flags"] = _as_list(merged.get("red_flags"))
    merged["experience_years"] = _as_number(merged.get("experience_years"))
    merged["leadership"] = _as_bool(merged.get("leadership"))
    merged["tech_stack"] = {
        "languages": _as_list(_as_dict(merged.get("tech_stack")).get("languages")),
        "frameworks": _as_list(_as_dict(merged.get("tech_stack")).get("frameworks")),
        "databases": _as_list(_as_dict(merged.get("tech_stack")).get("databases")),
        "infrastructure": _as_list(
            _as_dict(merged.get("tech_stack")).get("infrastructure")
        ),
        "tools": _as_list(_as_dict(merged.get("tech_stack")).get("tools")),
    }
    merged["hiring_signals"] = {
        "ownership": _as_bool(_as_dict(merged.get("hiring_signals")).get("ownership")),
        "mentorship": _as_bool(_as_dict(merged.get("hiring_signals")).get("mentorship")),
        "stakeholder_management": _as_bool(
            _as_dict(merged.get("hiring_signals")).get("stakeholder_management")
        ),
        "startup_mindset": _as_bool(
            _as_dict(merged.get("hiring_signals")).get("startup_mindset")
        ),
        "ai_tooling_expected": _as_bool(
            _as_dict(merged.get("hiring_signals")).get("ai_tooling_expected")
        ),
    }
    return merged


def normalize_candidate_analysis(data: dict[str, Any]) -> dict[str, Any]:
    fallback = fallback_candidate_analysis("llm_response_missing_fields")
    merged = {**fallback, **data}
    merged["portfolio_urls"] = _as_list(merged.get("portfolio_urls"))
    merged["project_urls"] = _as_list(merged.get("project_urls"))
    merged["skills"] = _as_list(merged.get("skills"))
    merged["years_experience"] = _as_number(merged.get("years_experience"))
    merged["tech_stack"] = {
        "languages": _as_list(_as_dict(merged.get("tech_stack")).get("languages")),
        "frameworks": _as_list(_as_dict(merged.get("tech_stack")).get("frameworks")),
        "databases": _as_list(_as_dict(merged.get("tech_stack")).get("databases")),
        "cloud": _as_list(_as_dict(merged.get("tech_stack")).get("cloud")),
        "tools": _as_list(_as_dict(merged.get("tech_stack")).get("tools")),
    }
    for key in (
        "work_history",
        "education",
        "certifications",
        "leadership_signals",
        "ownership_signals",
        "impact_claims",
        "parse_warnings",
    ):
        merged[key] = _as_list(merged.get(key))
    return merged


def safe_gemini_call(
    client,
    prompt: str,
    schema_keys: list[str],
    fallback_fn,
    label: str = "gemini",
) -> tuple[dict[str, Any], dict[str, Any]]:
    """
    Wraps a Gemini generate_content call with full error handling.

    Returns (result_dict, metadata) where:
        result_dict  — usable dict (from LLM or fallback)
        metadata     — {status, error_reason, fallback_used}

    Handles:
        - timeout / network failure
        - empty or None response text
        - invalid JSON
        - safety-blocked response
        - missing required schema keys (partial merge)

    Never raises. Always returns something usable.
    """
    metadata: dict[str, Any] = {
        "status": "ok",
        "error_reason": None,
        "fallback_used": False,
    }

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=gemini_json_config(),
        )

        # Check for safety block
        finish_reason = None
        try:
            candidates = getattr(response, "candidates", None) or []
            if candidates:
                finish_reason = str(
                    getattr(candidates[0], "finish_reason", "") or ""
                ).upper()
        except Exception:
            pass

        if finish_reason and finish_reason not in ("STOP", "MAX_TOKENS", ""):
            raise ValueError(f"safety_blocked:{finish_reason}")

        text = getattr(response, "text", None)
        data = parse_json_object(text)

        # Verify schema completeness — fill in missing keys from fallback
        fallback = fallback_fn(f"{label}_missing_keys")
        for key in schema_keys:
            if key not in data:
                data[key] = fallback.get(key)
                metadata["status"] = "partial"

        return data, metadata

    except ValueError as exc:
        reason = str(exc)
        logger.warning("%s LLM call failed: %s", label, reason)
        metadata.update(status="error", error_reason=reason, fallback_used=True)
        return fallback_fn(f"{label}_error:{reason}"), metadata

    except Exception as exc:
        reason = f"unexpected:{type(exc).__name__}:{exc}"
        logger.exception("%s LLM call unexpected failure", label)
        metadata.update(status="error", error_reason=reason, fallback_used=True)
        return fallback_fn(f"{label}_error:{reason}"), metadata

