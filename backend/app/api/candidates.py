from pathlib import Path
from uuid import uuid4
import logging

from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File, Query
from fastapi import Depends, HTTPException

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_candidate
from app.schemas.candidate import (
    CandidateListResponse,
    CandidateProfileResponse,
    CandidateResponse,
    DeleteCandidateResponse,
    GitHubProfileRequest,
    GitHubProfileResponse,
    LinkedInProfileResponse,
    NormalizedProfileResponse,
    TrustScoreResponse,
    RebuildProfileResponse,
)
from app.services.candidate_service import (
    create_candidate,
    get_candidate_by_id,
    get_candidate_by_user_id,
    delete_candidate,
    update_candidate_github_profile,
    update_candidate_linkedin_profile,
    rebuild_candidate_intelligence,
)
from app.services.github_service import (
    GitHubClientError,
    GitHubNotFoundError,
    analyze_github_profile,
)
from app.services.linkedin_service import parse_linkedin_pdf

router = APIRouter()

UPLOAD_DIR = "uploads"
MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
PDF_SIGNATURE = b"%PDF"
DOCX_SIGNATURE = b"PK"
logger = logging.getLogger(__name__)


def _normalize_name(name: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace for loose comparison."""
    import re
    name = name.lower().strip()
    name = re.sub(r"[^a-z\s]", "", name)   # remove punctuation / accents (basic)
    name = re.sub(r"\s+", " ", name)
    return name


def _names_match(registered: str, from_resume: str) -> bool:
    """
    Returns True if the names are considered a match.

    Strategy:
      1. Exact normalised match (e.g. "Ayush Pahuja" == "ayush pahuja")
      2. All tokens of the shorter name appear in the longer name
         (handles middle-name / suffix differences, e.g. "John Smith" matches
         "John Michael Smith Jr").
    """
    if not registered or not from_resume:
        return True   # can't compare — don't flag

    reg_norm  = _normalize_name(registered)
    res_norm  = _normalize_name(from_resume)

    if reg_norm == res_norm:
        return True

    reg_tokens = set(reg_norm.split())
    res_tokens = set(res_norm.split())

    # If every word in the registered name is present in the resume name
    # (or vice-versa) treat it as a match.
    if reg_tokens <= res_tokens or res_tokens <= reg_tokens:
        return True

    # Check for at least one surname token in common (last word heuristic)
    reg_last = reg_norm.split()[-1]
    res_last = res_norm.split()[-1]
    if reg_last == res_last:
        return True

    return False


def _safe_resume_extension(filename: str | None) -> str:
    suffix = Path(filename or "").name.lower()
    extension = Path(suffix).suffix
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Resume must be a PDF or DOCX file",
        )
    return extension


def _validate_resume_content(content: bytes, extension: str):
    if not content:
        raise HTTPException(
            status_code=400,
            detail="Resume file is empty",
        )

    if len(content) > MAX_RESUME_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Resume file exceeds 5 MB limit",
        )

    if extension == ".pdf" and not content.startswith(PDF_SIGNATURE):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid PDF",
        )

    if extension == ".docx" and not content.startswith(DOCX_SIGNATURE):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid DOCX",
        )


@router.post("/upload", response_model=CandidateResponse)
async def upload_candidate(
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_candidate
    )
):

    Path(UPLOAD_DIR).mkdir(
        exist_ok=True
    )

    extension = _safe_resume_extension(resume.filename)
    stored_file_name = f"{uuid4().hex}{extension}"
    file_path = str(Path(UPLOAD_DIR) / stored_file_name)

    try:
        content = await resume.read()
        _validate_resume_content(content, extension)

        with open(
            file_path,
            "wb"
        ) as buffer:

            buffer.write(content)

        candidate = create_candidate(
            db=db,
            user_id=current_user.id,
            file_path=file_path,
            file_name=stored_file_name
        )

    except HTTPException:
        if Path(file_path).exists():
            Path(file_path).unlink()
        raise

    except ValueError as exc:
        if Path(file_path).exists():
            Path(file_path).unlink()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception:
        if Path(file_path).exists():
            Path(file_path).unlink()
        logger.exception("Critical resume upload failure")
        raise HTTPException(
            status_code=500,
            detail="Resume upload failed",
        )

    # Rebuild intelligence after upload (best-effort, never blocks response)
    try:
        rebuild_candidate_intelligence(db=db, candidate=candidate)
    except Exception:
        logger.exception("Intelligence rebuild failed after resume upload")

    # ── Name mismatch check ──────────────────────────────────────────────────
    # Compare the name extracted from the resume against the registered name.
    name_mismatch = False
    name_on_resume: str | None = None

    parsed = candidate.parsed_candidate_json or {}
    name_on_resume = parsed.get("name") or None

    if name_on_resume:
        name_mismatch = not _names_match(current_user.name, name_on_resume)
        if name_mismatch:
            logger.warning(
                "Name mismatch: registered=%r resume=%r user_id=%s",
                current_user.name,
                name_on_resume,
                current_user.id,
            )

    return {
        "id": candidate.id,
        "resume_file_name": candidate.resume_file_name,
        "name_mismatch": name_mismatch,
        "name_on_resume": name_on_resume if name_mismatch else None,
        "registered_name": current_user.name if name_mismatch else None,
    }


@router.get("/me", response_model=CandidateProfileResponse)
def get_my_candidate_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_candidate
    )
):

    candidate = get_candidate_by_user_id(
        db=db,
        user_id=current_user.id
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    return {
        "id": candidate.id,
        "resume_file_name": candidate.resume_file_name,
        "parsed_candidate": candidate.parsed_candidate_json,
        "github_profile": candidate.github_profile_json,
        "linkedin_profile": candidate.linkedin_profile_json,
        "created_at": candidate.created_at,
        "updated_at": candidate.updated_at
    }


@router.post("/github", response_model=GitHubProfileResponse)
def upload_github_profile(
    data: GitHubProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_candidate
    )
):

    candidate = get_candidate_by_user_id(
        db=db,
        user_id=current_user.id
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    try:
        github_profile = analyze_github_profile(
            data.identifier
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    except GitHubNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc)
        ) from exc

    except GitHubClientError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc)
        ) from exc

    candidate = update_candidate_github_profile(
        db=db,
        user_id=current_user.id,
        github_profile=github_profile
    )

    # Rebuild intelligence after new GitHub data
    try:
        rebuild_candidate_intelligence(db=db, candidate=candidate)
    except Exception:
        logger.exception("Intelligence rebuild failed after GitHub upload")

    return {
        "id": candidate.id,
        "github_profile": candidate.github_profile_json
    }


@router.post("/linkedin", response_model=LinkedInProfileResponse)
async def upload_linkedin_profile(
    profile: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_candidate
    )
):

    candidate = get_candidate_by_user_id(
        db=db,
        user_id=current_user.id
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    try:
        linkedin_profile = parse_linkedin_pdf(
            await profile.read()
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    candidate = update_candidate_linkedin_profile(
        db=db,
        user_id=current_user.id,
        linkedin_profile=linkedin_profile
    )

    # Rebuild intelligence after new LinkedIn data
    try:
        rebuild_candidate_intelligence(db=db, candidate=candidate)
    except Exception:
        logger.exception("Intelligence rebuild failed after LinkedIn upload")

    return {
        "id": candidate.id,
        "linkedin_profile": candidate.linkedin_profile_json
    }


@router.get("/me/profile")
def get_my_normalized_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate),
):
    """Return stored normalized profile (DB read — no rebuild)."""
    candidate = get_candidate_by_user_id(db=db, user_id=current_user.id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
        
    profile_data = candidate.normalized_profile_json or {}
    if "confidence_score" in profile_data:
        del profile_data["confidence_score"]
        
    return {
        "id": candidate.id,
        "normalized_profile": profile_data,
    }


@router.get("/me/trust")
def get_my_trust_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate),
):
    """Return stored trust score but masked for candidates."""
    candidate = get_candidate_by_user_id(db=db, user_id=current_user.id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    trust = candidate.trust_score_json or {}
    profile = candidate.normalized_profile_json or {}

    # Completely hide actual scores from candidate
    safe_trust_data = {
        "missing_evidence": trust.get("unsupported_claims", []),
        "recommendations": "Ensure GitHub and LinkedIn are linked, and certificates are updated to improve profile completeness."
    }

    return {
        "id": candidate.id,
        "trust_score": safe_trust_data,
    }


@router.post("/me/profile/rebuild")
def rebuild_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate),
):
    """Force rebuild of normalized profile and trust score."""
    candidate = get_candidate_by_user_id(db=db, user_id=current_user.id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    profile, trust = rebuild_candidate_intelligence(db=db, candidate=candidate)
    
    # Strip sensitive scores
    if "confidence_score" in profile:
        del profile["confidence_score"]
    
    safe_trust_data = {
        "missing_evidence": trust.get("unsupported_claims", []),
        "recommendations": "Ensure GitHub and LinkedIn are linked, and certificates are updated to improve profile completeness."
    }

    return {
        "id": candidate.id,
        "message": "Profile rebuilt successfully",
        "normalized_profile": profile,
        "trust_score": safe_trust_data,
    }

@router.get("/", response_model=CandidateListResponse)
def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_candidate
    )
):

    candidate = get_candidate_by_user_id(
        db=db,
        user_id=current_user.id
    )

    data = []
    if candidate:
        data.append(
            {
                "id": candidate.id,
                "resume_file_name": candidate.resume_file_name,
                "created_at": candidate.created_at,
            }
        )

    return {
        "total": len(data),
        "page": page,
        "page_size": page_size,
        "data": data,
    }


@router.get("/{candidate_id}", response_model=CandidateProfileResponse)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_candidate
    )
):

    candidate = get_candidate_by_id(
        db=db,
        candidate_id=candidate_id
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    if candidate.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Candidate access required"
        )

    return {
        "id": candidate.id,
        "resume_file_name": candidate.resume_file_name,
        "parsed_candidate": candidate.parsed_candidate_json,
        "github_profile": candidate.github_profile_json,
        "linkedin_profile": candidate.linkedin_profile_json,
        "created_at": candidate.created_at,
        "updated_at": candidate.updated_at
    }


@router.delete("/{candidate_id}", response_model=DeleteCandidateResponse)
def remove_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_candidate
    )
):

    candidate = delete_candidate(
        db=db,
        candidate_id=candidate_id,
        user_id=current_user.id
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    return {
        "message": "Candidate deleted",
        "id": candidate_id
    }
