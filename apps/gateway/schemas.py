from pydantic import BaseModel


# --- Requests ---

class ProcessNoteRequest(BaseModel):
    raw_text: str
    session_id: str
    language: str = "fr"


class RecommendationRequest(BaseModel):
    session_id: str
    clinical_context: str
    language: str = "fr"


class ReportRequest(BaseModel):
    session_id: str
    content: str
    format: str = "text"


# --- Internal service responses ---

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


class ReportResponse(BaseModel):
    session_id: str
    report_data: str
    format: str
    filename: str


# --- Gateway responses ---

class ProcessNoteResponse(BaseModel):
    session_id: str
    anonymized_text: str
    ai_response: AIGenerateResponse


class RecommendationResponse(BaseModel):
    session_id: str
    summary: str
    recommendations: list[str]
    exercises: list[str]
    evidence_level: str
    sources: list[str]
    precautions: list[str]
