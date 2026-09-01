# Elevate Workspace Suite — ERP Connected Workflow

```mermaid
flowchart LR
    U[Users: Admin · Manager · Developer · QA · Sales] --> FE[React + Vite PWA]
    FE -->|JWT / REST| API[FastAPI API]
    FE <-->|Live notifications| WS[WebSocket channel]
    API --> AUTH[Authentication + RBAC]
    API --> PG[(PostgreSQL)]
    API --> FILES[Persistent uploads volume]
    API --> SMTP[SMTP provider]
    API --> ODOO[Odoo ERP + Elevate Core addon]

    subgraph Delivery
      JIRA[Projects · Issues · Board · Comments]
      QA[Test cases · Runs · Results · Evidence]
      TRACE[Traceability: requirement → issue → test → defect]
      JIRA --> TRACE --> QA
    end

    subgraph Business ERP
      SALES[Sales orders · Invoices]
      INV[Inventory]
      HR[Leave requests]
      APPROVAL[Approval requests · Audit]
      SALES --> APPROVAL
      HR --> APPROVAL
    end

    API --> Delivery
    API --> Business ERP
    PG --> DASH[Dashboard · Search · CSV reports]
    DASH --> FE
```

## Runtime URLs

| Component | Local URL |
| --- | --- |
| React app | `http://127.0.0.1:5174/` |
| FastAPI health | `http://127.0.0.1:8000/health` |
| FastAPI OpenAPI docs | `http://127.0.0.1:8000/docs` |
| Odoo | `http://127.0.0.1:8069/` |

Production deploys the React bundle to Vercel/Netlify and the API/PostgreSQL/Odoo stack to a Docker-capable host. Configure SMTP and a production secret through environment variables; never commit credentials.
