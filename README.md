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
```

Activate the virtual environment depending on your OS:

```bash
# Windows (PowerShell) — venv creates: Include/, Lib/, Scripts/
.\.venv\Scripts\Activate.ps1

# macOS / Linux — venv creates: include/, lib/, bin/
source .venv/bin/activate
```

Then install dependencies:

```bash
pip install fastapi uvicorn httpx pydantic
```

### Run with Docker

```bash
docker-compose up --build
```

## API

### Docs accessible here
- Gateway: http://localhost:8000/docs

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

---

## Schemas

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
