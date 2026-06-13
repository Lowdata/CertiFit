from datetime import datetime

from sqlalchemy import DateTime
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import UniqueConstraint
from sqlalchemy import func

from sqlalchemy.dialects.postgresql import JSONB

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.db.database import Base


class Application(Base):

    __tablename__ = "applications"

    __table_args__ = (
        UniqueConstraint(
            "job_id",
            "candidate_id",
            name="uq_applications_job_candidate"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id"),
        nullable=False,
        index=True
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id"),
        nullable=False,
        index=True
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="applied",
        index=True
    )

    match_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0
    )

    match_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default=""
    )

    strengths_json: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list
    )

    gaps_json: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list
    )

    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
