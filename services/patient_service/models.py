import uuid

from sqlalchemy import JSON, CheckConstraint, Column, Date, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func

try:
    from .database import Base
except ImportError:
    from database import Base


class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = (
        UniqueConstraint("user_id", "mrn", name="uq_patient_user_mrn"),
        CheckConstraint("sex IN ('M', 'F', 'Other')", name="ck_patient_sex"),
    )

    id = Column(String, primary_key=True, default=lambda: f"patient_{uuid.uuid4().hex}")
    user_id = Column(Integer, index=True, nullable=False)
    mrn = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    birth_date = Column(Date, nullable=True)
    sex = Column(String, nullable=True)
    contact = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    patient_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
