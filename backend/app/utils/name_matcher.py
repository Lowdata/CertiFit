import re

def _normalize_name(name: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace for loose comparison."""
    name = name.lower().strip()
    name = re.sub(r"[^a-z\s]", "", name)   # remove punctuation / accents (basic)
    name = re.sub(r"\s+", " ", name)
    return name

def names_match(registered: str, extracted: str) -> bool:
    """
    Returns True if the names are considered a match.
    
    Strategy:
      1. Exact normalised match (e.g. "Ayush Pahuja" == "ayush pahuja")
      2. All tokens of the shorter name appear in the longer name
         (handles middle-name / suffix differences)
    """
    if not registered or not extracted:
        return True   # can't compare — don't flag

    reg_norm  = _normalize_name(registered)
    res_norm  = _normalize_name(extracted)

    if reg_norm == res_norm:
        return True

    reg_tokens = set(reg_norm.split())
    res_tokens = set(res_norm.split())

    # If every word in the registered name is present in the extracted name
    # (or vice-versa) treat it as a match.
    if reg_tokens <= res_tokens or res_tokens <= reg_tokens:
        return True

    # Check for at least one surname token in common (last word heuristic)
    reg_last = reg_norm.split()[-1]
    res_last = res_norm.split()[-1]
    if reg_last == res_last:
        return True

    return False
