const express = require('express');
const axios = require('axios');
const router = express.Router();

// Middleware to authenticate token (optional for weather, but good for rate limiting/tracking)
// For now, we'll keep it public or use the same auth middleware if passed

module.exports = (authenticateToken) => {

    // Helper to map Open-Meteo WMO codes to OpenWeatherMap conditions
    const mapWmoToOwm = (code) => {
        const map = {
            0: { main: 'Clear', description: 'clear sky' },
            1: { main: 'Clouds', description: 'mainly clear' },
            2: { main: 'Clouds', description: 'partly cloudy' },
            3: { main: 'Clouds', description: 'overcast' },
            45: { main: 'Fog', description: 'fog' },
            48: { main: 'Fog', description: 'depositing rime fog' },
            51: { main: 'Drizzle', description: 'light drizzle' },
            53: { main: 'Drizzle', description: 'moderate drizzle' },
            55: { main: 'Drizzle', description: 'dense drizzle' },
            61: { main: 'Rain', description: 'slight rain' },
            63: { main: 'Rain', description: 'moderate rain' },
            65: { main: 'Rain', description: 'heavy rain' },
            71: { main: 'Snow', description: 'slight snow' },
            73: { main: 'Snow', description: 'moderate snow' },
            75: { main: 'Snow', description: 'heavy snow' },
            95: { main: 'Thunderstorm', description: 'thunderstorm' },
        };
        return map[code] || { main: 'Clear', description: 'clear sky' };
    };

    // GET current weather
    router.get('/current', async (req, res) => {
        const { lat, lon, city } = req.query;

        try {
            // Try OpenWeatherMap first
            const API_KEY = process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c'; // Consistent key
            let url = `https://api.openweathermap.org/data/2.5/weather?appid=${API_KEY}&units=metric`;

            if (lat && lon) {
                url += `&lat=${lat}&lon=${lon}`;
            } else if (city) {
                url += `&q=${encodeURIComponent(city)}`;
            } else {
                return res.status(400).json({ error: 'Location required' });
            }

            const response = await axios.get(url);
            return res.json(response.data);

        } catch (error) {
            console.warn('⚠️ OpenWeatherMap failed, falling back to Open-Meteo:', error.message);

            // Fallback to Open-Meteo
            try {
                let latitude = lat;
                let longitude = lon;
                let locationName = city || 'Unknown Location';

                // Geocode if only city provided
                if (!latitude || !longitude) {
                    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
                    const geoRes = await axios.get(geoUrl);
                    if (geoRes.data.results && geoRes.data.results.length > 0) {
                        latitude = geoRes.data.results[0].latitude;
                        longitude = geoRes.data.results[0].longitude;
                        locationName = geoRes.data.results[0].name;
                    } else {
                        throw new Error('Location not found');
                    }
                }

                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,surface_pressure,visibility`;
                const weatherRes = await axios.get(weatherUrl);
                const current = weatherRes.data.current_weather;
                const hourly = weatherRes.data.hourly;

                // Map to OWM format
                const weatherCondition = mapWmoToOwm(current.weathercode);
                const currentHourIndex = new Date().getHours();

                const mappedData = {
                    name: locationName,
                    sys: { country: 'XX', sunrise: Date.now() / 1000 - 20000, sunset: Date.now() / 1000 + 20000 }, // Mock sun times
                    main: {
                        temp: current.temperature,
                        humidity: hourly.relativehumidity_2m[currentHourIndex] || 50,
                        pressure: hourly.surface_pressure[currentHourIndex] || 1013,
                    },
                    weather: [{
                        main: weatherCondition.main,
                        description: weatherCondition.description,
                        icon: '01d' // Default icon
                    }],
                    wind: {
                        speed: current.windspeed / 3.6, // km/h to m/s
                        deg: current.winddirection
                    },
                    visibility: hourly.visibility ? hourly.visibility[currentHourIndex] : 10000,
                    dt: Math.floor(Date.now() / 1000)
                };

                return res.json(mappedData);

            } catch (fallbackError) {
                console.error('❌ Open-Meteo fallback failed:', fallbackError.message);
                res.status(500).json({ error: 'Failed to fetch weather data from all providers' });
            }
        }
    });

    // GET weather forecast
    router.get('/forecast', async (req, res) => {
        const { lat, lon, city } = req.query;

        try {
            // Try OpenWeatherMap first
            const API_KEY = process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c';
            let url = `https://api.openweathermap.org/data/2.5/forecast?appid=${API_KEY}&units=metric`;

            if (lat && lon) {
                url += `&lat=${lat}&lon=${lon}`;
            } else if (city) {
                url += `&q=${encodeURIComponent(city)}`;
            } else {
                return res.status(400).json({ error: 'Location required' });
            }

            const response = await axios.get(url);
            return res.json(response.data);

        } catch (error) {
            console.warn('⚠️ OpenWeatherMap forecast failed, falling back to Open-Meteo');

            // Fallback to Open-Meteo
            try {
                let latitude = lat;
                let longitude = lon;

                if (!latitude || !longitude) {
                    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
                    const geoRes = await axios.get(geoUrl);
                    if (geoRes.data.results && geoRes.data.results.length > 0) {
                        latitude = geoRes.data.results[0].latitude;
                        longitude = geoRes.data.results[0].longitude;
                    } else {
                        throw new Error('Location not found');
                    }
                }

                const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=auto`;
                const forecastRes = await axios.get(forecastUrl);
                const daily = forecastRes.data.daily;

                // Map to OWM Forecast format (list of 3-hour steps, but we'll mock it with daily data repeated)
                const list = [];
                for (let i = 0; i < daily.time.length; i++) {
                    const condition = mapWmoToOwm(daily.weathercode[i]);
                    // Create a mock entry for noon
                    list.push({
                        dt: new Date(daily.time[i]).getTime() / 1000 + 43200, // Noon
                        main: {
                            temp: (daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2,
                            temp_min: daily.temperature_2m_min[i],
                            temp_max: daily.temperature_2m_max[i],
                            humidity: 50
                        },
                        weather: [{ main: condition.main, description: condition.description }],
                        pop: (daily.precipitation_probability_max[i] || 0) / 100
                    });
                }

                return res.json({ list });

            } catch (fallbackError) {
                console.error('❌ Open-Meteo forecast fallback failed:', fallbackError.message);
                res.status(500).json({ error: 'Failed to fetch forecast data' });
            }
        }
    });

    return router;
};
