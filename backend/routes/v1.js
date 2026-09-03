const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const { createProviderRegistry } = require('../services/providers');
const { ProviderExecutor, structuredLogger, requestWithReliability } = require('../services/core/reliability');
const { ProviderError, normalizeProviderError } = require('../services/core/providerError');
const { parseCoordinates, parseMarketLocation, parseCommodity, cleanText, validateFarm } = require('../schemas');
const { normalizePlantDiagnosis } = require('../schemas/intelligence');
const { CropIntelligenceService, validateCropInput } = require('../services/cropIntelligenceService');
const { AdvisoryEngine, validateAdvisoryInput } = require('../services/advisory/advisoryEngine');
const { normalizeFieldHealth } = require('../services/geospatial/fieldHealthService');
const { validateAlertRule, evaluateAlerts } = require('../services/alerts/alertEngine');
const { openApiDocument } = require('../openapi/v1');

const timestamp = () => new Date().toISOString();
const safeRequestId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value) ? value : crypto.randomUUID();
const requestIdOf = (req) => req.requestId || (req.requestId = safeRequestId(req.headers?.['x-request-id']));
const responseMeta = (req, meta = {}) => ({ timestamp: timestamp(), requestId: requestIdOf(req), ...meta });
const data = (req, res, payload, meta = {}, status = 200) => res.status(status).json({ data: payload, meta: responseMeta(req, meta) });
const error = (req, res, status, code, message, details) => res.status(status).json({ error: { code, message, ...(details ? { details } : {}) }, meta: responseMeta(req) });

const coordinateQuery = (query) => {
  const parsed = parseCoordinates(query);
  return parsed.issue ? parsed : { latitude: parsed.value.latitude, longitude: parsed.value.longitude };
};
const paginationQuery = (query) => {
  const limit = query.limit === undefined ? 50 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  const issues = [];
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) issues.push({ field: 'limit', message: 'must be an integer between 1 and 100' });
  if (!Number.isInteger(offset) || offset < 0 || offset > 10000) issues.push({ field: 'offset', message: 'must be an integer between 0 and 10000' });
  return { issues, value: { limit, offset } };
};
const sendProviderError = (req, res, cause, providerId) => {
  const providerError = normalizeProviderError(cause, providerId);
  return error(req, res, providerError.status, providerError.code, providerError.message);
};

