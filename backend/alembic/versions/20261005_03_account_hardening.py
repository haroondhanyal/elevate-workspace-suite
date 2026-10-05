"""profile fields and persistent login throttling

Revision ID: 20261005_03
Revises: 20260901_02
"""
from alembic import op
import sqlalchemy as sa

revision = "20261005_03"
down_revision = "20260901_02"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("mobile", sa.String(40), nullable=False, server_default=""))
    op.add_column("users", sa.Column("address", sa.Text(), nullable=False, server_default=""))
    op.add_column("users", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("token_version", sa.Integer(), nullable=False, server_default="0"))
    op.create_table(
        "login_attempts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("attempted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_login_attempts_email", "login_attempts", ["email"])
    op.create_index("ix_login_attempts_attempted_at", "login_attempts", ["attempted_at"])


def downgrade():
    op.drop_index("ix_login_attempts_attempted_at", table_name="login_attempts")
    op.drop_index("ix_login_attempts_email", table_name="login_attempts")
    op.drop_table("login_attempts")
    op.drop_column("users", "token_version")
    op.drop_column("users", "date_of_birth")
    op.drop_column("users", "address")
    op.drop_column("users", "mobile")
