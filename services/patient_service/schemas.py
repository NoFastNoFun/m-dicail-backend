from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, field_validator


class ContactModel(BaseModel):
    email: str | None = None
    phone: str | None = None
    address: str | None = None

    @field_validator("email", "phone", "address", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if v == "":
            return None
        return v


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

    @field_validator("notes", mode="before")
    @classmethod
    def empty_notes_to_none(cls, v):
        if v == "":
            return None
        return v


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
    contact: Any | None
    notes: str | None
    patient_metadata: Any | None
    created_at: datetime
    updated_at: datetime
