"""add normalized profile and trust score columns

Revision ID: 0006_add_normalized_trust
Revises: 0005_add_candidate_linkedin
Create Date: 2026-06-14 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0006_add_normalized_trust"
down_revision = "0005_add_candidate_linkedin"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def upgrade():
    cols = _columns("candidates")

    if "normalized_profile_json" not in cols:
        op.add_column(
            "candidates",
            sa.Column(
                "normalized_profile_json",
                postgresql.JSONB(astext_type=sa.Text()),
                server_default=sa.text("'{}'::jsonb"),
                nullable=False,
            ),
        )
        op.alter_column("candidates", "normalized_profile_json", server_default=None)

    if "trust_score_json" not in cols:
        op.add_column(
            "candidates",
            sa.Column(
                "trust_score_json",
                postgresql.JSONB(astext_type=sa.Text()),
                server_default=sa.text("'{}'::jsonb"),
                nullable=False,
            ),
        )
        op.alter_column("candidates", "trust_score_json", server_default=None)


def downgrade():
    cols = _columns("candidates")
    if "normalized_profile_json" in cols:
        op.drop_column("candidates", "normalized_profile_json")
    if "trust_score_json" in cols:
        op.drop_column("candidates", "trust_score_json")
