const cleanText = (value, field, { required = false, max = 120 } = {}) => {
  if (value === undefined || value === null || value === '') return required ? { issue: { field, message: 'is required' } } : { value: null };
  if (typeof value !== 'string' || value.trim().length > max) return { issue: { field, message: `must be a string no longer than ${max} characters` } };
  return { value: value.trim() || null };
};

const parseCoordinates = (query = {}) => {
  const latitude = Number(query.lat ?? query.latitude);
  const longitude = Number(query.lon ?? query.lng ?? query.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return { issue: { field: 'lat', message: 'must be a latitude between -90 and 90' } };
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return { issue: { field: 'lon', message: 'must be a longitude between -180 and 180' } };
  return { value: { country: 'IN', state: null, district: null, market: null, latitude, longitude } };
};

const normalizeLocation = (input = {}) => ({
  country: (input.country || 'IN').toUpperCase(),
  state: input.state || null,
  district: input.district || null,
  market: input.market || null,
  latitude: Number.isFinite(Number(input.latitude)) ? Number(input.latitude) : null,
  longitude: Number.isFinite(Number(input.longitude)) ? Number(input.longitude) : null
});

const parseMarketLocation = (query = {}) => {
  const issues = [];
  const result = {};
  for (const field of ['state', 'district', 'market']) {
    const parsed = cleanText(query[field], field);
    if (parsed.issue) issues.push(parsed.issue); else result[field] = parsed.value;
  }
  return { issues, value: normalizeLocation(result) };
};

module.exports = { cleanText, parseCoordinates, normalizeLocation, parseMarketLocation };
