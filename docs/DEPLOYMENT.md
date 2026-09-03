# FarmEase production deployment

## Published services

- Farmer app: https://farmease.vercel.app/
- Core API: https://farmease-tqgy.onrender.com
- Swagger UI: https://farmease-tqgy.onrender.com/api/v1/docs
- OpenAPI JSON: https://farmease-tqgy.onrender.com/api/v1/openapi.json
- ML service: https://farmease-plant-doctor.onrender.com

## Render Core service

Use the repository root as the source and `backend` as the Render Root Directory, or use equivalent commands from the repository root:

- Runtime: Node 20 (the repository declares `>=20 <23`)
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/api/v1/health`

When the root directory is the repository root instead, use `npm ci --prefix backend` as the build command and `node backend/server.js` as the start command. The server always binds to `0.0.0.0` and uses Render's `PORT`.

The process binds before database initialization. `/api/v1/health` reports process health immediately and exposes database readiness separately; it does not wait for providers or the database. Database-backed requests return clear errors while a configured database is unavailable.

## Render ML service

Set the Root Directory to `ml-service`:

- Build command: `pip install -r requirements.txt`
- Start command: `./start.sh`
- Health check path: `/health`

The service binds Uvicorn to `0.0.0.0:${PORT:-10000}`. Model downloads are disabled by default so external storage cannot block startup. Bundled models are used when present; crop recommendation remains explicitly rule-based when the crop model is unavailable, and plant diagnosis returns HTTP 503 when its disease model is unavailable. To opt into controlled artifact downloads, set `FARMEASE_DOWNLOAD_MODELS=true` and provide the corresponding URL or Google Drive ID variables.

## Required Core environment variables

- `JWT_SECRET`: strong unique production secret; required for signing authentication tokens.
- `DATABASE_URL`: persistent PostgreSQL URL for Render production. Do not use local SQLite for persistent production data.
- `CORS_ORIGINS`: explicit comma-separated origins, including `https://farmease.vercel.app`.
- `ML_API_URL`: `https://farmease-plant-doctor.onrender.com` for crop recommendation.
- `PLANT_DOCTOR_API_URL`: `https://farmease-plant-doctor.onrender.com` for plant diagnosis, if overriding the default.
- `MARKET_DATA_MODE`: `LIVE`.

Optional Core variables:

- `AGMARKNET_API_KEY`: data.gov.in key for live market prices; without it, market requests return a documented 503 provider-not-configured response.
- `SENTINEL_ACCESS_TOKEN` and `SENTINEL_PROCESS_URL`: required together for field-health observations; without them, field health returns a documented 503 degraded response.
- `GOOGLE_CLIENT_ID`: only if Google sign-in is enabled.
- `OPENWEATHER_API_KEY`: legacy optional integration; Open-Meteo weather does not require a key.

## Database behavior and checks

Render production requires a persistent PostgreSQL `DATABASE_URL`. Startup tests the connection and creates missing non-destructive tables with `CREATE TABLE IF NOT EXISTS`; it does not wipe data or run destructive migrations. The SQLite setup command is for local development only: `npm --prefix backend run db:setup`.

After deployment, verify `/api/v1/health`, `/api/v1/providers`, `/api/v1/docs`, and `/api/v1/openapi.json`. Weather uses live Open-Meteo. Markets use live AGMARKNET only when configured and never return demo records. Sentinel and plant diagnosis remain honest degraded responses when their optional credentials/models are unavailable.

Review `SECURITY.md` before exposing the service publicly. Keep secrets in Render/Vercel environment settings, never in the repository.
