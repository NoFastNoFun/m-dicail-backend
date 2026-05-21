import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

try:
    from .database import get_db
    from .models import Protocol
    from .schemas import ProtocolListResponse, ProtocolResponse
except ImportError:
    from database import get_db
    from models import Protocol
    from schemas import ProtocolListResponse, ProtocolResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/protocols", tags=["Protocols"])


@router.get("", response_model=ProtocolListResponse)
def get_protocols(
    pathology: str | None = Query(None, description="Filter by pathology"),
    phase: str | None = Query(None, description="Filter by phase"),
    db: Session = Depends(get_db),
):
    query = db.query(Protocol)

    if pathology:
        query = query.filter(Protocol.pathology.ilike(f"%{pathology}%"))
    if phase:
        query = query.filter(Protocol.phase.ilike(f"%{phase}%"))

    protocols = query.all()
    return ProtocolListResponse(
        protocols=[ProtocolResponse.model_validate(p) for p in protocols],
        total=len(protocols),
    )


@router.get("/{protocol_id}", response_model=ProtocolResponse)
def get_protocol(protocol_id: int, db: Session = Depends(get_db)):
    protocol = db.query(Protocol).filter(Protocol.id == protocol_id).first()
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocole introuvable")
    return ProtocolResponse.model_validate(protocol)


@router.get("/pathologies/list")
def get_pathologies(db: Session = Depends(get_db)):
    pathologies = db.query(Protocol.pathology).distinct().all()
    return {"pathologies": [p[0] for p in pathologies]}
