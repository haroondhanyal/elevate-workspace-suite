# Elevate Workspace Suite

Elevate Workspace Suite is a unified operations platform that brings **ERP**, **Jira-style project delivery**, and **TestRail-style quality management** into one connected workspace. It gives leadership, delivery teams, QA, and operations teams one place to monitor work, resolve blockers, and prepare releases.

## Features

### Command Center

- Unified dashboard across ERP, Jira, and TestRail
- Workspace health, sprint delivery, release quality, and revenue indicators
- Release command view with story, test, failure, and blocker counts
- Priority queue, live cross-team activity, and connected-tool status
- Global workspace search and quick navigation with `Cmd/Ctrl + K`
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
- Branch and department management, approval-request workflow, and audit log
- Custom Odoo module that extends standard Odoo apps without changing Odoo core

### API and data

- FastAPI endpoints for workspace data, audit history, and health checks
- PostgreSQL persistence for saved data and audit events
- Firebase/browser-storage fallback for frontend-only development

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 19, Vite 8, modern CSS |
| UI | DM Sans and Manrope, responsive dashboard system, dark mode |
| API | FastAPI, SQLAlchemy, Pydantic Settings |
| Database | PostgreSQL 16 |
| ERP | Odoo 19 with custom Elevate addon |
| Infrastructure | Docker Compose |

## Run locally

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

## Environment configuration

Copy `.env.example` for frontend configuration. Use `VITE_ERP_API_URL` to connect the frontend to FastAPI. The API reads `backend/.env`; begin from `backend/.env.example`.

## Validate the frontend

```bash
npm run build
```

## Repository layout

```text
src/                                  React application and module pages
src/pages/WorkspaceHub.jsx             Cross-product Command Center
src/pages/jira/                        Project delivery workspace
src/pages/testrail/                    Quality-management workspace
src/pages/erp/                         Business and operations dashboards
backend/app/                           FastAPI application
backend/custom_addons/elevate_erp_core Odoo custom Elevate module
docker-compose.yml                     PostgreSQL, API, and Odoo services
```

## Repository note

The project uses the official Odoo Docker image for runtime. Only the custom `elevate_erp_core` addon is versioned; a local Odoo source checkout is intentionally excluded to keep the repository lightweight.
