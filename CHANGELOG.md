# Changelog

FarmEase follows Keep a Changelog-style release notes. The project has not yet
published a tagged open-source release.

## Unreleased — v0.1 foundation

- Added versioned FarmEase Core API endpoints and provider-oriented weather and market adapters.
- Added reproducible local SQLite schema setup, focused API tests, and CI.
- Removed embedded provider credentials from source and documented configuration.
- Added open-source governance, security, roadmap, and contributor materials.

## Unreleased — v0.2 developer platform

- Added a provider registry, provider status/capability API, request IDs,
  structured provider events, bounded retry/backoff, and TTL cache semantics.
- Added reusable location, commodity, market-price, and runtime farm schemas.
- Expanded AGMARKNET normalization and real-result filtering/pagination; Core v1
  continues to return no simulated weather or market data.
- Added OpenAPI 3.0 source, validation script, and Swagger UI at `/api/v1/docs`.
- Added IMD/eNAM access research and a provider contribution guide.

## Unreleased — v0.3 agricultural intelligence

- Added `POST /api/v1/advisories`, deterministic explainable weather/context
  signals, canonical farm validation, and a citation-ready knowledge-provider
  boundary.
- Standardized crop recommendation and plant diagnosis metadata, fallback flags,
  confidence handling, and degraded model behavior.
- Expanded the ML model card with provenance and evaluation limitations.
## Unreleased

### Added

* GeoJSON farm boundaries, vegetation normalization, field-health API, and deterministic alert APIs.
* Satellite provider contract with explicit Sentinel-2 configuration and unavailable behavior.
