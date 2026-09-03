const normalizeConfidencePercent = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const confidence = Number(value);
  if (!Number.isFinite(confidence) || confidence < 0) return null;
  return Math.min(100, confidence <= 1 ? confidence * 100 : confidence);
};

const normalizeCropRecommendation = (payload = {}) => {
  if (!payload.recommended_crop || typeof payload.recommended_crop !== 'string') return null;
  const method = payload.method === 'ml_model' ? 'ml_model' : payload.method === 'rule_based' ? 'rule_based' : 'unknown';
  return {
    recommendedCrop: payload.recommended_crop.trim(), recommendation: payload.recommended_crop.trim(), crop: payload.recommended_crop.trim(),
    confidence: normalizeConfidencePercent(payload.confidence), confidencePercent: normalizeConfidencePercent(payload.confidence),
    method, fallbackUsed: method === 'rule_based', model: payload.model || null,
    provenance: { provider: 'farmease-ml', model: payload.model || null, fallback: method === 'rule_based' }
  };
};

const normalizePlantDiagnosis = (payload = {}) => {
  if (!payload.disease || typeof payload.disease !== 'string') return null;
  return { status: 'success', disease: payload.disease.trim(), confidencePercent: normalizeConfidencePercent(payload.confidence), model: payload.model || null, provenance: { provider: 'farmease-ml', fallbackUsed: false } };
};

module.exports = { normalizeConfidencePercent, normalizeCropRecommendation, normalizePlantDiagnosis };
