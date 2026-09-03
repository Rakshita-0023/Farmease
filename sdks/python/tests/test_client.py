import io, json, unittest
from farmease import FarmEase, FarmEaseError
class Response:
    def __init__(self, value): self.value=value
    def read(self): return json.dumps(self.value).encode()
class ClientTests(unittest.TestCase):
    def test_weather_and_auth(self):
        seen=[]
        def opener(request, timeout): seen.append((request.full_url, request.headers.get('Authorization'), timeout)); return Response({'data': {'temperatureC': 20}})
        self.assertEqual(FarmEase('http://x', token='t', opener=opener).weather.current(lat=1, lon=2), {'temperatureC':20}); self.assertEqual(seen[0][1], 'Bearer t')
    def test_errors(self):
        def opener(request, timeout): return Response({'error': {'code':'BAD','message':'no'}})
        with self.assertRaises(FarmEaseError) as ctx: FarmEase('http://x', opener=opener).markets.prices()
        self.assertEqual(ctx.exception.code, 'BAD')
