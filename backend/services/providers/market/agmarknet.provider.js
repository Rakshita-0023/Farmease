const axios = require('axios');
const { requestWithReliability } = require('../../core/reliability');
const { ProviderError } = require('../../core/providerError');
const { normalizeMarketPrice } = require('../../../schemas/marketPrice');
const { canonicalCommodityName } = require('../../../schemas/commodity');

const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

const sourceField = (record, ...names) => {
  for (const name of names) {
    if (record[name] !== undefined && record[name] !== null) return record[name];
  }
  return undefined;
};

const normalizeRecord = (record) => normalizeMarketPrice({
  state: sourceField(record, 'state', 'State'),
  district: sourceField(record, 'district', 'District'),
  market: sourceField(record, 'market', 'Market', 'Market Name'),
  commodity: sourceField(record, 'commodity', 'Commodity'),
  variety: sourceField(record, 'variety', 'Variety'),
  min_price: sourceField(record, 'min_price', 'Min Price', 'Min Price (Rs./Quintal)'),
  max_price: sourceField(record, 'max_price', 'Max Price', 'Max Price (Rs./Quintal)'),
  modal_price: sourceField(record, 'modal_price', 'Modal Price', 'Modal Price (Rs./Quintal)'),
  arrival_date: sourceField(record, 'arrival_date', 'Arrival_Date', 'Arrival Date')
}, { provider: 'agmarknet' });

/** MarketProvider contract: getPrices(query) returns normalized live records. */
class AgmarknetMarketProvider {
  constructor({ apiKey = process.env.AGMARKNET_API_KEY, httpClient = axios, baseUrl = BASE_URL, timeoutMs = 10000, retries = 2, logger, sleep } = {}) {
    this.id = 'agmarknet';
    this.domain = 'markets';
    this.capabilities = ['market-prices', 'state-filter', 'district-filter', 'commodity-filter', 'pagination'];
    this.apiKey = apiKey;
    this.httpClient = httpClient;
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
    this.retries = retries;
    this.logger = logger;
    this.sleep = sleep;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  getStatus() { return { configured: this.isConfigured(), available: this.isConfigured(), authentication: 'api-key' }; }

  async getPrices({ state, district, market, commodity, limit = 100, offset = 0 } = {}) {
    if (!this.apiKey) {
      throw new ProviderError('PROVIDER_NOT_CONFIGURED', 'AGMARKNET_API_KEY is required to query live market prices', { status: 503 });
    }
    const params = { 'api-key': this.apiKey, format: 'json', limit: Math.min(Math.max(limit, 1), 100), offset: Math.max(Number(offset) || 0, 0) };
    if (state) params['filters[state]'] = state;
    if (district) params['filters[district]'] = district;
    if (market) params['filters[market]'] = market;
    if (commodity) params['filters[commodity]'] = commodity;
    const response = await requestWithReliability({
      providerId: this.id, operation: 'market-prices', retries: this.retries, logger: this.logger, sleep: this.sleep,
      request: () => this.httpClient.get(this.baseUrl, { params, timeout: this.timeoutMs })
    });
    if (!Array.isArray(response.data?.records)) {
      throw new ProviderError('PROVIDER_BAD_RESPONSE', 'agmarknet returned an invalid market-price payload');
    }
    const requestedCommodity = commodity ? canonicalCommodityName(commodity) : null;
    return response.data.records.map(normalizeRecord).filter(Boolean).filter(record => {
      if (requestedCommodity && record.commodity.canonicalName !== requestedCommodity) return false;
      if (state && record.market.location.state?.toLocaleLowerCase('en-IN') !== state.toLocaleLowerCase('en-IN')) return false;
      if (district && record.market.location.district?.toLocaleLowerCase('en-IN') !== district.toLocaleLowerCase('en-IN')) return false;
      return true;
    });
  }
}

module.exports = { AgmarknetMarketProvider, normalizeRecord };
