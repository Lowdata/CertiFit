"""
Trust Score Engine — hybrid deterministic (80 pts) + LLM consistency (20 pts).

Deterministic rules run always.
LLM portion is only added if Gemini succeeds.
Gemini failure = no bonus, no penalty.

Output shape:
{
    "trust_score": int,          # 0-100
    "strengths": [],
    "concerns": [],
    "unsupported_claims": [],
    "evidence": {},              # evidence_map subset relevant to trust
    "explanations": [],
    "llm_review": {
        "status": "ok|error|skipped",
        "consistency_score": int,
        "llm_concerns": [],
        "llm_strengths": [],
        "fallback_used": bool
    }
}
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, UTC
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models.candidate import Candidate

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Claim extraction
# ---------------------------------------------------------------------------

# Skills/technologies to look for in free-form resume text
_TECH_PATTERN = re.compile(
    r"\b(Kubernetes|Docker|AWS|GCP|Azure|Terraform|Kafka|Redis|Elasticsearch|"
    r"Machine Learning|Deep Learning|NLP|MLOps|LLM|AI|Spark|Hadoop|Airflow|"
    r"React|Angular|Vue|Node\.js|FastAPI|Django|Flask|Spring|Rails|"
    r"PostgreSQL|MySQL|MongoDB|Cassandra|DynamoDB|"
    r"Microservices|GraphQL|gRPC|REST API)\b",
    re.IGNORECASE,
)

_ROLE_PATTERN = re.compile(
    r"\b(Lead|Senior|Principal|Staff|Head of|Manager|Director|Architect|"
    r"VP|CTO|Founder)\b",
    re.IGNORECASE,
)


def extract_claims(candidate: "Candidate") -> list[dict[str, str]]:
    """
    Parse resume text and parsed JSON to produce structured claims.

    Returns list of {"type": "skill|role|project", "value": str}
    """
    claims: list[dict[str, str]] = []
    seen: set[str] = set()

    parsed = candidate.parsed_candidate_json or {}
    raw_text = getattr(candidate, "raw_resume_text", "") or ""

    # Skill claims from parsed JSON
    for skill in (parsed.get("skills") or []):
        key = str(skill).lower().strip()
        if key and key not in seen:
            seen.add(key)
            claims.append({"type": "skill", "value": str(skill).strip()})

    # Skill claims from raw text (technologies not always in skills list)
    for match in _TECH_PATTERN.finditer(raw_text):
        key = match.group().lower()
        if key not in seen:
            seen.add(key)
            claims.append({"type": "skill", "value": match.group()})

    # Role claims
    current_role = parsed.get("current_role") or ""
    for match in _ROLE_PATTERN.finditer(current_role):
        key = f"role:{match.group().lower()}"
        if key not in seen:
            seen.add(key)
            claims.append({"type": "role", "value": match.group()})

    # Project claims from project URLs and portfolio
    for url in (parsed.get("project_urls") or []):
        key = f"project:{url}"
        if key not in seen:
            seen.add(key)
            claims.append({"type": "project", "value": str(url)})

    return claims


# ---------------------------------------------------------------------------
# Deterministic checks (0-80 pts)
# ---------------------------------------------------------------------------

def _date_consistency_check(
    parsed: dict, linkedin: dict
) -> tuple[int, list[str], list[str]]:
    """
    Check for gaps/mismatches between resume work history and LinkedIn positions.
    Returns (score_delta, explanations, concerns)
    """
    explanations: list[str] = []
    concerns: list[str] = []

    resume_history = parsed.get("work_history") or []
    linkedin_positions = linkedin.get("positions") or []

    if not resume_history or not linkedin_positions:
        # Can't check — neutral
        return 0, explanations, concerns

    # Extract years from date strings
    year_re = re.compile(r"\b(20\d{2}|19\d{2})\b")

    resume_years: list[int] = []
    for entry in resume_history:
        text = json.dumps(entry)
        resume_years.extend(int(y) for y in year_re.findall(text))

    linkedin_years: list[int] = []
    for pos in linkedin_positions:
        text = json.dumps(pos)
        linkedin_years.extend(int(y) for y in year_re.findall(text))

    if not resume_years or not linkedin_years:
        return 0, explanations, concerns

    resume_start = min(resume_years)
    linkedin_start = min(linkedin_years)

    gap = abs(resume_start - linkedin_start)
    if gap > 1:
        concerns.append(
            f"Career start date mismatch: resume suggests {resume_start}, "
            f"LinkedIn suggests {linkedin_start} ({gap} year gap)"
        )
        return -10, explanations, concerns

    explanations.append("Career timeline consistent across resume and LinkedIn")
    return 5, explanations, concerns


def _title_consistency_check(
    parsed: dict, linkedin: dict
) -> tuple[int, list[str], list[str]]:
    """
    Compare resume current_role with LinkedIn headline.
    """
    explanations: list[str] = []
    concerns: list[str] = []

    resume_role = (parsed.get("current_role") or "").lower()
    linkedin_headline = (linkedin.get("headline") or "").lower()

    if not resume_role or not linkedin_headline:
        return 0, explanations, concerns

    # Extract significant words (ignore stop words)
    def keywords(text: str) -> set[str]:
        words = re.findall(r"[a-z]+", text)
        return {w for w in words if len(w) > 3 and w not in {
            "with", "and", "the", "for", "from", "that", "this",
            "engineer", "developer", "manager",  # too generic
        }}

    resume_kw = keywords(resume_role)
    linkedin_kw = keywords(linkedin_headline)

    if not resume_kw or not linkedin_kw:
        return 0, explanations, concerns

    overlap = resume_kw & linkedin_kw
    if len(overlap) == 0 and len(resume_kw) > 0 and len(linkedin_kw) > 0:
        concerns.append(
            f"Title mismatch: resume says '{parsed.get('current_role', '')}', "
            f"LinkedIn says '{linkedin.get('headline', '')}'"
        )
        return -10, explanations, concerns

    explanations.append(
        f"Role title consistent: '{parsed.get('current_role', '')}' "
        f"aligns with LinkedIn headline"
    )
    return 5, explanations, concerns


def _skill_evidence_check(
    evidence_map: dict[str, list[str]]
) -> tuple[int, list[str], list[str], list[str]]:
    """
    Score skills by evidence source count.
    Returns (score, explanations, concerns, unsupported_claims)
    """
    explanations: list[str] = []
    concerns: list[str] = []
    unsupported: list[str] = []

    if not evidence_map:
        return 0, explanations, concerns, unsupported

    pts = 0
    for skill, sources in evidence_map.items():
        count = len(sources)
        if count >= 3:
            pts += 3
            explanations.append(f"{skill} verified across all 3 sources")
        elif count == 2:
            pts += 2
            explanations.append(f"{skill} verified in {' and '.join(sources)}")
        elif "resume" in sources and count == 1:
            # Resume-only claim
            pts += 0
            unsupported.append(skill)
            concerns.append(f"{skill} claim lacks corroborating evidence")
        else:
            pts += 1  # non-resume source only — some signal

    # Normalise to 40 max
    max_raw = len(evidence_map) * 3
    score = int((pts / max(max_raw, 1)) * 40)
    return min(score, 40), explanations, concerns, unsupported


def _github_activity_check(
    github: dict
) -> tuple[int, list[str], list[str]]:
    explanations: list[str] = []
    concerns: list[str] = []
    pts = 0

    if not github:
        concerns.append("No GitHub data available")
        return 0, explanations, concerns

    # Recent events check (< 90 days)
    recent_events = github.get("recent_events") or []
    now = datetime.now(UTC)
    recent_count = 0
    for evt in recent_events:
        created = evt.get("created_at") or ""
        try:
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            if (now - dt).days <= 90:
                recent_count += 1
        except Exception:
            pass

    if recent_count >= 3:
        pts += 5
        explanations.append(f"Active GitHub: {recent_count} events in last 90 days")
    elif recent_count > 0:
        pts += 2
        explanations.append(f"Some GitHub activity: {recent_count} recent events")
    else:
        concerns.append("No recent GitHub activity in last 90 days")

    # Owned repos
    repos = github.get("repositories") or []
    owned = [r for r in repos if not r.get("fork")]
    if len(owned) >= 3:
        pts += 5
        explanations.append(f"{len(owned)} owned (non-fork) repositories")
    elif len(owned) > 0:
        pts += 2
        explanations.append(f"{len(owned)} owned repositories")
    else:
        concerns.append("No owned repositories found")

    # Languages present
    languages = github.get("language_totals") or {}
    if len(languages) >= 2:
        pts += 5
        explanations.append(
            f"GitHub shows proficiency in: {', '.join(list(languages.keys())[:4])}"
        )
    elif len(languages) == 1:
        pts += 2

    return min(pts, 15), explanations, concerns


def _certification_check(
    parsed: dict,
    linkedin: dict,
    evidence_map: dict[str, list[str]],
) -> tuple[int, list[str], list[str]]:
    explanations: list[str] = []
    concerns: list[str] = []
    pts = 0

    resume_certs = parsed.get("certifications") or []
    linkedin_certs = linkedin.get("certifications") or []
    all_certs = resume_certs + linkedin_certs

    skill_keys = {s.lower() for s in evidence_map}

    for cert in all_certs:
        cert_lower = str(cert).lower()
        matched = any(sk in cert_lower for sk in skill_keys)
        if matched:
            pts += 2
            explanations.append(f"Certification validates claimed skill: {cert}")

    if pts == 0 and all_certs:
        concerns.append("Certifications present but don't align with claimed skills")

    return min(pts, 10), explanations, concerns


# ---------------------------------------------------------------------------
# LLM consistency review (0-20 pts)
# ---------------------------------------------------------------------------

_LLM_SCHEMA_KEYS = ["concerns", "strengths", "consistency_score"]


def _fallback_llm_review(reason: str) -> dict[str, Any]:
    return {
        "concerns": [],
        "strengths": [],
        "consistency_score": 0,  # not used — fallback means no LLM pts awarded
        "_reason": reason,
    }


def _llm_consistency_review(candidate: "Candidate") -> tuple[int, dict[str, Any]]:
    """
    Calls Gemini to review cross-source consistency.
    Returns (pts_to_add: int, llm_output: dict)

    If Gemini fails: returns (0, {status: "error", ...}) — no bonus, no penalty.
    """
    try:
        from google import genai
        from app.core.config import GEMINI_API_KEY
        from app.services.llm_validation import safe_gemini_call

        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as exc:
        logger.warning("Gemini client init failed in trust review: %s", exc)
        return 0, {
            "status": "skipped",
            "error_reason": str(exc),
            "consistency_score": 0,
            "llm_concerns": [],
            "llm_strengths": [],
            "fallback_used": True,
        }

    parsed = candidate.parsed_candidate_json or {}
    linkedin = candidate.linkedin_profile_json or {}
    github = candidate.github_profile_json or {}

    # Build a compact evidence summary to avoid huge prompts
    resume_summary = {
        "name": parsed.get("name"),
        "current_role": parsed.get("current_role"),
        "years_experience": parsed.get("years_experience"),
        "skills": (parsed.get("skills") or [])[:20],
        "work_history": (parsed.get("work_history") or [])[:5],
        "certifications": parsed.get("certifications") or [],
    }
    linkedin_summary = {
        "name": linkedin.get("name"),
        "headline": linkedin.get("headline"),
        "positions": (linkedin.get("positions") or [])[:5],
        "certifications": (linkedin.get("certifications") or [])[:5],
        "skills": (linkedin.get("skills") or [])[:15],
    }
    github_summary = {
        "username": github.get("username"),
        "languages": list((github.get("language_totals") or {}).keys())[:10],
        "repos": [
            {
                "name": r.get("name"),
                "language": r.get("language"),
                "description": r.get("description"),
            }
            for r in (github.get("repositories") or [])[:5]
        ],
        "recent_event_count": len(github.get("recent_events") or []),
    }

    prompt = f"""You are a senior technical recruiter conducting a background verification.

