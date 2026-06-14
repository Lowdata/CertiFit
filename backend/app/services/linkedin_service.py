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

# Known LinkedIn PDF section headers
_SECTION_HEADERS = {
    "Contact",
    "Top Skills",
    "Certifications",
    "Summary",
    "Experience",
    "Education",
    "Languages",
    "Honors-Awards",
    "Publications",
    "Volunteer Experience",
    "Projects",
    "Interests",
    "Recommendations",
}

# Words that should never appear in a person's name line
_NON_NAME_WORDS = {
    "certificate",
    "certified",
    "certification",
    "development",
    "developer",
    "simulation",
    "analytics",
    "technology",
    "technician",
    "engineer",
    "engineering",
    "powered",
    "management",
    "fundamentals",
    "specialist",
    "professional",
    "associate",
    "area",
    "architect",
    "administrator",
    "consultant",
    "security",
    "cyber",
}

# Geographic terms for location line detection
_LOCATION_TERMS = {
    "india",
    "delhi",
    "mumbai",
    "bengaluru",
    "bangalore",
    "hyderabad",
    "chennai",
    "kolkata",
    "pune",
    "ahmedabad",
    "surat",
    "jaipur",
    "noida",
    "gurgaon",
    "gurugram",
    "karnataka",
    "maharashtra",
    "tamil nadu",
    "telangana",
    "west bengal",
    "uttar pradesh",
    "gujarat",
    "rajasthan",
    "kerala",
    "dubai",
    "abu dhabi",
    "united arab emirates",
    "united states",
    "united kingdom",
    "canada",
    "australia",
    "singapore",
    "germany",
    "netherlands",
    "ireland",
    "france",
    "new york",
    "san francisco",
    "seattle",
    "london",
    "berlin",
    "remote",
}

# School-name keywords for education parsing
_SCHOOL_KEYWORDS = {
    "university",
    "college",
    "institute",
    "campus",
    "academy",
}

# Degree prefixes that mark an education detail line
_DEGREE_PREFIXES = (
    "bachelor",
    "master",
    "b.tech",
    "btech",
    "bca",
    "mba",
    "phd",
    "doctor",
    "diploma",
    "associate",
    "m.tech",
    "mtech",
    "b.sc",
    "bsc",
    "m.sc",
    "msc",
    "b.a.",
    "m.a.",
)


# ---------------------------------------------------------------------------
# Validation & text extraction
# ---------------------------------------------------------------------------


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
            filetype="pdf",
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


# ---------------------------------------------------------------------------
# Section detection
# ---------------------------------------------------------------------------


def _find_sections(lines: list[str]) -> dict[str, int]:
    """Return {section_name: line_index} for all detected LinkedIn sections."""
    sections: dict[str, int] = {}
    for i, line in enumerate(lines):
        if line in _SECTION_HEADERS:
            sections[line] = i
    return sections


def _section_lines(
    lines: list[str],
    sections: dict[str, int],
    section_name: str,
) -> list[str]:
    """Get the content lines for a section (up to the next section header)."""
    start = sections.get(section_name)
    if start is None:
        return []

    end = len(lines)
    for _, sec_idx in sections.items():
        if sec_idx > start and sec_idx < end:
            end = sec_idx

    return lines[start + 1 : end]


# ---------------------------------------------------------------------------
# Header detection helpers
# ---------------------------------------------------------------------------


def _looks_like_person_name(line: str) -> bool:
    """Heuristic: does this line look like a person's name?"""
    words = line.split()
    if len(words) < 2 or len(words) > 4:
        return False

    if not words[0][0].isupper():
        return False

    # No special characters that appear in headlines / cert names
    if any(c in line for c in "|&·/"):
        return False

    # No standalone hyphens (" - ")
    if " - " in line:
        return False

    # Names in LinkedIn display never contain commas
    if "," in line:
        return False

    # Reject lines containing cert / tech keywords
    lowered = line.lower()
    if any(word in lowered for word in _NON_NAME_WORDS):
        return False

    # Must not look like a location
    if _looks_like_location(line):
        return False

    return True


