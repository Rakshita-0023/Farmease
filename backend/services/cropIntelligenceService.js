const axios = require('axios');
const { requestWithReliability } = require('./core/reliability');
const { ProviderError } = require('./core/providerError');
const { normalizeCropRecommendation } = require('../schemas/intelligence');

const FIELDS = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];

const validateCropInput = (input) => {
  const errors = [];
  for (const field of FIELDS) {
    if (!Number.isFinite(Number(input?.[field]))) errors.push({ field, message: 'must be a finite number' });
  }
  if (Number(input?.ph) < 0 || Number(input?.ph) > 14) errors.push({ field: 'ph', message: 'must be between 0 and 14' });
  if (Number(input?.humidity) < 0 || Number(input?.humidity) > 100) errors.push({ field: 'humidity', message: 'must be between 0 and 100' });
  return errors;
};

class CropIntelligenceService {
  constructor({ httpClient = axios, baseUrl = process.env.ML_API_URL || 'http://127.0.0.1:8000' } = {}) {
    this.httpClient = httpClient;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async recommend(input) {
    const response = await requestWithReliability({
      providerId: 'farmease-ml', operation: 'crop-recommendation', retries: 1,
      request: () => this.httpClient.post(`${this.baseUrl}/predict-crop`, input, { timeout: 30000, headers: { 'Content-Type': 'application/json' } })
    });
    const payload = response.data;
    const recommendation = normalizeCropRecommendation(payload);
    if (!recommendation) throw new ProviderError('PROVIDER_BAD_RESPONSE', 'farmease-ml returned an invalid crop recommendation');
    return recommendation;
  }
}

module.exports = { CropIntelligenceService, validateCropInput, FIELDS };
