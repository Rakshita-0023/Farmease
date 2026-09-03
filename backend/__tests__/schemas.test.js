const { validateFarm, normalizeFarm, normalizeMarketPrice } = require('../schemas');

describe('FarmEase domain schemas', () => {
  test('validates and normalizes canonical farm records', () => {
    const farm = { id: 'farm-1', name: 'North field', location: { state: 'Haryana', district: 'Karnal', latitude: 29.68, longitude: 76.99 }, area: { value: 2.5, unit: 'acre' }, soil: { type: 'loam' }, currentCrop: { name: 'Wheat' }, sowingDate: '2026-11-12', irrigation: { method: 'drip' }, metadata: { ownerNote: 'demo' } };
    expect(validateFarm(farm)).toEqual([]);
    expect(normalizeFarm(farm)).toMatchObject({ location: { country: 'IN', state: 'Haryana', latitude: 29.68 }, area: { value: 2.5, unit: 'acre' } });
  });

  test('rejects incomplete farm contracts and returns canonical price shape', () => {
    expect(validateFarm({ name: 'Missing area', area: { value: 0, unit: 'square-meter' }, sowingDate: '12-11-2026' })).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'id' }), expect.objectContaining({ field: 'area.value' }), expect.objectContaining({ field: 'area.unit' })]));
    expect(normalizeMarketPrice({ commodity: 'Wheat', market: 'Karnal', state: 'Haryana', district: 'Karnal', modal_price: '2400', min_price: '2200', max_price: '2500', arrival_date: '03/09/2026' })).toMatchObject({ commodity: { canonicalName: 'wheat' }, arrivalDate: '2026-09-03', price: { unit: { verified: true } } });
  });
});
