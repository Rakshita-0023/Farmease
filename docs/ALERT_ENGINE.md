# Alert engine

The alert engine is deterministic and source-transparent. Rules compare observed weather, market, vegetation, or observation-age values against an explicit threshold. Each alert includes severity, trigger, observed value, threshold, source, and evaluation timestamp.

Supported rule types are `heavy_rain`, `temperature_threshold`, `market_price_threshold`, `vegetation_decline`, and `stale_observation`. Rules are validated and kept in memory for the current process; persistent rule storage is planned. Re-evaluating a farm replaces alerts for that farm using stable `ruleId:source` identifiers, making repeated evaluations idempotent.

Vegetation alerts describe a stress signal only. They are not a disease or agronomic diagnosis.

