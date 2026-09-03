# FarmEase roadmap

This roadmap describes intent, not shipped functionality. Integration work is accepted only where data access, licensing, reliability, and maintenance are clear.

## v0.1 — Open-source foundation

- Repository cleanup, configuration examples, governance, security policy, and CI.
- Provider-oriented weather and market contracts.
- Normalized `/api/v1` endpoints, farm schema documentation, focused tests, and reproducible SQLite setup.

## v0.2 — India agricultural data (in progress)

- Provider registry, provider status endpoint, normalized location/commodity/
  market price/farm schemas, and AGMARKNET filtering/pagination.
- IMD and eNAM access research documented; neither source is enabled until
  production access terms are confirmed.
- Remaining: approved IMD access, AGMARKNET alias/freshness work, and an eNAM
  integration decision.

## v0.3 — Agricultural intelligence (in progress)

- Explainable advisory engine over canonical farm/weather context, standardized
  ML response provenance, and a knowledge-provider boundary.
- Remaining: approved ICAR/government knowledge source, model evaluation manifests,
  and crop-stage-specific rules reviewed by agronomists.

## v0.4 — Geospatial intelligence

- Sentinel provider research, NDVI/NDWI, field health monitoring, and alerts.

## v0.5 — Developer ecosystem

- Python SDK, TypeScript SDK, provider developer kit, caching adapters, and observability.

## Future research

OpenAgriNet; AgriStack/UFSI where publicly accessible and legally appropriate; multilingual voice interfaces; and offline-first farmer workflows.
## v0.4 — Geospatial intelligence and alerts (in progress)

* GeoJSON farm boundaries and validation
* Satellite provider contract and Sentinel-2 unavailable state
* normalized NDVI/NDWI/EVI/SAVI observations
* deterministic field-health alerts
