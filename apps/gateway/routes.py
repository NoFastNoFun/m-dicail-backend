import logging

import httpx
from fastapi import APIRouter, HTTPException

from .config import AI_URL, ANONYMIZATION_URL, PUBMED_URL, REPORT_URL
from .schemas import (
    AIGenerateResponse,
    AnonymizeResponse,
    Article,
    ProcessNoteRequest,
    ProcessNoteResponse,
    RecommendationRequest,
    RecommendationResponse,
    ReportRequest,
    ReportResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/notes/process", response_model=ProcessNoteResponse, tags=["Notes"])
async def process_note(request: ProcessNoteRequest):
    async with httpx.AsyncClient() as client:
        anon_resp = await client.post(
            f"{ANONYMIZATION_URL}/anonymize",
            json={
                "text": request.raw_text,
                "language": request.language,
            },
        )
        if anon_resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Anonymization service error")
        anon_data = AnonymizeResponse.model_validate(anon_resp.json())

        pubmed_resp = await client.post(
            f"{PUBMED_URL}/search",
            json={
                "query": anon_data.anonymized_text,
                "max_results": 5,
            },
        )
        pubmed_articles: list[Article] = (
            [Article.model_validate(a) for a in pubmed_resp.json()]
            if pubmed_resp.status_code == 200
            else []
        )
        pubmed_results = [a.model_dump() for a in pubmed_articles]

        ai_resp = await client.post(
            f"{AI_URL}/generate",
            json={
                "anonymized_text": anon_data.anonymized_text,
                "clinical_context": "",
                "pubmed_results": pubmed_results,
                "language": request.language,
            },
        )
        if ai_resp.status_code != 200:
            raise HTTPException(status_code=502, detail="AI service error")
        ai_data = AIGenerateResponse.model_validate(ai_resp.json())

        return ProcessNoteResponse(
            session_id=request.session_id,
            anonymized_text=anon_data.anonymized_text,
            ai_response=ai_data,
        )


@router.post("/recommendations", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_recommendations(request: RecommendationRequest):
    async with httpx.AsyncClient() as client:
        pubmed_resp = await client.post(
            f"{PUBMED_URL}/search",
            json={
                "query": request.clinical_context,
                "max_results": 5,
            },
        )
        pubmed_articles: list[Article] = (
            [Article.model_validate(a) for a in pubmed_resp.json()]
            if pubmed_resp.status_code == 200
            else []
        )
        pubmed_results = [a.model_dump() for a in pubmed_articles]

        ai_resp = await client.post(
            f"{AI_URL}/generate",
            json={
                "anonymized_text": request.clinical_context,
                "clinical_context": request.clinical_context,
                "pubmed_results": pubmed_results,
                "language": request.language,
            },
        )
        if ai_resp.status_code != 200:
            raise HTTPException(status_code=502, detail="AI service error")
        ai_data = AIGenerateResponse.model_validate(ai_resp.json())

        return RecommendationResponse(
            session_id=request.session_id, **ai_data.model_dump()
        )


@router.post("/reports/generate", response_model=ReportResponse, tags=["Reports"])
async def generate_report(request: ReportRequest):
    async with httpx.AsyncClient() as client:
        report_resp = await client.post(
            f"{REPORT_URL}/generate",
            json={
                "session_id": request.session_id,
                "content": request.content,
                "format": request.format,
            },
        )
        if report_resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Report service error")
        return ReportResponse.model_validate(report_resp.json())
