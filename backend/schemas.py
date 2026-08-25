from datetime import datetime
from typing import Literal

from pydantic import BaseModel

Severity = Literal["low", "medium", "high", "critical"]
AlertStatus = Literal["active", "acknowledged", "resolved"]


class AlertBase(BaseModel):
    camera_id: str
    anomaly_type: str
    severity: Severity
    confidence: float
    status: AlertStatus
    explanation: str
    recommended_action: str


class AlertCreate(AlertBase):
    pass


class AlertRead(AlertBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SimulateDetectionRequest(BaseModel):
    camera_id: str
    anomaly_type: str
    confidence: float


class AlertStatusUpdate(BaseModel):
    status: AlertStatus


class HealthResponse(BaseModel):
    status: str


class ErrorResponse(BaseModel):
    detail: str
