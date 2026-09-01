import asyncio
import csv
import hashlib
import io
import re
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, Response, UploadFile, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .auth import create_access_token, get_current_user, hash_password, verify_password
from .config import get_settings
from .database import get_db
from .email_service import send_password_reset
from .models import ApprovalRequest, AuditEvent, InventoryItem, Invoice, Issue, IssueAttachment, IssueComment, LeaveRequest, Membership, Notification, Organization, PasswordResetToken, Project, SalesOrder, TestCase, TestEvidence, TestResult, TestRun, User, WorkspaceData
from .schemas import (ApprovalCreate, ApprovalDecision, ApprovalRead, AttachmentCreate, AttachmentRead, AuthResponse, CommentCreate, CommentRead, DashboardSummary, HealthRead, InventoryItemCreate, InventoryItemRead, InvoiceCreate, InvoiceRead, IssueCreate, IssueRead, IssueUpdate, LeaveRequestCreate, LoginRequest, NotificationRead, OrganizationRead, PasswordResetConfirm, PasswordResetRequest, ProfileUpdate, ProjectCreate, ProjectRead, SalesOrderCreate, SalesOrderRead, SearchResult, SignupRequest, TestCaseCreate, TestCaseRead, TestResultRead, TestResultUpsert, TestRunCreate, TestRunRead, UserRead, WorkspaceDataRead, WorkspaceDataWrite)

settings = get_settings()
upload_dir = Path("uploads")


@asynccontextmanager
async def lifespan(_: FastAPI):
    upload_dir.mkdir(exist_ok=True)
    yield


app = FastAPI(title=settings.app_name, version="2.0.0", lifespan=lifespan)
app.mount("/uploads", StaticFiles(directory=upload_dir, check_dir=False), name="uploads")
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins, allow_credentials=True, allow_methods=["GET", "POST", "PUT", "PATCH", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])


class NotificationHub:
    def __init__(self):
        self.connections: dict[int, list[WebSocket]] = {}
        self.loop = None

    async def connect(self, user_id: int, socket: WebSocket):
        await socket.accept()
        self.loop = asyncio.get_running_loop()
        self.connections.setdefault(user_id, []).append(socket)

    def disconnect(self, user_id: int, socket: WebSocket):
        if socket in self.connections.get(user_id, []): self.connections[user_id].remove(socket)

    async def publish(self, user_id: int, payload: dict):
        for socket in self.connections.get(user_id, [])[:]:
            try: await socket.send_json(payload)
            except Exception: self.disconnect(user_id, socket)

    def publish_from_sync(self, user_id: int, payload: dict):
        if self.loop and self.connections.get(user_id):
            asyncio.run_coroutine_threadsafe(self.publish(user_id, payload), self.loop)


notification_hub = NotificationHub()


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:80] or "workspace"


def membership_for(db: Session, user: User, organization_id: int) -> Membership:
    membership = db.scalar(select(Membership).where(Membership.user_id == user.id, Membership.organization_id == organization_id))
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this organization")
    return membership


def require_role(membership: Membership, *roles: str):
    if membership.role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Required role: {' or '.join(roles)}")


