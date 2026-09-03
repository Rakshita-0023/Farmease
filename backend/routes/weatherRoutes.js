const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * Weather Routes - Using Open-Meteo as PRIMARY source
 * 
 * Why Open-Meteo:
 * - 100% free, no API key required
 * - Excellent accuracy for India
 * - Agricultural-friendly data (soil temp, humidity, etc.)
 * - No rate limits or sudden blocks
 * - Perfect for farming applications
 * 
 * OpenWeatherMap kept as fallback only
 */

module.exports = (authenticateToken) => {

    // Map Open-Meteo WMO weather codes to readable conditions
    const mapWmoToCondition = (code) => {
        const conditions = {
            0: { main: 'Clear', description: 'Clear sky', icon: '01d' },
            1: { main: 'Clear', description: 'Mainly clear', icon: '01d' },
            2: { main: 'Clouds', description: 'Partly cloudy', icon: '02d' },
            3: { main: 'Clouds', description: 'Overcast', icon: '03d' },
            45: { main: 'Fog', description: 'Foggy', icon: '50d' },
            48: { main: 'Fog', description: 'Depositing rime fog', icon: '50d' },
            51: { main: 'Drizzle', description: 'Light drizzle', icon: '09d' },
            53: { main: 'Drizzle', description: 'Moderate drizzle', icon: '09d' },
            55: { main: 'Drizzle', description: 'Dense drizzle', icon: '09d' },
            56: { main: 'Drizzle', description: 'Freezing drizzle', icon: '09d' },
            57: { main: 'Drizzle', description: 'Dense freezing drizzle', icon: '09d' },
            61: { main: 'Rain', description: 'Slight rain', icon: '10d' },
            63: { main: 'Rain', description: 'Moderate rain', icon: '10d' },
            65: { main: 'Rain', description: 'Heavy rain', icon: '10d' },
            66: { main: 'Rain', description: 'Freezing rain', icon: '13d' },
            67: { main: 'Rain', description: 'Heavy freezing rain', icon: '13d' },
            71: { main: 'Snow', description: 'Slight snow', icon: '13d' },
            73: { main: 'Snow', description: 'Moderate snow', icon: '13d' },
            75: { main: 'Snow', description: 'Heavy snow', icon: '13d' },
            77: { main: 'Snow', description: 'Snow grains', icon: '13d' },
            80: { main: 'Rain', description: 'Slight rain showers', icon: '09d' },
            81: { main: 'Rain', description: 'Moderate rain showers', icon: '09d' },
            82: { main: 'Rain', description: 'Violent rain showers', icon: '09d' },
            85: { main: 'Snow', description: 'Slight snow showers', icon: '13d' },
            86: { main: 'Snow', description: 'Heavy snow showers', icon: '13d' },
            95: { main: 'Thunderstorm', description: 'Thunderstorm', icon: '11d' },
            96: { main: 'Thunderstorm', description: 'Thunderstorm with hail', icon: '11d' },
            99: { main: 'Thunderstorm', description: 'Thunderstorm with heavy hail', icon: '11d' },
        };
        return conditions[code] || { main: 'Clear', description: 'Clear sky', icon: '01d' };
    };

    // Calculate sunrise/sunset times (approximate based on latitude)
    const getSunTimes = (lat) => {
        const now = new Date();
        // Simple approximation - adjust based on season and latitude
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        const sunriseHour = 6 + Math.sin((dayOfYear - 80) * Math.PI / 182.5) * 1;
        const sunsetHour = 18 - Math.sin((dayOfYear - 80) * Math.PI / 182.5) * 1;
        
        const sunrise = new Date(now);
        sunrise.setHours(Math.floor(sunriseHour), (sunriseHour % 1) * 60, 0);
        
        const sunset = new Date(now);
        sunset.setHours(Math.floor(sunsetHour), (sunsetHour % 1) * 60, 0);
        
        return {
            sunrise: Math.floor(sunrise.getTime() / 1000),
            sunset: Math.floor(sunset.getTime() / 1000)
        };
    };

    // GET current weather
    router.get('/current', authenticateToken, async (req, res) => {
        try {
            console.log(`🌤️ Weather request for user: ${req.user.userId}`);
            
            const { lat, lon } = req.query;
            
            let latitude, longitude, city;
            
            if (lat && lon) {
                latitude = parseFloat(lat);
                longitude = parseFloat(lon);
                city = 'Your Location';
                console.log(`📍 Using coordinates from request: ${latitude}, ${longitude}`);
            } else {
                return res.status(400).json({ 
                    error: 'Coordinates required',
                    message: 'Please provide lat and lon parameters',
                    requiresLocation: true
                });
            }

            // ============================================
            // PRIMARY: Open-Meteo (free, no API key, accurate)
            // ============================================
            try {
                console.log(`🌤️ Fetching from Open-Meteo (PRIMARY)...`);
                
                const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover&timezone=auto`;
                
                const response = await axios.get(openMeteoUrl, { timeout: 10000 });
                const current = response.data.current;
                
                if (!current || current.temperature_2m === undefined) {
                    throw new Error('Invalid Open-Meteo response');
                }

                const condition = mapWmoToCondition(current.weather_code);
                const sunTimes = getSunTimes(latitude);

                // Reverse geocode to get city name
                let cityName = city;
                try {
                    const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
                    const geoRes = await axios.get(geoUrl, { timeout: 5000 });
                    cityName = geoRes.data.city || geoRes.data.locality || geoRes.data.principalSubdivision || 'Your Location';
                } catch (geoErr) {
                    console.warn('⚠️ Geocoding failed, using default city name');
                }

                const weatherData = {
                    name: cityName,
                    coord: { lat: latitude, lon: longitude },
                    sys: { 
                        country: 'IN',
                        sunrise: sunTimes.sunrise,
                        sunset: sunTimes.sunset
                    },
                    main: {
                        temp: Math.round(current.temperature_2m * 10) / 10,
                        feels_like: Math.round(current.apparent_temperature * 10) / 10,
                        humidity: current.relative_humidity_2m,
                        pressure: Math.round(current.surface_pressure),
                    },
                    weather: [{
                        main: condition.main,
                        description: condition.description,
                        icon: condition.icon
                    }],
                    wind: {
                        speed: current.wind_speed_10m / 3.6, // km/h to m/s
                        deg: current.wind_direction_10m
                    },
                    clouds: { all: current.cloud_cover },
                    visibility: 10000,
                    dt: Math.floor(Date.now() / 1000),
                    timezone: response.data.utc_offset_seconds || 19800,
                    source: 'Open-Meteo'
                };

                console.log(`✅ Open-Meteo: ${weatherData.main.temp}°C, ${condition.description}, Humidity: ${weatherData.main.humidity}%`);
                return res.json(weatherData);

            } catch (openMeteoError) {
                console.warn('⚠️ Open-Meteo failed:', openMeteoError.message);
                console.log('🔄 Falling back to OpenWeatherMap...');
            }

            // ============================================
            // FALLBACK: OpenWeatherMap
            // ============================================
            try {
                const API_KEY = process.env.OPENWEATHER_API_KEY;
                if (!API_KEY) throw new Error('OPENWEATHER_API_KEY is not configured');
                const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
                
                const response = await axios.get(owmUrl, { timeout: 10000 });
                response.data.source = 'OpenWeatherMap';
                
                console.log(`✅ OpenWeatherMap fallback: ${response.data.main.temp}°C`);
                return res.json(response.data);

            } catch (owmError) {
                console.error('❌ Both weather sources failed');
                throw new Error('Weather data unavailable');
            }

        } catch (error) {
            console.error('❌ Weather fetch failed:', error.message);
            res.status(500).json({ 
                error: 'Failed to fetch weather data',
                message: error.message
            });
        }
    });

    // GET weather forecast (5-day)
    router.get('/forecast', authenticateToken, async (req, res) => {
        try {
            console.log(`🌤️ Forecast request for user: ${req.user.userId}`);
            
            const { lat, lon } = req.query;
            
            if (!lat || !lon) {
                return res.status(400).json({ 
                    error: 'Coordinates required',
                    message: 'Please provide lat and lon parameters',
                    requiresLocation: true
                });
            }

            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);

            // ============================================
            // PRIMARY: Open-Meteo Forecast
            // ============================================
            try {
                console.log(`🌤️ Fetching forecast from Open-Meteo...`);
                
                const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
                
                const response = await axios.get(forecastUrl, { timeout: 10000 });
                const daily = response.data.daily;
                
                if (!daily || !daily.time) {
                    throw new Error('Invalid forecast response');
                }

                // Convert to OpenWeatherMap-like format for frontend compatibility
                const list = daily.time.map((date, i) => {
                    const condition = mapWmoToCondition(daily.weather_code[i]);
                    return {
                        dt: new Date(date).getTime() / 1000 + 43200, // Noon
                        main: {
                            temp: (daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2,
                            temp_min: daily.temperature_2m_min[i],
                            temp_max: daily.temperature_2m_max[i],
                            humidity: 50 // Open-Meteo doesn't provide daily humidity in free tier
                        },
                        weather: [{
                            main: condition.main,
                            description: condition.description,
                            icon: condition.icon
                        }],
                        pop: (daily.precipitation_probability_max[i] || 0) / 100,
                        wind: {
                            speed: (daily.wind_speed_10m_max[i] || 0) / 3.6
                        }
                    };
                });

                console.log(`✅ Open-Meteo forecast: ${list.length} days`);
                return res.json({ list, source: 'Open-Meteo' });

            } catch (openMeteoError) {
                console.warn('⚠️ Open-Meteo forecast failed:', openMeteoError.message);
            }

            // ============================================
            // FALLBACK: OpenWeatherMap Forecast
            // ============================================
            try {
                const API_KEY = process.env.OPENWEATHER_API_KEY;
                if (!API_KEY) throw new Error('OPENWEATHER_API_KEY is not configured');
                const owmUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
                
                const response = await axios.get(owmUrl, { timeout: 10000 });
                response.data.source = 'OpenWeatherMap';
                
                console.log(`✅ OpenWeatherMap forecast fallback`);
                return res.json(response.data);

            } catch (owmError) {
                console.error('❌ Both forecast sources failed');
                throw new Error('Forecast data unavailable');
            }

        } catch (error) {
            console.error('❌ Forecast fetch failed:', error.message);
            res.status(500).json({ 
                error: 'Failed to fetch forecast data',
                message: error.message
            });
        }
    });

    return router;
};
