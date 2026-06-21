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
    candidate_data = candidate.parsed_candidate_json or {}

    required_skills = _as_set(
        job_data.get("required_skills", [])
    )
    inferred_skills = _as_set(
        job_data.get("inferred_skills", [])
    )
    candidate_skills = _as_set(
        _candidate_skill_terms(candidate)
    )

    job_tech = _as_set(
        _tech_values(job_data.get("tech_stack", {}))
    )

    profile = getattr(candidate, "normalized_profile_json", None) or {}
    if profile.get("skills"):
        # Normalized profile already flattens tech_stack into its canonical
        # skills list across resume + LinkedIn + GitHub.
        candidate_tech = _as_set(profile.get("skills"))
    else:
        candidate_tech = _as_set(
            _tech_values(candidate_data.get("tech_stack", {}))
        )

    required_skill_matches = required_skills.intersection(
        candidate_skills
    )
    inferred_skill_matches = inferred_skills.intersection(
        candidate_skills
    )
    tech_matches = job_tech.intersection(
        candidate_tech
    )

    required_skill_score = 0
    if required_skills:
        required_skill_score = (
            len(required_skill_matches) / len(required_skills)
        ) * 50

    inferred_skill_score = 0
    if inferred_skills:
        inferred_skill_score = (
            len(inferred_skill_matches) / len(inferred_skills)
        ) * 10

    tech_score = 0
    if job_tech:
        tech_score = (
            len(tech_matches) / len(job_tech)
        ) * 25

    required_years = job_data.get(
        "experience_years",
        0
    ) or 0
    candidate_years = candidate_data.get(
        "years_experience",
        0
    ) or 0

    experience_score = 15
    if required_years:
        experience_score = min(
            candidate_years / required_years,
            1
        ) * 15

    score = round(
        min(
            required_skill_score
            + inferred_skill_score
            + tech_score
            + experience_score,
            100
        ),
        2
    )

    strengths = sorted(
        required_skill_matches.union(inferred_skill_matches, tech_matches)
    )
    gaps = sorted(
        required_skills.difference(candidate_skills)
    )

    summary = (
        f"Score {score}: required skills "
        f"{len(required_skill_matches)}/{len(required_skills)}, "
        f"inferred skills {len(inferred_skill_matches)}/{len(inferred_skills)}, "
        f"tech {len(tech_matches)}/{len(job_tech)}, "
        f"experience {candidate_years}/{required_years or 0} years"
    )

    return {
        "score": score,
        "summary": summary,
        "strengths": strengths,
        "gaps": gaps
    }


def _composite_score(fit_score: float, trust_score: float) -> float:
    """
    composite = fit * (0.6 + 0.4 * (trust / 100))
    Range: 0-100. Deterministic, no rounding quirks.
    """
    normalised_trust = max(0.0, min(trust_score, 100.0)) / 100.0
    raw = fit_score * (0.6 + 0.4 * normalised_trust)
    return round(min(raw, 100.0), 2)


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
    candidate: Candidate
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

    match = calculate_match(
        job=job,
        candidate=candidate
    )
    fit = match["score"]

    # Trust score — compute deterministically; LLM is best-effort
    try:
        from app.services.trust_service import calculate_trust_score
        trust_data = calculate_trust_score(candidate)
        trust = float(trust_data.get("trust_score") or 0)
    except Exception:
        logger.exception("Trust score computation failed; defaulting to 0")
        trust_data = {}
        trust = 0.0

    composite = _composite_score(fit, trust)
    score_explanations = _build_score_explanations(
        fit_score=fit,
        trust_score=trust,
        composite_score=composite,
        strengths=match["strengths"],
        trust_data=trust_data,
        profile=getattr(candidate, "normalized_profile_json", None) or {},
    )

    application = Application(
        job_id=job.id,
        candidate_id=candidate.id,
        status="applied",
        match_score=fit,          # backward compat
        match_summary=match["summary"],
        strengths_json=match["strengths"],
        gaps_json=match["gaps"],
        fit_score=fit,
        trust_score=trust,
        composite_score=composite,
        score_explanations=score_explanations,
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