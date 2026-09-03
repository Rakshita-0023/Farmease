const axios = require('axios');
const { requestWithReliability } = require('../../core/reliability');
const { ProviderError } = require('../../core/providerError');

const WMO_CONDITIONS = {
  0: { code: 'clear', summary: 'Clear sky' },
  1: { code: 'mainly_clear', summary: 'Mainly clear' },
  2: { code: 'partly_cloudy', summary: 'Partly cloudy' },
  3: { code: 'overcast', summary: 'Overcast' },
  45: { code: 'fog', summary: 'Fog' },
  48: { code: 'rime_fog', summary: 'Rime fog' },
  51: { code: 'light_drizzle', summary: 'Light drizzle' },
  53: { code: 'drizzle', summary: 'Drizzle' },
  55: { code: 'heavy_drizzle', summary: 'Heavy drizzle' },
  61: { code: 'light_rain', summary: 'Light rain' },
  63: { code: 'rain', summary: 'Rain' },
  65: { code: 'heavy_rain', summary: 'Heavy rain' },
  71: { code: 'light_snow', summary: 'Light snow' },
  73: { code: 'snow', summary: 'Snow' },
  75: { code: 'heavy_snow', summary: 'Heavy snow' },
  80: { code: 'rain_showers', summary: 'Rain showers' },
  81: { code: 'rain_showers', summary: 'Rain showers' },
  82: { code: 'heavy_rain_showers', summary: 'Heavy rain showers' },
  95: { code: 'thunderstorm', summary: 'Thunderstorm' }
};

const conditionFor = (weatherCode) => WMO_CONDITIONS[weatherCode] || {
  code: 'unknown',
  summary: 'Unknown conditions'
};

/**
 * WeatherProvider contract: getCurrentWeather({ latitude, longitude }) and
 * getForecast({ latitude, longitude }). Both methods return FarmEase-normalized
 * data, never a vendor-specific payload.
 */
class OpenMeteoWeatherProvider {
  constructor({ httpClient = axios, baseUrl = 'https://api.open-meteo.com/v1/forecast', timeoutMs = 10000, retries = 2, logger, sleep } = {}) {
    this.id = 'open-meteo';
    this.domain = 'weather';
    this.capabilities = ['current-weather', 'forecast'];
    this.httpClient = httpClient;
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
    this.retries = retries;
    this.logger = logger;
    this.sleep = sleep;
  }

  getStatus() { return { configured: true, available: true, authentication: 'none' }; }

  async request(operation, params) {
    return requestWithReliability({
      providerId: this.id, operation, retries: this.retries, logger: this.logger, sleep: this.sleep,
      request: () => this.httpClient.get(this.baseUrl, { params, timeout: this.timeoutMs })
    });
  }

  async getCurrentWeather({ latitude, longitude }) {
    const response = await this.request('current-weather', {
        latitude,
        longitude,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover,precipitation',
        timezone: 'auto'
    });
    const current = response.data?.current;
    if (!current || !Number.isFinite(current.temperature_2m)) {
      throw new ProviderError('PROVIDER_BAD_RESPONSE', 'open-meteo returned an invalid current-weather payload');
    }
    return {
      location: { latitude: Number(latitude), longitude: Number(longitude) },
      observedAt: current.time || new Date().toISOString(),
      temperatureC: current.temperature_2m,
      feelsLikeC: current.apparent_temperature,
      humidityPercent: current.relative_humidity_2m,
      pressureHpa: current.surface_pressure,
      wind: { speedKph: current.wind_speed_10m, directionDegrees: current.wind_direction_10m },
      cloudCoverPercent: current.cloud_cover,
      precipitationMm: current.precipitation,
      condition: conditionFor(current.weather_code)
    };
  }

  async getForecast({ latitude, longitude }) {
    const response = await this.request('forecast', {
        latitude,
        longitude,
        daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
        timezone: 'auto'
    });
    const daily = response.data?.daily;
    if (!daily?.time || !Array.isArray(daily.time)) {
      throw new ProviderError('PROVIDER_BAD_RESPONSE', 'open-meteo returned an invalid forecast payload');
    }
    return daily.time.map((date, index) => ({
      date,
      temperature: { minC: daily.temperature_2m_min?.[index], maxC: daily.temperature_2m_max?.[index] },
      precipitation: { probabilityPercent: daily.precipitation_probability_max?.[index], totalMm: daily.precipitation_sum?.[index] },
      wind: { maxSpeedKph: daily.wind_speed_10m_max?.[index] },
      condition: conditionFor(daily.weather_code?.[index])
    }));
  }
}

module.exports = { OpenMeteoWeatherProvider, conditionFor };
