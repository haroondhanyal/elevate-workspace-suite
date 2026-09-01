"""connected workflow, ERP records and account extensions

Revision ID: 20260901_02
Revises: 20260901_01
"""
from alembic import op
import sqlalchemy as sa

revision = "20260901_02"
down_revision = "20260901_01"
branch_labels = None
depends_on = None


def timestamp_columns():
    return [sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now())]


def upgrade():
    existing = sa.inspect(op.get_bind()).get_table_names()
    legacy_workspace = "workspace_data" in existing and "organization_id" not in {column["name"] for column in sa.inspect(op.get_bind()).get_columns("workspace_data")}
    if legacy_workspace:
        # Preserve unscoped demo data, then create the tenant-safe replacement.
        op.rename_table("workspace_data", "workspace_data_legacy")
        op.create_table("workspace_data", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False), sa.Column("key", sa.String(100), nullable=False), sa.Column("value", sa.JSON(), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()), sa.UniqueConstraint("organization_id", "key", name="uq_workspace_data_org_key"))
        op.execute("INSERT INTO workspace_data (organization_id, key, value, updated_at) SELECT (SELECT id FROM organizations ORDER BY id LIMIT 1), key, value, updated_at FROM workspace_data_legacy WHERE EXISTS (SELECT 1 FROM organizations)")
    op.add_column("users", sa.Column("avatar_url", sa.String(500), nullable=True))
    op.add_column("issues", sa.Column("labels", sa.JSON(), nullable=False, server_default="[]"))
    op.create_table("issue_comments", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("issue_id", sa.Integer(), sa.ForeignKey("issues.id", ondelete="CASCADE"), nullable=False), sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False), sa.Column("body", sa.Text(), nullable=False), *timestamp_columns())
    op.create_table("issue_attachments", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("issue_id", sa.Integer(), sa.ForeignKey("issues.id", ondelete="CASCADE"), nullable=False), sa.Column("uploaded_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False), sa.Column("file_name", sa.String(255), nullable=False), sa.Column("url", sa.String(1000), nullable=False), *timestamp_columns())
    op.create_table("test_evidence", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("test_result_id", sa.Integer(), sa.ForeignKey("test_results.id", ondelete="CASCADE"), nullable=False), sa.Column("uploaded_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False), sa.Column("file_name", sa.String(255), nullable=False), sa.Column("url", sa.String(1000), nullable=False), *timestamp_columns())
    op.create_table("approval_steps", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("approval_request_id", sa.Integer(), sa.ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False), sa.Column("step_number", sa.Integer(), nullable=False), sa.Column("approver_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False), sa.Column("status", sa.String(30), nullable=False, server_default="pending"), sa.Column("note", sa.Text(), nullable=False, server_default=""), *timestamp_columns())
    op.create_table("sales_orders", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False), sa.Column("number", sa.String(40), nullable=False, unique=True), sa.Column("customer", sa.String(180), nullable=False), sa.Column("amount", sa.Numeric(12, 2), nullable=False), sa.Column("status", sa.String(30), nullable=False, server_default="draft"), sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False), *timestamp_columns())
    op.create_table("inventory_items", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False), sa.Column("sku", sa.String(60), nullable=False), sa.Column("name", sa.String(180), nullable=False), sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"), sa.Column("reorder_level", sa.Integer(), nullable=False, server_default="0"), *timestamp_columns(), sa.UniqueConstraint("organization_id", "sku", name="uq_inventory_org_sku"))
    op.create_table("invoices", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False), sa.Column("number", sa.String(40), nullable=False, unique=True), sa.Column("customer", sa.String(180), nullable=False), sa.Column("amount", sa.Numeric(12, 2), nullable=False), sa.Column("due_date", sa.Date()), sa.Column("status", sa.String(30), nullable=False, server_default="draft"), *timestamp_columns())
    op.create_table("leave_requests", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False), sa.Column("employee_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False), sa.Column("leave_type", sa.String(60), nullable=False), sa.Column("start_date", sa.Date(), nullable=False), sa.Column("end_date", sa.Date(), nullable=False), sa.Column("status", sa.String(30), nullable=False, server_default="pending"), *timestamp_columns())
    op.create_table("password_reset_tokens", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("token_hash", sa.String(64), nullable=False, unique=True), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("used_at", sa.DateTime(timezone=True)))


def downgrade():
    for table in ("password_reset_tokens", "leave_requests", "invoices", "inventory_items", "sales_orders", "approval_steps", "test_evidence", "issue_attachments", "issue_comments"): op.drop_table(table)
    op.drop_column("issues", "labels")
    op.drop_column("users", "avatar_url")
