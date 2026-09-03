const daysSince = (date, now = new Date()) => {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - parsed.getTime()) / 86400000));
};

const addContextAdvisory = (advisories, id, title, message, reasons) => advisories.push({ id, severity: 'info', title, message, reasons, basis: 'context' });

/**
 * Conservative, explainable operational signals. Thresholds are intentionally
 * alerts rather than agronomic prescriptions; every message exposes the actual
 * observed value and configured threshold used by the rule.
 */
const generateAdvisories = ({ farm, crop, weather, now = new Date() }) => {
  const advisories = [];
  const selectedCrop = crop || farm?.currentCrop;
  if (!selectedCrop) addContextAdvisory(advisories, 'missing-crop-context', 'Crop context needed', 'Add the current crop and variety to receive crop-specific advisories.', ['No crop was supplied.']);
  if (!farm?.soil) addContextAdvisory(advisories, 'missing-soil-context', 'Soil context needed', 'Add soil observations before interpreting crop or irrigation conditions.', ['No soil data was supplied; the engine will not infer it.']);
  if (!farm?.irrigation) addContextAdvisory(advisories, 'missing-irrigation-context', 'Irrigation context needed', 'Add the irrigation method and water source for farm planning.', ['No irrigation data was supplied; the engine will not infer it.']);
  const days = daysSince(farm?.sowingDate, now);
  if (days !== null) addContextAdvisory(advisories, 'sowing-date-context', 'Crop calendar context', `The supplied sowing date is ${days} day${days === 1 ? '' : 's'} old; confirm the actual crop stage locally.`, [`sowingDate=${farm.sowingDate}`, `daysSinceSowing=${days}`]);
  if (!weather) {
    addContextAdvisory(advisories, 'weather-unavailable', 'Weather data unavailable', 'Weather-backed signals are omitted until a normalized weather provider result is available.', ['No weather object was supplied.']);
    return advisories;
  }
  const temperature = Number(weather.temperatureC);
  if (Number.isFinite(temperature) && temperature >= 35) advisories.push({ id: 'high-temperature', severity: temperature >= 40 ? 'high' : 'medium', title: 'Review heat plan', message: 'Review heat-protection and irrigation plans for the reported conditions.', reasons: [`temperatureC=${temperature}`, 'alertThresholdC=35'], basis: 'weather-threshold' });
  const precipitation = Number(weather.precipitationMm);
  if (Number.isFinite(precipitation) && precipitation >= 20) advisories.push({ id: 'heavy-precipitation', severity: 'medium', title: 'Review rain response', message: 'Review drainage, access, and planned field work for the reported precipitation.', reasons: [`precipitationMm=${precipitation}`, 'alertThresholdMm=20'], basis: 'weather-threshold' });
  const humidity = Number(weather.humidityPercent);
  if (Number.isFinite(humidity) && humidity >= 85) advisories.push({ id: 'high-humidity', severity: 'low', title: 'Inspect crop conditions', message: 'Inspect the crop and follow locally approved disease-monitoring guidance under the reported humidity.', reasons: [`humidityPercent=${humidity}`, 'alertThresholdPercent=85'], basis: 'weather-threshold' });
  if (!advisories.length) addContextAdvisory(advisories, 'conditions-within-alert-thresholds', 'No configured weather alerts', 'No configured weather threshold was crossed; continue local monitoring.', ['temperatureThresholdC=35', 'precipitationThresholdMm=20', 'humidityThresholdPercent=85']);
  return advisories;
};

module.exports = { generateAdvisories, daysSince };
