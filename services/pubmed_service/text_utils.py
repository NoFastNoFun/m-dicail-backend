import re
import unicodedata

_STOP_WORDS = {
    "a", "au", "aux", "avec", "ce", "ces", "cet", "cette",
    "dans", "de", "des", "du", "d",
    "elle", "elles", "en", "entre", "et",
    "il", "ils",
    "j", "je",
    "la", "le", "les", "leur", "leurs", "l",
    "ma", "mais", "me", "mes", "m", "mon",
    "ni", "n", "nous",
    "on", "ou", "où",
    "par", "pas", "pour",
    "qu", "que", "qui",
    "sa", "se", "ses", "si", "son", "sur", "s",
    "ta", "te", "tes", "ton", "tu", "t",
    "un", "une",
    "vers", "votre", "vous",
    "y",
}


def _remove_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(c for c in normalized if not unicodedata.combining(c))


def clean_text_for_query(text: str) -> list[str]:
    text = _remove_accents(text.lower())
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    words = text.split()
    return [w for w in words if w not in _STOP_WORDS]
