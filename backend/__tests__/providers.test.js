const { OpenMeteoWeatherProvider } = require('../services/providers/weather/openMeteo.provider');
const { normalizeRecord } = require('../services/providers/market/agmarknet.provider');

describe('FarmEase provider normalization', () => {
  test('normalizes Open-Meteo current weather without exposing its vendor payload', async () => {
    const httpClient = {
      get: jest.fn().mockResolvedValue({ data: { current: {
        time: '2026-09-03T10:00', temperature_2m: 30.4, apparent_temperature: 33,
        relative_humidity_2m: 65, surface_pressure: 1008, wind_speed_10m: 12,
        wind_direction_10m: 180, cloud_cover: 75, precipitation: 1.2, weather_code: 63
      } } })
    };
    const provider = new OpenMeteoWeatherProvider({ httpClient });
    const result = await provider.getCurrentWeather({ latitude: 17.385, longitude: 78.4867 });
    expect(result).toMatchObject({
      location: { latitude: 17.385, longitude: 78.4867 },
      temperatureC: 30.4,
      humidityPercent: 65,
      condition: { code: 'rain', summary: 'Rain' }
    });
    expect(result.current).toBeUndefined();
  });

  test('normalizes valid AGMARKNET records and rejects incomplete records', () => {
    expect(normalizeRecord({
      state: 'Telangana', district: 'Hyderabad', market: 'Bowenpally', commodity: 'Tomato',
      variety: 'Other', min_price: '1000', max_price: '1800', modal_price: '1400', arrival_date: '03/09/2026'
    })).toMatchObject({
      commodity: { name: 'Tomato', canonicalName: 'tomato' },
      market: { name: 'Bowenpally', location: { district: 'Hyderabad', state: 'Telangana', country: 'IN' } },
      price: { minimumInrPerQuintal: 1000, maximumInrPerQuintal: 1800, modalInrPerQuintal: 1400, unit: { currency: 'INR', quantity: 'quintal', verified: true } },
      arrivalDate: '2026-09-03'
    });
    expect(normalizeRecord({ market: 'Bowenpally', modal_price: '1400' })).toBeNull();
  });

  test('retries a timeout once before succeeding without leaking the upstream payload', async () => {
    const timeout = new Error('timeout');
    timeout.code = 'ECONNABORTED';
    const httpClient = { get: jest.fn().mockRejectedValueOnce(timeout).mockResolvedValue({ data: { current: { time: '2026-09-03T10:00', temperature_2m: 24 } } }) };
    const provider = new OpenMeteoWeatherProvider({ httpClient, retries: 1, sleep: jest.fn().mockResolvedValue(), logger: { info: jest.fn(), warn: jest.fn() } });
    const result = await provider.getCurrentWeather({ latitude: 28.6, longitude: 77.2 });
    expect(result.temperatureC).toBe(24);
    expect(httpClient.get).toHaveBeenCalledTimes(2);
    expect(httpClient.get.mock.calls[0][1].timeout).toBe(10000);
  });

  test('accepts documented AGMARKNET label variants while preserving the canonical contract', () => {
    expect(normalizeRecord({ State: 'Haryana', District: 'Karnal', Market: 'Karnal', Commodity: 'Wheat', Variety: 'Dara', 'Min Price (Rs./Quintal)': '2200', 'Max Price (Rs./Quintal)': '2500', 'Modal Price (Rs./Quintal)': '2400', 'Arrival Date': '03/09/2026' })).toMatchObject({ commodity: { canonicalName: 'wheat' }, price: { modalInrPerQuintal: 2400 }, arrivalDate: '2026-09-03' });
  });
});
