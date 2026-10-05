"""persist optional user age

Revision ID: 20261005_05
Revises: 20261005_04
"""
from alembic import op
import sqlalchemy as sa

revision = "20261005_05"
down_revision = "20261005_04"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("age", sa.Integer(), nullable=True))


def downgrade():
    op.drop_column("users", "age")
