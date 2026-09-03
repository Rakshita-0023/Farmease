const { validateFarm, normalizeFarm } = require('../../schemas/farm');
const { normalizeLocation } = require('../../schemas/location');
const { EmptyKnowledgeProvider } = require('../knowledge/knowledgeProvider');
const { generateAdvisories } = require('./rules');

const validateAdvisoryInput = (input = {}) => {
  const issues = [];
  if (!input.farm || typeof input.farm !== 'object') issues.push({ field: 'farm', message: 'is required and must be an object' });
  else issues.push(...validateFarm(input.farm).map(issue => ({ ...issue, field: `farm.${issue.field}` })));
  if (input.location && (!Number.isFinite(Number(input.location.latitude)) || !Number.isFinite(Number(input.location.longitude)))) issues.push({ field: 'location', message: 'must include latitude and longitude when supplied' });
  if (input.weather && typeof input.weather !== 'object') issues.push({ field: 'weather', message: 'must be a normalized weather object' });
  return issues;
};

class AdvisoryEngine {
  constructor({ knowledgeProvider = new EmptyKnowledgeProvider(), version = '0.3.0' } = {}) {
    this.knowledgeProvider = knowledgeProvider;
    this.version = version;
  }

  async generate(input) {
    const issues = validateAdvisoryInput(input);
    if (issues.length) {
      const error = new Error('Invalid advisory context');
      error.code = 'VALIDATION_ERROR';
      error.details = issues;
      throw error;
    }
    const farm = normalizeFarm(input.farm);
    const location = normalizeLocation(input.location || farm.location);
    const advisories = generateAdvisories({ farm, crop: input.crop || farm.currentCrop, weather: input.weather });
    const sources = await this.knowledgeProvider.findSources({ farm, crop: input.crop || farm.currentCrop, location, weather: input.weather });
    return { advisories, context: { farmId: farm.id, crop: input.crop || farm.currentCrop || null, location, weatherAvailable: Boolean(input.weather) }, provenance: { engine: 'farmease-advisory-rules', version: this.version, sources: Array.isArray(sources) ? sources : [] } };
  }
}

module.exports = { AdvisoryEngine, validateAdvisoryInput };
