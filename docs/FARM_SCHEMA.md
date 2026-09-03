# FarmEase canonical farm schema (draft v0.2)

This contract is the portable representation future FarmEase services should consume. It documents the current farm-management concepts without forcing a database migration. Existing API rows remain backward compatible and can be mapped to this shape.

```json
{
  "id": "farm_01H...",
  "name": "North field",
  "location": {
    "latitude": 17.385,
    "longitude": 78.4867,
    "district": "Hyderabad",
    "state": "Telangana",
    "country": "IN"
  },
  "area": { "value": 2.5, "unit": "acre" },
  "soil": { "type": "loam", "ph": 6.5, "organicCarbonPercent": null },
  "currentCrop": { "name": "rice", "variety": "Sona Masuri" },
  "sowingDate": "2026-06-15",
  "irrigation": { "method": "drip", "waterSource": "borewell" },
  "metadata": { "ownerId": "user_…", "createdAt": "2026-09-03T00:00:00Z" }
}
```

Identifiers are opaque strings; coordinates use WGS84; dates use ISO 8601; areas always carry units. `metadata` is reserved for non-core extension fields. Advice providers must treat missing soil, irrigation, or crop fields as unknown rather than infer values. The runtime validator is `backend/schemas/farm.js`; it intentionally does not migrate or constrain the existing legacy farm tables.
