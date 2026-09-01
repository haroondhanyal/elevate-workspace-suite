from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class WorkspaceDataWrite(BaseModel):
    value: Any
    actor: str = Field(default="Raja Haroon", max_length=120)


class WorkspaceDataRead(ORMModel):
    organization_id: int
    key: str
    value: Any
    updated_at: datetime | None = None


class HealthRead(BaseModel):
    status: str
    service: str


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    organization_name: str = Field(min_length=2, max_length=160)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=20, max_length=500)
    password: str = Field(min_length=8, max_length=128)


class UserRead(ORMModel):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    avatar_url: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=160)
    avatar_url: str | None = Field(default=None, max_length=500)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    organization_id: int
    role: str


class OrganizationRead(ORMModel):
    id: int
    name: str
    slug: str


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    key: str = Field(min_length=2, max_length=12, pattern=r"^[A-Za-z0-9_-]+$")
    description: str = ""


class ProjectRead(ORMModel):
    id: int
    organization_id: int
    name: str
    key: str
    description: str
    status: str
    created_at: datetime | None = None


class IssueCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = ""
    issue_type: str = "task"
    priority: str = "medium"
    assignee_id: int | None = None
    sprint: str | None = None


class IssueUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    assignee_id: int | None = None
    sprint: str | None = None
    labels: list[str] | None = None


class IssueRead(ORMModel):
    id: int
    project_id: int
    issue_key: str
    title: str
    description: str
    issue_type: str
    status: str
    priority: str
    assignee_id: int | None
    reporter_id: int
    sprint: str | None
    labels: list[str] = Field(default_factory=list)
    created_at: datetime | None = None


class TestCaseCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    preconditions: str = ""
    steps: list[dict[str, Any]] = Field(default_factory=list)
    expected_result: str = ""
    priority: str = "medium"
    linked_issue_id: int | None = None


class TestCaseRead(ORMModel):
    id: int
    project_id: int
    title: str
    preconditions: str
    steps: list[dict[str, Any]]
    expected_result: str
    priority: str
    linked_issue_id: int | None


class TestRunCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str = ""


class TestRunRead(ORMModel):
    id: int
    project_id: int
    name: str
    description: str
    status: str


class TestResultUpsert(BaseModel):
    test_case_id: int
    status: str = Field(pattern=r"^(untested|passed|failed|blocked|retest)$")
    comment: str = ""
    evidence_url: str | None = None
    defect_issue_id: int | None = None


class TestResultRead(ORMModel):
    id: int
    test_run_id: int
    test_case_id: int
    status: str
    comment: str
    evidence_url: str | None
    defect_issue_id: int | None
    tested_by_id: int | None


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=10000)


class AttachmentCreate(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    url: str = Field(min_length=1, max_length=1000)


class CommentRead(ORMModel):
    id: int
    issue_id: int
    author_id: int
    body: str
    created_at: datetime | None = None


class AttachmentRead(ORMModel):
    id: int
    file_name: str
    url: str
    created_at: datetime | None = None


class ApprovalCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    category: str = "general"
    amount: int | None = Field(default=None, ge=0)


class ApprovalDecision(BaseModel):
    decision: str = Field(pattern=r"^(approved|rejected)$")
    note: str = ""


class ApprovalRead(ORMModel):
    id: int
    organization_id: int
    title: str
    category: str
    amount: int | None
    status: str
    requested_by_id: int
    approved_by_id: int | None
    decision_note: str


class NotificationRead(ORMModel):
    id: int
    title: str
    body: str
    kind: str
    is_read: bool
    created_at: datetime | None = None


class SalesOrderCreate(BaseModel):
    customer: str = Field(min_length=2, max_length=180)
    amount: float = Field(gt=0)


class SalesOrderRead(ORMModel):
    id: int
    organization_id: int
    number: str
    customer: str
    amount: float
    status: str
    created_at: datetime | None = None


class InventoryItemCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=60)
    name: str = Field(min_length=2, max_length=180)
    quantity: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=0, ge=0)


class InventoryItemRead(ORMModel):
    id: int
    organization_id: int
    sku: str
    name: str
    quantity: int
    reorder_level: int


class InvoiceCreate(BaseModel):
    customer: str = Field(min_length=2, max_length=180)
    amount: float = Field(gt=0)
    due_date: date | None = None


class InvoiceRead(ORMModel):
    id: int
    organization_id: int
    number: str
    customer: str
    amount: float
    due_date: date | None
    status: str


class LeaveRequestCreate(BaseModel):
    leave_type: str = Field(min_length=2, max_length=60)
    start_date: date
    end_date: date


class DashboardSummary(BaseModel):
    organization_id: int
    projects: int
    open_issues: int
    completed_issues: int
    active_test_runs: int
    passed_tests: int
    failed_tests: int
    pending_approvals: int
    unread_notifications: int


class SearchResult(BaseModel):
    kind: str
    id: int
    title: str
    subtitle: str
    href: str
