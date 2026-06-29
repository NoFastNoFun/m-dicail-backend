import os
import sys

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests-minimum-32-chars!!")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_roles.db")
os.environ.setdefault("RATELIMIT_ENABLED", "False")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.database import Base, get_db 
from app.models import User             
import app.routes as auth_routes
from app.routes import router

TEST_DATABASE_URL = "sqlite:///./test_roles.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


limiter = Limiter(key_func=get_remote_address, enabled=False)
auth_routes.limiter = limiter

app = FastAPI(title="Auth Service Test")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.include_router(router)
app.dependency_overrides[get_db] = override_get_db

Base.metadata.create_all(bind=engine)
client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def register_praticien():
    return client.post("/auth/register", json={
        "email": "praticien@test.com",
        "password": "Password1!",
        "full_name": "Dr Dupont"
    })


def get_token(email="praticien@test.com", password="Password1!"):
    resp = client.post("/auth/login", json={"email": email, "password": password})
    return resp.json().get("access_token")




def test_register_creates_praticien_role():
    resp = register_praticien()
    assert resp.status_code == 201
    assert resp.json()["user"]["role"] == "PRATICIEN"
    assert resp.json()["user"]["patient_id"] is None


def test_login_token_contains_role():
    register_praticien()
    token = get_token()
    import jwt
    payload = jwt.decode(token, options={"verify_signature": False})
    assert payload["role"] == "PRATICIEN"



def test_praticien_can_create_patient_account():
    register_praticien()
    token = get_token()
    resp = client.post(
        "/auth/patients",
        json={
            "email": "patient@test.com",
            "password": "Password1!",
            "full_name": "Jean Martin",
            "patient_id": "patient_abc123"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["role"] == "PATIENT"
    assert data["user"]["patient_id"] == "patient_abc123"


def test_patient_account_token_contains_patient_role():
    register_praticien()
    praticien_token = get_token()
    resp = client.post(
        "/auth/patients",
        json={
            "email": "patient@test.com",
            "password": "Password1!",
            "full_name": "Jean Martin",
            "patient_id": "patient_abc123"
        },
        headers={"Authorization": f"Bearer {praticien_token}"}
    )
    patient_token = resp.json()["access_token"]
    import jwt
    payload = jwt.decode(patient_token, options={"verify_signature": False})
    assert payload["role"] == "PATIENT"


def test_patient_cannot_create_patient_account():
    register_praticien()
    praticien_token = get_token()
    client.post(
        "/auth/patients",
        json={
            "email": "patient@test.com",
            "password": "Password1!",
            "patient_id": "patient_abc123"
        },
        headers={"Authorization": f"Bearer {praticien_token}"}
    )
    patient_token = get_token("patient@test.com", "Password1!")
    resp = client.post(
        "/auth/patients",
        json={
            "email": "patient2@test.com",
            "password": "Password1!",
            "patient_id": "patient_xyz789"
        },
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert resp.status_code == 403


def test_create_patient_account_duplicate_email():
    register_praticien()
    token = get_token()
    client.post(
        "/auth/patients",
        json={
            "email": "patient@test.com",
            "password": "Password1!",
            "patient_id": "patient_abc123"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    resp = client.post(
        "/auth/patients",
        json={
            "email": "patient@test.com",
            "password": "Password1!",
            "patient_id": "patient_xyz789"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 409


def test_create_patient_account_without_token():
    resp = client.post(
        "/auth/patients",
        json={
            "email": "patient@test.com",
            "password": "Password1!",
            "patient_id": "patient_abc123"
        }
    )
    assert resp.status_code == 401
