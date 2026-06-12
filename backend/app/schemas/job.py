from pydantic import BaseModel


class JobInput(BaseModel):
    jd: str


class CreateJobRequest(BaseModel):
    title: str
    company: str
    jd: str