import os
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from pydantic import ValidationError
from schemas import RegisterRequest


def test_valid_password():
    req = RegisterRequest(email="test@test.com", password="Password1!")
    assert req.password == "Password1!"


def test_password_too_short():
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(email="test@test.com", password="Pas1!")
    assert "8 caractères" in str(exc.value)


def test_password_no_uppercase():
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(email="test@test.com", password="password1!")
    assert "majuscule" in str(exc.value)


def test_password_no_lowercase():
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(email="test@test.com", password="PASSWORD1!")
    assert "minuscule" in str(exc.value)


def test_password_no_digit():
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(email="test@test.com", password="Password!")
    assert "chiffre" in str(exc.value)


def test_password_no_special_char():
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(email="test@test.com", password="Password1")
    assert "spécial" in str(exc.value)


def test_invalid_email():
    with pytest.raises(ValidationError):
        RegisterRequest(email="not-an-email", password="Password1!")


def test_full_name_optional():
    req = RegisterRequest(email="test@test.com", password="Password1!")
    assert req.full_name is None


def test_full_name_provided():
    req = RegisterRequest(email="test@test.com", password="Password1!", full_name="John Doe")
    assert req.full_name == "John Doe"
