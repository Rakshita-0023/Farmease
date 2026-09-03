# FarmEase data schemas

The runtime normalizers live in `backend/schemas/`; this document is the public
contract for the first developer-platform release. It is independent of the
legacy database column names.

## Location

```json
{ "country": "IN", "state": "Haryana", "district": "Karnal", "market": "Karnal", "latitude": 29.6857, "longitude": 76.9905 }
```

`country` is ISO 3166-1 alpha-2 when known. Administrative fields and coordinates
are nullable when the source does not provide them. Coordinates are WGS84.

## Commodity

```json
{ "name": "Wheat", "canonicalName": "wheat" }
```

`name` retains the source label; `canonicalName` is a conservative lowercased,
whitespace-normalized matching key. It is not an unverified synonym mapping.

## Market price

```json
{
  "id": "agmarknet:haryana:karnal:karnal:wheat:2026-09-03",
  "commodity": { "name": "Wheat", "canonicalName": "wheat" },
  "variety": { "name": "Dara" },
  "market": { "name": "Karnal", "location": { "country": "IN", "state": "Haryana", "district": "Karnal", "market": "Karnal", "latitude": null, "longitude": null } },
  "price": { "minimumInrPerQuintal": 2200, "maximumInrPerQuintal": 2500, "modalInrPerQuintal": 2400, "unit": { "currency": "INR", "quantity": "quintal", "verified": true } },
  "arrivalDate": "2026-09-03",
  "source": { "provider": "agmarknet", "recordUpdatedAt": "2026-09-03" }
}
```

AGMARKNET’s published resource is a mandi price source whose price fields use
rupees per quintal. `verified: true` denotes that the adapter applies that source
unit, not an independently audited transaction. `/api/v1/markets` returns `[]`
for an empty source result and never replaces it with simulated records.

## Farm

See [FARM_SCHEMA.md](FARM_SCHEMA.md). Runtime validation checks required identity,
name, positive area with `acre` or `hectare`, ISO sowing date, and supplied
coordinates. It is intentionally a reusable contract, not a database migration.
