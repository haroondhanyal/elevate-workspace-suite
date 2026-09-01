from datetime import date, datetime
from typing import Any

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Timestamped:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class User(Timestamped, Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(160))
    password_hash: Mapped[str] = mapped_column(String(512))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)


class Organization(Timestamped, Base):
    __tablename__ = "organizations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)


class Membership(Timestamped, Base):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("user_id", "organization_id", name="uq_membership_user_org"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(30), default="member")  # owner, admin, manager, qa, member


class Project(Timestamped, Base):
    __tablename__ = "projects"
    __table_args__ = (UniqueConstraint("organization_id", "key", name="uq_project_org_key"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(180))
    key: Mapped[str] = mapped_column(String(12))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="active")


class Issue(Timestamped, Base):
    __tablename__ = "issues"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    issue_key: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    issue_type: Mapped[str] = mapped_column(String(30), default="task")
    status: Mapped[str] = mapped_column(String(30), default="todo")
    priority: Mapped[str] = mapped_column(String(30), default="medium")
    assignee_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    sprint: Mapped[str | None] = mapped_column(String(100), nullable=True)
    labels: Mapped[Any] = mapped_column(JSON, default=list)


class IssueComment(Timestamped, Base):
    __tablename__ = "issue_comments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    issue_id: Mapped[int] = mapped_column(ForeignKey("issues.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    body: Mapped[str] = mapped_column(Text)


class IssueAttachment(Timestamped, Base):
    __tablename__ = "issue_attachments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    issue_id: Mapped[int] = mapped_column(ForeignKey("issues.id", ondelete="CASCADE"), index=True)
    uploaded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    file_name: Mapped[str] = mapped_column(String(255))
    url: Mapped[str] = mapped_column(String(1000))


class TestCase(Timestamped, Base):
    __tablename__ = "test_cases"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    preconditions: Mapped[str] = mapped_column(Text, default="")
    steps: Mapped[Any] = mapped_column(JSON, default=list)
    expected_result: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[str] = mapped_column(String(30), default="medium")
    linked_issue_id: Mapped[int | None] = mapped_column(ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)


class TestRun(Timestamped, Base):
    __tablename__ = "test_runs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="active")


class TestResult(Timestamped, Base):
    __tablename__ = "test_results"
    __table_args__ = (UniqueConstraint("test_run_id", "test_case_id", name="uq_result_run_case"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    test_run_id: Mapped[int] = mapped_column(ForeignKey("test_runs.id", ondelete="CASCADE"), index=True)
    test_case_id: Mapped[int] = mapped_column(ForeignKey("test_cases.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(30), default="untested")
    comment: Mapped[str] = mapped_column(Text, default="")
    evidence_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    defect_issue_id: Mapped[int | None] = mapped_column(ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    tested_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class TestEvidence(Timestamped, Base):
    __tablename__ = "test_evidence"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    test_result_id: Mapped[int] = mapped_column(ForeignKey("test_results.id", ondelete="CASCADE"), index=True)
    uploaded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    file_name: Mapped[str] = mapped_column(String(255))
    url: Mapped[str] = mapped_column(String(1000))


class ApprovalRequest(Timestamped, Base):
    __tablename__ = "approval_requests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(80), default="general")
    amount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending")
    requested_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    approved_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decision_note: Mapped[str] = mapped_column(Text, default="")


class ApprovalStep(Timestamped, Base):
    __tablename__ = "approval_steps"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    approval_request_id: Mapped[int] = mapped_column(ForeignKey("approval_requests.id", ondelete="CASCADE"), index=True)
    step_number: Mapped[int] = mapped_column(Integer)
    approver_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(30), default="pending")
    note: Mapped[str] = mapped_column(Text, default="")


class SalesOrder(Timestamped, Base):
    __tablename__ = "sales_orders"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    customer: Mapped[str] = mapped_column(String(180))
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(30), default="draft")
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))


class InventoryItem(Timestamped, Base):
    __tablename__ = "inventory_items"
    __table_args__ = (UniqueConstraint("organization_id", "sku", name="uq_inventory_org_sku"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    sku: Mapped[str] = mapped_column(String(60))
    name: Mapped[str] = mapped_column(String(180))
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, default=0)


class Invoice(Timestamped, Base):
    __tablename__ = "invoices"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    customer: Mapped[str] = mapped_column(String(180))
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="draft")


class LeaveRequest(Timestamped, Base):
    __tablename__ = "leave_requests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    leave_type: Mapped[str] = mapped_column(String(60))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(30), default="pending")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Notification(Timestamped, Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text, default="")
    kind: Mapped[str] = mapped_column(String(40), default="system")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)


class WorkspaceData(Base):
    """Tenant-scoped storage used by the existing ERP module screens."""
    __tablename__ = "workspace_data"
    __table_args__ = (UniqueConstraint("organization_id", "key", name="uq_workspace_data_org_key"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(100), index=True)
    value: Mapped[Any] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    actor: Mapped[str] = mapped_column(String(120), default="system")
    detail: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
