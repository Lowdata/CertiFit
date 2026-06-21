import logging

from google import genai

from app.core.config import GEMINI_API_KEY
from app.services.llm_validation import (
    GEMINI_MODEL,
    fallback_candidate_analysis,
    gemini_json_config,
    normalize_candidate_analysis,
    parse_json_object,
)


client = genai.Client(
    api_key=GEMINI_API_KEY
)
logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """
You are an expert technical recruiter.

Analyze a resume.

Return ONLY valid JSON.

{
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
    "tools": []
  },

  "work_history": [],

  "education": [],

  "certifications": [],

  "leadership_signals": [],

  "ownership_signals": [],

  "impact_claims": []
}

Rules:

1. Extract GitHub URL if present.
2. Extract LinkedIn URL if present.
3. Put personal/project websites into project_urls.
4. Put portfolio websites into portfolio_urls.
5. Return ONLY JSON.
"""


def analyze_candidate_resume(
    resume_text: str,
    links: list
):

    prompt = f"""
Resume Links:

{chr(10).join(links)}

Resume:

{resume_text}
"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=f"{SYSTEM_PROMPT}\n\n{prompt}",
            config=gemini_json_config()
        )

        return normalize_candidate_analysis(
            parse_json_object(response.text)
        )

    except Exception as exc:
        logger.exception("Critical candidate LLM parsing failure")
        return fallback_candidate_analysis(
            f"llm_parse_error: {str(exc)}"
        )
