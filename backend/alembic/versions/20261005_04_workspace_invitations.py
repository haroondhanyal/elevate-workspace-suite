"""workspace team invitations

Revision ID: 20261005_04
Revises: 20261005_03
"""
from alembic import op
import sqlalchemy as sa

revision = "20261005_04"
down_revision = "20261005_03"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "workspace_invitations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("role", sa.String(30), nullable=False, server_default="member"),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("invited_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_workspace_invitations_organization_id", "workspace_invitations", ["organization_id"])
    op.create_index("ix_workspace_invitations_email", "workspace_invitations", ["email"])


def downgrade():
    op.drop_index("ix_workspace_invitations_email", table_name="workspace_invitations")
    op.drop_index("ix_workspace_invitations_organization_id", table_name="workspace_invitations")
    op.drop_table("workspace_invitations")
