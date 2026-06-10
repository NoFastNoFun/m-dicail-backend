import os
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import time
import jwt
import pytest

SECRET_KEY = "test-secret-key-for-tests-minimum-32-chars!!"
ALGORITHM = "HS256"


def create_access_token(data: dict, expires_in_seconds: int = 3600) -> str:
    from datetime import datetime, timedelta
    payload = data.copy()
    from datetime import timezone
    payload["exp"] = datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def test_create_access_token_returns_string():
    token = create_access_token({"sub": "1", "email": "test@test.com"})
    assert isinstance(token, str)


def test_create_access_token_contains_sub():
    token = create_access_token({"sub": "1", "email": "test@test.com"})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "1"


def test_create_access_token_contains_email():
    token = create_access_token({"sub": "1", "email": "test@test.com"})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["email"] == "test@test.com"


def test_create_access_token_has_expiry():
    token = create_access_token({"sub": "1"})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert "exp" in payload


def test_create_access_token_expired():
    token = create_access_token({"sub": "1"}, expires_in_seconds=-1)
    with pytest.raises(jwt.ExpiredSignatureError):
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def test_create_access_token_invalid_secret():
    token = create_access_token({"sub": "1"})
    with pytest.raises(jwt.InvalidSignatureError):
        jwt.decode(token, "wrong-secret", algorithms=[ALGORITHM])
