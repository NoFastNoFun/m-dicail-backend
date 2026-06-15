from pydantic import BaseModel, EmailStr


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
    publication_date: str
    doi: str


class SearchResponse(BaseModel):
    articles: list[Article]


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
