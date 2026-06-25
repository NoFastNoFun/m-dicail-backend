from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

try:
    from .auth import get_current_user_id
    from .database import get_db
    from .models import RecordingSession
    from .schemas import SessionCreate, SessionPatientUpdate, SessionResponse, SessionUpdate
except ImportError:
    from auth import get_current_user_id
    from database import get_db
    from models import RecordingSession
    from schemas import SessionCreate, SessionPatientUpdate, SessionResponse, SessionUpdate

router = APIRouter(prefix="/recording-sessions", tags=["Sessions"])
patients_router = APIRouter(tags=["Sessions"])


@router.post("", response_model=SessionResponse, status_code=201)
def create_session(
    body: SessionCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    session = RecordingSession(
        user_id=user_id,
        **body.model_dump(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.put("/{session_id}", response_model=SessionResponse)
def update_session(
    session_id: str,
    body: SessionUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    session = db.query(RecordingSession).filter(
        RecordingSession.id == session_id,
        RecordingSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session introuvable")

    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "soap_note" and value is not None:
            setattr(session, field, value.model_dump() if hasattr(value, "model_dump") else value)
        else:
            setattr(session, field, value)

    db.commit()
    db.refresh(session)
    return session


@router.put("/{session_id}/patient", response_model=SessionResponse)
def associate_patient(
    session_id: str,
    body: SessionPatientUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    session = db.query(RecordingSession).filter(
        RecordingSession.id == session_id,
        RecordingSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session introuvable")

    session.patient_id = body.patient_id
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    session = db.query(RecordingSession).filter(
        RecordingSession.id == session_id,
        RecordingSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session introuvable")
    return session


@patients_router.get("/patients/{patient_id}/recording-sessions", response_model=list[SessionResponse])
def get_sessions_by_patient(
    patient_id: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return db.query(RecordingSession).filter(
        RecordingSession.patient_id == patient_id,
        RecordingSession.user_id == user_id,
    ).all()
