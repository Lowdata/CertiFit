"""
Normalized profile builder.

Reads parsed_candidate_json, linkedin_profile_json, and github_profile_json
from a Candidate row and produces a single unified profile dict with:

  - evidence_map      : skill -> list of sources
  - skill_confidence  : skill -> int (30/70/100)
  - verified_skills   : skills present in >= 2 sources
  - confidence_score  : overall profile completeness (0-100)

This module is pure Python — no DB writes, no external calls.
Callers are responsible for persisting the result.
"""
from __future__ import annotations

import re
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.candidate import Candidate

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_STOP_WORDS = {
    "and", "or", "the", "a", "an", "in", "on", "at", "for", "with",
    "to", "of", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "may",
    "might", "shall", "should", "can", "could", "not", "no", "nor",
    "so", "yet", "both", "either", "neither", "than", "then",
}


def _normalise(skill: str) -> str:
    """Lower-case, strip punctuation — used only for deduplication keys."""
    return re.sub(r"[^a-z0-9#+.]", "", skill.lower())


def _canonical(skill: str) -> str:
    """Return the display-form skill string, stripped."""
    return skill.strip()


def _as_list(value) -> list:
    if isinstance(value, list):
        return value
    return []


def _flatten_tech(tech_stack: dict) -> list[str]:
    """Flatten a tech_stack dict (languages/frameworks/…) into a flat list."""
    out: list[str] = []
    if not isinstance(tech_stack, dict):
        return out
    for items in tech_stack.values():
        if isinstance(items, list):
            out.extend(str(s) for s in items if s)
    return out


# ---------------------------------------------------------------------------
# Per-source skill extraction
# ---------------------------------------------------------------------------

def _skills_from_resume(parsed: dict) -> list[str]:
    """Extract all skills mentioned in the resume parsed JSON."""
    skills: list[str] = []
    skills.extend(_as_list(parsed.get("skills")))
    skills.extend(_flatten_tech(parsed.get("tech_stack", {})))
    for cert in _as_list(parsed.get("certifications")):
        # certifications often name a technology
        if isinstance(cert, str) and len(cert.split()) <= 5:
            skills.append(cert)
    return [s for s in skills if isinstance(s, str) and s.strip()]


def _skills_from_linkedin(linkedin: dict) -> list[str]:
    skills: list[str] = []
    skills.extend(_as_list(linkedin.get("skills")))
    for pos in _as_list(linkedin.get("positions")):
        if isinstance(pos, dict):
            title = pos.get("title", "")
            # titles themselves are not skills; skip
            _ = title
    for cert in _as_list(linkedin.get("certifications")):
        if isinstance(cert, str) and len(cert.split()) <= 6:
            skills.append(cert)
    return [s for s in skills if isinstance(s, str) and s.strip()]


def _skills_from_github(github: dict) -> list[str]:
    """Extract language names from github_profile_json language_totals."""
    skills: list[str] = []
    language_totals = github.get("language_totals", {})
    if isinstance(language_totals, dict):
        skills.extend(language_totals.keys())
    # topics from repositories
    for repo in _as_list(github.get("repositories")):
        if isinstance(repo, dict):
            skills.extend(_as_list(repo.get("topics")))
    return [s for s in skills if isinstance(s, str) and s.strip()]


# ---------------------------------------------------------------------------
# Evidence map builder
# ---------------------------------------------------------------------------

def _build_evidence_map(
    resume_skills: list[str],
    linkedin_skills: list[str],
    github_skills: list[str],
) -> dict[str, list[str]]:
    """
    Returns {canonical_skill: [sources_list]} where sources are
    'resume', 'linkedin', 'github'.
    Deduplication is done via normalised key; the first-seen form is kept.
    """
    canonical_map: dict[str, str] = {}   # norm_key -> display_name
    evidence: dict[str, set[str]] = {}   # norm_key -> set of sources

    for skill, source in (
        [(s, "resume") for s in resume_skills]
        + [(s, "linkedin") for s in linkedin_skills]
        + [(s, "github") for s in github_skills]
    ):
        key = _normalise(skill)
        if not key or key in _STOP_WORDS:
            continue
        if key not in canonical_map:
            canonical_map[key] = _canonical(skill)
        evidence.setdefault(key, set()).add(source)

    return {
        canonical_map[k]: sorted(v)
        for k, v in evidence.items()
    }


# ---------------------------------------------------------------------------
# Confidence scoring
# ---------------------------------------------------------------------------

def _skill_confidence(sources: list[str]) -> int:
    """
    30  → resume only
    50  → non-resume source only (edge case)
    70  → resume + 1 other
    100 → all 3 sources
    """
    has_resume = "resume" in sources
    count = len(sources)
    if count >= 3:
        return 100
    if count == 2 and has_resume:
        return 70
    if count == 1 and has_resume:
        return 30
    # 1 or 2 sources but no resume (e.g. linkedin + github)
    return 50 if count == 1 else 70


