# m-dicail-backend

Backend monorepo for the m-dicail physiotherapist assistant.

## Architecture

```
Flutter app
    ↓ HTTP REST
Gateway (port 8000)
    ├─→ auth_service           (port 8005)
    ├─→ anonymization_service  (port 8001)
    ├─→ ai_service             (port 8002)
    ├─→ pubmed_service         (port 8003)
    ├─→ patient_service        (port 8006)
    └─→ session_service        (port 8007)
```

The gateway is the only service exposed externally. It validates the JWT on every protected route and proxies requests to the appropriate internal service.

## Prerequisites

- Docker
- Docker Compose

## Setup

**1. Clone the repository**

```bash
git clone <repo-url>
cd m-dicail-backend
```

**2. Create your `.env` file**

```bash
cp .env.example .env
```

Then fill in the values in `.env` :

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing key — generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | PostgreSQL database name |
| `NCBI_API_KEY` | *(optional)* PubMed API key — without it rate limit is 3 req/s instead of 10. Get one at https://www.ncbi.nlm.nih.gov/account/ |

> Never commit `.env` to git.

**3. Set up the local Python environment** *(for IDE type-checking only — not needed to run the stack)*

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

pip install \
  -r services/auth_service/requirements.txt \
  -r services/auth_service/requirements-dev.txt \
  -r services/pubmed_service/requirements.txt \
  -r services/pubmed_service/requirements-dev.txt \
  -r services/ai_service/requirements.txt \
  -r services/anonymization_service/requirements.txt \
  -r services/session_service/requirements.txt \
  -r services/session_service/requirements-dev.txt \
  -r apps/gateway/requirements.txt
```

`pyrightconfig.json` points to this `.venv` — without it basedpyright reports errors on every import.

**4. Start the services**

```bash
docker compose up --build
```

All services start automatically. Database migrations run on service startup.

## User roles

The application uses a role-based access system with two roles:

| Role | Description |
|---|---|
| `PRATICIEN` | Healthcare professional — registers via `POST /auth/register`. Can create patients and access all their data. |
| `PATIENT` | Patient — account created by a PRATICIEN via `POST /auth/patients`. Linked to a single practitioner. Has access to their own data only. |

### Role flow

```
PRATICIEN
  POST /auth/register          → creates PRATICIEN account → returns JWT
  POST /patients               → creates patient record (patient_service)
  POST /auth/patients          → creates patient app account linked to patient record
  GET  /patients               → lists their own patients only

PATIENT
  POST /auth/login             → same login route as PRATICIEN
  GET  /patients/{id}          → own record only
```

### JWT payload

The JWT token includes the user role:

```json
{
  "sub": "3",
  "email": "praticien@example.com",
  "role": "PRATICIEN",
  "exp": 1782851959
}
```

### Security

- Passwords: minimum 8 characters, requires uppercase, lowercase, digit, and special character
- Rate limiting: 5 req/min on `/auth/register`, 10 req/min on `/auth/login`
- RGPD: only user `id` is written to logs — never email or personal data
- `SECRET_KEY` is required at startup — service raises `RuntimeError` if not set
- Database: PostgreSQL 15 (not SQLite)

## Auth migrations

Managed with **Alembic** — one file per domain:

| File | Description |
|---|---|
| `001_auth.py` | Creates `users` table |
| `002_add_role_to_users.py` | Adds `role` (PRATICIEN/PATIENT) and `patient_id` columns |

## API

The full API documentation (routes, request/response schemas) is available via Swagger once the stack is running:

**http://localhost:8000/docs**

### Auth endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Create PRATICIEN account → returns JWT |
| POST | `/auth/login` | ❌ | Login (PRATICIEN or PATIENT) → returns JWT |
| GET | `/auth/me` | ✅ | Get current user profile |
| POST | `/auth/patients` | ✅ PRATICIEN only | Create patient app account |

### Patient endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/patients` | ✅ | List patients (PRATICIEN sees their own only) |
| POST | `/patients` | ✅ PRATICIEN only | Create patient record |
| GET | `/patients/{id}` | ✅ | Get patient by ID |
| PUT | `/patients/{id}` | ✅ | Update patient |
| DELETE | `/patients/{id}` | ✅ | Delete patient |

### Session endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/recording-sessions` | ✅ | Create recording session |
| PUT | `/recording-sessions/{id}` | ✅ | Update session |
| GET | `/recording-sessions/{id}` | ✅ | Get session |
| PUT | `/recording-sessions/{id}/patient` | ✅ | Associate session to patient |
| GET | `/patients/{id}/recording-sessions` | ✅ | Get sessions by patient |

## Run tests

```bash
# auth_service — includes role tests
cd services/auth_service
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/ -v

# patient_service
cd services/patient_service
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/

# session_service
cd services/session_service
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/
```

### auth_service test coverage

| File | Tests | Covers |
|---|---|---|
| `test_auth.py` | 6 | `hash_password` / `verify_password` |
| `test_jwt.py` | 6 | `create_access_token` |
| `test_schemas.py` | 9 | Password validation (Pydantic) |
| `test_routes.py` | 9 | Register / login / me endpoints |
| `test_roles.py` | 6 | Role system — PRATICIEN/PATIENT |

## PubMed — sources des articles

Il y a deux APIs NCBI distinctes :

- **E-utilities** — donne accès à toute la base PubMed : titre, auteurs, abstract, métadonnées. C'est l'API actuellement intégrée dans le `pubmed_service`. Gratuite, la clé `NCBI_API_KEY` augmente simplement la limite de 3 à 10 req/s. → [Documentation E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25497/)

- **PMC (PubMed Central)** — donne accès au texte complet des articles, mais uniquement pour les publications open access (~40% du catalogue). Les 60% restants sont bloqués par les journaux payants (Elsevier, Springer, etc.). → [Documentation PMC](https://www.ncbi.nlm.nih.gov/pmc/tools/developers/)

Pour le POC on part sur E-utilities (abstracts uniquement) pour valider que ça suffit à l'IA pour générer des recommandations pertinentes. Si les abstracts s'avèrent insuffisants, on pourra compléter avec PMC pour les articles open access.
