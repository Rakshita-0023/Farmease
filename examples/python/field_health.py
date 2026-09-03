import os
from farmease import FarmEase
print(FarmEase(os.getenv('FARMEASE_API_URL', 'http://localhost:5000/api/v1')).field_health(os.getenv('FARM_ID','demo')))
