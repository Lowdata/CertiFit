import re

import fitz

LINKEDIN_MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024
PDF_SIGNATURE = b"%PDF"

MONTHS = (
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
)
DATE_RE = re.compile(
    rf"({'|'.join(MONTHS)})\s+\d{{4}}\s+[-–]\s+(({'|'.join(MONTHS)})\s+\d{{4}}|Present)"
)
DURATION_RE = re.compile(r"^\(?\d+\s+(year|years|month|months)", re.IGNORECASE)
LOCATION_TERMS = {
    "india",
    "dubai",
    "united arab emirates",
    "bengaluru",
    "karnataka",
    "noida",
    "uttar pradesh",
}


def validate_linkedin_pdf(content: bytes):
    if not content:
        raise ValueError("LinkedIn PDF is empty")

    if len(content) > LINKEDIN_MAX_PDF_SIZE_BYTES:
        raise ValueError("LinkedIn PDF exceeds 5 MB limit")

    if not content.startswith(PDF_SIGNATURE):
        raise ValueError("LinkedIn upload must be a valid PDF")


def extract_linkedin_text(content: bytes) -> str:
    validate_linkedin_pdf(content)

    try:
        pdf = fitz.open(
            stream=content,
            filetype="pdf"
        )
    except Exception as exc:
        raise ValueError("LinkedIn PDF could not be opened") from exc

    try:
        return "\n".join(
            page.get_text()
            for page in pdf
        )
    finally:
        pdf.close()


def _clean_lines(text: str) -> list[str]:
    lines = []
    for line in text.replace("\xa0", " ").splitlines():
        cleaned = re.sub(r"\s+", " ", line).strip()
        if not cleaned:
            continue
        if re.match(r"^Page \d+ of \d+$", cleaned):
            continue
        lines.append(cleaned)
    return lines


def _index(lines: list[str], value: str) -> int | None:
    try:
        return lines.index(value)
    except ValueError:
        return None


def _slice_between(lines: list[str], start: str, end: str) -> list[str]:
    start_index = _index(lines, start)
    end_index = _index(lines, end)
    if start_index is None:
        return []
    if end_index is None or end_index <= start_index:
        return lines[start_index + 1:]
    return lines[start_index + 1:end_index]


def _profile_header(lines: list[str]) -> dict:
    summary_index = _index(lines, "Summary")
    if summary_index is None or summary_index < 4:
        return {
            "name": "",
            "headline": "",
            "location": "",
        }

    return {
        "name": lines[summary_index - 4],
        "headline": " ".join(lines[summary_index - 3:summary_index - 1]),
        "location": lines[summary_index - 1],
    }


def _summary(lines: list[str]) -> str:
    return " ".join(
        _slice_between(
            lines,
            "Summary",
            "Experience"
        )
    )


def _top_skills(lines: list[str]) -> list[str]:
    skills = _slice_between(
        lines,
        "Top Skills",
        "Certifications"
    )
    key_skills = _slice_between(
        lines,
        "Key Skills:",
        "Metrics and Achievements:"
    )
    return list(dict.fromkeys(skills + key_skills))


def _certifications(lines: list[str], name: str) -> list[str]:
    start_index = _index(lines, "Certifications")
    if start_index is None:
        return []

    end_index = lines.index(name) if name in lines else _index(lines, "Summary")
    if end_index is None or end_index <= start_index:
        return []

    cert_lines = lines[start_index + 1:end_index]
    certifications = []
    buffer = []
    for line in cert_lines:
        buffer.append(line)
        if len(buffer) == 2:
            certifications.append(" ".join(buffer))
            buffer = []
    if buffer:
        certifications.append(" ".join(buffer))
    return certifications


def _positions(lines: list[str]) -> list[dict]:
    experience = _slice_between(
        lines,
        "Experience",
        "Education"
    )
    positions = []
    previous_company = ""
    previous_date_index = -1

    for index, line in enumerate(experience):
        if not DATE_RE.search(line):
            continue

        title_index = index - 1
        if title_index < 0:
            continue

        title = _title(experience[title_index])
        if not title:
            previous_date_index = index
            continue

        company = _company_before_title(
            lines=experience,
            start=previous_date_index + 1,
            end=title_index,
        ) or previous_company

        positions.append(
            {
                "company": company,
                "title": title,
                "date_range": line,
            }
        )
        if company:
            previous_company = company
        previous_date_index = index

    return positions


def _title(line: str) -> str:
    return line.title()


def _company_before_title(
    lines: list[str],
    start: int,
    end: int
) -> str:

    for line in reversed(lines[start:end]):
        if _is_company_line(line):
            return line

    return ""


def _is_company_line(line: str) -> bool:
    if not line:
        return False

    if DATE_RE.search(line) or DURATION_RE.search(line):
        return False

    if line[0].islower():
        return False

    lowered = line.lower()
    if any(term in lowered for term in LOCATION_TERMS):
        return False

    if "," in line:
        return False

    words = line.split()
    if len(words) > 5:
        return False

    if line.endswith(".") and "Ltd." not in line and "Inc." not in line:
        return False

    return True


def _education(lines: list[str]) -> list[dict]:
    education_lines = _slice_between(
        lines,
        "Education",
        "__end__"
    )
    if not education_lines:
        return []

    education = []
    index = 0
    while index < len(education_lines):
        school = education_lines[index]
        detail = education_lines[index + 1] if index + 1 < len(education_lines) else ""
        education.append(
            {
                "school": school,
                "details": detail,
            }
        )
        index += 2

    return education


def parse_linkedin_pdf(content: bytes) -> dict:
    text = extract_linkedin_text(content)
    lines = _clean_lines(text)
    header = _profile_header(lines)

    return {
        "source": "linkedin_pdf",
        "name": header["name"],
        "headline": header["headline"],
        "location": header["location"],
        "summary": _summary(lines),
        "skills": _top_skills(lines),
        "positions": _positions(lines),
        "education": _education(lines),
        "certifications": _certifications(
            lines=lines,
            name=header["name"],
        ),
        "raw_text": text,
    }
