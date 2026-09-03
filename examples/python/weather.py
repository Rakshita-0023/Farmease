import os
from farmease import FarmEase
client = FarmEase(os.getenv('FARMEASE_API_URL', 'http://localhost:5000/api/v1'))
print(client.weather.current(lat=float(os.getenv('LAT', 28.6)), lon=float(os.getenv('LON', 77.2))))
