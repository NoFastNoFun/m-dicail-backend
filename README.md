# m-dicail-backend

Backend monorepo for the m-dicail physiotherapist assistant.

## Architecture

```
Flutter app
    ↓ HTTP REST
Gateway (port 8000)
    ├─→ anonymization_service  (port 8001)
    ├─→ ai_service             (port 8002)
    ├─→ pubmed_service         (port 8003)
    ├─→ report_service         (port 8004)
    └─→ auth_service           (port 8005)
```

## Structure

- `apps/gateway/` — REST gateway, entry point for the Flutter client. Validates JWT on every protected route via middleware.
- `services/` — internal REST services (not exposed externally)

Each service follows the same internal layout:

```
service/
├── __init__.py   # Python package
├── config.py     # port and environment variables
├── schemas.py    # Pydantic request/response models
├── routes.py     # FastAPI router and business logic
└── main.py       # app creation, router registration, uvicorn startup
```

The `auth_service` has additional files:

```
auth_service/
├── __init__.py
├── config.py
├── database.py           # SQLAlchemy engine, session, Base
├── models.py             # User ORM model
├── auth.py               # password hashing (argon2), JWT creation/validation
├── schemas.py            # Pydantic models + password strength validation
├── routes.py             # auth endpoints + rate limiting (slowapi)
├── main.py
├── requirements.txt
├── requirements-dev.txt  # test dependencies (pytest)
├── Dockerfile
├── tests/
│   └── test_auth.py      # unit tests for hash_password / verify_password
└── migrations/           # Alembic migrations — one file per domain
    ├── env.py
    ├── script.py.mako
    └── versions/
        └── 001_auth.py   # users table
```

The `gateway` has additional files:

```
gateway/
├── middleware.py   # JWTMiddleware — validates Bearer token on every protected route
└── ...
```

## Authentication

Authentication is handled exclusively by `auth_service`. The gateway does **not** manage users or passwords — it only validates the JWT token on incoming requests via `JWTMiddleware`, then proxies `/auth/*` routes to `auth_service`.

### Flow

```
Flutter app
    │
    ├─ POST /auth/register ──→ gateway ──→ auth_service → creates user → returns JWT
    ├─ POST /auth/login    ──→ gateway ──→ auth_service → verifies credentials → returns JWT
    │
    └─ POST /notes/process  ──→ gateway (validates JWT via middleware) ──→ services...
```

### JWT

- Algorithm: `HS256`
- Expiration: 24h
- `SECRET_KEY` is shared between `gateway` and `auth_service` via environment variable (`.env` file)
- `SECRET_KEY` is **required** — the service raises a `RuntimeError` at startup if not set

### Password hashing

Passwords are hashed using **argon2** (`argon2-cffi`) — more secure than bcrypt, no Rust dependency required.

### Password validation

Passwords are validated at registration via a Pydantic `field_validator`:

| Rule | Requirement |
|---|---|
| Length | Minimum 8 characters |
| Uppercase | At least 1 uppercase letter |
| Lowercase | At least 1 lowercase letter |
| Digit | At least 1 digit |
| Special character | At least 1 special character (`!@#$%^&*...`) |

Invalid passwords return `422 Unprocessable Entity` with a descriptive error message.

### Rate limiting

Endpoints are protected against brute-force attacks via `slowapi`:

| Endpoint | Limit |
|---|---|
| `POST /auth/register` | 5 requests/minute per IP |
| `POST /auth/login` | 10 requests/minute per IP |

Exceeding the limit returns `429 Too Many Requests`.

### RGPD — Logging policy

User personal data is never logged. Only the user `id` is written to logs:

```
✅ INFO: Nouvel utilisateur enregistré : id=1
❌ INFO: Nouvel utilisateur enregistré : email=test@test.com  ← interdit
```

### Database

The project uses **PostgreSQL 15** managed via Docker Compose.

### Database migrations

Migrations are managed with **Alembic**. Each domain has its own migration file — no single monolithic SQL file:

| File | Description |
|---|---|
| `001_auth.py` | Creates `users` table |

> `002_research.py` has been removed from `auth_service` — research queries belong to `pubmed_service` and will be migrated there.

Run migrations manually:

```bash
cd services/auth_service
alembic upgrade head
```

> Migrations run automatically via `alembic upgrade head` on service startup in Docker.

## Getting started

### Prerequisites

- Python 3.11+
- Docker + Docker Compose

### Local setup

```bash
python -m venv .venv
```

Activate the virtual environment depending on your OS:

