from pydantic import BaseModel


class CandidateResponse(BaseModel):
    id: int
    resume_file_name: str