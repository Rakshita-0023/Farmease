# FarmEase provider contracts

Providers are small adapters that expose only FarmEase-normalized values. A weather
provider declares `domain: 'weather'`, an `id`, `capabilities`, `getStatus()`,
`getCurrentWeather(location)`, and `getForecast(location)`. A market provider uses
`domain: 'markets'` and implements `getPrices(query)`.

Provider adapters must use `services/core/reliability.js` for every network call,
including an explicit timeout. They must not return sample data after an upstream
failure. See [`docs/PROVIDER_DEVELOPMENT.md`](../../../docs/PROVIDER_DEVELOPMENT.md)
for the full contribution guide.
