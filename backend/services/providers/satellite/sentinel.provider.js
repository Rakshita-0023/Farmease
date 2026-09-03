const axios = require('axios');
const { requestWithReliability } = require('../../core/reliability');
const { ProviderError } = require('../../core/providerError');

class Sentinel2Provider {
  constructor({ accessToken = process.env.SENTINEL_ACCESS_TOKEN, processUrl = process.env.SENTINEL_PROCESS_URL, httpClient = axios, baseUrl = process.env.SENTINEL_API_URL || 'https://sh.dataspace.copernicus.eu/api/v1', logger, sleep } = {}) {
    this.id = 'sentinel-2'; this.domain = 'satellite';
    this.capabilities = ['field-health', 'ndvi', 'ndwi', 'cloud-quality'];
    this.accessToken = accessToken; this.processUrl = processUrl; this.httpClient = httpClient; this.baseUrl = baseUrl.replace(/\/$/, ''); this.logger = logger; this.sleep = sleep;
  }
  isConfigured() { return Boolean(this.accessToken); }
  getStatus() { return { configured: this.isConfigured(), available: this.isConfigured(), authentication: 'oauth2', source: 'Copernicus Data Space Ecosystem' }; }
  async getFieldObservation({ boundary, from, to, maxCloudCoverage = 60 } = {}) {
    if (!this.isConfigured()) throw new ProviderError('PROVIDER_NOT_CONFIGURED', 'SENTINEL_ACCESS_TOKEN is required for Sentinel-2 observations', { status: 503 });
    if (!boundary) throw new ProviderError('VALIDATION_ERROR', 'A valid farm boundary is required for Sentinel-2 observations', { status: 400 });
    if (!this.processUrl) throw new ProviderError('PROVIDER_UNAVAILABLE', 'Sentinel-2 credentials are configured, but SENTINEL_PROCESS_URL is required for index processing', { status: 503 });
    // The catalog endpoint returns product metadata, not vegetation index values.
    // A production adapter must pair it with an authorized Process/Statistical API
    // request; never treat catalog products as fabricated NDVI observations.
    const response = await requestWithReliability({ providerId: this.id, operation: 'process', retries: 1, logger: this.logger, sleep: this.sleep, request: () => this.httpClient.post(this.processUrl, { input: { bounds: { geometry: boundary }, data: [{ type: 'sentinel-2-l2a', dataFilter: { timeRange: { from, to }, maxCloudCoverage } }], evalscript: '// Configure a project-specific NDVI/NDWI evalscript.' }, output: { responses: [{ identifier: 'default', format: { type: 'image/tiff' } }] } }, { headers: { Authorization: `Bearer ${this.accessToken}` }, timeout: 15000 }) });
    if (!Array.isArray(response.data?.features) && !Array.isArray(response.data?.value)) throw new ProviderError('PROVIDER_BAD_RESPONSE', 'Sentinel-2 catalog response did not contain products');
    throw new ProviderError('PROVIDER_UNAVAILABLE', 'Sentinel-2 catalog access is configured, but index processing requires an authorized Statistical/Process API adapter', { status: 503 });
  }
}

module.exports = { Sentinel2Provider };