def _looks_like_location(line: str) -> bool:
    """Heuristic: does this line look like a geographic location?"""
    lowered = line.lower()
    if any(term in lowered for term in _LOCATION_TERMS):
        return True

    # "Greater X Area" pattern
    if "area" in lowered:
        return True

    # "City, State, Country" or "City, State" pattern
    if re.match(r"^[A-Z][a-zA-Z\s]+,\s+[A-Z]", line):
        return True

    return False


# ---------------------------------------------------------------------------
# Profile header — works backward from Summary
# ---------------------------------------------------------------------------


def _profile_header(
    lines: list[str],
    sections: dict[str, int],
) -> dict:
    """
    Extract name, headline, location by working backward from Summary.

    LinkedIn PDF layout before Summary::

        [Certifications / Honors-Awards / Patents ...]
          content lines
        NAME                 ← no section header
        HEADLINE (1-4 lines)
        LOCATION
        [Summary]

    Returns dict with name, headline, location, _name_idx, _warnings.

    BUG FIX: The original backward scan stopped at max(summary_idx - 6, -1)
    which is exclusive in Python's range(), so summary_idx - 6 was never
    checked.  Profiles with 3-4 line headlines (common with long LinkedIn
    headlines) place the name at summary_idx - 6 or further back.
    The scan now extends to max(summary_idx - 10, -1).
    """
    warnings: list[str] = []
    summary_idx = sections.get("Summary")

    if summary_idx is None or summary_idx < 2:
        warnings.append("No Summary section found — header extraction unreliable")
        return {
            "name": "",
            "headline": "",
            "location": "",
            "_name_idx": 0,
            "_warnings": warnings,
        }

    # Location is always the last line before Summary
    location = lines[summary_idx - 1]

    name = ""
    name_idx = 0
    headline = ""

    # Try 1-line headline: name at summary_idx - 3
    if summary_idx >= 3 and _looks_like_person_name(lines[summary_idx - 3]):
        name = lines[summary_idx - 3]
        name_idx = summary_idx - 3
        headline = lines[summary_idx - 2]

    # Try 2-line headline: name at summary_idx - 4
    elif summary_idx >= 4 and _looks_like_person_name(lines[summary_idx - 4]):
        name = lines[summary_idx - 4]
        name_idx = summary_idx - 4
        headline = " ".join(lines[summary_idx - 3 : summary_idx - 1])

    # Try 3-line headline: name at summary_idx - 5
    elif summary_idx >= 5 and _looks_like_person_name(lines[summary_idx - 5]):
        name = lines[summary_idx - 5]
        name_idx = summary_idx - 5
        headline = " ".join(lines[summary_idx - 4 : summary_idx - 1])

    # Try 4-line headline: name at summary_idx - 6
    elif summary_idx >= 6 and _looks_like_person_name(lines[summary_idx - 6]):
        name = lines[summary_idx - 6]
        name_idx = summary_idx - 6
        headline = " ".join(lines[summary_idx - 5 : summary_idx - 1])

    # Try no headline: name at summary_idx - 2
    elif summary_idx >= 2 and _looks_like_person_name(lines[summary_idx - 2]):
        name = lines[summary_idx - 2]
        name_idx = summary_idx - 2
        headline = ""

    else:
        # FIX: Extended backward scan — was max(summary_idx - 6, -1) which
        # made Python's exclusive range stop miss the name at offset -6.
        # Now scans back to offset -10, covering up to 8-line headlines.
        for i in range(summary_idx - 1, max(summary_idx - 10, -1), -1):
            if _looks_like_person_name(lines[i]):
                name = lines[i]
                name_idx = i
                headline = " ".join(lines[i + 1 : summary_idx - 1])
                break

        if not name:
            warnings.append(
                "Could not identify person name — using offset fallback"
            )
            name_idx = max(0, summary_idx - 3)
            name = lines[name_idx]
            headline = " ".join(lines[name_idx + 1 : summary_idx - 1])

    return {
        "name": name,
        "headline": headline,
        "location": location,
        "_name_idx": name_idx,
        "_warnings": warnings,
    }