const createV1Router = ({ registry, weatherProvider, marketProvider, satelliteProvider, executor, logger = structuredLogger(console), cropService = new CropIntelligenceService(), advisoryEngine = new AdvisoryEngine(), farmResolver = async () => null, plantDoctorUrl = process.env.PLANT_DOCTOR_API_URL || process.env.ML_API_URL || process.env.PLANT_DOCTOR_LOCAL_API_URL || 'http://127.0.0.1:8000', plantDoctorClient = axios, readiness = () => ({ status: 'unknown' }) } = {}) => {
  const providerRegistry = registry || createProviderRegistry({ weatherProvider, marketProvider, satelliteProvider });
  const providerExecutor = executor || new ProviderExecutor({ logger });
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, callback) => callback(null, /^image\/(jpeg|png|webp)$/i.test(file.mimetype)) });

  router.use((req, res, next) => {
    req.requestId = safeRequestId(req.get('X-Request-Id'));
    res.set('X-Request-Id', req.requestId);
    next();
  });
  router.get('/openapi.json', (req, res) => res.json(openApiDocument));
  router.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: 'FarmEase Core API docs' }));
  router.get('/health', (req, res) => data(req, res, { status: 'ok', service: 'FarmEase Core API', version: 'v1', database: readiness(), providers: providerRegistry.describe() }));
  router.get('/providers', (req, res) => data(req, res, providerRegistry.describe()));

  const weatherRoute = (operation, ttlMs) => async (req, res) => {
    const coordinates = coordinateQuery(req.query);
    if (coordinates.issue) return error(req, res, 400, 'VALIDATION_ERROR', 'Invalid location query', [coordinates.issue]);
    let provider;
    try {
      provider = providerRegistry.get('weather', req.query.provider);
      const result = await providerExecutor.execute({ provider, operation, input: coordinates, requestId: requestIdOf(req), ttlMs });
      return data(req, res, result.value, { provider: provider.id, cache: result.cache });
    } catch (cause) {
      return sendProviderError(req, res, cause, provider?.id || req.query.provider || 'weather provider');
    }
  };
  router.get('/weather/current', weatherRoute('getCurrentWeather', 5 * 60 * 1000));
  router.get('/weather/forecast', weatherRoute('getForecast', 30 * 60 * 1000));

  const prices = async (req, res) => {
    const pagination = paginationQuery(req.query);
    const marketLocation = parseMarketLocation(req.query);
    const commodity = parseCommodity(req.query.commodity);
    const providerName = cleanText(req.query.provider, 'provider', { max: 80 });
    const issues = [...pagination.issues, ...marketLocation.issues];
    if (commodity.issue) issues.push(commodity.issue);
    if (providerName.issue) issues.push(providerName.issue);
    if (issues.length) return error(req, res, 400, 'VALIDATION_ERROR', 'Invalid market query', issues);
    let provider;
    try {
      provider = providerRegistry.get('markets', providerName.value || undefined);
      const input = { state: marketLocation.value.state, district: marketLocation.value.district, market: marketLocation.value.market, commodity: commodity.value?.name || undefined, ...pagination.value };
      const result = await providerExecutor.execute({ provider, operation: 'getPrices', input, requestId: requestIdOf(req), ttlMs: 10 * 60 * 1000 });
      const records = result.value;
      return data(req, res, records, { provider: provider.id, cache: result.cache, count: records.length, pagination: { limit: input.limit, offset: input.offset, nextOffset: records.length === input.limit ? input.offset + input.limit : null } });
    } catch (cause) {
      return sendProviderError(req, res, cause, provider?.id || providerName.value || 'market provider');
    }
  };
  router.get('/markets', prices);
  router.get('/market-prices', prices);

  router.post('/advisories', async (req, res) => {
    const issues = validateAdvisoryInput(req.body);
    if (issues.length) return error(req, res, 400, 'VALIDATION_ERROR', 'Invalid advisory context', issues);
    const input = { ...req.body };
    let weatherStatus = 'provided';
    let weatherProviderId = null;
    if (!input.weather) {
      const location = input.location || input.farm.location;
      const hasCoordinates = Number.isFinite(Number(location?.latitude)) && Number.isFinite(Number(location?.longitude));
      if (hasCoordinates) {
        let provider;
        try {
          provider = providerRegistry.get('weather', req.query.provider || req.body.provider);
          weatherProviderId = provider.id;
          const result = await providerExecutor.execute({ provider, operation: 'getCurrentWeather', input: { latitude: Number(location.latitude), longitude: Number(location.longitude) }, requestId: requestIdOf(req), ttlMs: 5 * 60 * 1000 });
          input.weather = result.value;
          weatherStatus = result.cache === 'hit' ? 'cached' : 'fetched';
        } catch (cause) {
          const providerError = normalizeProviderError(cause, provider?.id || req.body.provider || 'weather provider');
          if (providerError.code === 'PROVIDER_NOT_FOUND') return sendProviderError(req, res, providerError, req.query.provider || req.body.provider || 'weather provider');
          weatherStatus = 'unavailable';
          input.weather = null;
          weatherProviderId = provider?.id || null;
        }
      } else {
        weatherStatus = 'not-requested';
      }
    }
    try {
      const advisory = await advisoryEngine.generate(input);
      return data(req, res, advisory, { provider: 'farmease-advisory-rules', weatherStatus, weatherProvider: weatherProviderId });
    } catch (cause) {
      if (cause.code === 'VALIDATION_ERROR') return error(req, res, 400, cause.code, cause.message, cause.details);
      return error(req, res, 503, 'ADVISORY_ENGINE_UNAVAILABLE', 'Advisory engine is unavailable');
    }
  });

  router.post('/crop-recommendation', async (req, res) => {
    const issues = validateCropInput(req.body);
    if (issues.length) return error(req, res, 400, 'VALIDATION_ERROR', 'Invalid crop recommendation input', issues);
    try { return data(req, res, await cropService.recommend(req.body), { provider: 'farmease-ml' }); }
    catch (cause) { return error(req, res, 503, 'INTELLIGENCE_SERVICE_UNAVAILABLE', 'Crop intelligence service is unavailable'); }
  });

  router.post('/plant-diagnosis', upload.single('file'), async (req, res) => {
    if (!req.file) return error(req, res, 400, 'VALIDATION_ERROR', 'A JPEG, PNG, or WebP image file is required', [{ field: 'file', message: 'missing or unsupported image type' }]);
    const form = new FormData();
    form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
    try {
      const response = await requestWithReliability({ providerId: 'farmease-ml', operation: 'plant-diagnosis', retries: 1, logger, request: () => plantDoctorClient.post(`${plantDoctorUrl.replace(/\/$/, '')}/predict-disease`, form, { headers: form.getHeaders(), timeout: 30000 }) });
      const result = response.data;
      const diagnosis = normalizePlantDiagnosis(result);
      if (!diagnosis) throw new ProviderError('PROVIDER_BAD_RESPONSE', 'farmease-ml returned an invalid plant diagnosis response');
      return data(req, res, diagnosis, { provider: 'farmease-ml' });
    } catch (cause) { return error(req, res, 503, 'INTELLIGENCE_SERVICE_UNAVAILABLE', 'Plant diagnosis service is unavailable'); }
  });

  router.get('/farms/:id/field-health', async (req, res) => {
    let farm;
    try { farm = await farmResolver(req.params.id, req); } catch { return error(req, res, 503, 'FARM_STORE_UNAVAILABLE', 'Farm store is unavailable'); }
    if (!farm) return error(req, res, 404, 'FARM_NOT_FOUND', 'Farm was not found');
    const issues = validateFarm(farm);
    if (issues.length) return error(req, res, 400, 'VALIDATION_ERROR', 'Invalid farm boundary or context', issues);
    let provider;
    try {
      provider = providerRegistry.get('satellite', req.query.provider);
      const result = await providerExecutor.execute({ provider, operation: 'getFieldObservation', input: { boundary: farm.boundary, from: req.query.from, to: req.query.to, maxCloudCoverage: req.query.maxCloudCoverage === undefined ? 60 : Number(req.query.maxCloudCoverage) }, requestId: requestIdOf(req), ttlMs: 24 * 60 * 60 * 1000 });
      const health = normalizeFieldHealth({ current: result.value.current || result.value, previous: result.value.previous, provider: provider.id });
      return data(req, res, health, { provider: provider.id, cache: result.cache });
    } catch (cause) { return sendProviderError(req, res, cause, provider?.id || req.query.provider || 'satellite provider'); }
  });

  const alertRules = new Map();
  const activeAlerts = new Map();
  router.post('/alert-rules', (req, res) => {
    const issues = validateAlertRule(req.body);
    if (issues.length) return error(req, res, 400, 'VALIDATION_ERROR', 'Invalid alert rule', issues);
    const rule = { ...req.body, severity: req.body.severity || 'warning' };
    alertRules.set(rule.id, rule);
    return data(req, res, rule, { resource: 'alert-rule' }, 201);
  });
  router.post('/farms/:id/alerts/evaluate', async (req, res) => {
    const farm = req.body?.farm || await farmResolver(req.params.id, req);
    if (!farm) return error(req, res, 404, 'FARM_NOT_FOUND', 'Farm was not found');
    const rules = Array.isArray(req.body?.rules) ? req.body.rules : [...alertRules.values()];
    const ruleIssues = rules.flatMap(validateAlertRule);
    if (ruleIssues.length) return error(req, res, 400, 'VALIDATION_ERROR', 'Invalid alert rules', ruleIssues);
    try {
      const alerts = evaluateAlerts({ farm, weather: req.body.weather, marketPrices: req.body.marketPrices, fieldHealth: req.body.fieldHealth, rules });
      activeAlerts.set(String(req.params.id), new Map(alerts.map(item => [item.id, item])));
      return data(req, res, { alerts, evaluatedAt: new Date().toISOString() }, { alertCount: alerts.length });
    } catch (cause) { if (cause.code === 'VALIDATION_ERROR') return error(req, res, 400, cause.code, cause.message, cause.details); return error(req, res, 500, 'ALERT_EVALUATION_FAILED', 'Alert evaluation failed'); }
  });
  router.get('/farms/:id/alerts', (req, res) => data(req, res, [...(activeAlerts.get(String(req.params.id))?.values() || [])], { count: activeAlerts.get(String(req.params.id))?.size || 0 }));
  return router;
};

module.exports = { createV1Router, coordinateQuery, paginationQuery, safeRequestId };
