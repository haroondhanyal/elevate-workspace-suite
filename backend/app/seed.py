"""Idempotent development seed. Run: python -m app.seed"""
from sqlalchemy import select

from .auth import hash_password
from .database import SessionLocal
from .models import ApprovalRequest, Issue, Membership, Organization, Project, TestCase, TestResult, TestRun, User


def main():
    db = SessionLocal()
    try:
        if db.scalar(select(User).where(User.email == "admin@elevate.local")):
            print("Seed data already exists."); return
        admin = User(email="admin@elevate.local", full_name="Elevate Admin", password_hash=hash_password("ChangeMe123!"))
        org = Organization(name="Elevate Demo", slug="elevate-demo")
        db.add_all([admin, org]); db.flush(); db.add(Membership(user_id=admin.id, organization_id=org.id, role="owner"))
        project = Project(organization_id=org.id, name="Elevate Platform", key="ELV", description="Connected delivery demo")
        db.add(project); db.flush()
        issue = Issue(project_id=project.id, issue_key="ELV-1", title="Connect release workflow", description="Requirement through QA and approval.", issue_type="story", status="in_progress", priority="high", reporter_id=admin.id, assignee_id=admin.id, sprint="Sprint 1")
        db.add(issue); db.flush()
        case = TestCase(project_id=project.id, title="Release workflow is traceable", steps=[{"action": "Create issue", "expected": "Issue is linked"}], expected_result="Traceability is visible", linked_issue_id=issue.id)
        run = TestRun(project_id=project.id, name="Release 1.0 regression")
        db.add_all([case, run]); db.flush()
        db.add_all([TestResult(test_run_id=run.id, test_case_id=case.id, status="passed", tested_by_id=admin.id), ApprovalRequest(organization_id=org.id, title="Approve Release 1.0", category="release", requested_by_id=admin.id)])
        db.commit(); print("Seeded admin@elevate.local / ChangeMe123! (change this password).")
    finally: db.close()


if __name__ == "__main__": main()
