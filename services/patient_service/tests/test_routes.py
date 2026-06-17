import os
import sys

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests-minimum-32-chars!!")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_routes.db")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.routes import router
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


app = FastAPI(title="Patient Service Test")
app.include_router(router)
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user_id] = lambda: 1

Base.metadata.create_all(bind=engine)

client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


PATIENT_PAYLOAD = {
    "mrn": "MRN001",
    "first_name": "Jean",
    "last_name": "Dupont",
    "birth_date": "1990-05-15",
    "sex": "M",
    "contact": {"email": "jean@test.com", "phone": "0612345678", "address": "1 rue Test"},
    "notes": "RAS",
    "patient_metadata": {"source": "import"},
}


def test_create_patient_returns_201():
    response = client.post("/patients", json=PATIENT_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["id"].startswith("patient_")
    assert data["mrn"] == "MRN001"
    assert data["first_name"] == "Jean"
    assert "created_at" in data
    assert "updated_at" in data


def test_create_patient_id_generated_by_backend():
    payload = {**PATIENT_PAYLOAD, "id": "should-be-ignored", "created_at": "2000-01-01T00:00:00Z"}
    response = client.post("/patients", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"].startswith("patient_")
    assert data["id"] != "should-be-ignored"


def test_create_duplicate_mrn_returns_409():
    client.post("/patients", json=PATIENT_PAYLOAD)
    response = client.post("/patients", json=PATIENT_PAYLOAD)
    assert response.status_code == 409


def test_list_patients_returns_200():
    client.post("/patients", json=PATIENT_PAYLOAD)
    response = client.get("/patients")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["mrn"] == "MRN001"


def test_list_patients_query_filters_by_mrn():
    client.post("/patients", json=PATIENT_PAYLOAD)
    client.post("/patients", json={**PATIENT_PAYLOAD, "mrn": "MRN999", "first_name": "Other"})
    response = client.get("/patients?query=MRN001")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["mrn"] == "MRN001"


def test_list_patients_query_filters_by_first_name():
    client.post("/patients", json=PATIENT_PAYLOAD)
    client.post("/patients", json={**PATIENT_PAYLOAD, "mrn": "MRN999", "first_name": "Alice"})
    response = client.get("/patients?query=ali")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["first_name"] == "Alice"


def test_get_patient_returns_200():
    created = client.post("/patients", json=PATIENT_PAYLOAD).json()
    response = client.get(f"/patients/{created['id']}")
    assert response.status_code == 200
    assert response.json()["mrn"] == "MRN001"


def test_get_patient_not_found_returns_404():
    response = client.get("/patients/patient_000000")
    assert response.status_code == 404


def test_update_patient_returns_200():
    created = client.post("/patients", json=PATIENT_PAYLOAD).json()
    response = client.put(f"/patients/{created['id']}", json={**PATIENT_PAYLOAD, "first_name": "Pierre"})
    assert response.status_code == 200
    assert response.json()["first_name"] == "Pierre"


def test_update_patient_not_found_returns_404():
    response = client.put("/patients/patient_000000", json=PATIENT_PAYLOAD)
    assert response.status_code == 404


def test_update_patient_mrn_conflict_returns_409():
    client.post("/patients", json=PATIENT_PAYLOAD)
    p2 = client.post("/patients", json={**PATIENT_PAYLOAD, "mrn": "MRN002"}).json()
    response = client.put(f"/patients/{p2['id']}", json={**PATIENT_PAYLOAD, "mrn": "MRN001"})
    assert response.status_code == 409


def test_delete_patient_returns_204():
    created = client.post("/patients", json=PATIENT_PAYLOAD).json()
    response = client.delete(f"/patients/{created['id']}")
    assert response.status_code == 204


def test_delete_patient_not_found_returns_404():
    response = client.delete("/patients/patient_000000")
    assert response.status_code == 404


def test_deleted_patient_not_found_on_get():
    created = client.post("/patients", json=PATIENT_PAYLOAD).json()
    client.delete(f"/patients/{created['id']}")
    response = client.get(f"/patients/{created['id']}")
    assert response.status_code == 404


def test_user_isolation():
    client.post("/patients", json=PATIENT_PAYLOAD)

    app.dependency_overrides[get_current_user_id] = lambda: 2
    response = client.get("/patients")
    app.dependency_overrides[get_current_user_id] = lambda: 1

    assert response.status_code == 200
    assert response.json() == []
