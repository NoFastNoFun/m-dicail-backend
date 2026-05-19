# m-dicail-backend

Backend monorepo for the m-dicail physiotherapist assistant.

## Architecture

```
Flutter app
    ↓ HTTP REST
Gateway (port 8000)
    ├─→ anonymization_service (port 8001)
    ├─→ ai_service            (port 8002)
    ├─→ pubmed_service        (port 8003)
    └─→ report_service        (port 8004)
```

## Structure

- `apps/gateway/` — REST gateway, entry point for the Flutter client
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

## Getting started

### Local setup

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1   # Windows
pip install fastapi uvicorn httpx pydantic
```

### Run with Docker

```bash
docker-compose up --build
```

## API

### Gateway endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/notes/process` | Anonymize a clinical note and get an AI response |
| POST | `/recommendations` | Get clinical recommendations from AI + PubMed |
| POST | `/reports/generate` | Generate a text or PDF report |

### Internal service endpoints

| Service | Port | Endpoint | Description |
|---|---|---|---|
| anonymization_service | 8001 | `POST /anonymize` | NLP/NER PII anonymization |
| ai_service | 8002 | `POST /generate` | Mistral inference |
| pubmed_service | 8003 | `POST /search` | PubMed article search |
| report_service | 8004 | `POST /generate` | Report / PDF generation |
