from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class SoapNote(BaseModel):
    subjective: str | None = None
    objective: str | None = None
    assessment: str | None = None
    plan: str | None = None


class SessionCreate(BaseModel):
    model_config = {"extra": "ignore"}

    started_at: datetime | None = None
    status: Literal["draft", "recording", "completed", "failed"] | None = "recording"
    transcript: str | None = None
    patient_id: str | None = None


class SessionUpdate(BaseModel):
    model_config = {"extra": "ignore"}

    ended_at: datetime | None = None
    status: Literal["draft", "recording", "completed", "failed"] | None = None
    transcript: str | None = None
    soap_note: SoapNote | None = None
    summary: str | None = None
    patient_id: str | None = None


class SessionPatientUpdate(BaseModel):
    patient_id: str


class SessionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    user_id: int
    patient_id: str | None
    started_at: datetime | None
    ended_at: datetime | None
    status: str
    transcript: str | None
    soap_note: SoapNote | None
    summary: str | None
    created_at: datetime
    updated_at: datetime
