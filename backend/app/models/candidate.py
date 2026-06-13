from datetime import datetime

from sqlalchemy import Text
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import func

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from sqlalchemy.dialects.postgresql import JSONB

from app.db.database import Base


class Candidate(Base):

    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True
    )

    resume_file_name: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    raw_resume_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    parsed_candidate_json: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict
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
