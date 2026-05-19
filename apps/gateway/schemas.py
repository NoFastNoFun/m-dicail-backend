from pydantic import BaseModel


class ProcessNoteRequest(BaseModel):
    raw_text: str
    session_id: str
    language: str = "fr"


class ProcessNoteResponse(BaseModel):
    session_id: str
    anonymized_text: str
    ai_response: dict


class RecommendationRequest(BaseModel):
    session_id: str
    clinical_context: str
    language: str = "fr"


class ReportRequest(BaseModel):
    session_id: str
    content: str
    format: str = "text"
