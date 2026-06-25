import logging

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response

from .config import AI_URL, ANONYMIZATION_URL, AUTH_URL, PATIENT_URL, PUBMED_URL, SESSION_URL
from .schemas import (
    AIGenerateResponse,
    AnonymizeResponse,
    Article,
    LoginRequest,
    PatientCreate,
    PatientResponse,
    PatientUpdate,
    ProcessNoteRequest,
    ProcessNoteResponse,
    RegisterRequest,
    SessionCreate,
    SessionPatientUpdate,
    SessionResponse,
    SessionUpdate,
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


@router.post("/recording-sessions", tags=["Sessions"], response_model=SessionResponse, status_code=201)
async def create_session(body: SessionCreate, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SESSION_URL}/recording-sessions",
            json=body.model_dump(mode="json"),
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.put("/recording-sessions/{session_id}", tags=["Sessions"], response_model=SessionResponse)
async def update_session(session_id: str, body: SessionUpdate, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"{SESSION_URL}/recording-sessions/{session_id}",
            json=body.model_dump(mode="json", exclude_unset=True),
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.put("/recording-sessions/{session_id}/patient", tags=["Sessions"], response_model=SessionResponse)
async def associate_session_patient(session_id: str, body: SessionPatientUpdate, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"{SESSION_URL}/recording-sessions/{session_id}/patient",
            json=body.model_dump(),
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.get("/recording-sessions/{session_id}", tags=["Sessions"], response_model=SessionResponse)
async def get_session(session_id: str, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SESSION_URL}/recording-sessions/{session_id}",
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.get("/patients/{patient_id}/recording-sessions", tags=["Sessions"], response_model=list[SessionResponse])
async def get_sessions_by_patient(patient_id: str, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SESSION_URL}/patients/{patient_id}/recording-sessions",
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.get("/patients", tags=["Patients"], response_model=list[PatientResponse])
async def list_patients(request: Request, query: str | None = None):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{PATIENT_URL}/patients",
            params={"query": query} if query else {},
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.post("/patients", tags=["Patients"], response_model=PatientResponse, status_code=201)
async def create_patient(body: PatientCreate, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PATIENT_URL}/patients",
            json=body.model_dump(mode="json"),
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.get("/patients/{patient_id}", tags=["Patients"], response_model=PatientResponse)
async def get_patient(patient_id: str, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{PATIENT_URL}/patients/{patient_id}",
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.put("/patients/{patient_id}", tags=["Patients"], response_model=PatientResponse)
async def update_patient(patient_id: str, body: PatientUpdate, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"{PATIENT_URL}/patients/{patient_id}",
            json=body.model_dump(mode="json"),
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
        return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")


@router.delete("/patients/{patient_id}", tags=["Patients"], status_code=204)
async def delete_patient(patient_id: str, request: Request):
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{PATIENT_URL}/patients/{patient_id}",
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
        return Response(status_code=resp.status_code)


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
        if pubmed_resp.status_code == 200:
            pubmed_articles: list[Article] = [Article.model_validate(a) for a in pubmed_resp.json()]
        else:
            logger.warning(f"PubMed service returned {pubmed_resp.status_code}, proceeding without articles")
            pubmed_articles = []
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
