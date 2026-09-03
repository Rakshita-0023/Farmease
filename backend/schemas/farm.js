const { normalizeLocation } = require('./location');
const { validateGeoJsonBoundary, normalizeGeoJsonBoundary } = require('./geojson');

const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
const validateFarm = (farm = {}) => {
  const issues = [];
  if (typeof farm.id !== 'string' || !farm.id.trim()) issues.push({ field: 'id', message: 'is required and must be a string' });
  if (typeof farm.name !== 'string' || !farm.name.trim()) issues.push({ field: 'name', message: 'is required and must be a string' });
  if (!Number.isFinite(Number(farm.area?.value)) || Number(farm.area.value) <= 0) issues.push({ field: 'area.value', message: 'must be a positive number' });
  if (!['acre', 'hectare'].includes(farm.area?.unit)) issues.push({ field: 'area.unit', message: 'must be acre or hectare' });
  if (farm.sowingDate && !dateOnly.test(farm.sowingDate)) issues.push({ field: 'sowingDate', message: 'must use YYYY-MM-DD' });
  if (farm.location && (!Number.isFinite(Number(farm.location.latitude)) || !Number.isFinite(Number(farm.location.longitude)))) issues.push({ field: 'location', message: 'must include valid latitude and longitude when supplied' });
  if (farm.boundary) issues.push(...validateGeoJsonBoundary(farm.boundary));
  return issues;
};

const normalizeFarm = (farm) => ({
  id: String(farm.id), name: farm.name.trim(), location: normalizeLocation(farm.location || {}),
  area: { value: Number(farm.area.value), unit: farm.area.unit },
  soil: farm.soil || null, currentCrop: farm.currentCrop || null, sowingDate: farm.sowingDate || null,
  irrigation: farm.irrigation || null, boundary: normalizeGeoJsonBoundary(farm.boundary), metadata: farm.metadata || {}
});

module.exports = { validateFarm, normalizeFarm };
