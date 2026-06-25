import uuid

from sqlalchemy import JSON, CheckConstraint, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

try:
    from .database import Base
except ImportError:
    from database import Base


class RecordingSession(Base):
    __tablename__ = "recording_sessions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'recording', 'completed', 'failed')",
            name="ck_session_status",
        ),
    )

    id = Column(String, primary_key=True, default=lambda: f"recording_{uuid.uuid4().hex}")
    user_id = Column(Integer, index=True, nullable=False)
    patient_id = Column(String, index=True, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False, default="recording")
    transcript = Column(Text, nullable=True)
    soap_note = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
