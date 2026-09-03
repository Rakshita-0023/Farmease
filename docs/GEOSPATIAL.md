# Geospatial intelligence

FarmEase stores farm boundaries as WGS84 GeoJSON `Polygon` or `MultiPolygon` objects, alongside the canonical latitude/longitude location. Rings must be closed, contain at least four positions, and use `[longitude, latitude]` coordinates within the WGS84 bounds. Validation happens before a provider is called.

Vegetation observations are normalized into acquisition date, NDVI, NDWI, EVI/SAVI when the source supplies the required bands, cloud coverage, quality state, and provider metadata. A low-quality observation is returned with `usable: false`; missing observations are represented as `status: unavailable`.

The Sentinel-2 adapter is deliberately unavailable until an operator supplies an authorized Copernicus Data Space OAuth token and a project-specific Process API URL/evalscript. Product catalog metadata is never treated as an index observation. FarmEase does not infer disease from vegetation signals.

