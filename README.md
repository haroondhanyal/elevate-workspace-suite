<p align="center">
  <img src="./public/elevate-logo.svg" alt="Elevate Workspace" width="360" />
</p>

<h1 align="center">Elevate Workspace</h1>

<p align="center">One connected workspace for delivery, quality, and business operations.</p>

Elevate brings project delivery, software quality, and ERP operations together. Teams can track work, connect requirements to tests, manage operational workflows, and monitor release readiness from one suite.

## Contents

- [What’s inside](#whats-inside)
- [Technology](#technology)
- [Product journey](#product-journey)
- [Demo workspaces and data](#demo-workspaces-and-data)
- [Screenshots](#screenshots)
- [Feature status and next improvements](#feature-status-and-next-improvements)
- [Get started](#get-started)
- [Environment configuration](#environment-configuration)
- [Project structure](#project-structure)

## What’s inside

| Workspace | What it helps with | Main route |
| --- | --- | --- |
| Command Center | Workspace health, priorities, release readiness, and cross-team activity | `/workspace` |
| Jira workspace | Projects, issues, sprint planning, and personal tasks | `/jira` |
| TestRail workspace | Test cases, UAT, user stories, and requirement coverage | `/testrail` |
| ERP workspace | Sales, finance, inventory, people, and operational workflows | `/erp` |

## Features

### Command Center

- Unified dashboard across ERP, Jira, and TestRail
- Workspace health, sprint delivery, release quality, and revenue indicators
- Release command view with story, test, failure, and blocker counts
- Priority queue, live cross-team activity, and connected-tool status
- Global workspace search and quick navigation with `Cmd/Ctrl + K`
- Multi-workspace switching, member directory, role-based invitations, and invitation acceptance
- Reconnecting live notifications and one-click sales CSV export
- Responsive desktop and mobile experience

### Project delivery (Jira workspace)

- Project dashboard with open issues, active sprints, completion, and project health
- Scrum board, sprint tracking, project creation, and customization
- Personal tasks, inbox, profile, media library, help center, theme settings, and dark mode

### Quality management (TestRail workspace)

- Test case, UAT, user story, and requirements traceability matrix (RTM) modules
- Regression run progress, pass/fail/coverage metrics, and QA activity
- Test evidence attachments, case actions, and release health in the Command Center

### ERP operations

- Revenue, orders, employees, invoices, priorities, and executive reporting dashboard
- CRM, sales, purchasing, inventory, finance, HR, approvals, customer support, manufacturing, quality, maintenance, and expenses
- Approval center backed by workspace requests, manager decisions, and decision notes
- Branch and department management, approval-request workflow, and audit log
- Custom Odoo module that extends standard Odoo apps without changing Odoo core

### API and data

- JWT authentication, organization-scoped roles, projects, issues, test runs, approvals, notifications and audit events
- Private authenticated uploads, password recovery, login throttling, security headers, and workspace invitations
- PostgreSQL persistence through versioned Alembic migrations
- OpenAPI documentation at `/docs` and a typed dashboard summary/global-search API
- Firebase/browser-storage fallback for frontend-only development
- Lazy-loaded route bundles to keep the initial application bundle smaller

## Product journey

1. **Create an account** at `/signup`. The form supports name, organization, age, country code and phone, optional profile image, and password confirmation. Password visibility controls and field validation help prevent common input mistakes.
2. **Sign in** at `/login`. Password reset starts at `/reset-password`; when the API and SMTP are configured, recovery is delivered by email. In development without SMTP, the API returns a reset link for local use.
3. **Open the Command Center** at `/` or `/workspace`. It brings workspace health, priorities, activity, release readiness, and navigation together.
4. **Switch workspace** from the workspace selector. The seeded demo account belongs to all five sample organizations. Workspace settings at `/settings/workspace` lets owners manage members and invitations; recipients join through `/accept-invitation`.
5. **Plan delivery in Jira** at `/jira`: review projects, use the Scrum board, create projects, and manage personal tasks and inbox items.
6. **Verify quality in TestRail** at `/testrail`: review test runs, execute cases, track UAT and stories, then inspect requirement coverage in the RTM.
7. **Coordinate operations in ERP** at `/erp`: review business summaries and explore sales, inventory, finance, people, approvals, and other operational areas.
8. **Manage the account and get help** through profile settings, notifications, Help Center, Terms, and Privacy pages.

Use the seeded local login shown under [Database migrations and demo data](#database-migrations-and-demo-data). On a fresh installation, signup can also create a separate account. Route access and available actions depend on membership role.

## Demo workspaces and data

The seed script creates these five sample workspaces and grants the local demo admin owner access in each one:

| Workspace | Project | Key |
| --- | --- | --- |
| Elevate Demo | Elevate Platform | ELV |
| Product Studio | Product Experience | PRD |
| Platform Engineering | Cloud Platform | ENG |
| Quality Lab | Quality Engineering | QLT |
| Customer Operations | Customer Operations | OPS |

Each seeded workspace receives 25 personal task records, 15 Jira issues, 20 linked relational test cases, 3 test runs with 20 results apiece, 20 UAT records, 20 user stories, 20 RTM requirements, 4 approval requests, 15 sales orders, 10 inventory items, and 8 invoices. The frontend demo fallback also includes populated task and quality-management lists for trying screens without an API connection. Seed reruns update matching demo records rather than intentionally adding another copy.

The dashboard and TestRail counts are derived from available records when connected to the API; modules backed by local/demo state may show their own sample data. The seed is starter content for exploration and should be replaced with real organization data before operational use.

## Screenshots

Fresh screenshots below show the current app pages and populated demo UI. They are product previews, not production customer data.

### Account access and command center

| Sign up | Login | Command Center |
| --- | --- | --- |
| ![Sign up page](docs/screenshots/01-sign-up.png) | ![Login page](docs/screenshots/02-login.png) | ![Command Center](docs/screenshots/03-command-center.png) |

### Delivery and quality

| My tasks | Jira dashboard | Scrum board |
| --- | --- | --- |
| ![My tasks](docs/screenshots/04-my-tasks.png) | ![Jira dashboard](docs/screenshots/05-jira-dashboard.png) | ![Scrum board](docs/screenshots/06-scrum-board.png) |

| TestRail overview | Test cases | UAT cases |
| --- | --- | --- |
| ![TestRail overview](docs/screenshots/07-testrail-overview.png) | ![Test cases](docs/screenshots/08-test-cases.png) | ![UAT cases](docs/screenshots/09-uat-cases.png) |

| User stories | Requirements traceability |
| --- | --- |
| ![User stories](docs/screenshots/10-user-stories.png) | ![Requirements traceability matrix](docs/screenshots/11-requirements-matrix.png) |

### Business operations and account support

| ERP overview | Sales | Inventory |
| --- | --- | --- |
| ![ERP overview](docs/screenshots/12-erp-overview.png) | ![Sales](docs/screenshots/13-sales.png) | ![Inventory](docs/screenshots/14-inventory.png) |

| Profile settings | Help Center | Privacy | Approval Center |
| --- | --- | --- | --- |
| ![Profile settings](docs/screenshots/15-profile-settings.png) | ![Help Center](docs/screenshots/16-help-center.png) | ![Privacy page](docs/screenshots/17-privacy.png) | ![Approval Center](docs/screenshots/18-approval-center.png) |

## Feature status and next improvements

### Implemented in this repository

- React multi-screen app with signup/login, password reset screens, protected app areas, workspace switching, profile, help, legal pages, notifications, and responsive layouts.
- FastAPI authentication and organization-scoped membership, role checks, PostgreSQL persistence, Alembic migrations, invitation lifecycle, project/issues, test cases/runs/results, approvals, and audit events.
- Five-workspace deterministic demo seed with linked Jira and QA data, plus frontend-only fallback lists for browsing without an API.
- Jira project/sprint experiences, TestRail-style QA screens, ERP dashboards/modules, and the custom Odoo addon included in this repository.

### Configure or extend before production use

- Configure a production database, unique JWT secret, allowed origins, HTTPS, backups, monitoring, and a deployment pipeline; never use the seeded demo credentials outside local development.
- Set up SMTP and verify password reset and invitation delivery end to end. The UI/API support those flows, but delivery depends on valid mail configuration.
- Add an external identity provider only if needed; OAuth/SSO provider integration is not included as a configured login option.
- Review which ERP pages use persistent API records versus frontend sample/demo state before relying on them as an authoritative system of record.
- Add organization-specific retention, privacy, access-review, and audit policies, plus real customer/product data import and reporting rules.

Frontend-only mode is useful for exploring screens; API-backed sign-in and persistence require PostgreSQL and the API to be running. The screenshots capture the local frontend demo state and do not claim the backend seed was executed in this environment.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 19, Vite 8, modern CSS |
| UI | DM Sans and Manrope, responsive dashboard system, dark mode |
| API | FastAPI, SQLAlchemy, Pydantic Settings |
| Database | PostgreSQL 16 |
| ERP | Odoo 19 with custom Elevate addon |
| Infrastructure | Docker Compose |

## Get started

### Frontend only

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The default route opens the Command Center.

### Full stack

```bash
docker compose up --build
```

In a second terminal:

```bash
npm run dev
```

| Service | URL |
| --- | --- |
| Command Center | `http://127.0.0.1:5173/` |
| ERP dashboard | `http://127.0.0.1:5173/erp` |
| Jira workspace | `http://127.0.0.1:5173/jira` |
| TestRail workspace | `http://127.0.0.1:5173/testrail` |
| API documentation | `http://localhost:8000/docs` |
| Odoo | `http://localhost:8069` |

Create/select the `elevate_erp` database in Odoo, then install **Elevate ERP Core** from Apps.

### Database migrations and demo data

The API container applies the latest Alembic migration before it starts. For a local backend outside Docker:

```bash
cd backend
alembic upgrade head
python -m app.seed
```

The migrations add profile/security fields, login attempt tracking, and workspace invitations. Invitation delivery needs SMTP configured; without SMTP, development mode returns a shareable invitation URL in the People & access screen. Invitations expire after seven days. Manage members at `/settings/workspace`; accept an invitation at `/accept-invitation`.

The seed command is idempotent and creates `admin@elevate.local` with password `ChangeMe123!` for local development only. Change or remove this account before deployment.

The FastAPI OpenAPI page documents every endpoint, request body, authentication requirement and response at `http://localhost:8000/docs`. Protected requests use `Authorization: Bearer <access_token>`; the frontend saves this token only after a successful login.

## Environment configuration

Copy `.env.example` to the repository root as `.env` before starting Docker Compose. It configures the database, API secret, CORS origins and optional SMTP delivery. Change the example database password and secret before deployment; production mode rejects the sample credentials and requires SMTP for password recovery.

For the frontend, set `VITE_ERP_API_URL` to the FastAPI base path, such as `http://localhost:8000/api/v1`. When running FastAPI outside Docker, copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` to a database reachable from your host machine.

## Validate the frontend

```bash
npm run build
```

The backend test suite lives in `backend/tests` and needs the backend dependencies from `backend/requirements.txt` installed in the Python environment.

## Project structure

```text
src/                                  React application and module pages
src/pages/WorkspaceHub.jsx             Cross-product Command Center
src/pages/jira/                        Project delivery workspace
src/pages/testrail/                    Quality-management workspace
src/pages/erp/                         Business and operations dashboards
backend/app/                           FastAPI application
backend/custom_addons/elevate_erp_core Odoo custom Elevate module
docker-compose.yml                     PostgreSQL, API, and Odoo services
docs/erp-architecture.md               Full connected ERP workflow diagram
```

## Repository note

The project uses the official Odoo Docker image for runtime. Only the custom `elevate_erp_core` addon is versioned; a local Odoo source checkout is intentionally excluded to keep the repository lightweight.
