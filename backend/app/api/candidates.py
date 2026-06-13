from pathlib import Path

from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import Depends

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.candidate_service import (
    create_candidate
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