```bash
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

Install dependencies:

```bash
pip install fastapi uvicorn httpx pydantic sqlalchemy alembic PyJWT argon2-cffi "pydantic[email]" slowapi psycopg2-binary
```

### Environment variables

Create a `.env` file at the root of the project:

```
SECRET_KEY=your-secret-key-here
POSTGRES_PASSWORD=medicail
```

> ⚠️ Never commit `.env` to git. Add it to `.gitignore`.
> ⚠️ `SECRET_KEY` is required — the service will not start without it.

### Run with Docker

```bash
docker compose up --build
```

### Run tests

```bash
cd services/auth_service
pip install -r requirements-dev.txt
pytest tests/
```

## API

### Docs

- Gateway: http://localhost:8000/docs

### Auth endpoints

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Create account → returns JWT |
| POST | `/auth/login` | ❌ | Login → returns JWT |
| GET | `/auth/me` | ✅ | Get current user profile |

### Gateway endpoints

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/notes/process` | ✅ | Anonymize a clinical note and get an AI response |
| POST | `/recommendations` | ✅ | Get clinical recommendations from AI + PubMed |
| POST | `/reports/generate` | ✅ | Generate a text or PDF report |

### Internal service endpoints

| Service | Port | Endpoint | Description |
|---|---|---|---|
| auth_service | 8005 | `POST /auth/register` | Register user |
| auth_service | 8005 | `POST /auth/login` | Login user |
| auth_service | 8005 | `GET /auth/me` | Get current user |
| anonymization_service | 8001 | `POST /anonymize` | NLP/NER PII anonymization |
| ai_service | 8002 | `POST /generate` | Mistral inference |
| pubmed_service | 8003 | `POST /search` | PubMed article search |
| report_service | 8004 | `POST /generate` | Report / PDF generation |

---

## Schemas

### Auth — `POST /auth/register`

Request:
```json
{
  "email": "string",
  "password": "Min8chars+1Uppercase+1digit+1special!",
  "full_name": "string"
}
```

Response `201`:
```json
{
  "user": {
    "id": 1,
    "email": "string",
    "full_name": "string"
  },
  "access_token": "string",
  "token_type": "bearer"
}
```

Error `422` — weak password:
```json
{
  "detail": [
    {
      "msg": "Le mot de passe doit contenir au moins un caractère spécial"
    }
  ]
}
```

Error `429` — rate limit exceeded:
```json
{
  "error": "Rate limit exceeded: 5 per 1 minute"
}
```

### Auth — `POST /auth/login`

Request:
```json
{
  "email": "string",
  "password": "string"
}
```

Response `200`:
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### Auth — `GET /auth/me`

Headers:
```
Authorization: Bearer <access_token>
```

Response `200`:
```json
{
  "id": 1,
  "email": "string",
  "full_name": "string"
}
```

### Gateway — `POST /notes/process`

Request:
```json
{
  "raw_text": "string",
  "session_id": "string",
  "language": "fr"
}
```

Response:
```json
{
  "session_id": "string",
  "anonymized_text": "string",
  "ai_response": {}
}
```

### Gateway — `POST /recommendations`

Request:
```json
{
  "session_id": "string",
  "clinical_context": "string",
  "language": "fr"
}
```

Response: same shape as the AI service `POST /generate` response (see below), with `session_id` added.

### Gateway — `POST /reports/generate`

Request:
```json
{
  "session_id": "string",
  "content": "string",
  "format": "text"
}
```

Response: same shape as the report service `POST /generate` response (see below).

---

### anonymization_service — `POST /anonymize`

Request:
```json
{
  "text": "string",
  "language": "fr"
}
```

Response:
```json
{
  "anonymized_text": "string",
  "entities": [
    {
      "label": "string",
      "original_value": "string",
      "placeholder": "string",
      "start": 0,
      "end": 0
    }
  ]
}
```

### ai_service — `POST /generate`

Request:
```json
{
  "anonymized_text": "string",
  "clinical_context": "",
  "pubmed_results": [],
  "language": "fr"
}
```

Response:
```json
{
  "summary": "string",
  "recommendations": ["string"],
  "exercises": ["string"],
  "evidence_level": "string",
  "sources": ["string"],
  "precautions": ["string"]
}
```

### pubmed_service — `POST /search`

Request:
```json
{
  "query": "string",
  "max_results": 10
}
```

Response:
```json
{
  "articles": [
    {
      "pmid": "string",
      "title": "string",
      "abstract": "string",
      "authors": ["string"],
      "publication_date": "string",
      "doi": "string"
    }
  ]
}
```

### report_service — `POST /generate`

Request:
```json
{
  "session_id": "string",
  "content": "string",
  "format": "text"
}
```

Response:
```json
{
  "session_id": "string",
  "report_data": "string",
  "format": "string",
  "filename": "string"
}
```

---

## SSO / OAuth — research notes

For future reference, here are the main options for SSO in the medical domain:

| Solution | Description | Use case |
|---|---|---|
| **Pro Santé Connect (PSC)** | Official French SSO for healthcare professionals, managed by ANS | ✅ Standard for French practitioners (médecins, kinés, etc.) |
| **eIDAS** | European digital identity standard | ✅ Multi-country deployments |
| **Keycloak** | Open-source IAM, supports OIDC/SAML, integrable with PSC | ✅ Recommended for self-hosted setups |
| **Auth0** | SaaS IAM, HIPAA compliant, OAuth2/OIDC | ✅ Fast to integrate, good for prototyping |

