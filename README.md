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
| `NCBI_EMAIL` | *(optional)* Contact email sent with NCBI E-utilities requests |
| `APP_PUBLIC_URL` | Public HTTPS origin for password-reset and account-recovery links in emails (e.g. `https://medicail.nf2.tech`). Serves an HTML bounce into the native app — not a web product. |
| `APP_DEEPLINK_SCHEME` | Custom URL scheme opened by the bounce page (default `medicail` → `medicail://reset-password?token=…`) |
| `SMTP_HOST` | Outbound mail host — Proton: `smtp.proton.me`; Bridge: `127.0.0.1`. Required to send reset/recovery mail |
| `SMTP_PORT` | SMTP port — `587` (Proton STARTTLS) or `1025` (Proton Bridge) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password or Proton SMTP token |
| `SMTP_FROM` | From address (e.g. `Medicail <noreply@example.com>`) |
| `WEBAUTHN_RP_ID` | Passkey relying party ID — must match the app host (e.g. `medicail.nf2.tech`) |
| `WEBAUTHN_RP_NAME` | Passkey display name shown to users (default: `Medicail`) |
| `WEBAUTHN_ORIGIN` | Passkey origin URL (e.g. `https://medicail.nf2.tech`) |

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
| `init-core-schema.ts` | Creates `users`, `patients`, `recording_sessions` tables |
| `create-appointments.ts` | Creates `appointments` table |
| `add-medical-watch.ts` | Creates `medical_watch_articles` table |
| `add-refresh-token-to-user.ts` | Adds refresh token columns to `users` |
| `add-role-to-users.ts` | Adds `role` (enum: PRATICIEN/PATIENT) and `patient_id` columns to `users` |
| `add-exercises.ts` | Creates `exercises` and `patient_exercises` tables |
| `add-template-to-recording-sessions.ts` | Adds `template_id` and `template_name` to `recording_sessions` |
| `add-pathologies-to-recording-sessions.ts` | Adds jsonb `pathologies` list to `recording_sessions` |

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

HTTP on port 80 redirects to HTTPS on port 443 — port 80 serves nothing else.

## Public exposure

Only nginx is reachable from outside. `api` (8000), `ai` (8001) and `postgres`
(5432) talk to it over the Docker network and must never be published on the
host; `docker-compose.yml` binds Postgres to `127.0.0.1` for local work only.

Check a deployed host from a machine other than the VPS:

```bash
sh scripts/check-vps-exposure.sh medicail.nf2.tech <origin-ip>
```

`medicail.nf2.tech` is proxied through Cloudflare, so testing the hostname
alone only measures Cloudflare's edge — the edge terminates TLS, applies its
own HTTPS redirect and forwards only 80/443. Pass the origin IP to test the
machine itself: anyone who learns that IP can bypass the edge, so the origin
firewall has to hold on its own.

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

## Email (Proton SMTP)

Outbound mail uses nodemailer via `MailModule`. Missing SMTP makes password-reset return 503, except in tests or when `MAIL_SKIP=true` (local only). Production requires SMTP and never skips.

### Proton hosted SMTP (production / test)

```env
SMTP_HOST=smtp.proton.me
SMTP_PORT=587
SMTP_USER=your-address@proton.me
SMTP_PASS=your-smtp-token
SMTP_FROM=Medicail <your-address@proton.me>
APP_PUBLIC_URL=https://medicail.nf2.tech
APP_DEEPLINK_SCHEME=medicail
```

Generate the SMTP token in Proton Mail → Settings → Proton Mail → IMAP/SMTP → SMTP tokens.

### Password reset / recovery links (native app)

Emails still use HTTPS (`${APP_PUBLIC_URL}/reset-password?token=…`) so mail clients keep a clickable link. Nginx proxies `GET /reset-password` and `GET /recovery` to the API, which returns a small HTML page that redirects to `${APP_DEEPLINK_SCHEME}://reset-password?token=…` (and the same for recovery). The Flutter app registers that custom scheme and navigates to the in-app reset/recovery screens.

There is no web UI for reset. The real password change remains `POST /api/v1/auth/reset-password`.

### Proton Bridge (local dev)

```env
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_USER=your-bridge-user
SMTP_PASS=your-bridge-password
SMTP_FROM=dev@medicail.test
APP_PUBLIC_URL=http://localhost:3000
APP_DEEPLINK_SCHEME=medicail
```

### WebAuthn / passkeys

```env
WEBAUTHN_RP_ID=medicail.nf2.tech
WEBAUTHN_RP_NAME=Medicail
WEBAUTHN_ORIGIN=https://medicail.nf2.tech
```

### Auth endpoints (extended)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/forgot-password` | ❌ | Request password reset email |
| POST | `/api/v1/auth/reset-password` | ❌ | Reset password with token |
| POST | `/api/v1/auth/recovery/request` | ❌ | Request account recovery (disable TOTP) |
| POST | `/api/v1/auth/recovery/confirm` | ❌ | Confirm recovery token |
| POST | `/api/v1/auth/mfa/verify` | ❌ | Complete login after TOTP/recovery code |
| POST | `/api/v1/auth/mfa/enroll` | ✅ | Start TOTP enrollment |
| POST | `/api/v1/auth/mfa/confirm` | ✅ | Confirm TOTP + get recovery codes |
| POST | `/api/v1/auth/mfa/disable` | ✅ | Disable TOTP |
| POST | `/api/v1/auth/passkeys/register/options` | ✅ | WebAuthn registration options |
| POST | `/api/v1/auth/passkeys/register/verify` | ✅ | Verify passkey registration |
| POST | `/api/v1/auth/passkeys/authenticate/options` | ❌ | Passkey login options |
| POST | `/api/v1/auth/passkeys/authenticate/verify` | ❌ | Passkey login verify |
| GET | `/api/v1/auth/passkeys` | ✅ | List passkeys |
| DELETE | `/api/v1/auth/passkeys/:id` | ✅ | Remove passkey |
| GET/PATCH | `/api/v1/medical-watch/preferences` | ✅ | Digest opt-in (email CRON stub at 07:00 Paris) |
