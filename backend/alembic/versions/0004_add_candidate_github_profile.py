"""add candidate github profile

Revision ID: 0004_add_candidate_github
Revises: 0003_create_applications
Create Date: 2026-06-14 01:30:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004_add_candidate_github"
down_revision = "0003_create_applications"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def upgrade():
    if "github_profile_json" not in _columns("candidates"):
        op.add_column(
            "candidates",
            sa.Column(
                "github_profile_json",
                postgresql.JSONB(astext_type=sa.Text()),
                server_default=sa.text("'{}'::jsonb"),
                nullable=False,
            ),
        )
        op.alter_column("candidates", "github_profile_json", server_default=None)


def downgrade():
    if "github_profile_json" in _columns("candidates"):
        op.drop_column("candidates", "github_profile_json")
