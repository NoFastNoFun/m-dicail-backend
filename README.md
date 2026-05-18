# m-dicail-backend

Backend monorepo for the m-dicail physiotherapist assistant.

## Architecture

```
Flutter app
    ↓ gRPC
Gateway (port 50051)
    ├─→ anonymization_service (port 50052)
    ├─→ ai_service            (port 50053)
    ├─→ pubmed_service        (port 50054)
    └─→ report_service        (port 50055)
```

## Structure

- `apps/gateway/` — gRPC gateway, entry point for the Flutter client
- `services/` — internal gRPC services (not exposed externally)
- `proto/` — source of truth for all service contracts
- `scripts/` — tooling

## Getting started

### Generate proto stubs

```bash
pip install grpcio-tools
bash scripts/generate_proto.sh
```

### Run with Docker

```bash
docker-compose up --build
```

## Services

| Service | Port | Role |
|---|---|---|
| gateway | 50051 | Entry point, orchestration |
| anonymization_service | 50052 | NLP/NER anonymisation |
| ai_service | 50053 | Mistral inference |
| pubmed_service | 50054 | PubMed search |
| report_service | 50055 | Report / PDF generation |
