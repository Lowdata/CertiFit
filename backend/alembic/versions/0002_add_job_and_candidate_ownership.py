"""add job and candidate ownership

Revision ID: 0002_add_ownership
Revises: 0001_baseline
Create Date: 2026-06-14 00:01:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_add_ownership"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def _indexes(table_name: str) -> set[str]:
    bind = op.get_bind()
    return {index["name"] for index in sa.inspect(bind).get_indexes(table_name)}


def _foreign_keys(table_name: str) -> set[str]:
    bind = op.get_bind()
    return {fk["name"] for fk in sa.inspect(bind).get_foreign_keys(table_name)}


def upgrade():
    job_columns = _columns("jobs")
    candidate_columns = _columns("candidates")

    if "recruiter_id" not in job_columns:
        op.add_column("jobs", sa.Column("recruiter_id", sa.Integer(), nullable=True))

    if "user_id" not in candidate_columns:
        op.add_column("candidates", sa.Column("user_id", sa.Integer(), nullable=True))

    op.execute(
        """
        UPDATE jobs
        SET recruiter_id = only_recruiter.id
        FROM (
            SELECT id
            FROM users
            WHERE user_type = 1
            LIMIT 1
        ) AS only_recruiter
        WHERE jobs.recruiter_id IS NULL
          AND (SELECT COUNT(*) FROM users WHERE user_type = 1) = 1
        """
    )
    op.execute(
        """
        UPDATE candidates
        SET user_id = only_candidate.id
        FROM (
            SELECT id
            FROM users
            WHERE user_type = 2
            LIMIT 1
        ) AS only_candidate
        WHERE candidates.user_id IS NULL
          AND (SELECT COUNT(*) FROM users WHERE user_type = 2) = 1
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM jobs WHERE recruiter_id IS NULL) THEN
                RAISE EXCEPTION 'Cannot add jobs.recruiter_id: existing jobs need recruiter ownership backfill';
            END IF;
            IF EXISTS (SELECT 1 FROM candidates WHERE user_id IS NULL) THEN
                RAISE EXCEPTION 'Cannot add candidates.user_id: existing candidates need user ownership backfill';
            END IF;
        END $$;
        """
    )

    op.alter_column("jobs", "recruiter_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("candidates", "user_id", existing_type=sa.Integer(), nullable=False)

    indexes = _indexes("jobs")
    if "ix_jobs_recruiter_id" not in indexes:
        op.create_index("ix_jobs_recruiter_id", "jobs", ["recruiter_id"], unique=False)

    candidate_indexes = _indexes("candidates")
    if "ix_candidates_user_id" not in candidate_indexes:
        op.create_index(
            "ix_candidates_user_id",
            "candidates",
            ["user_id"],
            unique=False,
        )
    if "uq_candidates_user_id" not in candidate_indexes:
        op.create_unique_constraint(
            "uq_candidates_user_id",
            "candidates",
            ["user_id"],
        )

    job_fks = _foreign_keys("jobs")
    if "fk_jobs_recruiter_id_users" not in job_fks:
        op.create_foreign_key(
            "fk_jobs_recruiter_id_users",
            "jobs",
            "users",
            ["recruiter_id"],
            ["id"],
            ondelete="RESTRICT",
        )

    candidate_fks = _foreign_keys("candidates")
    if "fk_candidates_user_id_users" not in candidate_fks:
        op.create_foreign_key(
            "fk_candidates_user_id_users",
            "candidates",
            "users",
            ["user_id"],
            ["id"],
            ondelete="CASCADE",
        )


def downgrade():
    fks = _foreign_keys("candidates")
    if "fk_candidates_user_id_users" in fks:
        op.drop_constraint("fk_candidates_user_id_users", "candidates", type_="foreignkey")
    fks = _foreign_keys("jobs")
    if "fk_jobs_recruiter_id_users" in fks:
        op.drop_constraint("fk_jobs_recruiter_id_users", "jobs", type_="foreignkey")

    indexes = _indexes("candidates")
    if "uq_candidates_user_id" in indexes:
        op.drop_constraint("uq_candidates_user_id", "candidates", type_="unique")
    if "ix_candidates_user_id" in indexes:
        op.drop_index("ix_candidates_user_id", table_name="candidates")
    indexes = _indexes("jobs")
    if "ix_jobs_recruiter_id" in indexes:
        op.drop_index("ix_jobs_recruiter_id", table_name="jobs")

    if "user_id" in _columns("candidates"):
        op.drop_column("candidates", "user_id")
    if "recruiter_id" in _columns("jobs"):
        op.drop_column("jobs", "recruiter_id")
