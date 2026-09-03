const { createV1Router } = require('../routes/v1');
const { ProviderRegistry } = require('../services/core/providerRegistry');
const { ProviderExecutor, TtlCache } = require('../services/core/reliability');
const { ProviderError } = require('../services/core/providerError');

const invoke = async (router, path, method, request = {}) => {
  const layer = router.stack.find(candidate => candidate.route?.path === path && candidate.route.methods[method]);
  if (!layer) throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  const handler = layer.route.stack[0].handle;
  return new Promise((resolve, reject) => {
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { resolve({ status: this.statusCode, body }); } };
    Promise.resolve(handler({ query: {}, body: {}, headers: {}, ...request }, response)).catch(reject);
  });
};

const silentLogger = { info: jest.fn(), warn: jest.fn() };
const weather = (id, result = { temperatureC: 28, condition: { code: 'clear', summary: 'Clear sky' } }) => ({ id, domain: 'weather', capabilities: ['current-weather'], getStatus: () => ({ configured: true, available: true }), getCurrentWeather: jest.fn().mockResolvedValue(result), getForecast: jest.fn().mockResolvedValue([]) });
const market = (id, records = []) => ({ id, domain: 'markets', capabilities: ['market-prices'], getStatus: () => ({ configured: true, available: true }), getPrices: jest.fn().mockResolvedValue(records) });
const registryOf = (...providers) => providers.reduce((registry, provider) => registry.register(provider), new ProviderRegistry());

describe('FarmEase Core v1 API', () => {
  test('uses selected provider, normalized output, request ID, and standard envelope', async () => {
    const primary = weather('open-meteo');
    const selected = weather('test-weather', { temperatureC: 31, condition: { code: 'rain', summary: 'Rain' } });
    const result = await invoke(createV1Router({ registry: registryOf(primary, selected), logger: silentLogger }), '/weather/current', 'get', { query: { lat: '17.385', lon: '78.4867', provider: 'test-weather' }, headers: { 'x-request-id': 'request_1234' } });
    expect(result.status).toBe(200);
    expect(result.body.data.temperatureC).toBe(31);
    expect(result.body.meta).toMatchObject({ provider: 'test-weather', requestId: 'request_1234', cache: 'miss' });
    expect(selected.getCurrentWeather).toHaveBeenCalledWith({ latitude: 17.385, longitude: 78.4867 });
    expect(primary.getCurrentWeather).not.toHaveBeenCalled();
  });

  test('rejects invalid providers and coordinates using predictable errors', async () => {
    const router = createV1Router({ registry: registryOf(weather('open-meteo'), market('agmarknet')), logger: silentLogger });
    const invalidCoordinates = await invoke(router, '/weather/current', 'get', { query: { lat: '120', lon: '78' } });
    expect(invalidCoordinates.status).toBe(400);
    expect(invalidCoordinates.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    const invalidProvider = await invoke(router, '/weather/current', 'get', { query: { lat: '17', lon: '78', provider: 'nope' } });
    expect(invalidProvider.status).toBe(400);
    expect(invalidProvider.body.error.code).toBe('PROVIDER_NOT_FOUND');
  });

  test('returns timeout/unavailable errors without fabricating weather', async () => {
    const failing = weather('slow-weather');
    failing.getCurrentWeather.mockRejectedValue(new ProviderError('PROVIDER_TIMEOUT', 'timed out', { status: 504 }));
    const result = await invoke(createV1Router({ registry: registryOf(failing, market('agmarknet')), logger: silentLogger }), '/weather/current', 'get', { query: { lat: '17', lon: '78' } });
    expect(result.status).toBe(504);
    expect(result.body.error.code).toBe('PROVIDER_TIMEOUT');
  });

  test('passes filter and pagination query to market providers and preserves empty real results', async () => {
    const agmarknet = market('agmarknet', []);
    const result = await invoke(createV1Router({ registry: registryOf(weather('open-meteo'), agmarknet), logger: silentLogger }), '/market-prices', 'get', { query: { commodity: 'wheat', state: 'Haryana', district: 'Karnal', limit: '2', offset: '4' } });
    expect(result.status).toBe(200);
    expect(result.body.data).toEqual([]);
    expect(result.body.meta).toMatchObject({ provider: 'agmarknet', count: 0, pagination: { limit: 2, offset: 4, nextOffset: null } });
    expect(agmarknet.getPrices).toHaveBeenCalledWith({ commodity: 'wheat', state: 'Haryana', district: 'Karnal', market: null, limit: 2, offset: 4 });
  });

  test('lists provider capabilities and statuses', async () => {
    const result = await invoke(createV1Router({ registry: registryOf(weather('open-meteo'), market('agmarknet')), logger: silentLogger }), '/providers', 'get');
    expect(result.status).toBe(200);
    expect(result.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'open-meteo', domain: 'weather' }), expect.objectContaining({ id: 'agmarknet', domain: 'markets' })]));
  });

  test('caches matching provider requests and records hit/miss', async () => {
    let now = 0;
    const cache = new TtlCache({ now: () => now });
    const executor = new ProviderExecutor({ cache, logger: silentLogger });
    const provider = weather('open-meteo');
    await executor.execute({ provider, operation: 'getCurrentWeather', input: { latitude: 17, longitude: 78 }, requestId: 'one', ttlMs: 1000 });
    const cached = await executor.execute({ provider, operation: 'getCurrentWeather', input: { longitude: 78, latitude: 17 }, requestId: 'two', ttlMs: 1000 });
    expect(cached.cache).toBe('hit');
    expect(provider.getCurrentWeather).toHaveBeenCalledTimes(1);
    now = 1001;
    await executor.execute({ provider, operation: 'getCurrentWeather', input: { latitude: 17, longitude: 78 }, requestId: 'three', ttlMs: 1000 });
    expect(provider.getCurrentWeather).toHaveBeenCalledTimes(2);
  });

  test('generates an advisory envelope and degrades clearly when the weather provider is unavailable', async () => {
    const failing = weather('open-meteo');
    failing.getCurrentWeather.mockRejectedValue(new Error('offline'));
    const farm = { id: 'farm-1', name: 'Field', location: { latitude: 17, longitude: 78 }, area: { value: 1, unit: 'acre' }, currentCrop: { name: 'rice' } };
    const result = await invoke(createV1Router({ registry: registryOf(failing, market('agmarknet')), logger: silentLogger }), '/advisories', 'post', { body: { farm } });
    expect(result.status).toBe(200);
    expect(result.body.data.advisories).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'weather-unavailable' })]));
    expect(result.body.meta).toMatchObject({ weatherStatus: 'unavailable', weatherProvider: 'open-meteo' });
  });
});
