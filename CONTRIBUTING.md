# Contributing to FarmEase

FarmEase combines a reference farmer application with reusable agricultural data and intelligence services. Contributions should preserve that distinction: app-specific behavior belongs in `frontend/`; reusable provider and normalized API work belongs in `backend/services/providers/` and `backend/routes/v1.js`.

## Repository map

- `frontend/` — React + Vite reference farmer web application.
- `backend/` — Express API, SQLite/PostgreSQL/MySQL adapters, legacy compatibility routes, and FarmEase Core v1 routes.
- `ml-service/` — FastAPI crop recommendation and plant diagnosis service.
- `docs/` — public contracts, roadmap, farm schema, and contribution backlog.
- `backend/migrations/` — reproducible SQLite schema setup.

## Local setup

Use Node 20+ and Python 3.10–3.12 where TensorFlow supports your platform.

```bash
git clone https://github.com/Rakshita-0023/Farmease.git
cd Farmease
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ml-service/.env.example ml-service/.env
npm ci --prefix backend
npm ci --prefix frontend
npm --prefix backend run db:setup
python -m venv ml-service/.venv
ml-service/.venv/bin/pip install -r ml-service/requirements.txt
```

Run the services in separate terminals:

```bash
npm run backend:dev
npm run frontend:dev
cd ml-service && .venv/bin/uvicorn app:app --reload --port 8000
```

The Vite frontend is served at `http://localhost:5173`; it proxies `/api` to the backend at port 5001. `AGMARKNET_API_KEY`, Google OAuth, and OpenWeatherMap are optional integrations. Open-Meteo needs no key. Never commit `.env` files or model credentials.

## Tests and checks

```bash
npm --prefix backend test
npm --prefix backend run openapi:validate
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
cd ml-service && FARMEASE_SKIP_MODEL_LOADING=true .venv/bin/python -m unittest discover -s tests
```

The backend test script builds an ignored `.test-farmease.db` from SQL migrations, so tests never require a committed database file. Mock external HTTP calls in provider tests; do not make CI depend on API keys or live providers.

## Provider contributions

Providers are intentionally small adapters with a stable FarmEase-shaped return value. Add a provider under `backend/services/providers/<domain>/`, give it a stable `id`, inject the HTTP client in its constructor, validate upstream payloads, and expose only normalized fields. Advisory and knowledge contributions belong under `backend/services/advisory/` and `backend/services/knowledge/`; they must expose reasons and source metadata rather than generated prose. A provider must:

1. document credentials, source terms, rate limits, and data freshness;
2. throw a clear `PROVIDER_NOT_CONFIGURED` or provider failure instead of fabricating data;
3. have unit tests for normalization and upstream failure;
4. be registered only after its API contract and tests are ready.

Follow the concrete contract, failure codes, cache behavior, and checklist in
[the provider development guide](docs/PROVIDER_DEVELOPMENT.md). Core API changes
also require updating `backend/openapi/v1.js` and running its validator.

## Pull requests

Use branches such as `feat/agmarknet-normalization`, `fix/weather-validation`, or `docs/provider-guide`. Keep commits focused and use imperative Conventional Commit-style subjects when practical, for example `feat(api): add market provider contract`.

Before opening a PR, rebase on the default branch, run the relevant checks, explain user-visible behavior and migration/configuration changes, and link the issue. Do not mix reformatting, generated files, or unrelated cleanup with a functional change. Small, well-scoped issues in [the contribution backlog](docs/CONTRIBUTION_BACKLOG.md) are good first contributions.
## SDKs and providers

SDK changes must preserve the normalized Core envelope and include mocked tests. Provider contributions should implement the domain contract, return canonical schemas, declare configuration status, set timeouts, and include deterministic fixtures. Use `feat/sdk-...` or `feat/provider-...` branch names.
