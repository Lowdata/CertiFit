from pydantic import BaseModel

class RecruiterDashboardMetrics(BaseModel):
    open_jobs: int
    total_applications: int
    candidates_in_pipeline: int
    avg_fit_score: float
    avg_trust_score: float
