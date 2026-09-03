const { ProviderRegistry } = require('../core/providerRegistry');
const { OpenMeteoWeatherProvider } = require('./weather');
const { AgmarknetMarketProvider } = require('./market');
const { WeatherProvider, MarketProvider } = require('./contracts');
const { Sentinel2Provider } = require('./satellite');

const providerFor = (provider, domain, fallback) => {
  const resolved = provider || fallback;
  // The adapter factory accepts old test/custom adapters while making the
  // public registry contract explicit for first-party providers.
  if (!resolved.domain) resolved.domain = domain;
  if (!resolved.capabilities) resolved.capabilities = [];
  return resolved;
};

const createProviderRegistry = ({ weatherProvider, marketProvider, satelliteProvider } = {}) => new ProviderRegistry()
  .register(providerFor(weatherProvider, 'weather', new OpenMeteoWeatherProvider()))
  .register(providerFor(marketProvider, 'markets', new AgmarknetMarketProvider()))
  .register(providerFor(satelliteProvider, 'satellite', new Sentinel2Provider()));

module.exports = { createProviderRegistry, ProviderRegistry, WeatherProvider, MarketProvider, SatelliteProvider: require('./contracts').SatelliteProvider };
