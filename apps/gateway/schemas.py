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


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str    
