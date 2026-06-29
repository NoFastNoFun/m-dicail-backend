import re
from pydantic import BaseModel, EmailStr, field_validator
from enum import Enum


class UserRole(str, Enum):
    PRATICIEN = "PRATICIEN"
    PATIENT = "PATIENT"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Le mot de passe doit contenir au moins une majuscule")
        if not re.search(r"[a-z]", v):
            raise ValueError("Le mot de passe doit contenir au moins une minuscule")
        if not re.search(r"\d", v):
            raise ValueError("Le mot de passe doit contenir au moins un chiffre")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Le mot de passe doit contenir au moins un caractère spécial")
        return v


class CreatePatientAccountRequest(BaseModel):
    """Créé par un PRATICIEN pour donner accès app à un patient existant"""
    email: EmailStr
    password: str
    full_name: str | None = None
    patient_id: str 


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    role: UserRole
    patient_id: str | None = None

    model_config = {"from_attributes": True}


class RegisterResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