Compare the candidate's claims across three data sources and identify inconsistencies.

Resume:
{json.dumps(resume_summary, indent=2)}

LinkedIn:
{json.dumps(linkedin_summary, indent=2)}

GitHub:
{json.dumps(github_summary, indent=2)}

Identify:
- Scope inflation (claims bigger roles/impact than evidence supports)
- Title mismatch between resume and LinkedIn
- Unsupported technical claims (claimed but no GitHub/LinkedIn evidence)
- Suspicious achievement claims
- Date gaps or contradictions

Return ONLY valid JSON in this exact shape:
{{
  "concerns": ["<specific concern>"],
  "strengths": ["<specific strength>"],
  "consistency_score": <integer 0-100>
}}

consistency_score:
- 90-100: highly consistent across all sources
- 70-89: minor inconsistencies
- 50-69: moderate concerns
- below 50: significant red flags
"""

    result, meta = safe_gemini_call(
        client=client,
        prompt=prompt,
        schema_keys=_LLM_SCHEMA_KEYS,
        fallback_fn=_fallback_llm_review,
        label="trust_llm_review",
    )

    if meta["fallback_used"]:
        # No LLM bonus — no penalty either
        return 0, {
            "status": "error",
            "error_reason": meta["error_reason"],
            "consistency_score": 0,
            "llm_concerns": [],
            "llm_strengths": [],
            "fallback_used": True,
        }

    raw_score = int(result.get("consistency_score") or 0)
    raw_score = max(0, min(100, raw_score))
    pts = int((raw_score / 100) * 20)

    return pts, {
        "status": meta["status"],
        "error_reason": None,
        "consistency_score": raw_score,
        "llm_concerns": result.get("concerns") or [],
        "llm_strengths": result.get("strengths") or [],
        "fallback_used": False,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_trust_score(candidate: "Candidate") -> dict[str, Any]:
    """
    Compute the hybrid trust score for a candidate.
    Deterministic rules: 0-80 pts (always run).
    LLM review: 0-20 pts (only added if Gemini succeeds).

    Returns the full trust_score output dict — caller stores it.
    """
    parsed = candidate.parsed_candidate_json or {}
    linkedin = candidate.linkedin_profile_json or {}
    github = candidate.github_profile_json or {}

    # Build evidence_map from normalized profile if available, else derive inline
    profile = candidate.normalized_profile_json or {}
    evidence_map: dict[str, list[str]] = profile.get("evidence_map") or {}

    # If no normalized profile yet, derive evidence map from raw sources
    if not evidence_map:
        from app.services.profile_service import (
            _skills_from_resume,
            _skills_from_linkedin,
            _skills_from_github,
            _build_evidence_map,
        )
        evidence_map = _build_evidence_map(
            _skills_from_resume(parsed),
            _skills_from_linkedin(linkedin),
            _skills_from_github(github),
        )

    all_strengths: list[str] = []
    all_concerns: list[str] = []
    all_explanations: list[str] = []
    all_unsupported: list[str] = []
    det_score = 0

    # 1. Date consistency (±10)
    pts, expl, conc = _date_consistency_check(parsed, linkedin)
    det_score += pts
    all_explanations.extend(expl)
    all_concerns.extend(conc)

    # 2. Title consistency (±10)
    pts, expl, conc = _title_consistency_check(parsed, linkedin)
    det_score += pts
    all_explanations.extend(expl)
    all_concerns.extend(conc)

    # 3. Skill evidence (0-40)
    pts, expl, conc, unsupported = _skill_evidence_check(evidence_map)
    det_score += pts
    all_explanations.extend(expl)
    all_concerns.extend(conc)
    all_unsupported.extend(unsupported)

    # 4. GitHub activity (0-15)
    pts, expl, conc = _github_activity_check(github)
    det_score += pts
    all_explanations.extend(expl)
    all_concerns.extend(conc)

    # 5. Certification check (0-10)
    pts, expl, conc = _certification_check(parsed, linkedin, evidence_map)
    det_score += pts
    all_explanations.extend(expl)
    all_concerns.extend(conc)

    # Collect deterministic strengths
    if len(evidence_map) > 5:
        all_strengths.append(
            f"Strong evidence portfolio: {len(evidence_map)} skills with source attribution"
        )

    det_score = max(0, min(det_score, 80))

    # 6. LLM review (0-20 pts, only if Gemini works)
    llm_pts, llm_review = _llm_consistency_review(candidate)
    all_concerns.extend(llm_review.get("llm_concerns") or [])
    all_strengths.extend(llm_review.get("llm_strengths") or [])

    final_score = min(det_score + llm_pts, 100)

    return {
        "trust_score": final_score,
        "strengths": all_strengths,
        "concerns": all_concerns,
        "unsupported_claims": all_unsupported,
        "evidence": evidence_map,
        "explanations": all_explanations,
        "llm_review": llm_review,
    }
