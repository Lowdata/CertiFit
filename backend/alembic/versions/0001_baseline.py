"""baseline legacy schema

Revision ID: 0001_baseline
Revises: None
Create Date: 2026-06-14 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def _has_table(table_name: str) -> bool:
    bind = op.get_bind()
    return sa.inspect(bind).has_table(table_name)


def upgrade():
    if not _has_table("users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("password_hash", sa.String(length=255), nullable=True),
            sa.Column("provider", sa.String(length=50), nullable=False),
            sa.Column("user_type", sa.Integer(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=True,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=True,
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
        op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    if not _has_table("jobs"):
        op.create_table(
            "jobs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("company", sa.String(length=255), nullable=False),
            sa.Column("raw_jd", sa.Text(), nullable=False),
            sa.Column(
                "parsed_jd_json",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=True,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=True,
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_jobs_id"), "jobs", ["id"], unique=False)

    if not _has_table("candidates"):
        op.create_table(
            "candidates",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("resume_file_name", sa.String(length=500), nullable=False),
            sa.Column("raw_resume_text", sa.Text(), nullable=False),
            sa.Column(
                "parsed_candidate_json",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=True,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=True,
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_candidates_id"), "candidates", ["id"], unique=False)


def downgrade():
    if _has_table("candidates"):
        op.drop_index(op.f("ix_candidates_id"), table_name="candidates")
        op.drop_table("candidates")
    if _has_table("jobs"):
        op.drop_index(op.f("ix_jobs_id"), table_name="jobs")
        op.drop_table("jobs")
    if _has_table("users"):
        op.drop_index(op.f("ix_users_email"), table_name="users")
        op.drop_index(op.f("ix_users_id"), table_name="users")
        op.drop_table("users")
