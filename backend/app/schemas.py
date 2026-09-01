from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WorkspaceDataWrite(BaseModel):
    value: Any = Field(description="Persisted module data; normally a list of ERP records")
    actor: str = Field(default="Raja Haroon", max_length=120)


class WorkspaceDataRead(BaseModel):
    key: str
    value: Any
    updated_at: datetime | None = None


class HealthRead(BaseModel):
    status: str
    service: str
