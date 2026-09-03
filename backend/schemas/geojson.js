const isPosition = (position) => Array.isArray(position) && position.length >= 2 && Number.isFinite(Number(position[0])) && Number.isFinite(Number(position[1])) && Number(position[0]) >= -180 && Number(position[0]) <= 180 && Number(position[1]) >= -90 && Number(position[1]) <= 90;

const validateRing = (ring, field) => {
  const issues = [];
  if (!Array.isArray(ring) || ring.length < 4) return [{ field, message: 'linear ring must contain at least four positions' }];
  if (ring.length > 10000) return [{ field, message: 'linear ring exceeds the 10,000-position safety limit' }];
  ring.forEach((position, index) => { if (!isPosition(position)) issues.push({ field: `${field}[${index}]`, message: 'must be [longitude, latitude] within WGS84 bounds' }); });
  const first = ring[0]; const last = ring[ring.length - 1];
  if (isPosition(first) && isPosition(last) && (Number(first[0]) !== Number(last[0]) || Number(first[1]) !== Number(last[1]))) issues.push({ field, message: 'linear ring must be closed' });
  return issues;
};

const validateGeoJsonBoundary = (geometry) => {
  if (!geometry || typeof geometry !== 'object') return [{ field: 'boundary', message: 'must be a GeoJSON geometry object' }];
  if (geometry.type === 'Polygon') return (geometry.coordinates || []).flatMap((ring, index) => validateRing(ring, `boundary.coordinates[${index}]`));
  if (geometry.type === 'MultiPolygon') return (geometry.coordinates || []).flatMap((polygon, polygonIndex) => (polygon || []).flatMap((ring, ringIndex) => validateRing(ring, `boundary.coordinates[${polygonIndex}][${ringIndex}]`)));
  return [{ field: 'boundary.type', message: 'must be Polygon or MultiPolygon' }];
};

const normalizeGeoJsonBoundary = (boundary) => boundary ? { type: boundary.type, coordinates: boundary.coordinates } : null;

module.exports = { isPosition, validateGeoJsonBoundary, normalizeGeoJsonBoundary };