def project_for(db: Session, user: User, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    membership_for(db, user, project.organization_id)
    return project


def audit(db: Session, action: str, resource_key: str, user: User, detail: str):
    db.add(AuditEvent(action=action, resource_key=resource_key, actor=user.full_name, detail=detail))


def notify(db: Session, user_id: int | None, title: str, body: str, kind: str = "system"):
    if user_id:
        db.add(Notification(user_id=user_id, title=title, body=body, kind=kind))
        notification_hub.publish_from_sync(user_id, {"type": "notification", "title": title, "body": body, "kind": kind})


@app.get("/health", response_model=HealthRead, tags=["system"])
def health_check():
    return {"status": "ok", "service": settings.app_name}


@app.post(f"{settings.api_prefix}/auth/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED, tags=["auth"])
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="An account already exists for this email")
    base_slug, candidate, sequence = slugify(payload.organization_name), "", 1
    while db.scalar(select(Organization).where(Organization.slug == (candidate or base_slug))):
        sequence += 1
        candidate = f"{base_slug}-{sequence}"
    organization = Organization(name=payload.organization_name, slug=candidate or base_slug)
    user = User(email=payload.email.lower(), full_name=payload.full_name, password_hash=hash_password(payload.password))
    db.add_all([organization, user]); db.flush()
    membership = Membership(user_id=user.id, organization_id=organization.id, role="owner")
    db.add_all([membership, Notification(user_id=user.id, title="Welcome to Elevate", body="Your workspace is ready.", kind="welcome")])
    audit(db, "created", f"organization:{organization.id}", user, "Created workspace")
    db.commit(); db.refresh(user)
    return AuthResponse(access_token=create_access_token(user.id), user=user, organization_id=organization.id, role="owner")


@app.post(f"{settings.api_prefix}/auth/login", response_model=AuthResponse, tags=["auth"])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    membership = db.scalar(select(Membership).where(Membership.user_id == user.id).order_by(Membership.id))
    if membership is None:
        raise HTTPException(status_code=403, detail="No workspace membership found")
    return AuthResponse(access_token=create_access_token(user.id), user=user, organization_id=membership.organization_id, role=membership.role)


@app.post(f"{settings.api_prefix}/auth/password-reset/request", tags=["auth"])
def request_password_reset(payload: PasswordResetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    response = {"detail": "If the account exists, a reset link has been sent."}
    if user is None: return response
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    db.add(PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)))
    db.commit()
    reset_url = f"{settings.frontend_url}/reset-password?token={raw_token}"
    background_tasks.add_task(send_password_reset, user.email, reset_url)
    # A local-only escape hatch keeps development testable without exposing tokens in production.
    if settings.app_env == "development" and not settings.smtp_host: response["development_reset_token"] = raw_token
    return response


@app.post(f"{settings.api_prefix}/auth/password-reset/confirm", tags=["auth"])
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    record = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash))
    if record is None or record.used_at or record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user = db.get(User, record.user_id)
    user.password_hash = hash_password(payload.password); record.used_at = datetime.now(timezone.utc)
    db.commit()
    return {"detail": "Password updated. You can now log in."}


@app.get(f"{settings.api_prefix}/auth/me", response_model=UserRead, tags=["auth"])
def me(user: User = Depends(get_current_user)):
    return user


@app.patch(f"{settings.api_prefix}/auth/me", response_model=UserRead, tags=["auth"])
def update_profile(payload: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in payload.model_dump(exclude_unset=True).items(): setattr(user, field, value)
    db.commit(); db.refresh(user)
    return user


@app.post(f"{settings.api_prefix}/uploads", tags=["uploads"])
async def upload_attachment(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "-", file.filename or "attachment")
    stored_name = f"{user.id}-{secrets.token_hex(8)}-{safe_name}"
    target = upload_dir / stored_name
    content = await file.read()
    if len(content) > 15 * 1024 * 1024: raise HTTPException(status_code=413, detail="Files must be 15 MB or smaller")
    target.write_bytes(content)
    return {"file_name": safe_name, "url": f"/uploads/{stored_name}"}


@app.get(f"{settings.api_prefix}/organizations", response_model=list[OrganizationRead], tags=["organizations"])
def organizations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Organization).join(Membership).where(Membership.user_id == user.id).order_by(Organization.name)).all()


