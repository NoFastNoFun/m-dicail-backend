import re
import unicodedata

from .stop_words import STOP_WORDS


def _remove_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(c for c in normalized if not unicodedata.combining(c))


def clean_text_for_query(text: str) -> list[str]:
    text = _remove_accents(text.lower())
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    words = text.split()
    return [w for w in words if w not in STOP_WORDS]
