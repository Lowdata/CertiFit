"""add candidate linkedin profile

Revision ID: 0005_add_candidate_linkedin
Revises: 0004_add_candidate_github
Create Date: 2026-06-14 01:45:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005_add_candidate_linkedin"
down_revision = "0004_add_candidate_github"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def upgrade():
    if "linkedin_profile_json" not in _columns("candidates"):
        op.add_column(
            "candidates",
            sa.Column(
                "linkedin_profile_json",
                postgresql.JSONB(astext_type=sa.Text()),
                server_default=sa.text("'{}'::jsonb"),
                nullable=False,
            ),
        )
        op.alter_column("candidates", "linkedin_profile_json", server_default=None)


def downgrade():
    if "linkedin_profile_json" in _columns("candidates"):
        op.drop_column("candidates", "linkedin_profile_json")
