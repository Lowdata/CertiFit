import json

from google import genai

from app.core.config import GEMINI_API_KEY


client = genai.Client(
    api_key=GEMINI_API_KEY
)


SYSTEM_PROMPT = """
You are a senior technical recruiter with 10+ years of experience.

Your task is to analyze a job description and return structured hiring intelligence.

Rules:

1. required_skills
   - Skills explicitly mentioned in the JD.
   - If React is mentioned, JavaScript can also be included.
   - If Next.js is mentioned, React can also be included.

2. inferred_skills
   - Skills not explicitly mentioned but highly likely.
   - Never return generic phrases like:
     - API development
     - Database management
     - Server-side programming
   - Return concrete technologies and competencies.

3. experience_years
   - Return minimum required years.
   - Example:
     3-5 years -> 3

4. leadership
   - True if role includes:
     lead
     mentor
     manage
     architecture ownership
     technical direction

5. ownership
   - high
   - medium
   - low

6. environment
   - startup
   - scaleup
   - enterprise
   - agency
   - unknown

7. domain
   Examples:
   - software_engineering
   - data_engineering
   - machine_learning
   - devops
   - product
   - design
   - sales
   - marketing

8. confidence
   - high
   - medium
   - low

9. Return ONLY JSON.

Schema:

{
  "role": "",
  "domain": "",

  "required_skills": [],
  "inferred_skills": [],

  "tech_stack": {
    "languages": [],
    "frameworks": [],
    "databases": [],
    "infrastructure": [],
    "tools": []
  },

  "experience_years": 0,

  "seniority": "",

  "leadership": false,

  "ownership": "",

  "environment": "",

  "hiring_signals": {
    "ownership": false,
    "mentorship": false,
    "stakeholder_management": false,
    "startup_mindset": false,
    "ai_tooling_expected": false
  },

  ROLE INFERENCE RULES

When a job title is identifiable but details are vague,
infer the most common modern industry stack.

Backend Developer:
- Node.js
- Python
- REST APIs
- PostgreSQL
- Docker
- AWS

Frontend Developer:
- React
- JavaScript
- TypeScript
- HTML
- CSS

Full Stack Developer:
- React
- Node.js
- PostgreSQL
- REST APIs
- Docker

DevOps Engineer:
- AWS
- Docker
- Kubernetes
- Terraform
- CI/CD

Data Engineer:
- Python
- SQL
- Airflow
- Spark
- AWS

Machine Learning Engineer:
- Python
- PyTorch
- TensorFlow
- MLOps
- AWS

Infer these skills even when not explicitly mentioned,

  "red_flags": [],

  "confidence": ""
}
"""


def analyze_job_with_llm(jd: str):

    prompt = f"""
{SYSTEM_PROMPT}

Job Description:

{jd}
"""

    try:

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        )

        text = response.text.strip()

        return json.loads(text)

    except Exception as e:

        return {
            "role": "unknown",
            "domain": "unknown",

            "required_skills": [],
            "inferred_skills": [],

            "tech_stack": {
                "languages": [],
                "frameworks": [],
                "databases": [],
                "infrastructure": [],
                "tools": []
            },

            "experience_years": 0,

            "seniority": "unknown",

            "leadership": False,

            "ownership": "unknown",

            "environment": "unknown",

            "hiring_signals": {
                "ownership": False,
                "mentorship": False,
                "stakeholder_management": False,
                "startup_mindset": False,
                "ai_tooling_expected": False
            },

            "red_flags": [
                f"llm_parse_error: {str(e)}"
            ],

            "confidence": "low"
        }