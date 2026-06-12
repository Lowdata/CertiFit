KNOWN_SKILLS = [
    "React",
    "Node.js",
    "Express.js",
    "GraphQL",
    "AWS",
    "GCP",
    "Azure",
    "Docker",
    "CI/CD",
    "Git",
    "TypeScript",
    "Next.js",
    "PostgreSQL",
    "MongoDB",
    "Datadog",
    "Sentry",
    "Grafana",
]


def extract_skills(jd: str):

    found_skills = []

    jd_lower = jd.lower()

    for skill in KNOWN_SKILLS:
        if skill.lower() in jd_lower:
            found_skills.append(skill)

    return found_skills


def extract_experience(jd: str):

    import re

    match = re.search(r"(\d+)\+?\s*years", jd.lower())

    if match:
        return int(match.group(1))

    return 0


def detect_leadership(jd: str):

    leadership_words = [
        "lead",
        "mentor",
        "manage",
        "technical direction",
        "architecture"
    ]

    jd_lower = jd.lower()

    for word in leadership_words:
        if word in jd_lower:
            return True

    return False


def parse_job_description(jd: str):

    return {
        "skills": extract_skills(jd),
        "experience_years": extract_experience(jd),
        "leadership": detect_leadership(jd)
    }