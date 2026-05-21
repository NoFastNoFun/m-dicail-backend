from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

try:
    from .database import Base
except ImportError:
    from database import Base


class Protocol(Base):
    __tablename__ = "protocols"

    id = Column(Integer, primary_key=True, index=True)
    pathology = Column(String, nullable=False, index=True)
    phase = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    source = Column(String, nullable=False)
    publication_year = Column(Integer, nullable=False)
    evidence_level = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
