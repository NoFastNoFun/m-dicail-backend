import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return ph.verify(hashed, plain)
    except VerifyMismatchError:
        return False


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
    hash1 = hash_password("Password1!")
    hash2 = hash_password("Password1!")
    assert hash1 != hash2


def test_verify_password_empty_string():
    hashed = hash_password("Password1!")
    assert verify_password("", hashed) is False
