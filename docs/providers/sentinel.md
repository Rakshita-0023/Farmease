# Sentinel-2 provider

FarmEase defines a `SatelliteProvider` contract and ships an explicit Sentinel-2 adapter. It is reported as unavailable until configured with `SENTINEL_ACCESS_TOKEN` and `SENTINEL_PROCESS_URL`; no sample or simulated satellite observations are returned.

The adapter is designed around the official Copernicus Data Space Sentinel Hub Process API, which supports AOI/time/cloud filters and band/evalscript processing: <https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html>. Catalog metadata (including cloud cover and GeoJSON footprints) is documented separately at <https://documentation.dataspace.copernicus.eu/APIs/OData.html> and is not used as NDVI. OAuth setup is described in the official getting-started guide: <https://documentation.dataspace.copernicus.eu/notebook-samples/sentinelhub/getting_started/introduction_to_SH_APIs.html>.

Before enabling production use, configure and test an evalscript that returns the bands required by `backend/services/geospatial/vegetation.js`, then add provider fixtures and quality thresholds.

