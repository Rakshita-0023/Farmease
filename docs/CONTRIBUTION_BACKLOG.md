# Contribution backlog

These are GitHub-ready, scoped issues. Provider tasks must respect source licenses, terms, rate limits, and privacy requirements.

## Good first issue

### Add Marathi translations

**Problem:** the reference app currently has limited language coverage. **Expected behavior:** add Marathi strings with English fallback. **Area:** `frontend/src/i18n.js`. **Acceptance:** dashboard/auth strings render, no duplicate keys, build passes. **Difficulty:** easy.

### Add Punjabi translations

**Problem:** Punjabi users lack localized UI. **Expected behavior:** add a Punjabi locale and switch option. **Area:** `frontend/src/i18n.js`, locale selector. **Acceptance:** core navigation/auth text translates and fallback is tested manually. **Difficulty:** easy.

### Document provider error codes

**Problem:** consumers need a stable failure reference. **Expected behavior:** document `VALIDATION_ERROR`, `PROVIDER_NOT_CONFIGURED`, and unavailable codes. **Area:** README/docs. **Acceptance:** examples match `backend/routes/v1.js`. **Difficulty:** easy.

### Add Open-Meteo normalization cases

**Problem:** uncommon WMO codes need coverage. **Expected behavior:** test fog, snow, and thunderstorm mappings. **Area:** weather provider tests. **Acceptance:** no HTTP requests; mappings are deterministic. **Difficulty:** easy.

## Help wanted

### Normalize AGMARKNET commodity names

**Problem:** spelling/variety differences prevent comparisons. **Expected behavior:** documented canonical commodity aliases without altering raw source fields. **Area:** market provider. **Acceptance:** fixtures cover aliases and ambiguous values remain untouched. **Difficulty:** medium.

### Add Redis caching adapter

**Problem:** provider calls need optional shared caching. **Expected behavior:** TTL cache interface with in-memory default. **Area:** `backend/services/providers/`. **Acceptance:** cache disabled without Redis, cache tests cover expiry. **Difficulty:** medium.

### Provider observability metrics

**Problem:** failures and freshness are opaque. **Expected behavior:** opt-in metrics for latency, failures, and record counts. **Area:** Core provider layer. **Acceptance:** no personal data/secret labels; documented endpoint or exporter. **Difficulty:** medium.

### Improve plant diagnosis error metadata

**Problem:** callers cannot distinguish bad images from unavailable models. **Expected behavior:** stable, safe error codes. **Area:** ML service and v1 route. **Acceptance:** malformed image, missing model, upstream timeout tests. **Difficulty:** medium.

## Feature

### Add an IMD weather provider

**Problem:** India-specific source coverage is a roadmap need. **Expected behavior:** provider behind an explicit selection/configuration policy. **Area:** weather providers. **Acceptance:** legal/public access confirmed, normalized contract, mocked tests, documented limits. **Difficulty:** hard.

### Export farm schema as JSON Schema

**Problem:** the runtime validator is not yet consumable by non-JavaScript clients. **Expected behavior:** publish a versioned JSON Schema alongside the runtime validator. **Area:** `backend/schemas/`, `docs/FARM_SCHEMA.md`. **Acceptance:** valid/invalid fixtures agree with the runtime contract and legacy rows map without data loss. **Difficulty:** medium.

### TypeScript SDK skeleton

**Problem:** web consumers repeat request/envelope code. **Expected behavior:** generated-or-handwritten v1 client shell. **Area:** new `sdk/typescript/`. **Acceptance:** weather/market examples and CI typecheck. **Difficulty:** medium.

### Python SDK skeleton

**Problem:** data/ML users need a Python entry point. **Expected behavior:** v1 client shell. **Area:** new `sdk/python/`. **Acceptance:** health/weather examples and isolated tests. **Difficulty:** medium.

### API rate limiting adapter

**Problem:** in-memory per-process limiting is unsuitable for production. **Expected behavior:** configurable proxy-safe/store-backed limiter. **Area:** backend middleware. **Acceptance:** documented limits, tests, and no auth bypass. **Difficulty:** medium.

### Provider development kit

**Problem:** provider contributions lack scaffolding. **Expected behavior:** template, test fixture, and checklist. **Area:** `docs/`, provider directory. **Acceptance:** a sample provider passes tests. **Difficulty:** medium.

## Research

### eNAM provider research spike

**Problem:** eNAM feasibility is unknown. **Expected behavior:** a no-code findings document. **Area:** `docs/research/`. **Acceptance:** access terms, endpoint status, schema fit, and go/no-go recommendation. **Difficulty:** medium.

### Sentinel provider proposal

**Problem:** geospatial roadmap needs a lawful technical plan. **Expected behavior:** proposal for field geometry, NDVI/NDWI, costs, cadence, and privacy. **Area:** `docs/research/`. **Acceptance:** no unsupported implementation claims. **Difficulty:** hard.

### AGMARKNET freshness study

**Problem:** arrival dates are not observation timestamps. **Expected behavior:** document freshness semantics and edge cases. **Area:** market provider/docs. **Acceptance:** proposal for UI/API labels and fixture examples. **Difficulty:** medium.

## Documentation

### Add generated SDK examples from OpenAPI

**Problem:** consumers still hand-write envelope parsing. **Expected behavior:** publish small language-specific examples generated or checked from the validated Core contract. **Area:** `backend/openapi/v1.js`, `docs/`, future `sdk/`. **Acceptance:** health/weather/markets/crop/diagnosis examples match the validator and include provider errors. **Difficulty:** medium.

### Local deployment guide

**Problem:** deployment notes predate the Core structure. **Expected behavior:** a concise SQLite/Postgres and frontend/ML deployment guide. **Area:** `docs/`. **Acceptance:** no real URLs/credentials, environment list matches examples. **Difficulty:** easy.

### ML evaluation documentation

**Problem:** model limitations are incomplete. **Expected behavior:** extend model card with provenance and evaluation once sources are known. **Area:** `ml-service/MODEL_CARD.md`. **Acceptance:** cite reproducible source material; do not fabricate metrics. **Difficulty:** medium.
