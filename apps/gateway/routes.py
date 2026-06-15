import logging

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response

from .config import AI_URL, ANONYMIZATION_URL, AUTH_URL, PUBMED_URL
from .schemas import (
    AIGenerateResponse,
    AnonymizeResponse,
    Article,
    LoginRequest,
    ProcessNoteRequest,
    ProcessNoteResponse,
    RegisterRequest,
    SummarizeNoteRequest,
    SummarizeNoteResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/auth/register", tags=["Auth"])
async def register(body: RegisterRequest):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{AUTH_URL}/auth/register",
            json=body.model_dump(),
            headers={"Content-Type": "application/json"},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.post("/auth/login", tags=["Auth"])
async def login(body: LoginRequest):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{AUTH_URL}/auth/login",
            json=body.model_dump(),
            headers={"Content-Type": "application/json"},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.get("/auth/me", tags=["Auth"])
async def me(request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{AUTH_URL}/auth/me",
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


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


@router.post("/notes/summarize", response_model=SummarizeNoteResponse, tags=["Notes"])
async def summarize_note(request: SummarizeNoteRequest):
    async with httpx.AsyncClient() as client:
        ai_resp = await client.post(
            f"{AI_URL}/summarize",
            json={
                "anonymized_text": request.anonymized_text,
                "language": request.language,
            },
        )
        if ai_resp.status_code != 200:
            raise HTTPException(status_code=502, detail="AI service error")

        return SummarizeNoteResponse(
            session_id=request.session_id,
            summary=ai_resp.json().get("summary", ""),
        )
