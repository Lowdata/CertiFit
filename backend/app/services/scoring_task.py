import logging
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.application import Application
from app.models.job import Job
from app.models.candidate import Candidate
from app.services.application_service import calculate_match, _composite_score, _build_score_explanations
from app.services.trust_service import calculate_trust_score

logger = logging.getLogger(__name__)

def process_application_scoring_background(application_id: int):
    """
    Background task to calculate match and trust scores for an application.
    """
    db: Session = SessionLocal()
    try:
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            logger.error(f"Application {application_id} not found for background scoring.")
            return

        job = db.query(Job).filter(Job.id == application.job_id).first()
        candidate = db.query(Candidate).filter(Candidate.id == application.candidate_id).first()

        if not job or not candidate:
            logger.error(f"Job or Candidate missing for application {application_id}.")
            return

        # Calculate fit using LLM
        match = calculate_match(
            job=job,
            candidate=candidate
        )
        from app.services.llm_screening_analyzer import analyze_screening_answers
        screening_eval = analyze_screening_answers(
            questions=job.screening_questions,
            answers=application.screening_answers
        )

        match["score"] += screening_eval["score_modifier"]
        match["score"] = max(0.0, min(100.0, match["score"]))
        match["strengths"].extend(screening_eval["strengths"])
        match["gaps"].extend(screening_eval["gaps"])
        match["summary"] += " " + screening_eval["summary"]

        fit = match["score"]

        # Trust score
        try:
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

        application.match_score = fit
        application.match_summary = match["summary"]
        application.strengths_json = match["strengths"]
        application.gaps_json = match["gaps"]
        application.fit_score = fit
        application.trust_score = trust
        application.composite_score = composite
        application.score_explanations = score_explanations

        # Also persist the full trust data (including reasoning) to the candidate
        if trust_data:
            candidate.trust_score_json = trust_data

        db.commit()
        logger.info(f"Background scoring completed for application {application_id}")
    except Exception as e:
        db.rollback()
        logger.exception(f"Failed to process background scoring for application {application_id}: {e}")
    finally:
        db.close()
