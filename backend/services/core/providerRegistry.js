const { ProviderError } = require('./providerError');

class ProviderRegistry {
  constructor() {
    this.providers = new Map();
  }

  register(provider) {
    if (!provider?.id || !provider?.domain) throw new Error('A provider must define id and domain');
    const required = provider.domain === 'weather' ? ['getCurrentWeather', 'getForecast'] : provider.domain === 'markets' ? ['getPrices'] : provider.domain === 'satellite' ? ['getFieldObservation'] : [];
    if (required.some(operation => typeof provider[operation] !== 'function')) throw new Error(`${provider.domain} provider ${provider.id} is missing a required operation`);
    this.providers.set(`${provider.domain}:${provider.id}`, provider);
    return this;
  }

  get(domain, id) {
    const candidates = [...this.providers.values()].filter(provider => provider.domain === domain);
    const provider = id ? this.providers.get(`${domain}:${id}`) : candidates[0];
    if (!provider) throw new ProviderError('PROVIDER_NOT_FOUND', `No ${domain} provider named "${id}" is registered`, { status: 400 });
    return provider;
  }

  describe() {
    return [...this.providers.values()].map(provider => ({
      id: provider.id,
      domain: provider.domain,
      capabilities: provider.capabilities || [],
      status: typeof provider.getStatus === 'function' ? provider.getStatus() : { configured: true, available: true }
    }));
  }
}

module.exports = { ProviderRegistry };
