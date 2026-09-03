/**
 * Runtime contract markers for JavaScript providers. Implementations return
 * FarmEase-normalized schemas; these names make the public extension points
 * discoverable without introducing a TypeScript migration.
 */
const WeatherProvider = Object.freeze({ domain: 'weather', operations: ['getCurrentWeather', 'getForecast'] });
const MarketProvider = Object.freeze({ domain: 'markets', operations: ['getPrices'] });
const SatelliteProvider = Object.freeze({ domain: 'satellite', operations: ['getFieldObservation'] });

module.exports = { WeatherProvider, MarketProvider, SatelliteProvider };
