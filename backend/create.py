from app.db.database import Base
from app.db.database import engine
from app.models.application import Application  # noqa: F401
from app.models.candidate import Candidate  # noqa: F401
from app.models.job import Job  # noqa: F401
from app.models.user import User  # noqa: F401

Base.metadata.create_all(
    bind=engine
)

print("Tables created")
