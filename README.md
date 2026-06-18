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

All services start automatically. Database migrations run on `auth_service` startup.

## API

The full API documentation (routes, request/response schemas) is available via Swagger once the stack is running:

**http://localhost:8000/docs**

## Run tests

```bash
# auth_service
cd services/auth_service
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/

# patient_service
cd services/patient_service
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/

# session_service
cd services/session_service
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/
```

## API Sessions

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/recording-sessions` | Crée une session. `201`. Backend génère l'`id`. |
| `PUT` | `/recording-sessions/{id}` | Met à jour transcript, soap_note, summary, status. `200`/`404`. |
| `PUT` | `/recording-sessions/{id}/patient` | Associe un patient à la session. `200`/`404`. |
| `GET` | `/recording-sessions/{id}` | Détail d'une session. `200`/`404`. |
| `GET` | `/patients/{id}/recording-sessions` | Historique des sessions d'un patient. `200`. |

Statuts possibles : `draft`, `recording`, `completed`, `failed`.

## PubMed — sources des articles

Il y a deux APIs NCBI distinctes :

- **E-utilities** — donne accès à toute la base PubMed : titre, auteurs, abstract, métadonnées. C'est l'API actuellement intégrée dans le `pubmed_service`. Gratuite, la clé `NCBI_API_KEY` augmente simplement la limite de 3 à 10 req/s. → [Documentation E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25497/)

- **PMC (PubMed Central)** — donne accès au texte complet des articles, mais uniquement pour les publications open access (~40% du catalogue). Les 60% restants sont bloqués par les journaux payants (Elsevier, Springer, etc.). → [Documentation PMC](https://www.ncbi.nlm.nih.gov/pmc/tools/developers/)

Pour le POC on part sur E-utilities (abstracts uniquement) pour valider que ça suffit à l'IA pour générer des recommandations pertinentes. Si les abstracts s'avèrent insuffisants, on pourra compléter avec PMC pour les articles open access.
