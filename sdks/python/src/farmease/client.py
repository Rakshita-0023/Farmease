"""Small, dependency-free FarmEase Core client."""
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

class FarmEaseError(Exception):
    def __init__(self, message, *, status=None, code=None, details=None):
        super().__init__(message); self.status = status; self.code = code; self.details = details

class _Resource:
    def __init__(self, client): self.client = client

class _Weather(_Resource):
    def current(self, *, lat, lon, provider=None): return self.client._get('/weather/current', lat=lat, lon=lon, provider=provider)
    def forecast(self, *, lat, lon, provider=None): return self.client._get('/weather/forecast', lat=lat, lon=lon, provider=provider)

class _Markets(_Resource):
    def prices(self, **params): return self.client._get('/markets', **params)

class FarmEase:
    def __init__(self, base_url, *, token=None, timeout=15, opener=urlopen):
        self.base_url = base_url.rstrip('/'); self.token = token; self.timeout = timeout; self.opener = opener
        self.weather = _Weather(self); self.markets = _Markets(self)
    def _request(self, method, path, payload=None, params=None):
        from urllib.parse import urlencode
        query = urlencode({k: v for k, v in (params or {}).items() if v is not None})
        url = f"{self.base_url}{path}" + (f"?{query}" if query else '')
        headers = {'Accept': 'application/json'}
        if self.token: headers['Authorization'] = f'Bearer {self.token}'
        body = None
        if payload is not None: headers['Content-Type'] = 'application/json'; body = json.dumps(payload).encode()
        try:
            response = self.opener(Request(url, data=body, headers=headers, method=method), timeout=self.timeout)
            result = json.loads(response.read().decode())
        except HTTPError as exc:
            try: result = json.loads(exc.read().decode())
            except Exception: result = {}
            err = result.get('error', {}); raise FarmEaseError(err.get('message', str(exc)), status=exc.code, code=err.get('code'), details=err.get('details')) from exc
        except (URLError, TimeoutError, ValueError) as exc: raise FarmEaseError(f'FarmEase request failed: {exc}') from exc
        if 'error' in result:
            err = result['error']; raise FarmEaseError(err.get('message', 'FarmEase API error'), code=err.get('code'), details=err.get('details'))
        return result.get('data')
    def _get(self, path, **params): return self._request('GET', path, params=params)
    def crop_recommendation(self, **context): return self._request('POST', '/crop-recommendation', context)
    def advisories(self, context): return self._request('POST', '/advisories', context)
    def plant_diagnosis(self, image, *, filename='plant.jpg', content_type='image/jpeg'):
        raise FarmEaseError('Plant diagnosis multipart upload is not yet supported by the dependency-free client; use the REST endpoint.')
    def field_health(self, farm_id, *, provider=None): return self._get(f'/farms/{farm_id}/field-health', provider=provider)
    def alerts(self, farm_id): return self._get(f'/farms/{farm_id}/alerts')
    def evaluate_alerts(self, farm_id, context): return self._request('POST', f'/farms/{farm_id}/alerts/evaluate', context)
