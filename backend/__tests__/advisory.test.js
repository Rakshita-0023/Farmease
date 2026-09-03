const { AdvisoryEngine, validateAdvisoryInput } = require('../services/advisory/advisoryEngine');
const { generateAdvisories } = require('../services/advisory/rules');

const farm = { id: 'farm-1', name: 'North field', location: { country: 'IN', state: 'Haryana', district: 'Karnal', latitude: 29.6, longitude: 76.9 }, area: { value: 2, unit: 'acre' }, currentCrop: { name: 'wheat' }, sowingDate: '2026-08-01', soil: { type: 'loam' }, irrigation: { method: 'drip' } };

describe('Agricultural advisory engine', () => {
  test('generates explainable weather signals with observed reasons', async () => {
    const result = await new AdvisoryEngine().generate({ farm, weather: { temperatureC: 36, humidityPercent: 70, precipitationMm: 0 } });
    const heat = result.advisories.find(advisory => advisory.id === 'high-temperature');
    expect(heat).toMatchObject({ severity: 'medium', basis: 'weather-threshold' });
    expect(heat.reasons).toEqual(expect.arrayContaining(['temperatureC=36', 'alertThresholdC=35']));
    expect(result.provenance).toMatchObject({ engine: 'farmease-advisory-rules', sources: [] });
  });

  test('rejects invalid canonical farm context', async () => {
    expect(validateAdvisoryInput({ farm: { name: 'missing area' } })).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'farm.id' }), expect.objectContaining({ field: 'farm.area.value' })]));
    await expect(new AdvisoryEngine().generate({ farm: { name: 'missing area' } })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('is explicit and non-fabricating when weather is missing', () => {
    const advisories = generateAdvisories({ farm, weather: null });
    expect(advisories).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'weather-unavailable' })]));
    expect(advisories.find(advisory => advisory.id === 'high-temperature')).toBeUndefined();
  });

  test('accepts source metadata from a trusted knowledge provider', async () => {
    const knowledgeProvider = { findSources: jest.fn().mockResolvedValue([{ id: 'icar-1', title: 'Approved guidance', url: 'https://icar.gov.in/example' }]) };
    const result = await new AdvisoryEngine({ knowledgeProvider }).generate({ farm, weather: { temperatureC: 20 } });
    expect(result.provenance.sources[0]).toMatchObject({ id: 'icar-1' });
    expect(knowledgeProvider.findSources).toHaveBeenCalledTimes(1);
  });
});
