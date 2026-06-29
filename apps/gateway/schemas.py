from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr


class ContactModel(BaseModel):
    email: str | None = None
    phone: str | None = None
    address: str | None = None


class PatientCreate(BaseModel):
    model_config = {"extra": "ignore"}

    mrn: str
    first_name: str
    last_name: str
    birth_date: date | None = None
    sex: Literal["M", "F", "Other"] | None = None
    contact: ContactModel | None = None
    notes: str | None = None
    patient_metadata: Any | None = None


class PatientUpdate(PatientCreate):
    pass


class PatientResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    user_id: int
    mrn: str
    first_name: str
    last_name: str
    birth_date: date | None
    sex: str | None
    contact: ContactModel | None
    notes: str | None
    patient_metadata: Any | None
    created_at: datetime
    updated_at: datetime


class ProcessNoteRequest(BaseModel):
    raw_text: str
    session_id: str
    language: str = "fr"



class AnonymizeResponse(BaseModel):
    anonymized_text: str
    entities: list[dict]


class Article(BaseModel):
    pmid: str
    title: str
    abstract: str
    authors: list[str]
    publication_date: str | None = None
    doi: str | None = None



class AIGenerateResponse(BaseModel):
    summary: str
    recommendations: list[str]
    exercises: list[str]
    evidence_level: str
    sources: list[str]
    precautions: list[str]


class ProcessNoteResponse(BaseModel):
    session_id: str
    anonymized_text: str
    ai_response: AIGenerateResponse



class SummarizeNoteRequest(BaseModel):
    session_id: str
    anonymized_text: str
    language: str = "fr"


class SummarizeNoteResponse(BaseModel):
    session_id: str
    summary: str


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


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str    


class CreatePatientAccountRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    patient_id: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    role: str
    patient_id: str | None = None


class RegisterResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
