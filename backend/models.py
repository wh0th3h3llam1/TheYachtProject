from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String(100), nullable=False, index=True)
    anomaly_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="active")
    explanation = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
