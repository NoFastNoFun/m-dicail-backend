import enum
from sqlalchemy import Column, DateTime, Enum, Integer, String
from sqlalchemy.sql import func

try:
    from .database import Base
except ImportError:
    from database import Base


class UserRole(str, enum.Enum):
    PRATICIEN = "PRATICIEN"
    PATIENT = "PATIENT"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(
        Enum(UserRole, native_enum=False),
        nullable=False,
        default=UserRole.PRATICIEN,
    )
    patient_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    
