import pytest
from argon2.exceptions import VerifyMismatchError

from auth import hash_password, verify_password


def test_hash_password_returns_string():
    hashed = hash_password("Password1!")
    assert isinstance(hashed, str)


def test_hash_password_is_not_plaintext():
    hashed = hash_password("Password1!")
    assert hashed != "Password1!"


def test_verify_password_correct():
    hashed = hash_password("Password1!")
    assert verify_password("Password1!", hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("Password1!")
    assert verify_password("WrongPass1!", hashed) is False


def test_hash_password_different_hashes():
    """Argon2 génère un salt différent à chaque fois."""
    hash1 = hash_password("Password1!")
    hash2 = hash_password("Password1!")
    assert hash1 != hash2


def test_verify_password_empty_string():
    hashed = hash_password("Password1!")
    assert verify_password("", hashed) is False
