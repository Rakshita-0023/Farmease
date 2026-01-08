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

    // GET current weather for authenticated user's saved location
    router.get('/current', authenticateToken, async (req, res) => {
        try {
            console.log(`🌤️ Weather request for user: ${req.user.userId}`);
            
            // Check if coordinates are passed directly (from frontend LocationContext)
            const { lat, lon } = req.query;
            
            let latitude, longitude, city;
            
            if (lat && lon) {
                // Use coordinates from query params (frontend has detected location)
                latitude = parseFloat(lat);
                longitude = parseFloat(lon);
                city = 'Your Location';
                console.log(`🌤️ Using coordinates from request: ${latitude}, ${longitude}`);
            } else {
                // Try to get user's saved location from database
                try {
                    const locationResponse = await axios.get(`http://localhost:5001/api/user/location`, {
                        headers: {
                            'Authorization': req.headers.authorization
                        }
                    });
                    
                    if (locationResponse.data && locationResponse.data.latitude && locationResponse.data.longitude) {
                        latitude = locationResponse.data.latitude;
                        longitude = locationResponse.data.longitude;
                        city = locationResponse.data.city || 'Your Location';
                        console.log(`🌤️ Using saved location: ${city} (${latitude}, ${longitude})`);
                    }
                } catch (locationError) {
                    console.log('❌ Failed to get user saved location:', locationError.message);
                }
            }
            
            if (!latitude || !longitude) {
                return res.status(400).json({ 
                    error: 'No saved location found',
                    message: 'Please set your farm location in your profile to view weather data',
                    requiresLocation: true
                });
            }

            // Try OpenWeatherMap first
            const API_KEY = process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c';
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;

            try {
                const response = await axios.get(url);
                console.log(`✅ Weather data fetched for: ${response.data.name || city}`);
                return res.json(response.data);
            } catch (owmError) {
                console.warn('⚠️ OpenWeatherMap failed, falling back to Open-Meteo:', owmError.message);
                
                // Fallback to Open-Meteo using saved coordinates
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,surface_pressure,visibility`;
                const weatherRes = await axios.get(weatherUrl);
                const current = weatherRes.data.current_weather;
                const hourly = weatherRes.data.hourly;

                // Map to OWM format
                const weatherCondition = mapWmoToOwm(current.weathercode);
                const currentHourIndex = new Date().getHours();

                const mappedData = {
                    name: city,
                    sys: { country: 'IN', sunrise: Date.now() / 1000 - 20000, sunset: Date.now() / 1000 + 20000 },
                    main: {
                        temp: current.temperature,
                        humidity: hourly.relativehumidity_2m[currentHourIndex] || 50,
                        pressure: hourly.surface_pressure[currentHourIndex] || 1013,
                    },
                    weather: [{
                        main: weatherCondition.main,
                        description: weatherCondition.description,
                        icon: '01d'
                    }],
                    wind: {
                        speed: current.windspeed / 3.6,
                        deg: current.winddirection
                    },
                    visibility: hourly.visibility ? hourly.visibility[currentHourIndex] : 10000,
                    dt: Math.floor(Date.now() / 1000)
                };

                console.log(`✅ Weather data (fallback) fetched for: ${city}`);
                return res.json(mappedData);
            }

        } catch (error) {
            console.error('❌ Weather fetch failed:', error);
            res.status(500).json({ 
                error: 'Failed to fetch weather data',
                message: 'Unable to get weather for your saved location'
            });
        }
    });

    // GET weather forecast for authenticated user's saved location
    router.get('/forecast', authenticateToken, async (req, res) => {
        try {
            console.log(`🌤️ Forecast request for user: ${req.user.userId}`);
            
            // Check if coordinates are passed directly (from frontend LocationContext)
            const { lat, lon } = req.query;
            
            let latitude, longitude, city;
            
            if (lat && lon) {
                // Use coordinates from query params
                latitude = parseFloat(lat);
                longitude = parseFloat(lon);
                city = 'Your Location';
                console.log(`🌤️ Using coordinates from request for forecast: ${latitude}, ${longitude}`);
            } else {
                // Try to get user's saved location from database
                try {
                    const locationResponse = await axios.get(`http://localhost:5001/api/user/location`, {
                        headers: {
                            'Authorization': req.headers.authorization
                        }
                    });
                    
                    if (locationResponse.data && locationResponse.data.latitude && locationResponse.data.longitude) {
                        latitude = locationResponse.data.latitude;
                        longitude = locationResponse.data.longitude;
                        city = locationResponse.data.city || 'Your Location';
                    }
                } catch (locationError) {
                    console.log('❌ Failed to get user saved location for forecast:', locationError.message);
                }
            }
            
            if (!latitude || !longitude) {
                return res.status(400).json({ 
                    error: 'No saved location found',
                    message: 'Please set your farm location in your profile to view weather forecast',
                    requiresLocation: true
                });
            }
            
            console.log(`🌤️ Using location for forecast: ${city} (${latitude}, ${longitude})`);

            // Try OpenWeatherMap first
            const API_KEY = process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c';
            const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;

            try {
                const response = await axios.get(url);
                console.log(`✅ Forecast data fetched for: ${city}`);
                return res.json(response.data);
            } catch (owmError) {
                console.warn('⚠️ OpenWeatherMap forecast failed, falling back to Open-Meteo');
                
                // Fallback to Open-Meteo using saved coordinates
                const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=auto`;
                const forecastRes = await axios.get(forecastUrl);
                const daily = forecastRes.data.daily;

                // Map to OWM Forecast format
                const list = [];
                for (let i = 0; i < daily.time.length; i++) {
                    const condition = mapWmoToOwm(daily.weathercode[i]);
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

                console.log(`✅ Forecast data (fallback) fetched for: ${city}`);
                return res.json({ list });
            }

        } catch (error) {
            console.error('❌ Forecast fetch failed:', error);
            res.status(500).json({ 
                error: 'Failed to fetch forecast data',
                message: 'Unable to get forecast for your saved location'
            });
        }
    });

    return router;
};
