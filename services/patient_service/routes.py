from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

try:
    from .auth import get_current_user_id
    from .database import get_db
    from .models import Patient
    from .schemas import PatientCreate, PatientResponse, PatientUpdate
except ImportError:
    from auth import get_current_user_id
    from database import get_db
    from models import Patient
    from schemas import PatientCreate, PatientResponse, PatientUpdate

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=list[PatientResponse])
def list_patients(
    query: str | None = None,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    q = db.query(Patient).filter(Patient.user_id == user_id)
    if query:
        pattern = f"%{query}%"
        q = q.filter(
            or_(
                Patient.mrn.ilike(pattern),
                Patient.first_name.ilike(pattern),
                Patient.last_name.ilike(pattern),
            )
        )
    return q.all()


@router.post("", response_model=PatientResponse, status_code=201)
def create_patient(
    body: PatientCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    patient = Patient(
        user_id=user_id,
        **body.model_dump(),
    )
    db.add(patient)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="MRN déjà utilisé")
    db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == user_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient introuvable")
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    body: PatientUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == user_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient introuvable")

    for field, value in body.model_dump().items():
        setattr(patient, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="MRN déjà utilisé")
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == user_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient introuvable")
    db.delete(patient)
    db.commit()
    return Response(status_code=204)
