import json

from google import genai

from app.core.config import GEMINI_API_KEY


client = genai.Client(
    api_key=GEMINI_API_KEY
)


SYSTEM_PROMPT = """
You are an expert technical recruiter.

Analyze a resume.

Return ONLY JSON.

{
  "name": "",
  "email": "",
  "phone": "",

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
"""


def analyze_candidate_resume(
    resume_text: str
):

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"{SYSTEM_PROMPT}\n\n{resume_text}",
        config={
            "temperature": 0.1,
            "response_mime_type": "application/json"
        }
    )

    return json.loads(
        response.text
    )