import os
import sys

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests-minimum-32-chars!!")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_routes.db")
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
from app.routes import router

TEST_DATABASE_URL = "sqlite:///./test_routes.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Limiter désactivé pour les tests
limiter = Limiter(key_func=get_remote_address, enabled=False)

# Override le limiter dans les routes
import app.routes as auth_routes
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


def test_register_success():
    response = client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "Password1!",
        "full_name": "John Doe"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@test.com"


def test_register_weak_password():
    response = client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "faible"
    })
    assert response.status_code == 422


def test_register_duplicate_email():
    client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "Password1!"
    })
    response = client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "Password1!"
    })
    assert response.status_code == 409


def test_login_success():
    client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "Password1!"
    })
    response = client.post("/auth/login", json={
        "email": "test@test.com",
        "password": "Password1!"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password():
    client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "Password1!"
    })
    response = client.post("/auth/login", json={
        "email": "test@test.com",
        "password": "WrongPass1!"
    })
    assert response.status_code == 401


def test_login_unknown_email():
    response = client.post("/auth/login", json={
        "email": "unknown@test.com",
        "password": "Password1!"
    })
    assert response.status_code == 401


def test_me_with_valid_token():
    reg = client.post("/auth/register", json={
        "email": "test@test.com",
        "password": "Password1!"
    })
    token = reg.json()["access_token"]
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "test@test.com"


def test_me_without_token():
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_with_invalid_token():
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid.token.here"}
    )
    assert response.status_code == 401
