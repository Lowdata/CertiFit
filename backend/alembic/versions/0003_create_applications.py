"""create applications

Revision ID: 0003_create_applications
Revises: 0002_add_ownership
Create Date: 2026-06-14 00:02:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_create_applications"
down_revision = "0002_add_ownership"
branch_labels = None
depends_on = None


def _has_table(table_name: str) -> bool:
    bind = op.get_bind()
    return sa.inspect(bind).has_table(table_name)


def _indexes(table_name: str) -> set[str]:
    bind = op.get_bind()
    return {index["name"] for index in sa.inspect(bind).get_indexes(table_name)}


def upgrade():
    if not _has_table("applications"):
        op.create_table(
            "applications",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("job_id", sa.Integer(), nullable=False),
            sa.Column("candidate_id", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False),
            sa.Column("match_score", sa.Float(), nullable=False),
            sa.Column("match_summary", sa.Text(), nullable=False),
            sa.Column(
                "strengths_json",
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
            ),
            sa.Column("gaps_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column(
                "applied_at",
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
            sa.CheckConstraint(
                "status in ('applied', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired')",
                name="ck_applications_status",
            ),
            sa.ForeignKeyConstraint(
                ["candidate_id"],
                ["candidates.id"],
                name="fk_applications_candidate_id_candidates",
                ondelete="CASCADE",
            ),
            sa.ForeignKeyConstraint(
                ["job_id"],
                ["jobs.id"],
                name="fk_applications_job_id_jobs",
                ondelete="CASCADE",
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "job_id",
                "candidate_id",
                name="uq_applications_job_candidate",
            ),
        )

    indexes = _indexes("applications")
    if "ix_applications_id" not in indexes:
        op.create_index("ix_applications_id", "applications", ["id"], unique=False)
    if "ix_applications_job_id" not in indexes:
        op.create_index(
            "ix_applications_job_id",
            "applications",
            ["job_id"],
            unique=False,
        )
    if "ix_applications_candidate_id" not in indexes:
        op.create_index(
            "ix_applications_candidate_id",
            "applications",
            ["candidate_id"],
            unique=False,
        )
    if "ix_applications_status" not in indexes:
        op.create_index(
            "ix_applications_status",
            "applications",
            ["status"],
            unique=False,
        )
    if "ix_applications_job_score" not in indexes:
        op.create_index(
            "ix_applications_job_score",
            "applications",
            ["job_id", "match_score"],
            unique=False,
        )


def downgrade():
    if _has_table("applications"):
        indexes = _indexes("applications")
        for index_name in (
            "ix_applications_job_score",
            "ix_applications_status",
            "ix_applications_candidate_id",
            "ix_applications_job_id",
            "ix_applications_id",
        ):
            if index_name in indexes:
                op.drop_index(index_name, table_name="applications")
        op.drop_table("applications")
