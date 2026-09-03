# FarmEase Core deployment

FarmEase Core is a conventional Node/Express service. Provide Node 20+, a persistent PostgreSQL/MySQL `DATABASE_URL` in production, and a strong `JWT_SECRET`. Run `npm ci --prefix backend`, `npm --prefix backend run db:setup`, then `npm --prefix backend start`. The service listens on `PORT` (default 5001); health is `/api/v1/health` and interactive OpenAPI is `/api/v1/docs`.

Set `CORS_ORIGINS` to an explicit comma-separated allowlist. Provider credentials (`AGMARKNET_API_KEY`, `SENTINEL_ACCESS_TOKEN`, and ML URLs) are environment variables only. Keep `MARKET_DATA_MODE=LIVE` in production; `/api/v1` never uses demo data. Put TLS, request-rate limiting, log retention, and secret management at the hosting edge. Review `SECURITY.md` before exposing the service publicly.

A deployment must fail clearly when its database is unavailable; do not rely on in-memory storage for production data. No Docker/Kubernetes configuration is required by the project.
