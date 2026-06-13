from pathlib import Path

from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File,Query
from fastapi import Depends, HTTPException

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.candidate_service import (
    create_candidate,
    get_candidates,
    get_candidate_by_id,
    delete_candidate

)

router = APIRouter()

UPLOAD_DIR = "uploads"


@router.post("/upload")
async def upload_candidate(
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    Path(UPLOAD_DIR).mkdir(
        exist_ok=True
    )

    file_path = (
        f"{UPLOAD_DIR}/{resume.filename}"
    )

    with open(
        file_path,
        "wb"
    ) as buffer:

        content = await resume.read()

        buffer.write(content)

    candidate = create_candidate(
        db=db,
        file_path=file_path,
        file_name=resume.filename
    )

    return {
        "id": candidate.id,
        "file_name": candidate.resume_file_name
    }

@router.get("/")
def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):

    candidates, total = get_candidates(
        db=db,
        page=page,
        page_size=page_size
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": [
            {
                "id": candidate.id,
                "resume_file_name": candidate.resume_file_name,
                "created_at": candidate.created_at
            }
            for candidate in candidates
        ]
    }

@router.get("/{candidate_id}")
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db)
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

    return {
        "id": candidate.id,
        "resume_file_name": candidate.resume_file_name,
        "parsed_candidate": candidate.parsed_candidate_json,
        "created_at": candidate.created_at,
        "updated_at": candidate.updated_at
    }

@router.delete("/{candidate_id}")
def remove_candidate(
    candidate_id: int,
    db: Session = Depends(get_db)
):

    candidate = delete_candidate(
        db=db,
        candidate_id=candidate_id
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