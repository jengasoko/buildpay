"""add_public_website_columns_to_projects

Revision ID: 8751fe26fdd1
Revises: f7a2c9e3d456
Create Date: 2026-09-20 18:22:16.502092
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "8751fe26fdd1"
down_revision: str | None = "f7a2c9e3d456"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    project_status = sa.Enum("PLANNED", "ONGOING", "COMPLETED", name="projectstatus")
    project_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "projects",
        sa.Column(
            "status",
            project_status,
            nullable=False,
            server_default=sa.text("'ONGOING'"),
        ),
    )
    op.add_column("projects", sa.Column("image_url", sa.String(length=500), nullable=True))
    op.add_column(
        "projects",
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("projects", "is_featured")
    op.drop_column("projects", "image_url")
    op.drop_column("projects", "status")

    project_status = sa.Enum("PLANNED", "ONGOING", "COMPLETED", name="projectstatus")
    project_status.drop(op.get_bind(), checkfirst=True)