def _build_skill_confidence(
    evidence_map: dict[str, list[str]]
) -> dict[str, int]:
    return {skill: _skill_confidence(sources) for skill, sources in evidence_map.items()}


def _compute_confidence_score(
    sources_present: int,
    verified_count: int,
    total_skills: int,
) -> int:
    """
    Base = 20 per data source present (max 60).
    Bonus = verified skills as fraction of total (max 40).
    """
    base = min(sources_present * 20, 60)
    if total_skills:
        bonus = int((verified_count / total_skills) * 40)
    else:
        bonus = 0
    return min(base + bonus, 100)


# ---------------------------------------------------------------------------
# Name / headline / experience helpers
# ---------------------------------------------------------------------------

def _best_name(parsed: dict, linkedin: dict) -> str:
    return (
        linkedin.get("name")
        or parsed.get("name")
        or ""
    )


def _best_headline(parsed: dict, linkedin: dict) -> str:
    return (
        linkedin.get("headline")
        or parsed.get("current_role")
        or ""
    )


def _experience_years(parsed: dict, linkedin: dict) -> int:
    resume_years = parsed.get("years_experience") or 0
    # LinkedIn positions: rough heuristic — number of positions as proxy
    linkedin_positions = len(_as_list(linkedin.get("positions")))
    linkedin_years = max(linkedin_positions - 1, 0) * 2  # rough estimate
    return max(int(resume_years), int(linkedin_years))


def _merge_education(parsed: dict, linkedin: dict) -> list[dict]:
    seen: set[str] = set()
    result: list[dict] = []

    for item in _as_list(parsed.get("education")):
        key = str(item).lower()[:40]
        if key not in seen:
            seen.add(key)
            result.append({"source": "resume", "detail": item})

    for item in _as_list(linkedin.get("education")):
        if isinstance(item, dict):
            key = item.get("school", "")[:40].lower()
        else:
            key = str(item).lower()[:40]
        if key not in seen:
            seen.add(key)
            result.append({"source": "linkedin", "detail": item})

    return result


def _merge_certifications(parsed: dict, linkedin: dict) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for cert in (
        _as_list(parsed.get("certifications"))
        + _as_list(linkedin.get("certifications"))
    ):
        key = str(cert).lower()[:60]
        if key not in seen:
            seen.add(key)
            result.append(str(cert))
    return result


def _merge_projects(parsed: dict, github: dict) -> list[dict]:
    projects: list[dict] = []
    for url in _as_list(parsed.get("project_urls")):
        projects.append({"source": "resume", "url": url})
    for repo in _as_list(github.get("repositories")):
        if isinstance(repo, dict) and repo.get("html_url"):
            projects.append({
                "source": "github",
                "name": repo.get("name"),
                "url": repo.get("html_url"),
                "description": repo.get("description"),
                "language": repo.get("language"),
                "stars": repo.get("stargazers_count", 0),
            })
    return projects


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_normalized_profile(candidate: "Candidate") -> dict:
    """
    Build and return a normalized profile dict from all stored candidate data.
    Does NOT write to DB — caller stores the result.
    """
    parsed = candidate.parsed_candidate_json or {}
    linkedin = candidate.linkedin_profile_json or {}
    github = candidate.github_profile_json or {}

    resume_skills = _skills_from_resume(parsed)
    linkedin_skills = _skills_from_linkedin(linkedin)
    github_skills = _skills_from_github(github)

    sources_present = sum([
        bool(parsed),
        bool(linkedin),
        bool(github),
    ])

    evidence_map = _build_evidence_map(resume_skills, linkedin_skills, github_skills)
    skill_confidence = _build_skill_confidence(evidence_map)

    verified_skills = [
        skill for skill, sources in evidence_map.items()
        if len(sources) >= 2
    ]

    all_skills = sorted(evidence_map.keys())

    confidence_score = _compute_confidence_score(
        sources_present=sources_present,
        verified_count=len(verified_skills),
        total_skills=len(all_skills),
    )

    github_languages = sorted(
        (github.get("language_totals") or {}).keys()
    )

    return {
        "name": _best_name(parsed, linkedin),
        "headline": _best_headline(parsed, linkedin),
        "skills": all_skills,
        "verified_skills": sorted(verified_skills),
        "skill_confidence": skill_confidence,
        "experience_years": _experience_years(parsed, linkedin),
        "education": _merge_education(parsed, linkedin),
        "certifications": _merge_certifications(parsed, linkedin),
        "projects": _merge_projects(parsed, github),
        "github_languages": github_languages,
        "evidence_map": {
            skill: sources
            for skill, sources in evidence_map.items()
        },
        "confidence_score": confidence_score,
    }
