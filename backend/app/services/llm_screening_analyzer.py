import logging
import json
from google import genai
from app.core.config import GEMINI_API_KEY
from app.services.llm_validation import (
    GEMINI_MODEL,
    gemini_json_config,
    parse_json_object,
)

client = genai.Client(api_key=GEMINI_API_KEY)
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are an expert technical recruiter analyzing a candidate's answers to screening questions.

You will be given the original questions and the candidate's answers.
Some questions may be Yes/No, some text, and some links.

Evaluate the candidate's answers.
- For Yes/No questions: if required and they say No, severely penalize the score unless their provided reason is exceptionally strong.
- For text questions: evaluate the quality, depth, and relevance of the answer.
- For link questions: evaluate if a link was provided when requested.

Return ONLY valid JSON in this exact format:
{
  "score_modifier": <float between -50.0 and +20.0>,
  "strengths": ["list", "of", "strengths", "found", "in", "answers"],
  "gaps": ["list", "of", "weaknesses", "or", "missing", "requirements"],
  "summary": "Brief 1-2 sentence summary of their answers."
}
"""

def analyze_screening_answers(questions: list[dict], answers: dict) -> dict:
    if not questions or not answers:
        return {
            "score_modifier": 0.0,
            "strengths": [],
            "gaps": [],
            "summary": "No screening questions answered."
        }

    prompt = f"Questions:\n{json.dumps(questions, indent=2)}\n\nAnswers:\n{json.dumps(answers, indent=2)}"

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[SYSTEM_PROMPT, prompt],
            config=gemini_json_config
        )

        data = parse_json_object(response.text)
        
        # Ensure bounds
        modifier = float(data.get("score_modifier", 0.0))
        modifier = max(-50.0, min(20.0, modifier))
        
        return {
            "score_modifier": modifier,
            "strengths": data.get("strengths", []),
            "gaps": data.get("gaps", []),
            "summary": data.get("summary", "Answers evaluated.")
        }
    except Exception:
        logger.exception("Failed to analyze screening answers")
        return {
            "score_modifier": 0.0,
            "strengths": [],
            "gaps": [],
            "summary": "Failed to analyze screening answers."
        }
