# Developer quick start

1. Start Core with `npm --prefix backend run dev` (the API is at `http://localhost:5000/api/v1`).
2. Call REST endpoints using the interactive docs at `/api/v1/docs`.
3. Python: `python -m pip install -e sdks/python`, then use `FarmEase(base_url=...)`.
4. TypeScript: `cd sdks/typescript && npm install && npm run build`, then import `@farmease/sdk`.
5. Provider authors should read [Provider Development](PROVIDER_DEVELOPMENT.md), implement the normalized contract, and add fixtures before registering a provider.

The examples under `examples/python/` use only real Core responses and default to localhost. No SDK command requires production credentials.
