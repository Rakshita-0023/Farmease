# Developing a FarmEase provider

FarmEase providers adapt a specific source into the platform’s stable contracts;
they do not expose a vendor payload directly. The reference implementation is in
`backend/services/providers/` and registry wiring is in
`backend/services/providers/index.js`.

## Contract

Every provider declares a stable `id`, a `domain` (`weather` or `markets`), an
array of `capabilities`, and `getStatus()`. Weather providers implement
`getCurrentWeather({ latitude, longitude })` and `getForecast(location)`.
Market providers implement `getPrices({ commodity, state, district, market,
limit, offset })`. Return the schemas from `backend/schemas/`, never the upstream
response or substitute sample data.

Use `ProviderError` for known failures:

| Code | Meaning | HTTP status |
| --- | --- | --- |
| `PROVIDER_NOT_CONFIGURED` | A required credential/configuration is absent. | 503 |
| `PROVIDER_NOT_FOUND` | The requested `?provider=` is not registered for that domain. | 400 |
| `PROVIDER_TIMEOUT` | The source did not respond within its explicit timeout. | 504 |
| `PROVIDER_UNAVAILABLE` | A retryable source/network failure persisted. | 503 |
| `PROVIDER_BAD_RESPONSE` | The source response cannot be normalized safely. | 502 |

## Implementation checklist

1. Read the source’s official API documentation, licence/terms, rate limits, and
   attribution requirements. Add a source note under `docs/providers/`.
2. Create an adapter under the appropriate provider domain. Inject its HTTP
   client, credentials, base URL, and timeout in the constructor so tests can
   avoid real network calls.
3. Route every external request through `requestWithReliability`. Use an explicit
   timeout, limited retries only for retryable errors, and bounded backoff.
4. Validate and normalize the result with `backend/schemas/`. Missing or malformed
   values must produce a provider error, not guessed data.
5. Add the adapter to `createProviderRegistry`. Capabilities and configuration
   status are surfaced by `GET /api/v1/providers`.
6. Add mocked unit tests for success normalization, malformed data, timeout/retry,
   filtering, and an empty but valid response. Do not add live-source tests to CI.
7. Update `backend/openapi/v1.js`, README, environment examples, and the provider
   table if a public endpoint becomes available.

## Caching and observability

The router’s `ProviderExecutor` owns TTL caching: five minutes for current
weather, thirty minutes for forecasts, and ten minutes for market prices. Keep
provider methods pure so cache keys are deterministic. Structured log events
include provider, operation, request ID, cache hit/miss, latency, and safe error
codes. Never put API keys, raw authorization headers, farmer identities, or
upload contents in logs.

The in-memory cache is deliberately lightweight and process-local. A shared cache
adapter is a future contribution; it must preserve the same TTL and no-error-cache
semantics.
