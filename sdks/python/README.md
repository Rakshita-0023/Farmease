# FarmEase Python SDK

```python
from farmease import FarmEase
client = FarmEase("http://localhost:5000/api/v1")
weather = client.weather.current(lat=28.6, lon=77.2)
prices = client.markets.prices(commodity="wheat")
```

Version `0.1.0`. Responses contain the normalized `data` payload; `FarmEaseError` exposes API code/status/details.
