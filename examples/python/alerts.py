import os
from farmease import FarmEase
farm={'id':'demo','name':'Demo farm','area':{'value':1,'unit':'acre'}}
client=FarmEase(os.getenv('FARMEASE_API_URL', 'http://localhost:5000/api/v1'))
print(client.evaluate_alerts('demo', {'farm':farm,'weather':{'precipitationMm':25},'rules':[{'id':'rain','type':'heavy_rain','threshold':20}]}))
