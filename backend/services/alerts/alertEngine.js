const { validateFarm } = require('../../schemas/farm');

const TYPES = new Set(['heavy_rain', 'temperature_threshold', 'market_price_threshold', 'vegetation_decline', 'stale_observation']);
const OPERATORS = new Set(['>=', '<=', '>', '<']);

function validateAlertRule(rule = {}) {
  const issues = [];
  if (!rule.id || typeof rule.id !== 'string') issues.push({ field: 'id', message: 'is required' });
  if (!TYPES.has(rule.type)) issues.push({ field: 'type', message: `must be one of ${[...TYPES].join(', ')}` });
  if (rule.severity && !['info', 'warning', 'critical'].includes(rule.severity)) issues.push({ field: 'severity', message: 'must be info, warning, or critical' });
  if (rule.type === 'stale_observation') {
    if (!Number.isFinite(Number(rule.maxAgeDays)) || Number(rule.maxAgeDays) <= 0) issues.push({ field: 'maxAgeDays', message: 'must be a positive number' });
  } else if (rule.type === 'vegetation_decline') {
    if (rule.threshold !== undefined && (!Number.isFinite(Number(rule.threshold)) || Number(rule.threshold) <= 0 || Number(rule.threshold) > 1)) issues.push({ field: 'threshold', message: 'must be between 0 and 1' });
  } else if (rule.type === 'market_price_threshold' || rule.type === 'heavy_rain' || rule.type === 'temperature_threshold') {
    if (!Number.isFinite(Number(rule.threshold))) issues.push({ field: 'threshold', message: 'must be numeric' });
    if (rule.operator && !OPERATORS.has(rule.operator)) issues.push({ field: 'operator', message: 'must be one of >=, <=, >, <' });
  }
  return issues;
}

const compare = (value, operator, threshold) => ({ '>=': value >= threshold, '<=': value <= threshold, '>': value > threshold, '<': value < threshold }[operator]);
const alertRecord = ({ rule, observedValue, source, now, message }) => ({
  id: `${rule.id}:${source}`,
  ruleId: rule.id,
  severity: rule.severity || 'warning',
  trigger: { type: rule.type, observedValue, threshold: rule.type === 'stale_observation' ? rule.maxAgeDays : (rule.threshold ?? null), operator: rule.operator || '>=' },
  source,
  timestamp: new Date(now).toISOString(),
  message
});

function evaluateAlerts({ farm, weather, marketPrices = [], fieldHealth, rules = [], now = Date.now() } = {}) {
  const farmIssues = validateFarm(farm);
  if (farmIssues.length) { const error = new Error('Invalid farm context'); error.code = 'VALIDATION_ERROR'; error.details = farmIssues; throw error; }
  const alerts = [];
  for (const rule of rules) {
    if (rule.type === 'heavy_rain' && Number.isFinite(Number(weather?.precipitationMm)) && compare(Number(weather.precipitationMm), rule.operator || '>=', Number(rule.threshold ?? 20))) alerts.push(alertRecord({ rule, observedValue: Number(weather.precipitationMm), source: weather.provider || 'weather', now, message: `Rainfall of ${weather.precipitationMm} mm meets the configured threshold.` }));
    if (rule.type === 'temperature_threshold' && Number.isFinite(Number(weather?.temperatureC)) && compare(Number(weather.temperatureC), rule.operator || '>=', Number(rule.threshold))) alerts.push(alertRecord({ rule, observedValue: Number(weather.temperatureC), source: weather.provider || 'weather', now, message: `Temperature of ${weather.temperatureC} °C meets the configured threshold.` }));
    if (rule.type === 'market_price_threshold') for (const price of marketPrices) if ((!rule.commodity || String(price.commodity).toLowerCase() === String(rule.commodity).toLowerCase()) && Number.isFinite(Number(price.modalPrice)) && compare(Number(price.modalPrice), rule.operator || '>=', Number(rule.threshold))) alerts.push(alertRecord({ rule, observedValue: Number(price.modalPrice), source: price.provider || 'market', now, message: `${price.commodity || 'Market price'} is ${price.modalPrice}.` }));
    if (rule.type === 'vegetation_decline' && fieldHealth?.trend?.direction === 'declining' && Math.abs(Number(fieldHealth.trend.delta)) >= Number(rule.threshold ?? 0.1)) alerts.push(alertRecord({ rule, observedValue: Number(fieldHealth.trend.delta), source: fieldHealth.provider?.id || 'satellite', now, message: 'Vegetation index decline detected; this is a stress signal, not a diagnosis.' }));
    if (rule.type === 'stale_observation' && fieldHealth?.observation?.observationDate) { const age = (new Date(now) - new Date(fieldHealth.observation.observationDate)) / 86400000; if (age > Number(rule.maxAgeDays)) alerts.push(alertRecord({ rule, observedValue: age, source: fieldHealth.provider?.id || 'satellite', now, message: `Vegetation observation is ${age.toFixed(1)} days old.` })); }
  }
  return alerts;
}

module.exports = { TYPES, validateAlertRule, evaluateAlerts };
