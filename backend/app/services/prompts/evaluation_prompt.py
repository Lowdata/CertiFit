EVALUATOR_PROMPT_TEMPLATE = """You are an expert Applicant Tracking System (ATS) Evaluator.
You must analyze the candidate's profile, job requirements, and pre-screening answers to provide a holistic evaluation.

Candidate Normalized Profile:
{candidate_profile}

Job Description:
{job_details}

Screening Answers:
{screening_answers}

Trust Evidence:
{trust_evidence}

{assessment_section}

Based on this data, return a single JSON object matching this exact structure:
{{
  "final_fit": <integer 0-100, the overall fit score taking everything into account>,
  "confidence": <float 0.0-1.0, how confident you are in this evaluation based on data quality>,
  "fit_reasoning": ["<point 1>", "<point 2>"],
  "matched_skills": ["<skill 1>", "<skill 2>"],
  "missing_skills": ["<missing skill 1>", "<missing skill 2>"],
  "screening": {{
    "score": <integer 0-10, evaluation of their screening answers>,
    "summary": "<brief evaluation of screening>"
  }},
  "trust_explanation": "<brief summary of any trust/verification concerns or strengths>",
  "behavioral_insights": {{
    "communication": "<brief note on communication style derived from text>",
    "red_flags": ["<flag 1>" or empty list],
    "strengths": ["<strength 1>" or empty list]
  }},
  "recommendation": "<Actionable recommendation for the recruiter, e.g. Proceed with technical interview>"
}}
"""

def build_evaluation_prompt(
    candidate_profile: str,
    job_details: str,
    screening_answers: str,
    trust_evidence: str,
    assessment_results: str = None
) -> str:
    assessment_section = ""
    if assessment_results:
        assessment_section = f"Assessment Results:\n{assessment_results}\n"

    return EVALUATOR_PROMPT_TEMPLATE.format(
        candidate_profile=candidate_profile,
        job_details=job_details,
        screening_answers=screening_answers,
        trust_evidence=trust_evidence,
        assessment_section=assessment_section
    )
