# FarmEase advisory engine

`POST /api/v1/advisories` is a small, deterministic decision-support layer over
canonical farm context and normalized provider output. It is not a chatbot and it
does not invent crop prescriptions. The engine currently contains transparent
operational signals for reported temperature, precipitation, humidity, missing
context, and sowing-date context.

## Request

```json
{
  "farm": {
    "id": "farm-1", "name": "North field",
    "location": { "country": "IN", "state": "Haryana", "district": "Karnal", "latitude": 29.68, "longitude": 76.99 },
    "area": { "value": 2.5, "unit": "acre" },
    "currentCrop": { "name": "wheat", "variety": "Dara" },
    "sowingDate": "2026-08-01",
    "soil": { "type": "loam" }, "irrigation": { "method": "drip" }
  },
  "weather": { "temperatureC": 36, "humidityPercent": 72, "precipitationMm": 0 }
}
```

Weather may be omitted when the farm location has coordinates. The route then
fetches a normalized current result from the selected weather provider and marks
`meta.weatherStatus` as `fetched` or `cached`. If that provider is unavailable,
the response remains explicit and degraded: weather-backed signals are omitted,
`meta.weatherStatus` is `unavailable`, and the result contains a weather-unavailable
advisory. No weather value is guessed.

## Explainability and provenance

Each advisory includes `reasons` containing the observed values and threshold used,
plus a `basis` such as `weather-threshold` or `context`. Thresholds are alerting
heuristics, not agronomic guarantees. The response includes engine version and a
`sources` array. It is empty until a trusted knowledge provider is configured;
contributors must attach citations from approved ICAR or government material
before adding factual recommendations.

The extension point is `KnowledgeProvider.findSources(context)`. A future provider
may return citation metadata (`publisher`, `title`, `url`, `accessedAt`, and
source version) but must not silently rewrite or manufacture advisory text.

## Safety boundaries

- Invalid canonical farms are rejected with `VALIDATION_ERROR`.
- Missing soil, irrigation, or crop data produces a context notice rather than an
  inferred value.
- Crop recommendation confidence is `null` for rule-based fallback output.
- Plant diagnosis returns a clear service error when its model is unavailable;
  there is no fallback disease label.
- Advisory output is decision support and should be reviewed against local
  agronomists, crop stage, cultivar, and current official guidance.
