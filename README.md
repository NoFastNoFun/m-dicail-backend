# m-dicail-backend

Backend monorepo for the m-dicail physiotherapist assistant.

## Stack

- **Runtime** : Node.js 22 / TypeScript
- **Framework** : NestJS 10
- **Base de données** : PostgreSQL 15 via TypeORM
- **Package manager** : pnpm
- **Auth** : JWT (passport-jwt)
- **Conteneurisation** : Docker / Docker Compose

## Architecture

Monorepo NestJS avec deux apps distinctes :

```
Flutter app
    ↓ HTTP REST (JWT)
api (port 8000)          — app principale
    ├─ auth              routes d'authentification
    ├─ notes             classification SOAP + résumé
    └─ patients          (à venir)

ai (port 8001)           — microservice IA
    ├─ PubMed            recherche d'articles scientifiques
    └─ Mistral AI        classification SOAP optimisée (self-hosted via Ollama ou cloud)

postgres (port 5432)     — base de données partagée
```

Les deux apps partagent la lib `libs/shared` (guard JWT, décorateurs `@CurrentUser`, `@Public`).

## Prérequis

- Docker
- Docker Compose

## Installation

**1. Cloner le repo**

```bash
git clone <repo-url>
cd m-dicail-backend
```

**2. Créer le fichier `.env`**

```bash
cp .env.example .env
```

Remplir les variables :

| Variable | Description |
|---|---|
| `PORT` | Port de l'app `api` (ex: `8000`) |
| `AI_PORT` | Port de l'app `ai` (ex: `8001`) |
| `SECRET_KEY` | Clé de signature JWT |
| `POSTGRES_USER` | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL |
| `POSTGRES_DB` | Nom de la base de données |
| `NCBI_API_KEY` | *(optionnel)* Clé API PubMed — sans elle la limite est 3 req/s au lieu de 10. Gratuit sur [ncbi.nlm.nih.gov](https://www.ncbi.nlm.nih.gov/account/) |

**3. Lancer les services**

```bash
docker compose up --build
```

Postgres démarre en premier avec un healthcheck. Les apps `api` et `ai` attendent qu'il soit prêt avant de lancer.

## API

La documentation Swagger est disponible une fois le stack lancé :

- **api** → http://localhost:8000/docs
- **ai** → http://localhost:8001/docs

## Tests

```bash
# Tous les tests
npx jest --no-coverage

# Par service
npx jest notes --no-coverage
npx jest auth --no-coverage
```

## PubMed

Deux APIs NCBI disponibles :

- **E-utilities** — accès à toute la base PubMed (titre, abstract, métadonnées). Gratuite, `NCBI_API_KEY` augmente la limite de 3 à 10 req/s. → [Documentation](https://www.ncbi.nlm.nih.gov/books/NBK25497/)
- **PMC** — texte complet, uniquement pour les publications open access (~40% du catalogue). → [Documentation](https://www.ncbi.nlm.nih.gov/pmc/tools/developers/)
