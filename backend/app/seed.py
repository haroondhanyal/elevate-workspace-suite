"""Idempotent demo data for local development. Run: python -m app.seed"""
from datetime import date, timedelta

from sqlalchemy import select

from .auth import hash_password
from .database import SessionLocal
from .models import (
    ApprovalRequest, InventoryItem, Invoice, Issue, Membership, Organization,
    Project, SalesOrder, TestCase, TestResult, TestRun, User, WorkspaceData,
)

WORKSPACES = [
    ("Elevate Demo", "elevate-demo", "ELV", "Elevate Platform"),
    ("Product Studio", "product-studio", "PRD", "Product Experience"),
    ("Platform Engineering", "platform-engineering", "ENG", "Cloud Platform"),
    ("Quality Lab", "quality-lab", "QLT", "Quality Engineering"),
    ("Customer Operations", "customer-operations", "OPS", "Customer Operations"),
]

ISSUE_TITLES = [
    "Create an accessible account registration flow", "Add password reset email delivery", "Improve mobile navigation menu", "Connect dashboard metrics to live data", "Add project filtering and sorting", "Build sprint velocity report", "Add issue assignment and reviewer controls", "Reduce initial page bundle size", "Add CSV export for release reports", "Improve empty states across modules", "Link acceptance criteria to test cases", "Add audit history to approval decisions", "Support keyboard navigation in dialogs", "Add workspace member role management", "Resolve checkout regression on Safari",
]
CASE_TITLES = [
    "A new user can register with valid details", "An existing email receives a duplicate account message", "A user can sign in with valid credentials", "Invalid credentials show a safe error", "A user can request a password reset", "Expired reset links cannot change passwords", "Password visibility toggle changes input type", "Contact number saves with selected country code", "Profile photo upload accepts supported image types", "Profile photo upload rejects oversized files", "Workspace owner can invite a teammate", "Invitation can only be used once", "Member cannot open another workspace record", "Manager can approve a pending request", "Completed approval cannot be decided twice", "Jira issue appears in the correct board column", "Test case links to a Jira issue", "RTM export contains requirement coverage", "Search filters matching workspace records", "Mobile layout keeps primary actions visible",
]
STORY_TITLES = [
    "As a user, I want to create an account", "As a user, I want to recover my password", "As a teammate, I want to join by invitation", "As an owner, I want to manage workspace roles", "As a user, I want to switch workspaces", "As a planner, I want to create Jira projects", "As a developer, I want to manage sprint issues", "As a reviewer, I want to approve a request", "As a QA engineer, I want to create test cases", "As a QA engineer, I want to record test results", "As a product lead, I want requirement traceability", "As a user, I want to export reports", "As a user, I want profile photo controls", "As a user, I want my contact details saved", "As a manager, I want live notifications", "As an admin, I want an audit trail", "As a teammate, I want search across records", "As a user, I want a responsive mobile workspace", "As a QA engineer, I want to attach evidence", "As an owner, I want to review workspace activity",
]


def upsert_workspace_data(db, organization_id: int, key: str, value):
    row = db.scalar(select(WorkspaceData).where(WorkspaceData.organization_id == organization_id, WorkspaceData.key == key))
    if row is None:
        db.add(WorkspaceData(organization_id=organization_id, key=key, value=value))
    else:
        row.value = value


def build_tasks(workspace_name: str):
    tasks = [
        "Review the current sprint goals", "Update the launch checklist", "Prepare product release notes", "Validate the signup experience", "Review open customer feedback",
        "Draft acceptance criteria for account settings", "Check responsive dashboard spacing", "Confirm the payment error states", "Review accessibility contrast", "Update API integration notes",
        "Plan regression coverage for this release", "Verify invitation email copy", "Recheck the task creation flow", "Review project board priorities", "Prepare the stakeholder demo",
        "Triage reported browser issues", "Confirm profile image upload limits", "Update requirements traceability", "Review pending approval requests", "Export the monthly sales report",
        "Check notification delivery status", "Organize the workspace help articles", "Review test evidence attachments", "Confirm mobile navigation behavior", "Share sprint review outcomes",
    ]
    return [{"id": f"{workspace_name[:3].upper()}-TASK-{index + 1:03}", "title": title, "project": workspace_name, "person": ["RH", "AK", "SM", "YK", "JM"][index % 5], "due": ["Today", "Tomorrow", "Oct 10", "Oct 12", "Oct 15"][index % 5], "priority": ["High", "Normal", "Normal", "Low", "High"][index % 5], "done": index in {3, 8, 14, 19}} for index, title in enumerate(tasks)]


