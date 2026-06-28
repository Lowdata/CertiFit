from datetime import datetime

from sqlalchemy import CheckConstraint
from sqlalchemy import DateTime
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import JSON
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
        CheckConstraint(
            "status in ('applied', 'reviewed', 'shortlisted', "
            "'interview', 'rejected', 'hired')",
            name="ck_applications_status"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="applied",
        index=True
    )

    is_external: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
        server_default="false"
    )

    external_source: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
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
        JSON().with_variant(JSONB, "postgresql"),
        nullable=False,
        default=list
    )

    gaps_json: Mapped[list] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=False,
        default=list
    )

    fit_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0
    )

    trust_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0
    )

    composite_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0
    )

    score_explanations: Mapped[dict] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=False,
        default=dict
    )

    screening_answers: Mapped[dict] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=False,
        default=dict,
        server_default="{}"
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
