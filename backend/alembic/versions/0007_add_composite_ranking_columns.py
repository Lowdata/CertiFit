"""add composite ranking columns to applications

Revision ID: 0007_add_composite_ranking
Revises: 0006_add_normalized_trust
Create Date: 2026-06-14 12:01:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0007_add_composite_ranking"
down_revision = "0006_add_normalized_trust"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def upgrade():
    cols = _columns("applications")

    if "fit_score" not in cols:
        op.add_column(
            "applications",
            sa.Column(
                "fit_score",
                sa.Float(),
                server_default=sa.text("0"),
                nullable=False,
            ),
        )
        op.alter_column("applications", "fit_score", server_default=None)

    if "trust_score" not in cols:
        op.add_column(
            "applications",
            sa.Column(
                "trust_score",
                sa.Float(),
                server_default=sa.text("0"),
                nullable=False,
            ),
        )
        op.alter_column("applications", "trust_score", server_default=None)

    if "composite_score" not in cols:
        op.add_column(
            "applications",
            sa.Column(
                "composite_score",
                sa.Float(),
                server_default=sa.text("0"),
                nullable=False,
            ),
        )
        op.alter_column("applications", "composite_score", server_default=None)

    if "score_explanations" not in cols:
        op.add_column(
            "applications",
            sa.Column(
                "score_explanations",
                postgresql.JSONB(astext_type=sa.Text()),
                server_default=sa.text("'{}'::jsonb"),
                nullable=False,
            ),
        )
        op.alter_column("applications", "score_explanations", server_default=None)


def downgrade():
    cols = _columns("applications")
    for col in ("fit_score", "trust_score", "composite_score", "score_explanations"):
        if col in cols:
            op.drop_column("applications", col)
