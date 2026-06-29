import logging
import re
from datetime import UTC
from datetime import datetime

from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job
from app.services.profile_service import CANONICAL_SKILL_MAP


logger = logging.getLogger(__name__)

ALLOWED_APPLICATION_STATUSES = {
    "applied",
    "reviewed",
    "shortlisted",
    "interview",
    "rejected",
    "hired",
}

APPLICATION_STATUS_TRANSITIONS = {
    "applied": {"reviewed", "rejected"},
    "reviewed": {"shortlisted", "rejected"},
    "shortlisted": {"interview", "rejected"},
    "interview": {"hired", "rejected"},
    "rejected": set(),
    "hired": set(),
}

# Skill alias resolution now reuses the single canonical skill map maintained
# in profile_service, so ranking, evidence_map, and trust scoring all treat
# "JS"/"Node"/"Postgres"/etc. as the same canonical skill. TERM_ALIASES is
# kept as a thin backward-compatible alias for any external references.
TERM_ALIASES = CANONICAL_SKILL_MAP


class ApplicationNotFoundError(ValueError):
    pass


class InvalidApplicationStatusError(ValueError):
    pass


class InvalidApplicationStatusTransitionError(ValueError):
    pass


def _canonical_term(value) -> str:
    cleaned = re.sub(
        r"\s+",
        " ",
        str(value).strip(),
    )
    if not cleaned:
        return ""

    key = re.sub(r"[^a-z0-9+#.]", "", cleaned.lower())
    return CANONICAL_SKILL_MAP.get(key, cleaned)


def _as_set(values):

    if not values:
        return set()

    return {
        _canonical_term(value)
        for value in values
        if _canonical_term(value)
    }


def _tech_values(tech_stack: dict):

    values = []

    if not isinstance(tech_stack, dict):
        return values

    for item in tech_stack.values():
        if isinstance(item, list):
            values.extend(item)

    return values


def _candidate_skill_terms(candidate: Candidate) -> list:
    """
    Return the candidate's skill terms for matching.

    Prefers the normalized profile's canonical, cross-source-merged skill
    list (built from resume + LinkedIn + GitHub via profile_service) so that
    aliases like "JS"/"Node"/"Postgres" on a job description correctly match
    a candidate whose evidence uses "JavaScript"/"Node.js"/"PostgreSQL" (or
    vice versa). Falls back to the raw resume-parsed skills if no normalized
    profile has been built yet (e.g. immediately after first upload, before
    a rebuild).
    """
    profile = getattr(candidate, "normalized_profile_json", None) or {}
    normalized_skills = profile.get("skills")
    if normalized_skills:
        return normalized_skills

    candidate_data = candidate.parsed_candidate_json or {}
    return candidate_data.get("skills", [])


def calculate_match(
    job: Job,
    candidate: Candidate
):
    job_data = job.parsed_jd_json or {}
    candidate_skills = _as_set(_candidate_skill_terms(candidate))
    
    required_skills = _as_set(job_data.get("required_skills", []))
    preferred_skills = _as_set(job_data.get("preferred_skills", []))
    
    score = 0.0
    strengths = []
    gaps = []
    
    # Simple overlap for required skills
    if required_skills:
        overlap = required_skills & candidate_skills
        missing = required_skills - candidate_skills
        req_score = (len(overlap) / len(required_skills)) * 60.0
        score += req_score
        
        if overlap:
            strengths.append(f"Matches {len(overlap)} required skills")
        if missing:
            gaps.append(f"Missing {len(missing)} required skills")
            
    # Simple overlap for preferred skills
    if preferred_skills:
        overlap = preferred_skills & candidate_skills
        pref_score = (len(overlap) / len(preferred_skills)) * 40.0
        score += pref_score
        
        if overlap:
            strengths.append(f"Matches {len(overlap)} preferred skills")

    score = min(100.0, score)

    return {
        "score": score,
        "summary": "Deterministic keyword match calculation.",
        "strengths": strengths,
        "gaps": gaps,
        "raw_scores": {
            "required_skills_score": req_score if required_skills else 0,
            "preferred_skills_score": pref_score if preferred_skills else 0,
        }
    }


def _composite_score(fit_score: float, trust_score: float) -> float:
    """
    Deprecated: Do not mix Trust and Fit. Return Fit directly.
    """
    return round(fit_score, 2)


