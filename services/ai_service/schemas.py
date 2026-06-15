from pydantic import BaseModel


class GenerateRequest(BaseModel):
    anonymized_text: str
    clinical_context: str = ""
    pubmed_results: list[dict] = []
    language: str = "fr"


class GenerateResponse(BaseModel):
    summary: str
    recommendations: list[str]
    exercises: list[str]
    evidence_level: str
    sources: list[str]
    precautions: list[str]


class SummarizeRequest(BaseModel):
    anonymized_text: str
    language: str = "fr"


class SummarizeResponse(BaseModel):
    summary: str
