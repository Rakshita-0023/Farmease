const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET resolve coordinates to city
router.get('/resolve', async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.json({ locationRequired: true, message: 'Please select your city to view market data' });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        let city = 'Detected Location';
        let state = 'Unknown';
        let country = 'India';
        let source = 'gps';

        try {
            const API_KEY = process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c';
            const response = await axios.get(
                `https://api.openweathermap.org/geo/1.0/reverse`, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    limit: 1,
                    appid: API_KEY
                },
                timeout: 5000
            }
            );

            if (response.data && response.data.length > 0) {
                city = response.data[0].name;
                state = response.data[0].state || 'Unknown';
                country = response.data[0].country === 'IN' ? 'India' : response.data[0].country === 'US' ? 'USA' : 'Global';
            }
        } catch (geoError) {
            console.error('Reverse geocoding failed:', geoError.message);
        }

        res.json({
            city,
            state,
            country,
            latitude,
            longitude,
            source
        });

    } catch (error) {
        console.error('Location resolution error:', error);
        res.status(500).json({ error: 'Internal server error during location resolution' });
    }
});

// GET city search suggestions (worldwide, dynamic)
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                cities: []
            });
        }

        const API_KEY = process.env.OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c';

        const response = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
            params: {
                q: q,
                limit: 10,
                appid: API_KEY
            },
            timeout: 5000
        });

        const cities = response.data.map(city => ({
            name: city.name,
            state: city.state || '',
            country: city.country,
            latitude: city.lat,
            longitude: city.lon
        }));

        res.json({
            success: true,
            cities: cities
        });
    } catch (error) {
        console.error('City search error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search cities',
            cities: []
        });
    }
});

// GET stable cities list (for backward compatibility and quick selection)
router.get('/cities', async (req, res) => {
    try {
        const cities = [
            { name: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.385, longitude: 78.4867 },
            { name: 'Warangal', state: 'Telangana', country: 'India', latitude: 17.9689, longitude: 79.5941 },
            { name: 'Nizamabad', state: 'Telangana', country: 'India', latitude: 18.6725, longitude: 78.0941 },
            { name: 'Vijayawada', state: 'Andhra Pradesh', country: 'India', latitude: 16.5062, longitude: 80.6480 },
            { name: 'Guntur', state: 'Andhra Pradesh', country: 'India', latitude: 16.3067, longitude: 80.4365 },
            { name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', latitude: 17.6868, longitude: 83.2185 },
            { name: 'New Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090 },
            { name: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777 },
            { name: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567 },
            { name: 'Bangalore', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
            { name: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707 },
            { name: 'Kolkata', state: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639 }
        ];

        res.json({
            success: true,
            cities: cities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cities list',
            cities: []
        });
    }
});

module.exports = router;
