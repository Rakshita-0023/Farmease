const index = (a, b) => {
  const first = Number(a); const second = Number(b); const denominator = first + second;
  return Number.isFinite(first) && Number.isFinite(second) && denominator !== 0 ? (first - second) / denominator : null;
};

const calculateVegetationMetrics = ({ nir, red, green, swir, blue } = {}) => {
  const metrics = { ndvi: index(nir, red), ndwi: index(green, nir), evi: null, savi: null };
  const n = Number(nir); const r = Number(red); const b = Number(blue);
  if ([n, r, b].every(Number.isFinite) && (n + 6 * r - 7.5 * b + 1) !== 0) metrics.evi = 2.5 * ((n - r) / (n + 6 * r - 7.5 * b + 1));
  if ([n, r].every(Number.isFinite) && (n + r + 0.5) !== 0) metrics.savi = 1.5 * ((n - r) / (n + r + 0.5));
  return metrics;
};

const qualityFor = (cloudCoveragePercent, { maxCloudCoverage = 60 } = {}) => {
  const cloud = Number(cloudCoveragePercent);
  if (!Number.isFinite(cloud)) return { state: 'unknown', usable: false };
  return cloud > maxCloudCoverage ? { state: 'low', usable: false } : { state: cloud > maxCloudCoverage / 2 ? 'acceptable' : 'good', usable: true };
};

const normalizeSatelliteObservation = (raw = {}, { provider = 'sentinel-2', maxCloudCoverage = 60 } = {}) => {
  const acquisitionDate = raw.acquisitionDate || raw.date || raw.properties?.acquisitionDate || null;
  const cloudCoveragePercent = Number(raw.cloudCoveragePercent ?? raw.cloudCover ?? raw.properties?.cloudCover);
  const metrics = raw.metrics || calculateVegetationMetrics(raw.bands || raw);
  if (!acquisitionDate || !metrics || Object.values(metrics).every(value => value === null)) return null;
  const quality = qualityFor(cloudCoveragePercent, { maxCloudCoverage });
  return { observationDate: acquisitionDate, metrics, quality: { ...quality, cloudCoveragePercent: Number.isFinite(cloudCoveragePercent) ? cloudCoveragePercent : null }, provider: { id: provider, source: raw.source || 'Copernicus Data Space Ecosystem' }, rawId: raw.id || null };
};

const trendFor = (current, previous) => {
  const now = Number(current?.metrics?.ndvi); const before = Number(previous?.metrics?.ndvi);
  if (!Number.isFinite(now) || !Number.isFinite(before)) return { direction: 'unknown', delta: null };
  const delta = now - before;
  return { direction: delta <= -0.1 ? 'declining' : delta >= 0.1 ? 'improving' : 'stable', delta: Number(delta.toFixed(4)) };
};

module.exports = { index, calculateVegetationMetrics, qualityFor, normalizeSatelliteObservation, trendFor };