# ---------------------------------------------------------------------------
# Top Skills
# ---------------------------------------------------------------------------


def _top_skills(
    lines: list[str],
    sections: dict[str, int],
    name_idx: int,
) -> list[str]:
    """Extract skills from Top Skills section + Key Skills from the summary.

    BUG FIX: The original code only used the Certifications section index as
    the end boundary, falling back to name_idx when Certifications was absent.
    Profiles that use Honors-Awards, Patents, or other sections between
    Top Skills and the name caused all those lines (including the name itself
    and headline) to be swallowed into the skills list.

    Fix: use the nearest subsequent section header (any section) as the
    end boundary, so skills stop cleanly at the next LinkedIn sidebar section.
    """
    skills_idx = sections.get("Top Skills")
    if skills_idx is None:
        top_skills: list[str] = []
    else:
        # FIX: find the closest section that follows Top Skills (not just
        # Certifications).  This correctly handles Honors-Awards, Patents,
        # or any other sidebar section that appears before the name.
        end = name_idx
        for sec_idx in sections.values():
            if sec_idx > skills_idx and sec_idx < end:
                end = sec_idx

        top_skills = lines[skills_idx + 1 : end]

    # Also extract "Key Skills:" subsection from summary body
    summary_content = _section_lines(lines, sections, "Summary")
    key_skills: list[str] = []
    in_key = False
    for line in summary_content:
        if line.startswith("Key Skills:"):
            in_key = True
            rest = line[len("Key Skills:") :].strip()
            if rest:
                key_skills.append(rest)
            continue
        if in_key:
            if line.startswith("Metrics") or line.startswith("Let") or ":" in line:
                break
            key_skills.append(line)

    return list(dict.fromkeys(top_skills + key_skills))


# ---------------------------------------------------------------------------
# Certifications
# ---------------------------------------------------------------------------


def _certifications(
    lines: list[str],
    sections: dict[str, int],
    name_idx: int,
) -> list[str]:
    """
    Extract certifications between the Certifications header and the name line.

    LinkedIn PDFs list certs as pairs (cert name + issuer) or single lines.
    We pair consecutive lines and join them.
    """
    cert_idx = sections.get("Certifications")
    if cert_idx is None:
        return []

    cert_lines = lines[cert_idx + 1 : name_idx]
    if not cert_lines:
        return []

    certifications: list[str] = []
    buffer: list[str] = []
    for line in cert_lines:
        buffer.append(line)
        if len(buffer) == 2:
            certifications.append(" ".join(buffer))
            buffer = []
    if buffer:
        certifications.append(" ".join(buffer))

    return certifications


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


def _summary(lines: list[str], sections: dict[str, int]) -> str:
    return " ".join(_section_lines(lines, sections, "Summary"))


# ---------------------------------------------------------------------------
# Experience / Positions
# ---------------------------------------------------------------------------


def _normalize_title(text: str) -> str:
    """Capitalize first letter of each word that starts lowercase.

    Unlike str.title(), this preserves existing casing::

        "fullstack developer"  → "Fullstack Developer"
        "Node.js"              → "Node.js"  (not "Node.Js")
        "REST API"             → "REST API" (not "Rest Api")
    """
    words = text.split()
    result = []
    for word in words:
        if word and word[0].islower():
            result.append(word[0].upper() + word[1:])
        else:
            result.append(word)
    return " ".join(result)


def _is_company_line(line: str) -> bool:
    """Heuristic: is this line a company name?"""
    if not line:
        return False

    if DATE_RE.search(line) or DURATION_RE.search(line):
        return False

    if re.match(r"^\d+\s+(year|month)", line, re.IGNORECASE):
        return False

    if line[0].islower():
        return False

    if _looks_like_location(line):
        return False

    # Commas rarely appear in company names (allow Pvt., Ltd., Inc.)
    if "," in line and "Ltd." not in line and "Inc." not in line and "Pvt." not in line:
        return False

    words = line.split()
    if len(words) > 6:
        return False

    if line.endswith(".") and "Ltd." not in line and "Inc." not in line:
        return False

    return True


