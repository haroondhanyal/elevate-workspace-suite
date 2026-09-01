from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .database import Base, engine, get_db
from .models import AuditEvent, WorkspaceData
from .schemas import HealthRead, WorkspaceDataRead, WorkspaceDataWrite

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "PUT", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health", response_model=HealthRead, tags=["system"])
def health_check():
    return {"status": "ok", "service": settings.app_name}


@app.get(f"{settings.api_prefix}/data/{{key}}", response_model=WorkspaceDataRead, tags=["workspace"])
def get_workspace_data(key: str, db: Session = Depends(get_db)):
    record = db.get(WorkspaceData, key)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No data saved for this module")
    return record


@app.put(f"{settings.api_prefix}/data/{{key}}", response_model=WorkspaceDataRead, tags=["workspace"])
def save_workspace_data(key: str, payload: WorkspaceDataWrite, db: Session = Depends(get_db)):
    record = db.get(WorkspaceData, key)
    if record is None:
        record = WorkspaceData(key=key, value=payload.value)
        db.add(record)
        event_action = "created"
    else:
        record.value = payload.value
        event_action = "updated"
    db.add(AuditEvent(action=event_action, resource_key=key, actor=payload.actor, detail="ERP workspace data saved"))
    db.commit()
    db.refresh(record)
    return record


@app.get(f"{settings.api_prefix}/audit/{{key}}", tags=["audit"])
def get_audit_events(key: str, db: Session = Depends(get_db)):
    events = db.scalars(select(AuditEvent).where(AuditEvent.resource_key == key).order_by(AuditEvent.created_at.desc()).limit(50)).all()
    return [{"id": event.id, "action": event.action, "actor": event.actor, "detail": event.detail, "created_at": event.created_at} for event in events]