def _build_score_explanations(
    fit_score: float,
    trust_score: float,
    composite_score: float,
    strengths: list,
    trust_data: dict,
    profile: dict | None = None,
) -> dict:
    """Build the human-readable score_explanations dict."""
    why: list[str] = []
    profile = profile or {}

    # Positive signals
    for strength in (trust_data.get("strengths") or [])[:3]:
        why.append(strength)

    # Concerns
    for concern in (trust_data.get("concerns") or [])[:3]:
        why.append(concern)

    # Unsupported claims
    unsupported = trust_data.get("unsupported_claims") or []
    if unsupported:
        skills_str = ", ".join(unsupported[:3])
        why.append(f"Unverified claims: {skills_str} — resume only, no corroboration")

    # Skill strengths from match, annotated with confidence where known
    if strengths:
        skill_confidence = profile.get("skill_confidence") or {}
        annotated = []
        for skill in strengths[:4]:
            conf = skill_confidence.get(skill)
            if conf is not None:
                annotated.append(f"{skill} ({conf}% confidence)")
            else:
                annotated.append(str(skill))
        why.append(f"Matched skills: {', '.join(annotated)}")

    return {
        "fit": round(fit_score, 2),
        "trust": round(trust_score, 2),
        "composite": composite_score,
        "why": why,
    }


def create_application(
    db,
    job_id: int,
    candidate: Candidate,
    screening_answers: dict = None
):

    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        return None

    existing = (
        db.query(Application)
        .filter(
            Application.job_id == job_id,
            Application.candidate_id == candidate.id
        )
        .first()
    )

    if existing:
        raise ValueError("Candidate has already applied to this job")

    application = Application(
        job_id=job.id,
        candidate_id=candidate.id,
        status="applied",
        match_score=0.0,
        match_summary="Scoring in progress...",
        strengths_json=[],
        gaps_json=[],
        fit_score=0.0,
        trust_score=0.0,
        composite_score=0.0,
        score_explanations={},
        screening_answers=screening_answers or {},
    )

    try:
        db.add(application)
        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Application creation failed")
        raise

    db.refresh(application)

    return application


def get_applications_for_candidate(
    db,
    candidate_id: int
):

    return (
        db.query(Application)
        .filter(Application.candidate_id == candidate_id)
        .all()
    )


def get_applications_for_owned_job(
    db,
    job_id: int,
    recruiter_id: int
):

    return (
        db.query(Application, Candidate)
        .join(Job, Application.job_id == Job.id)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .filter(
            Application.job_id == job_id,
            Job.recruiter_id == recruiter_id
        )
        .order_by(Application.match_score.desc())
        .all()
    )


def update_application_status(
    db,
    application_id: int,
    recruiter_id: int,
    status: str
):

    if status not in ALLOWED_APPLICATION_STATUSES:
        raise InvalidApplicationStatusError("Invalid application status")

    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(
            Application.id == application_id,
            Job.recruiter_id == recruiter_id
        )
        .first()
    )

    if not application:
        raise ApplicationNotFoundError("Application not found")

    if status == application.status:
        return application

    allowed_next_statuses = APPLICATION_STATUS_TRANSITIONS.get(
        application.status,
        set()
    )

    if status not in allowed_next_statuses:
        raise InvalidApplicationStatusTransitionError(
            f"Cannot move application from {application.status} to {status}"
        )

    application.status = status
    application.updated_at = datetime.now(UTC)

    try:
        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Application status update failed")
        raise

    db.refresh(application)

    return application


# ---------------------------------------------------------------------------
# Candidate report transparency
# ---------------------------------------------------------------------------

def build_claims_report(candidate: Candidate) -> list[dict]:
    """
    Build a per-skill transparency report for the recruiter candidate report.

    For every canonical skill in the candidate's normalized evidence_map,
    returns a dict describing:
      - skill: canonical skill name
      - sources: which data sources back this claim (resume/linkedin/github)
      - confidence: skill_confidence score (30/50/70/100)
      - verified: True if backed by 2+ sources
      - status: "verified" | "unverified" — recruiter-facing label

    This gives recruiters claim-by-claim evidence transparency rather than
    just an aggregate trust score.
    """
    profile = getattr(candidate, "normalized_profile_json", None) or {}
    evidence_map = profile.get("evidence_map") or {}
    skill_confidence = profile.get("skill_confidence") or {}
    verified_skills = set(profile.get("verified_skills") or [])

    claims: list[dict] = []
    for skill, sources in evidence_map.items():
        is_verified = skill in verified_skills or len(sources) >= 2
        claims.append({
            "skill": skill,
            "sources": sorted(sources),
            "confidence": skill_confidence.get(skill, 0),
            "verified": is_verified,
            "status": "verified" if is_verified else "unverified",
        })

    # Most confident / well-evidenced claims first, for recruiter scanning
    claims.sort(key=lambda c: (-c["confidence"], c["skill"]))
    return claims