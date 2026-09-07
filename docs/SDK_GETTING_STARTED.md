# Developer quick start

1. Start Core with `npm --prefix backend run dev` (the API is at `http://localhost:5001/api/v1`).
2. Call REST endpoints using the interactive docs at `/api/v1/docs`.
3. Python: `pip install farmease`, then use `FarmEase(base_url=...)`.
4. TypeScript: `npm install @farmease/sdk`, then import `@farmease/sdk`.
5. Provider authors should read [Provider Development](PROVIDER_DEVELOPMENT.md), implement the normalized contract, and add fixtures before registering a provider.

Set `FARMEASE_BASE_URL` to a hosted Core URL or use the local default. Provider-backed routes may require configured server credentials; SDKs never receive provider secrets. API authentication, where enabled by the deployment, is supplied with the SDK `token` option.