@app.post(f"{settings.api_prefix}/organizations/{{organization_id}}/projects", response_model=ProjectRead, status_code=201, tags=["projects"])
def create_project(organization_id: int, payload: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    key = payload.key.upper()
    if db.scalar(select(Project).where(Project.organization_id == organization_id, Project.key == key)):
        raise HTTPException(status_code=409, detail="Project key already exists")
    project = Project(organization_id=organization_id, name=payload.name, key=key, description=payload.description)
    db.add(project); db.flush(); audit(db, "created", f"project:{project.id}", user, f"Created project {key}"); db.commit(); db.refresh(project)
    return project


@app.get(f"{settings.api_prefix}/organizations/{{organization_id}}/projects", response_model=list[ProjectRead], tags=["projects"])
def list_projects(organization_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    return db.scalars(select(Project).where(Project.organization_id == organization_id).order_by(Project.name)).all()


@app.post(f"{settings.api_prefix}/projects/{{project_id}}/issues", response_model=IssueRead, status_code=201, tags=["issues"])
def create_issue(project_id: int, payload: IssueCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = project_for(db, user, project_id)
    issue_number = (db.scalar(select(func.count(Issue.id)).where(Issue.project_id == project.id)) or 0) + 1
    issue = Issue(project_id=project.id, issue_key=f"{project.key}-{issue_number}", title=payload.title, description=payload.description, issue_type=payload.issue_type, priority=payload.priority, assignee_id=payload.assignee_id, reporter_id=user.id, sprint=payload.sprint)
    db.add(issue); db.flush(); audit(db, "created", f"issue:{issue.id}", user, f"Created {issue.issue_key}")
    if issue.assignee_id != user.id: notify(db, issue.assignee_id, f"Task assigned: {issue.issue_key}", issue.title, "issue")
    db.commit(); db.refresh(issue)
    return issue


@app.get(f"{settings.api_prefix}/projects/{{project_id}}/issues", response_model=list[IssueRead], tags=["issues"])
def list_issues(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project_for(db, user, project_id)
    return db.scalars(select(Issue).where(Issue.project_id == project_id).order_by(Issue.created_at.desc())).all()


@app.patch(f"{settings.api_prefix}/issues/{{issue_id}}", response_model=IssueRead, tags=["issues"])
def update_issue(issue_id: int, payload: IssueUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = db.get(Issue, issue_id)
    if issue is None: raise HTTPException(status_code=404, detail="Issue not found")
    project_for(db, user, issue.project_id)
    for field, value in payload.model_dump(exclude_unset=True).items(): setattr(issue, field, value)
    audit(db, "updated", f"issue:{issue.id}", user, f"Updated {issue.issue_key}"); db.commit(); db.refresh(issue)
    return issue


@app.get(f"{settings.api_prefix}/issues/{{issue_id}}/comments", response_model=list[CommentRead], tags=["issues"])
def list_comments(issue_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = db.get(Issue, issue_id)
    if issue is None: raise HTTPException(status_code=404, detail="Issue not found")
    project_for(db, user, issue.project_id)
    return db.scalars(select(IssueComment).where(IssueComment.issue_id == issue_id).order_by(IssueComment.created_at)).all()


@app.post(f"{settings.api_prefix}/issues/{{issue_id}}/comments", response_model=CommentRead, status_code=201, tags=["issues"])
def add_comment(issue_id: int, payload: CommentCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = db.get(Issue, issue_id)
    if issue is None: raise HTTPException(status_code=404, detail="Issue not found")
    project_for(db, user, issue.project_id)
    comment = IssueComment(issue_id=issue_id, author_id=user.id, body=payload.body)
    db.add(comment); audit(db, "commented", f"issue:{issue_id}", user, "Added issue comment"); db.commit(); db.refresh(comment)
    return comment


@app.get(f"{settings.api_prefix}/issues/{{issue_id}}/attachments", response_model=list[AttachmentRead], tags=["issues"])
def list_issue_attachments(issue_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = db.get(Issue, issue_id)
    if issue is None: raise HTTPException(status_code=404, detail="Issue not found")
    project_for(db, user, issue.project_id)
    return db.scalars(select(IssueAttachment).where(IssueAttachment.issue_id == issue_id)).all()


@app.post(f"{settings.api_prefix}/issues/{{issue_id}}/attachments", response_model=AttachmentRead, status_code=201, tags=["issues"])
def add_issue_attachment(issue_id: int, payload: AttachmentCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = db.get(Issue, issue_id)
    if issue is None: raise HTTPException(status_code=404, detail="Issue not found")
    project_for(db, user, issue.project_id)
    attachment = IssueAttachment(issue_id=issue_id, uploaded_by_id=user.id, **payload.model_dump())
    db.add(attachment); audit(db, "attached", f"issue:{issue_id}", user, payload.file_name); db.commit(); db.refresh(attachment)
    return attachment


@app.post(f"{settings.api_prefix}/projects/{{project_id}}/test-cases", response_model=TestCaseRead, status_code=201, tags=["quality"])
def create_test_case(project_id: int, payload: TestCaseCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project_for(db, user, project_id)
    test_case = TestCase(project_id=project_id, **payload.model_dump())
    db.add(test_case); db.flush(); audit(db, "created", f"test_case:{test_case.id}", user, "Created test case"); db.commit(); db.refresh(test_case)
    return test_case


@app.get(f"{settings.api_prefix}/projects/{{project_id}}/test-cases", response_model=list[TestCaseRead], tags=["quality"])
def list_test_cases(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project_for(db, user, project_id)
    return db.scalars(select(TestCase).where(TestCase.project_id == project_id).order_by(TestCase.id.desc())).all()


@app.post(f"{settings.api_prefix}/projects/{{project_id}}/test-runs", response_model=TestRunRead, status_code=201, tags=["quality"])
def create_test_run(project_id: int, payload: TestRunCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project_for(db, user, project_id)
    test_run = TestRun(project_id=project_id, **payload.model_dump())
    db.add(test_run); db.flush(); audit(db, "created", f"test_run:{test_run.id}", user, "Created test run"); db.commit(); db.refresh(test_run)
    return test_run


@app.post(f"{settings.api_prefix}/test-runs/{{test_run_id}}/results", response_model=TestResultRead, tags=["quality"])
def upsert_test_result(test_run_id: int, payload: TestResultUpsert, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    test_run = db.get(TestRun, test_run_id)
    if test_run is None: raise HTTPException(status_code=404, detail="Test run not found")
    project_for(db, user, test_run.project_id)
    test_case = db.get(TestCase, payload.test_case_id)
    if test_case is None or test_case.project_id != test_run.project_id: raise HTTPException(status_code=422, detail="Test case is not part of this project")
    result = db.scalar(select(TestResult).where(TestResult.test_run_id == test_run_id, TestResult.test_case_id == payload.test_case_id))
    if result is None: result = TestResult(test_run_id=test_run_id, test_case_id=payload.test_case_id, tested_by_id=user.id); db.add(result)
    for field, value in payload.model_dump().items(): setattr(result, field, value)
    audit(db, "updated", f"test_run:{test_run_id}", user, f"Marked test case {payload.test_case_id} {payload.status}")
    if payload.status == "failed":
        linked_issue = db.get(Issue, test_case.linked_issue_id) if test_case.linked_issue_id else None
        notify(db, linked_issue.reporter_id if linked_issue else None, "Test failed", f"{test_case.title} failed in {test_run.name}.", "test_failed")
    db.commit(); db.refresh(result)
    return result


@app.get(f"{settings.api_prefix}/test-runs/{{test_run_id}}/results", response_model=list[TestResultRead], tags=["quality"])
def list_test_results(test_run_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    test_run = db.get(TestRun, test_run_id)
    if test_run is None: raise HTTPException(status_code=404, detail="Test run not found")
    project_for(db, user, test_run.project_id)
    return db.scalars(select(TestResult).where(TestResult.test_run_id == test_run_id)).all()


@app.post(f"{settings.api_prefix}/test-results/{{result_id}}/evidence", response_model=AttachmentRead, status_code=201, tags=["quality"])
def add_test_evidence(result_id: int, payload: AttachmentCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = db.get(TestResult, result_id)
    if result is None: raise HTTPException(status_code=404, detail="Test result not found")
    test_run = db.get(TestRun, result.test_run_id)
    project_for(db, user, test_run.project_id)
    evidence = TestEvidence(test_result_id=result_id, uploaded_by_id=user.id, **payload.model_dump())
    db.add(evidence); audit(db, "evidence_added", f"test_result:{result_id}", user, payload.file_name); db.commit(); db.refresh(evidence)
    return evidence


@app.get(f"{settings.api_prefix}/organizations/{{organization_id}}/sales-orders", response_model=list[SalesOrderRead], tags=["erp"])
def list_sales_orders(organization_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    return db.scalars(select(SalesOrder).where(SalesOrder.organization_id == organization_id).order_by(SalesOrder.created_at.desc())).all()


@app.post(f"{settings.api_prefix}/organizations/{{organization_id}}/sales-orders", response_model=SalesOrderRead, status_code=201, tags=["erp"])
def create_sales_order(organization_id: int, payload: SalesOrderCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(membership_for(db, user, organization_id), "owner", "admin", "manager", "sales")
    count = (db.scalar(select(func.count(SalesOrder.id)).where(SalesOrder.organization_id == organization_id)) or 0) + 1
    order = SalesOrder(organization_id=organization_id, number=f"SO-{count:05d}", created_by_id=user.id, **payload.model_dump())
    db.add(order); audit(db, "created", f"sales_order:{order.number}", user, "Created sales order"); db.commit(); db.refresh(order)
    return order


@app.get(f"{settings.api_prefix}/organizations/{{organization_id}}/inventory", response_model=list[InventoryItemRead], tags=["erp"])
def list_inventory(organization_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    return db.scalars(select(InventoryItem).where(InventoryItem.organization_id == organization_id).order_by(InventoryItem.name)).all()


@app.post(f"{settings.api_prefix}/organizations/{{organization_id}}/inventory", response_model=InventoryItemRead, status_code=201, tags=["erp"])
def create_inventory_item(organization_id: int, payload: InventoryItemCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(membership_for(db, user, organization_id), "owner", "admin", "manager", "sales")
    item = InventoryItem(organization_id=organization_id, **payload.model_dump())
    db.add(item); audit(db, "created", f"inventory:{item.sku}", user, "Created inventory item")
    try: db.commit()
    except Exception: db.rollback(); raise HTTPException(status_code=409, detail="SKU already exists in this organization") from None
    db.refresh(item); return item


@app.get(f"{settings.api_prefix}/organizations/{{organization_id}}/invoices", response_model=list[InvoiceRead], tags=["erp"])
def list_invoices(organization_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    return db.scalars(select(Invoice).where(Invoice.organization_id == organization_id).order_by(Invoice.created_at.desc())).all()


@app.post(f"{settings.api_prefix}/organizations/{{organization_id}}/invoices", response_model=InvoiceRead, status_code=201, tags=["erp"])
def create_invoice(organization_id: int, payload: InvoiceCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_role(membership_for(db, user, organization_id), "owner", "admin", "manager", "sales")
    count = (db.scalar(select(func.count(Invoice.id)).where(Invoice.organization_id == organization_id)) or 0) + 1
    invoice = Invoice(organization_id=organization_id, number=f"INV-{count:05d}", **payload.model_dump())
    db.add(invoice); audit(db, "created", f"invoice:{invoice.number}", user, "Created invoice"); db.commit(); db.refresh(invoice)
    return invoice


@app.post(f"{settings.api_prefix}/organizations/{{organization_id}}/leave-requests", status_code=201, tags=["erp"])
def create_leave_request(organization_id: int, payload: LeaveRequestCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    if payload.end_date < payload.start_date: raise HTTPException(status_code=422, detail="End date must be on or after start date")
    leave = LeaveRequest(organization_id=organization_id, employee_id=user.id, **payload.model_dump())
    db.add(leave); audit(db, "created", f"leave:{leave.id}", user, "Created leave request"); db.commit(); db.refresh(leave)
    return {"id": leave.id, "status": leave.status}


@app.get(f"{settings.api_prefix}/organizations/{{organization_id}}/reports/sales.csv", tags=["reports"])
def export_sales_report(organization_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    output = io.StringIO(); writer = csv.writer(output)
    writer.writerow(["Order", "Customer", "Amount", "Status", "Created at"])
    for order in db.scalars(select(SalesOrder).where(SalesOrder.organization_id == organization_id).order_by(SalesOrder.created_at.desc())):
        writer.writerow([order.number, order.customer, order.amount, order.status, order.created_at.isoformat()])
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=elevate-sales-report.csv"})


@app.post(f"{settings.api_prefix}/organizations/{{organization_id}}/approvals", response_model=ApprovalRead, status_code=201, tags=["approvals"])
def create_approval(organization_id: int, payload: ApprovalCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    approval = ApprovalRequest(organization_id=organization_id, requested_by_id=user.id, **payload.model_dump())
    db.add(approval); db.flush(); audit(db, "created", f"approval:{approval.id}", user, "Created approval request")
    approvers = db.scalars(select(Membership).where(Membership.organization_id == organization_id, Membership.role.in_({"owner", "admin", "manager"}))).all()
    for approver in approvers: notify(db, approver.user_id, "Approval pending", approval.title, "approval")
    db.commit(); db.refresh(approval)
    return approval


@app.patch(f"{settings.api_prefix}/approvals/{{approval_id}}/decision", response_model=ApprovalRead, tags=["approvals"])
def decide_approval(approval_id: int, payload: ApprovalDecision, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    approval = db.get(ApprovalRequest, approval_id)
    if approval is None: raise HTTPException(status_code=404, detail="Approval request not found")
    membership = membership_for(db, user, approval.organization_id)
    if membership.role not in {"owner", "admin", "manager"}: raise HTTPException(status_code=403, detail="Manager permission required")
    approval.status, approval.approved_by_id, approval.decision_note = payload.decision, user.id, payload.note
    audit(db, payload.decision, f"approval:{approval.id}", user, "Approval decision recorded")
    notify(db, approval.requested_by_id, f"Approval {payload.decision}", approval.title, "approval")
    db.commit(); db.refresh(approval)
    return approval


@app.get(f"{settings.api_prefix}/organizations/{{organization_id}}/approvals", response_model=list[ApprovalRead], tags=["approvals"])
def list_approvals(organization_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    return db.scalars(select(ApprovalRequest).where(ApprovalRequest.organization_id == organization_id).order_by(ApprovalRequest.created_at.desc())).all()


@app.get(f"{settings.api_prefix}/notifications", response_model=list[NotificationRead], tags=["notifications"])
def notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(50)).all()


@app.patch(f"{settings.api_prefix}/notifications/{{notification_id}}/read", response_model=NotificationRead, tags=["notifications"])
def read_notification(notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != user.id: raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True; db.commit(); db.refresh(notification)
    return notification


@app.get(f"{settings.api_prefix}/organizations/{{organization_id}}/dashboard", response_model=DashboardSummary, tags=["dashboard"])
def dashboard_summary(organization_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    project_ids = select(Project.id).where(Project.organization_id == organization_id)
    test_run_ids = select(TestRun.id).where(TestRun.project_id.in_(project_ids))
    return DashboardSummary(organization_id=organization_id,
        projects=db.scalar(select(func.count(Project.id)).where(Project.organization_id == organization_id)) or 0,
        open_issues=db.scalar(select(func.count(Issue.id)).where(Issue.project_id.in_(project_ids), Issue.status != "done")) or 0,
        completed_issues=db.scalar(select(func.count(Issue.id)).where(Issue.project_id.in_(project_ids), Issue.status == "done")) or 0,
        active_test_runs=db.scalar(select(func.count(TestRun.id)).where(TestRun.project_id.in_(project_ids), TestRun.status == "active")) or 0,
        passed_tests=db.scalar(select(func.count(TestResult.id)).where(TestResult.test_run_id.in_(test_run_ids), TestResult.status == "passed")) or 0,
        failed_tests=db.scalar(select(func.count(TestResult.id)).where(TestResult.test_run_id.in_(test_run_ids), TestResult.status == "failed")) or 0,
        pending_approvals=db.scalar(select(func.count(ApprovalRequest.id)).where(ApprovalRequest.organization_id == organization_id, ApprovalRequest.status == "pending")) or 0,
        unread_notifications=db.scalar(select(func.count(Notification.id)).where(Notification.user_id == user.id, Notification.is_read.is_(False))) or 0)


@app.get(f"{settings.api_prefix}/organizations/{{organization_id}}/search", response_model=list[SearchResult], tags=["search"])
def global_search(organization_id: int, q: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    term = f"%{q.strip()}%"
    if not q.strip(): return []
    projects = db.scalars(select(Project).where(Project.organization_id == organization_id, Project.name.ilike(term)).limit(8)).all()
    issues = db.scalars(select(Issue).join(Project).where(Project.organization_id == organization_id, (Issue.title.ilike(term) | Issue.issue_key.ilike(term))).limit(12)).all()
    cases = db.scalars(select(TestCase).join(Project).where(Project.organization_id == organization_id, TestCase.title.ilike(term)).limit(8)).all()
    return ([SearchResult(kind="project", id=x.id, title=x.name, subtitle=x.key, href="/jira") for x in projects] +
            [SearchResult(kind="issue", id=x.id, title=x.title, subtitle=x.issue_key, href="/jira/board") for x in issues] +
            [SearchResult(kind="test_case", id=x.id, title=x.title, subtitle="Test case", href="/testrail/cases") for x in cases])[:20]


# Tenant-scoped compatibility endpoints used by the existing ERP screens.
@app.get(f"{settings.api_prefix}/organizations/{{organization_id}}/data/{{key}}", response_model=WorkspaceDataRead, tags=["workspace"])
def get_workspace_data(organization_id: int, key: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    record = db.scalar(select(WorkspaceData).where(WorkspaceData.organization_id == organization_id, WorkspaceData.key == key))
    if record is None: raise HTTPException(status_code=404, detail="No data saved for this module")
    return record


@app.put(f"{settings.api_prefix}/organizations/{{organization_id}}/data/{{key}}", response_model=WorkspaceDataRead, tags=["workspace"])
def save_workspace_data(organization_id: int, key: str, payload: WorkspaceDataWrite, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    record = db.scalar(select(WorkspaceData).where(WorkspaceData.organization_id == organization_id, WorkspaceData.key == key))
    if record is None: record = WorkspaceData(organization_id=organization_id, key=key, value=payload.value); db.add(record); event_action = "created"
    else: record.value = payload.value; event_action = "updated"
    audit(db, event_action, f"workspace:{organization_id}:{key}", user, "ERP workspace data saved"); db.commit(); db.refresh(record)
    return record


@app.get(f"{settings.api_prefix}/organizations/{{organization_id}}/audit/{{key}}", tags=["audit"])
def get_audit_events(organization_id: int, key: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership_for(db, user, organization_id)
    events = db.scalars(select(AuditEvent).where(AuditEvent.resource_key == f"workspace:{organization_id}:{key}").order_by(AuditEvent.created_at.desc()).limit(50)).all()
    return [{"id": event.id, "action": event.action, "actor": event.actor, "detail": event.detail, "created_at": event.created_at} for event in events]


@app.websocket(f"{settings.api_prefix}/notifications/ws")
async def notification_socket(socket: WebSocket, token: str):
    """A lightweight live channel. The client authenticates with its JWT query token."""
    from .auth import get_current_user
    from .database import SessionLocal
    from fastapi.security import HTTPAuthorizationCredentials
    db = SessionLocal()
    try:
        user = get_current_user(HTTPAuthorizationCredentials(scheme="Bearer", credentials=token), db)
        await notification_hub.connect(user.id, socket)
        while True: await socket.receive_text()
    except (WebSocketDisconnect, HTTPException):
        pass
    finally:
        if 'user' in locals(): notification_hub.disconnect(user.id, socket)
        db.close()
