import json
from typing import Any
from google.genai import Client

from app.core.config import GEMINI_API_KEY
from app.services.llm_validation import safe_gemini_call

# Initialize the Gemini client
client = Client(api_key=GEMINI_API_KEY)


def fallback_assessment_eval(reason: str) -> dict[str, Any]:
    return {
        "communication": 0.0,
        "technical_depth": 0.0,
        "ownership": 0.0,
        "clarity": 0.0,
        "STAR": 0.0,
        "confidence": 0.0,
        "reason": reason
    }


def evaluate_question_answer(transcript: str, question_text: str, question_type: str) -> dict[str, Any]:
    """
    Evaluates the candidate's transcript for a specific question using Gemini.
    """
    if not transcript or not transcript.strip():
        return fallback_assessment_eval("no_transcript_provided")

    prompt = f"""
    You are an expert technical recruiter and interviewer.
    Evaluate the candidate's answer to the following {question_type} question based on their transcript.
    
    Question: {question_text}
    Candidate Transcript: "{transcript}"
    
    Analyze the transcript and score the candidate out of 10 for the following metrics:
    - communication: How effectively did they express their ideas?
    - technical_depth: (If applicable) How deep was their technical understanding? (Score 5 if not a technical question but answered adequately).
    - ownership: Did they use "I" instead of "we", taking responsibility for outcomes?
    - clarity: Was the answer concise and easy to follow?
    - STAR: Did they use the Situation, Task, Action, Result framework (especially for behavioral questions)?
    - confidence: Did they sound confident without excessive filler words?
    
    Output a raw JSON object matching this schema exactly:
    {{
        "communication": float,
        "technical_depth": float,
        "ownership": float,
        "clarity": float,
        "STAR": float,
        "confidence": float
    }}
    """

    schema_keys = [
        "communication", "technical_depth", "ownership", "clarity", "STAR", "confidence"
    ]

    result, metadata = safe_gemini_call(
        client=client,
        prompt=prompt,
        schema_keys=schema_keys,
        fallback_fn=fallback_assessment_eval,
        label="assessment_evaluation"
    )

    return result


def generate_final_assessment_report(evaluations: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Aggregates the individual evaluations and generates a final report.
    """
    if not evaluations:
        return {}

    num_evals = len(evaluations)
    
    avg_communication = sum(e.get("communication", 0) for e in evaluations) / num_evals
    avg_technical = sum(e.get("technical_depth", 0) for e in evaluations) / num_evals
    avg_ownership = sum(e.get("ownership", 0) for e in evaluations) / num_evals
    avg_clarity = sum(e.get("clarity", 0) for e in evaluations) / num_evals
    avg_star = sum(e.get("STAR", 0) for e in evaluations) / num_evals
    avg_confidence = sum(e.get("confidence", 0) for e in evaluations) / num_evals

    overall_score = (avg_communication + avg_technical + avg_ownership + avg_clarity + avg_star + avg_confidence) / 6.0
    
    recommendation = "Reject"
    if overall_score >= 8.0:
        recommendation = "Hire"
    elif overall_score >= 6.0:
        recommendation = "Maybe"

    return {
        "overall_score": overall_score,
        "metrics": {
            "communication": avg_communication,
            "technical_depth": avg_technical,
            "ownership": avg_ownership,
            "clarity": avg_clarity,
            "STAR": avg_star,
            "confidence": avg_confidence
        },
        "recommendation": recommendation
    }
