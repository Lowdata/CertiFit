import json
import google.generativeai as genai

from app.core.config import GEMINI_API_KEY


genai.configure(
    api_key=GEMINI_API_KEY
)

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)


def analyze_job_with_llm(jd: str):

    prompt = f"""
You are an expert recruiter.

Analyze the job description and return ONLY valid JSON.

Schema:

{{
    "role": "",
    "required_skills": [],
    "inferred_skills": [],
    "experience_years": 0,
    "leadership": false,
    "ownership": "low|medium|high",
    "environment": "startup|enterprise|agency|unknown"
}}

Job Description:

{jd}
"""

    response = model.generate_content(
        prompt
    )

    text = response.text.strip()

    if text.startswith("```json"):
        text = text.replace(
            "```json",
            ""
        )

    if text.endswith("```"):
        text = text[:-3]

    return json.loads(
        text.strip()
    )