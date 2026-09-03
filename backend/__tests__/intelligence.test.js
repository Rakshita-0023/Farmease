const { normalizeCropRecommendation, normalizePlantDiagnosis } = require('../schemas/intelligence');

describe('normalized intelligence responses', () => {
  test('identifies ML output and converts genuine probability to percent', () => {
    expect(normalizeCropRecommendation({ recommended_crop: 'rice', confidence: 0.87, method: 'ml_model', model: { identifier: 'crop', version: '1' } })).toMatchObject({ recommendedCrop: 'rice', confidencePercent: 87, method: 'ml_model', fallbackUsed: false, model: { version: '1' } });
  });

  test('marks rule fallback and does not fabricate confidence', () => {
    expect(normalizeCropRecommendation({ recommended_crop: 'maize', confidence: null, method: 'rule_based', model: { identifier: 'rules', version: 'builtin' } })).toMatchObject({ method: 'rule_based', fallbackUsed: true, confidence: null });
  });

  test('rejects malformed diagnosis and preserves model provenance', () => {
    expect(normalizePlantDiagnosis({ disease: 'Tomato___Late_blight', confidence: 92, model: { identifier: 'disease', version: '1' } })).toMatchObject({ status: 'success', disease: 'Tomato___Late_blight', confidencePercent: 92, provenance: { fallbackUsed: false } });
    expect(normalizePlantDiagnosis({ confidence: 90 })).toBeNull();
  });
});
