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
    ├─→ auth_service           (port 8005)
    └─→ protocol_service       (port 8006)
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
├── database.py        # SQLAlchemy engine, session, Base
├── models.py          # User ORM model
├── auth.py            # password hashing (argon2), JWT creation/validation
├── schemas.py
├── routes.py
├── main.py
├── requirements.txt
├── Dockerfile
└── migrations/        # Alembic migrations — one file per domain
    ├── env.py
    ├── script.py.mako
    └── versions/
        ├── 001_auth.py      # users table
        └── 002_research.py  # research_queries table
```

The `protocol_service` has additional files:

```
protocol_service/
├── __init__.py
├── config.py
├── database.py        # SQLAlchemy engine, session, Base
├── models.py          # Protocol ORM model
├── schemas.py
├── routes.py
├── main.py
├── requirements.txt
├── Dockerfile
├── alembic.ini
└── migrations/
    ├── env.py
    ├── script.py.mako
    └── versions/
        └── 001_protocols.py  # protocols table + seed (10 pathologies EBP)
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

### Password hashing

Passwords are hashed using **argon2** (`argon2-cffi`) — more secure than bcrypt, no Rust dependency required.

### Database migrations

Migrations are managed with **Alembic**. Each domain has its own migration file — no single monolithic SQL file:

**auth_service migrations:**

| File | Description |
|---|---|
| `001_auth.py` | Creates `users` table |
| `002_research.py` | Creates `research_queries` table |

**protocol_service migrations:**

| File | Description |
|---|---|
| `001_protocols.py` | Creates and seeds `protocols` table with 10 EBP pathologies |

Run migrations manually:

```bash
# auth_service
cd services/auth_service
alembic upgrade head

# protocol_service
cd services/protocol_service
alembic upgrade head
```

> Migrations run automatically via `alembic upgrade head` on service startup in Docker.

## Protocols — Evidence-Based Practice

The `protocol_service` exposes rehabilitation protocols based on official French and European guidelines. Each protocol is classified by pathology and rehabilitation phase.

### Sources

All protocols are sourced from official French and European institutions:

- **HAS** — Haute Autorité de Santé (France)
- **EULAR** — European League Against Rheumatism
- **SFA** — Société Française d'Arthroscopie
- **SOFCOT** — Société Française de Chirurgie Orthopédique et Traumatologique
- **SFK** — Société Française de Kinésithérapie
- **SFMS** — Société Française de Médecine du Sport
- **ESO** — European Stroke Organisation
- **INRS** — Institut National de Recherche et de Sécurité

### Pathologies at launch (10)

| # | Pathologie |
|---|---|
| 1 | Entorse latérale de cheville |
| 2 | Lombalgie commune chronique |
| 3 | Tendinopathie achilléenne |
| 4 | Gonarthrose |
| 5 | Rupture LCA post-opératoire |
| 6 | Conflit sous-acromial |
| 7 | Cervicalgie mécanique commune |
| 8 | Épicondylite latérale (tennis elbow) |
| 9 | Capsulite rétractile de l'épaule |
| 10 | AVC - Hémiplégie |

> Each protocol mandatorily includes `source` and `publication_year` fields (Definition of Done).

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
pip install fastapi uvicorn httpx pydantic sqlalchemy alembic PyJWT argon2-cffi "pydantic[email]"
```

### Environment variables

Create a `.env` file at the root of the project:

```
SECRET_KEY=your-secret-key-here
```

> ⚠️ Never commit `.env` to git. Add it to `.gitignore`.

### Run with Docker

```bash
docker compose up --build
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

### Protocol endpoints

| Method | Path | Auth required | Description |
|---|---|---|---|
| GET | `/protocols` | ✅ | List all protocols (filterable by `pathology`, `phase`) |
| GET | `/protocols/{id}` | ✅ | Get a specific protocol by ID |
| GET | `/protocols/pathologies/list` | ✅ | List all available pathologies |

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
| protocol_service | 8006 | `GET /protocols` | List protocols |
| protocol_service | 8006 | `GET /protocols/{id}` | Get protocol by ID |
| protocol_service | 8006 | `GET /protocols/pathologies/list` | List pathologies |
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
  "password": "string",
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

### Protocol — `GET /protocols`

Query params (optional):
```
?pathology=Gonarthrose
?phase=Phase 1
```

Response `200`:
```json
{
  "protocols": [
    {
      "id": 1,
      "pathology": "string",
      "phase": "string",
      "title": "string",
      "description": "string",
      "source": "string",
      "publication_year": 2019,
      "evidence_level": "Grade A"
    }
  ],
  "total": 20
}
```

### Protocol — `GET /protocols/{id}`

Response `200`:
```json
{
  "id": 1,
  "pathology": "Entorse latérale de cheville",
  "phase": "Phase 1 - Aigüe (J0-J5)",
  "title": "Protocole POLICE",
  "description": "string",
  "source": "Haute Autorité de Santé (HAS) - Guide de rééducation de l'entorse de cheville.",
  "publication_year": 2017,
  "evidence_level": "Grade A"
}
```

### Protocol — `GET /protocols/pathologies/list`

Response `200`:
```json
{
  "pathologies": [
    "AVC - Hémiplégie",
    "Capsulite rétractile de l'épaule",
    "Cervicalgie mécanique commune",
    "Conflit sous-acromial",
    "Entorse latérale de cheville",
    "Gonarthrose",
    "Lombalgie commune chronique",
    "Rupture LCA post-opératoire",
    "Tendinopathie achilléenne",
    "Épicondylite latérale (tennis elbow)"
  ]
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
