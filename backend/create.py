from app.db.database import Base
from app.db.database import engine
from app.models.candidate import Candidate
from app.models.job import Job

Base.metadata.create_all(
    bind=engine
)

print("Tables created")