def _positions(lines: list[str], sections: dict[str, int]) -> list[dict]:
    """Extract positions from the Experience section.

    Each position includes company, title, date_range, location, and
    description.  Multi-line titles (ending with ``&``, ``|``, or ``,``)
    are merged.  The ``_normalize_title`` helper capitalises words without
    mangling dotted terms like ``Node.js``.
    """
    experience = _section_lines(lines, sections, "Experience")
    if not experience:
        return []

    positions: list[dict] = []
    previous_company = ""
    previous_date_index = -1

    # Find all date-range line indices as position anchors
    date_indices = [
        i for i, line in enumerate(experience) if DATE_RE.search(line)
    ]

    for di, date_idx in enumerate(date_indices):
        date_range = experience[date_idx]

        # --- Find title (line immediately before date) ---
        title_idx = date_idx - 1
        if title_idx < 0:
            continue

        title_line = experience[title_idx]

        # Skip duration lines in multi-role blocks (e.g. "6 months")
        if DURATION_RE.match(title_line) or re.match(
            r"^\d+\s+(year|month)", title_line, re.IGNORECASE
        ):
            title_idx -= 1
            if title_idx < 0:
                continue
            title_line = experience[title_idx]

        # Check for multi-line title (previous line ends with &, |, ,)
        effective_title_start = title_idx
        title = title_line

        if title_idx > 0:
            prev_line = experience[title_idx - 1]
            is_continuation = prev_line.rstrip().endswith(("&", "|", ",")) or (
                # Short fragment AND prev isn't structural
                len(title_line.split()) <= 2
                and not _is_company_line(prev_line)
                and not DATE_RE.search(prev_line)
                and not DURATION_RE.match(prev_line)
                and not re.match(
                    r"^\d+\s+(year|month)", prev_line, re.IGNORECASE
                )
                and not prev_line.rstrip().endswith(".")
                and not _looks_like_location(prev_line)
            )
            if is_continuation:
                title = prev_line.rstrip() + " " + title_line
                effective_title_start = title_idx - 1

        title = _normalize_title(title.strip())
        if not title:
            previous_date_index = date_idx
            continue

        # --- Find company ---
        search_start = previous_date_index + 1
        search_end = effective_title_start
        company = ""
        for k in range(search_end - 1, search_start - 1, -1):
            if _is_company_line(experience[k]):
                company = experience[k]
                break
        if not company:
            company = previous_company

        # --- Location (line after date if it matches) ---
        location = ""
        loc_idx = date_idx + 1
        if loc_idx < len(experience) and _looks_like_location(
            experience[loc_idx]
        ):
            location = experience[loc_idx]

        # --- Description ---
        desc_start = (date_idx + 2) if location else (date_idx + 1)

        if di + 1 < len(date_indices):
            next_date = date_indices[di + 1]
            # Exclude structural lines (title/company/duration) before next date
            desc_end = next_date - 1  # title line for next position
            while desc_end > desc_start:
                prev = experience[desc_end - 1]
                if (
                    _is_company_line(prev)
                    or DURATION_RE.match(prev)
                    or re.match(
                        r"^\d+\s+(year|month)", prev, re.IGNORECASE
                    )
                ):
                    desc_end -= 1
                elif (
                    desc_end >= 2
                    and experience[desc_end - 2].rstrip().endswith(
                        ("&", "|", ",")
                    )
                ):
                    # Multi-line title for next position
                    desc_end -= 1
                else:
                    break
        else:
            desc_end = len(experience)

        description = " ".join(experience[desc_start:desc_end])

        positions.append(
            {
                "company": company,
                "title": title,
                "date_range": date_range,
                "location": location,
                "description": description,
            }
        )
        if company:
            previous_company = company
        previous_date_index = date_idx

    return positions


# ---------------------------------------------------------------------------
# Education
# ---------------------------------------------------------------------------


def _is_school_line(line: str) -> bool:
    """Heuristic: does this line look like a school / institution name?"""
    lowered = line.lower()
    if any(kw in lowered for kw in _SCHOOL_KEYWORDS):
        return True
    # Abbreviation in parens: (IIT), (NSUT), (VNSGU), …
    if re.search(r"\([A-Z]{2,}\)", line):
        return True
    return False


