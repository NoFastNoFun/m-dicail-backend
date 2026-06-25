import sys
import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests-minimum-32-chars!!")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_routes.db")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.routes import router, patients_router
from app.auth import get_current_user_id

TEST_DATABASE_URL = "sqlite:///./test_routes.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI(title="Session Service Test")
app.include_router(router)
app.include_router(patients_router)
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user_id] = lambda: 1

Base.metadata.create_all(bind=engine)

client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


SESSION_PAYLOAD = {
    "started_at": "2026-06-18T10:00:00Z",
    "status": "recording",
    "transcript": "",
    "patient_id": None,
}

SOAP = {
    "subjective": "Le patient se plaint de douleurs lombaires",
    "objective": "Mobilité réduite à 60%",
    "assessment": "Lombalgie chronique",
    "plan": "Exercices de renforcement 3x/semaine",
}


def test_create_session_returns_201():
    response = client.post("/recording-sessions", json=SESSION_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["id"].startswith("recording_")
    assert data["status"] == "recording"
    assert "created_at" in data
    assert "updated_at" in data


def test_create_session_id_generated_by_backend():
    payload = {**SESSION_PAYLOAD, "id": "should-be-ignored"}
    response = client.post("/recording-sessions", json=payload)
    assert response.status_code == 201
    assert response.json()["id"] != "should-be-ignored"
    assert response.json()["id"].startswith("recording_")


def test_create_session_default_status_is_recording():
    payload = {k: v for k, v in SESSION_PAYLOAD.items() if k != "status"}
    response = client.post("/recording-sessions", json=payload)
    assert response.status_code == 201
    assert response.json()["status"] == "recording"


def test_update_session_returns_200():
    created = client.post("/recording-sessions", json=SESSION_PAYLOAD).json()
    response = client.put(f"/recording-sessions/{created['id']}", json={
        "ended_at": "2026-06-18T10:35:00Z",
        "status": "completed",
        "transcript": "Texte transcrit",
        "soap_note": SOAP,
        "summary": "Résumé de la séance",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["transcript"] == "Texte transcrit"
    assert data["soap_note"]["subjective"] == "Le patient se plaint de douleurs lombaires"
    assert data["summary"] == "Résumé de la séance"


def test_update_session_not_found_returns_404():
    response = client.put("/recording-sessions/recording_inexistant", json={"status": "completed"})
    assert response.status_code == 404


def test_associate_patient_returns_200():
    created = client.post("/recording-sessions", json=SESSION_PAYLOAD).json()
    response = client.put(f"/recording-sessions/{created['id']}/patient", json={
        "patient_id": "patient_abc123"
    })
    assert response.status_code == 200
    assert response.json()["patient_id"] == "patient_abc123"


def test_associate_patient_not_found_returns_404():
    response = client.put("/recording-sessions/recording_inexistant/patient", json={
        "patient_id": "patient_abc123"
    })
    assert response.status_code == 404


def test_get_session_returns_200():
    created = client.post("/recording-sessions", json=SESSION_PAYLOAD).json()
    response = client.get(f"/recording-sessions/{created['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_session_not_found_returns_404():
    response = client.get("/recording-sessions/recording_inexistant")
    assert response.status_code == 404


def test_get_sessions_by_patient_returns_list():
    s = client.post("/recording-sessions", json=SESSION_PAYLOAD).json()
    client.put(f"/recording-sessions/{s['id']}/patient", json={"patient_id": "patient_abc123"})
    response = client.get("/patients/patient_abc123/recording-sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == s["id"]


def test_get_sessions_by_patient_empty_for_other_patient():
    s = client.post("/recording-sessions", json=SESSION_PAYLOAD).json()
    client.put(f"/recording-sessions/{s['id']}/patient", json={"patient_id": "patient_abc123"})
    response = client.get("/patients/patient_other/recording-sessions")
    assert response.status_code == 200
    assert response.json() == []


def test_user_isolation():
    created = client.post("/recording-sessions", json=SESSION_PAYLOAD).json()

    app.dependency_overrides[get_current_user_id] = lambda: 2
    response = client.get(f"/recording-sessions/{created['id']}")
    app.dependency_overrides[get_current_user_id] = lambda: 1

    assert response.status_code == 404
