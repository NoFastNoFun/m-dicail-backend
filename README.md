# m-dicail-backend

Backend monorepo for the m-dicail physiotherapist assistant.

## Architecture

```
Flutter app
    ↓ HTTPS
nginx (ports 80 → 443 redirect, 443)
    ├─ /api  → api  (port 8000)
    └─ /ai   → ai   (port 8001)
```

Both NestJS apps use the `/api` global prefix internally. nginx rewrites `/ai/*` to `/api/*` on the AI service.

## Prerequisites

- Docker
- Docker Compose
- OpenSSL *(for generating local TLS certificates)*

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

**3. Generate TLS certificates** *(self-signed for local dev)*

```bash
# Git Bash / Linux / macOS
sh scripts/generate-ssl-certs.sh

# Windows PowerShell (if OpenSSL is not installed locally)
docker run --rm -v "${PWD}/nginx/certs:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/privkey.pem -out /certs/fullchain.pem -subj "/CN=localhost"
```

For production, replace `nginx/certs/fullchain.pem` and `nginx/certs/privkey.pem` with real certificates (e.g. Let's Encrypt).

**4. Start the services**

```bash
docker compose up --build
```

All services start automatically. Database migrations run on `api` startup.

**5. Run database migrations** *(if not auto-applied on first boot)*

```bash
pnpm run typeorm migration:run -- -d apps/api/src/data-source.ts
```

## User roles

The application uses a role-based access system with two roles, stored directly on the `users` table.

| Role | Description |
|---|---|
| `PRATICIEN` | Healthcare professional — registers via `POST /auth/register`. Can create patients and access all their data. |
| `PATIENT` | Patient — account created by a PRATICIEN via `POST /auth/patients`. Linked to a single practitioner via `patientId`. Has access to their own data only. |

### Role flow

```
PRATICIEN
  POST /auth/register          → creates PRATICIEN account → returns JWT
  POST /patients                → creates patient record
  POST /auth/patients           → creates patient app account linked to the patient record
  GET  /patients                 → lists their own patients only

PATIENT
  POST /auth/login              → same login route as PRATICIEN
  GET  /patients/{id}            → own record only
```

### JWT payload

The JWT token includes the user role:

```json
{
  "sub": "93825f5d-798a-4777-9e5b-37a776a4647e",
  "email": "praticien@example.com",
  "role": "PRATICIEN",
  "iat": 1782812065,
  "exp": 1782898465
}
```

### Architecture decision — why `users` and `patients` stay separate tables

The `role` column lives on `users` (authentication/identity), while clinical data stays in `patients` (medical records), linked via `users.patientId → patients.id`.

We deliberately did **not** merge the two tables, for three reasons:

1. **Different lifecycles** — a practitioner can create a patient clinical record without ever creating an app account for them. Creating a patient record and granting app access are two independent actions.
2. **Different data sensitivity** — `users` holds authentication secrets (hashed password); `patients` holds medical data (MRN, birth date, clinical notes). Merging them couples auth queries with medical data queries, which is bad practice for RGPD compliance.
3. **A single login route was the actual requirement** — `POST /auth/login` already works identically for both roles via the `role` claim in the JWT. The role column achieves the goal without forcing a 1:1 table merge.

### Security

- Passwords: minimum 8 characters, requires uppercase, lowercase, digit, and special character (`class-validator` `@Matches` decorators)
- Password hashing: Argon2 (`argon2` npm package)
- Role enforcement: `@Roles()` decorator + `RolesGuard` on protected routes (e.g. `POST /patients`, `POST /auth/patients` are PRATICIEN-only)
- `SECRET_KEY` is required at startup via `ConfigService.getOrThrow`
- Database: PostgreSQL (TypeORM)

## Migrations

Managed with **TypeORM** — one file per domain, located in `apps/api/src/migrations/`:

| File | Description |
|---|---|
| `1750000000000-Init.ts` | Creates `users`, `patients`, `recording_sessions` tables |
| `1782811334916-AddRoleToUsers.ts` | Adds `role` (enum: PRATICIEN/PATIENT) and `patient_id` columns to `users` |

Generate a new migration:
```bash
pnpm run typeorm migration:generate -- -d apps/api/src/data-source.ts apps/api/src/migrations/<MigrationName>
```

Run pending migrations:
```bash
pnpm run typeorm migration:run -- -d apps/api/src/data-source.ts
```

> ⚠️ Do not keep a `migrations/index.ts` barrel file that re-exports migration classes already matched by the `data-source.ts` glob pattern — TypeORM will throw `Duplicate migrations` errors.

## API

The stack is exposed through nginx:

| Path | Service | Example |
|---|---|---|
| `/api` | Main API (port 8000) | `https://localhost/api/v1/auth/login` |
| `/ai` | AI service (port 8001) | `https://localhost/ai/v1/...` |

HTTP on port 80 redirects to HTTPS on port 443.

Swagger:
- API: `https://localhost/docs` (or `http://localhost:8000/docs` when running `api` directly without nginx)
- AI: `https://localhost/ai/docs`

### Auth endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | ❌ | Create PRATICIEN account → returns JWT |
| POST | `/api/v1/auth/login` | ❌ | Login (PRATICIEN or PATIENT) → returns JWT |
| GET | `/api/v1/auth/me` | ✅ | Get current user profile |
| POST | `/api/v1/auth/patients` | ✅ PRATICIEN only | Create patient app account |

### Patient endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/patients` | ✅ | List patients (PRATICIEN sees their own only) |
| POST | `/api/v1/patients` | ✅ PRATICIEN only | Create patient record |
| GET | `/api/v1/patients/{id}` | ✅ | Get patient by ID |
| PUT | `/api/v1/patients/{id}` | ✅ | Update patient |
| DELETE | `/api/v1/patients/{id}` | ✅ | Delete patient |

### Session endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/recording-sessions` | ✅ | Create recording session |
| PUT | `/api/v1/recording-sessions/{id}` | ✅ | Update session |
| GET | `/api/v1/recording-sessions/{id}` | ✅ | Get session |
| PUT | `/api/v1/recording-sessions/{id}/patient` | ✅ | Associate session to patient |
| GET | `/api/v1/patients/{id}/recording-sessions` | ✅ | Get sessions by patient |

## PubMed — sources des articles

Il y a deux APIs NCBI distinctes :

- **E-utilities** — donne accès à toute la base PubMed : titre, auteurs, abstract, métadonnées. C'est l'API actuellement intégrée dans le `pubmed_service`. Gratuite, la clé `NCBI_API_KEY` augmente simplement la limite de 3 à 10 req/s. → [Documentation E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25497/)

- **PMC (PubMed Central)** — donne accès au texte complet des articles, mais uniquement pour les publications open access (~40% du catalogue). Les 60% restants sont bloqués par les journaux payants (Elsevier, Springer, etc.). → [Documentation PMC](https://www.ncbi.nlm.nih.gov/pmc/tools/developers/)

Pour le POC on part sur E-utilities (abstracts uniquement) pour valider que ça suffit à l'IA pour générer des recommandations pertinentes. Si les abstracts s'avèrent insuffisants, on pourra compléter avec PMC pour les articles open access.