def _is_education_detail(line: str) -> bool:
    """Heuristic: is this line a degree / date detail rather than a school?"""
    lowered = line.lower()
    if any(lowered.startswith(p) for p in _DEGREE_PREFIXES):
        return True
    if "·" in line:
        return True
    if re.search(r"\(\w+\s+\d{4}\s*[-–]", line):
        return True
    return False


def _education(lines: list[str], sections: dict[str, int]) -> list[dict]:
    """Extract education entries, grouping detail lines under their school."""
    edu_lines = _section_lines(lines, sections, "Education")
    if not edu_lines:
        return []

    education: list[dict] = []
    i = 0
    while i < len(edu_lines):
        line = edu_lines[i]

        # Orphaned detail line — attach to previous entry if one exists
        if _is_education_detail(line):
            if education:
                education[-1]["details"] = (
                    education[-1]["details"] + " " + line
                ).strip()
            i += 1
            continue

        # Start a new school entry and collect its detail lines
        school = line
        detail_parts: list[str] = []
        j = i + 1
        while j < len(edu_lines):
            next_line = edu_lines[j]
            # A new school name breaks the run
            if _is_school_line(next_line) and not _is_education_detail(
                next_line
            ):
                break
            detail_parts.append(next_line)
            j += 1

        education.append(
            {
                "school": school,
                "details": " ".join(detail_parts),
            }
        )
        i = j

    return education


# ---------------------------------------------------------------------------
# Parser confidence
# ---------------------------------------------------------------------------


def _compute_parser_confidence(result: dict) -> int:
    """Return 0-100 confidence score based on how complete the parse is.

    BUG FIX: The original check only flagged names containing "certificate",
    "certification", or "simulation".  Names that are actually LinkedIn
    headline text — which always contain pipe characters (|) or ampersands
    (&) — were being awarded the full 20 points, producing false-high
    confidence scores even when name detection had clearly failed.

    Fix: treat any name containing |, &, or more than 4 words as suspicious.
    """
    score = 0
    warnings = result.get("parser_warnings", [])

    # Name present and valid
    name = result.get("name", "")
    if name:
        # FIX: also flag pipe/ampersand chars that indicate a headline fragment
        suspicious_words = ("certificate", "certification", "simulation")
        is_suspicious = (
            any(ind in name.lower() for ind in suspicious_words)
            or "|" in name
            or "&" in name
            or len(name.split()) > 4
        )
        if is_suspicious:
            score += 5  # probably wrong
        else:
            score += 20

    if result.get("headline"):
        score += 10
    if result.get("location"):
        score += 10
    if result.get("skills"):
        score += 15

    positions = result.get("positions", [])
    if positions:
        score += 20
        valid = sum(
            1 for p in positions if p.get("company") and p.get("title")
        )
        if valid == len(positions):
            score += 10
        elif valid > 0:
            score += 5

    if result.get("education"):
        score += 10
    if result.get("summary"):
        score += 5

    # Penalty for warnings
    score -= len(warnings) * 5

    return max(0, min(score, 100))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def parse_linkedin_pdf(content: bytes) -> dict:
    text = extract_linkedin_text(content)
    lines = _clean_lines(text)
    sections = _find_sections(lines)
    warnings: list[str] = []

    # Header — name, headline, location
    header = _profile_header(lines, sections)
    name_idx = header["_name_idx"]
    warnings.extend(header.get("_warnings") or [])

    positions = _positions(lines, sections)
    education = _education(lines, sections)

    result = {
        "source": "linkedin_pdf",
        "name": header["name"],
        "headline": header["headline"],
        "location": header["location"],
        "summary": _summary(lines, sections),
        "skills": _top_skills(lines, sections, name_idx),
        "positions": positions,
        "education": education,
        "certifications": _certifications(lines, sections, name_idx),
        "parser_warnings": warnings,
        "raw_text": text,
    }

    result["parser_confidence"] = _compute_parser_confidence(result)

    return result