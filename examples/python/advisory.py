import os
from farmease import FarmEase
farm={'id':'demo','name':'Demo farm','area':{'value':1,'unit':'acre'}}
print(FarmEase(os.getenv('FARMEASE_API_URL', 'http://localhost:5000/api/v1')).advisories({'farm':farm}))