def seed_workspace(db, admin: User, workspace):
    name, slug, key, project_name = workspace
    organization = db.scalar(select(Organization).where(Organization.slug == slug))
    if organization is None:
        organization = Organization(name=name, slug=slug)
        db.add(organization); db.flush()
    elif organization.name != name:
        organization.name = name

    membership = db.scalar(select(Membership).where(Membership.user_id == admin.id, Membership.organization_id == organization.id))
    if membership is None:
        db.add(Membership(user_id=admin.id, organization_id=organization.id, role="owner"))
    else:
        membership.role = "owner"

    project = db.scalar(select(Project).where(Project.organization_id == organization.id, Project.key == key))
    if project is None:
        project = Project(organization_id=organization.id, name=project_name, key=key, description="Product delivery project")
        db.add(project); db.flush()
    elif project.name != project_name:
        project.name = project_name

    issues = []
    issue_statuses = ["todo", "in_progress", "in_review", "done", "todo"]
    priorities = ["high", "medium", "medium", "low", "high"]
    for index, title in enumerate(ISSUE_TITLES, start=1):
        issue_key = f"{key}-{index}"
        issue = db.scalar(select(Issue).where(Issue.issue_key == issue_key))
        fields = dict(title=title, description=f"Demo issue {issue_key} for {name}. Confirm the behavior, document acceptance criteria and keep the delivery record linked to QA.", issue_type=["story", "task", "bug"][index % 3], status=issue_statuses[index % len(issue_statuses)], priority=priorities[index % len(priorities)], reporter_id=admin.id, assignee_id=admin.id, sprint="Sprint 08")
        if issue is None:
            issue = Issue(project_id=project.id, issue_key=issue_key, **fields)
            db.add(issue); db.flush()
        else:
            for field, value in fields.items(): setattr(issue, field, value)
        issues.append(issue)

    cases = []
    for index, title in enumerate(CASE_TITLES, start=1):
        case_title = f"{key} · {title}"
        case = db.scalar(select(TestCase).where(TestCase.project_id == project.id, TestCase.title == case_title))
        if case is None and slug == "elevate-demo" and index == 20:
            case = db.scalar(select(TestCase).where(TestCase.project_id == project.id, TestCase.title == "Release workflow is traceable"))
        fields = dict(preconditions="A demo workspace is available and the user has the required role.", steps=[{"action": "Open the relevant workspace screen", "expected": "The screen is available to the current user"}, {"action": f"Perform scenario {index:02}", "expected": "The expected result is saved and visible"}], expected_result=f"{title}. The result and linked delivery record are visible to the authorized workspace team.", priority=["high", "medium", "low"][index % 3], linked_issue_id=issues[(index - 1) % len(issues)].id)
        if case is None:
            case = TestCase(project_id=project.id, title=case_title, **fields)
            db.add(case); db.flush()
        else:
            for field, value in fields.items(): setattr(case, field, value)
        cases.append(case)

    run_names = ["Sprint 08 regression", "Account and access smoke suite", "Release readiness verification"]
    result_statuses = ["passed", "passed", "passed", "passed", "passed", "passed", "passed", "passed", "passed", "passed", "passed", "passed", "passed", "failed", "failed", "blocked", "retest", "untested", "untested", "passed"]
    for run_index, run_name in enumerate(run_names):
        full_run_name = f"{name} · {run_name}"
        run = db.scalar(select(TestRun).where(TestRun.project_id == project.id, TestRun.name == full_run_name))
        if run is None and slug == "elevate-demo" and run_index == 0:
            run = db.scalar(select(TestRun).where(TestRun.project_id == project.id, TestRun.name == "Release 1.0 regression"))
        if run is None:
            run = TestRun(project_id=project.id, name=full_run_name, description=f"Seeded QA run with 20 linked cases for {project_name}.", status="active")
            db.add(run); db.flush()
        else:
            run.name = full_run_name
            run.description = f"Seeded QA run with 20 linked cases for {project_name}."
        for index, case in enumerate(cases):
            result = db.scalar(select(TestResult).where(TestResult.test_run_id == run.id, TestResult.test_case_id == case.id))
            result_status = result_statuses[(index + run_index * 3) % len(result_statuses)]
            if result is None:
                result = TestResult(test_run_id=run.id, test_case_id=case.id, status=result_status, comment="Seeded demo result. Replace with a live execution result.", tested_by_id=admin.id)
                db.add(result)
            else:
                result.status = result_status

    stories = [{"id": f"{key}-US-{index:03}", "title": title, "epic": ["Account", "Delivery", "Quality", "Reporting", "Workspace"][index % 5], "priority": ["High", "Normal", "Low"][index % 3], "tests": index % 7, "status": ["Ready", "In development", "Needs tests"][index % 3], "evidence": {}} for index, title in enumerate(STORY_TITLES, start=1)]
    ui_cases = [{"id": f"{key}-TC-{index:03}", "title": title, "suite": ["Accounts", "Workspace", "Delivery", "Checkout", "Reporting"][index % 5], "priority": ["High", "Normal", "Low"][index % 3], "status": ["Passed", "Passed", "Passed", "Failed", "Blocked", "Not run"][index % 6], "owner": ["RH", "AK", "SM", "YK", "JM"][index % 5], "evidence": {}} for index, title in enumerate(CASE_TITLES, start=1)]
    uat_cases = [{"id": f"{key}-UAT-{index:03}", "title": title.replace("A user", "A workspace user").replace("As a ", "A "), "area": ["Accounts", "Projects", "Quality", "Approvals", "Reporting"][index % 5], "status": ["Ready for UAT", "In review", "Approved", "Approved"][index % 4], "owner": ["Raja Haroon", "Aisha Khan", "Sarah Malik", "Yusuf Khan"][index % 4], "evidence": {}} for index, title in enumerate(CASE_TITLES, start=1)]
    rtm_rows = [{"req": f"{key}-REQ-{index:03}", "title": STORY_TITLES[index - 1], "source": f"User story {stories[index - 1]['id']}", "tests": stories[index - 1]["tests"], "coverage": ["100%", "100%", "75%", "50%", "0%"][index % 5], "status": ["Covered", "Covered", "Partial", "Missing"][index % 4], "evidence": {}} for index in range(1, 21)]
    upsert_workspace_data(db, organization.id, "tasks", build_tasks(name))
    upsert_workspace_data(db, organization.id, "testrail-cases", ui_cases)
    upsert_workspace_data(db, organization.id, "testrail-uat-cases", uat_cases)
    upsert_workspace_data(db, organization.id, "testrail-stories", stories)
    upsert_workspace_data(db, organization.id, "testrail-rtm", rtm_rows)

    for index in range(1, 5):
        title = [f"Approve {project_name} release readiness", "Review annual tool renewal", "Approve cross-team access request", "Review customer launch plan"][index - 1]
        approval = db.scalar(select(ApprovalRequest).where(ApprovalRequest.organization_id == organization.id, ApprovalRequest.title == title))
        if approval is None and slug == "elevate-demo" and index == 1:
            approval = db.scalar(select(ApprovalRequest).where(ApprovalRequest.organization_id == organization.id, ApprovalRequest.title == "Approve Release 1.0"))
        if approval is None:
            db.add(ApprovalRequest(organization_id=organization.id, title=title, category=["release", "purchase", "access", "operations"][index - 1], amount=[None, 12800, None, 4200][index - 1], status="pending" if index % 3 else "approved", requested_by_id=admin.id, approved_by_id=admin.id if index % 3 == 0 else None, decision_note="Seeded example approval" if index % 3 == 0 else ""))
        else:
            approval.title = title
            approval.category = ["release", "purchase", "access", "operations"][index - 1]
            approval.amount = [None, 12800, None, 4200][index - 1]

    for index in range(1, 16):
        number = f"{key}-SO-{1000 + index}"
        if db.scalar(select(SalesOrder).where(SalesOrder.number == number)) is None:
            db.add(SalesOrder(organization_id=organization.id, number=number, customer=["Northstar Labs", "Cedar & Co.", "Orbit Systems", "Bluebird Retail", "Summit Works"][index % 5], amount=round(850 + index * 437.5, 2), status=["confirmed", "draft", "sent", "confirmed", "cancelled"][index % 5], created_by_id=admin.id))
    for index in range(1, 11):
        sku = f"{key}-SKU-{index:03}"
        item = db.scalar(select(InventoryItem).where(InventoryItem.organization_id == organization.id, InventoryItem.sku == sku))
        if item is None:
            db.add(InventoryItem(organization_id=organization.id, sku=sku, name=["Laptop dock", "Wireless keyboard", "Test device", "USB-C hub", "Monitor stand"][index % 5], quantity=48 - index * 3, reorder_level=12))
        if index <= 8:
            number = f"{key}-INV-{2000 + index}"
            if db.scalar(select(Invoice).where(Invoice.number == number)) is None:
                db.add(Invoice(number=number, organization_id=organization.id, customer=["Northstar Labs", "Cedar & Co.", "Orbit Systems", "Bluebird Retail"][index % 4], amount=round(1350 + index * 215, 2), due_date=date.today() + timedelta(days=index * 3), status=["draft", "sent", "paid", "overdue"][index % 4]))
    db.flush()
    return {"organization": name, "tasks": 25, "issues": len(issues), "cases": len(cases), "uat": len(uat_cases), "stories": len(stories), "requirements": len(rtm_rows), "runs": len(run_names)}


def main():
    db = SessionLocal()
    try:
        admin = db.scalar(select(User).where(User.email == "admin@elevate.local"))
        if admin is None:
            admin = User(email="admin@elevate.local", full_name="Raja Haroon", password_hash=hash_password("ChangeMe123!"), mobile="+923001234567")
            db.add(admin); db.flush()
        report = [seed_workspace(db, admin, workspace) for workspace in WORKSPACES]
        db.commit()
        print("Seeded 5 demo workspaces. Admin: admin@elevate.local / ChangeMe123! (change this password).")
        for row in report:
            print(f"{row['organization']}: {row['tasks']} tasks, {row['issues']} Jira issues, {row['cases']} test cases, {row['uat']} UAT cases, {row['stories']} stories, {row['requirements']} requirements, {row['runs']} test runs")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
