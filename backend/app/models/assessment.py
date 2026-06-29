from datetime import datetime

from sqlalchemy import CheckConstraint
from sqlalchemy import DateTime
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import JSON
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import func

from sqlalchemy.dialects.postgresql import JSONB

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.db.database import Base


class Assessment(Base):

    __tablename__ = "assessments"

    __table_args__ = (
        CheckConstraint(
            "status in ('pending', 'in_progress', 'completed', 'failed')",
            name="ck_assessments_status"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending",
        index=True
    )

    current_question_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    overall_score: Mapped[float] = mapped_column(
        Float,
        nullable=True
    )

    evaluation_summary_json: Mapped[dict] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=True
    )

    integrity_score: Mapped[float] = mapped_column(
        Float,
        nullable=True
    )

    integrity_signals: Mapped[list] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=True
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


class AssessmentQuestion(Base):

    __tablename__ = "assessment_questions"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    assessment_id: Mapped[int] = mapped_column(
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    order_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    question_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    expected_skills: Mapped[list] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=False,
        default=list
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class AssessmentRecording(Base):

    __tablename__ = "assessment_recordings"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey("assessment_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True
    )

    video_url: Mapped[str] = mapped_column(
        String(1024),
        nullable=True
    )

    audio_url: Mapped[str] = mapped_column(
        String(1024),
        nullable=True
    )

    transcript_text: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )

    ai_evaluation_json: Mapped[dict] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=True
    )

    duration_seconds: Mapped[float] = mapped_column(
        Float,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
