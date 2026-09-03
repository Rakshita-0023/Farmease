const { validateGeoJsonBoundary } = require('../schemas/geojson');
const { calculateVegetationMetrics, normalizeSatelliteObservation, trendFor } = require('../services/geospatial/vegetation');

const polygon = { type: 'Polygon', coordinates: [[[77, 28], [77.1, 28], [77.1, 28.1], [77, 28]]] };
test('validates closed WGS84 polygons', () => { expect(validateGeoJsonBoundary(polygon)).toEqual([]); expect(validateGeoJsonBoundary({ ...polygon, coordinates: [[[200, 28], [77, 28], [77, 28], [200, 28]]] })).not.toEqual([]); });
test('calculates normalized vegetation metrics', () => { const m = calculateVegetationMetrics({ nir: 0.8, red: 0.2, green: 0.4, swir: 0.2 }); expect(m.ndvi).toBeCloseTo(0.6); expect(m.ndwi).toBeCloseTo(-0.3333); });
test('normalizes quality and trend without fabricating values', () => { const a = normalizeSatelliteObservation({ acquisitionDate: '2025-01-01', metrics: { ndvi: 0.5 }, cloudCoveragePercent: 10 }); const b = normalizeSatelliteObservation({ acquisitionDate: '2025-01-02', metrics: { ndvi: 0.3 }, cloudCoveragePercent: 10 }); expect(a.quality.usable).toBe(true); expect(trendFor(b, a).direction).toBe('declining'); expect(normalizeSatelliteObservation({})).toBeNull(); });
