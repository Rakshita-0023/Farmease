const axios = require('axios');

// Configuration
const API_KEY = process.env.AGMARKNET_API_KEY || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b'; // Public demo key often used
const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const MODE = process.env.MARKET_DATA_MODE || 'DEMO'; // 'LIVE' or 'DEMO'

// Helper to generate consistent pseudo-random numbers for DEMO mode
const pseudoRandom = (seed) => {
    let value = 0;
    for (let i = 0; i < seed.length; i++) {
        value += seed.charCodeAt(i);
    }
    return (Math.sin(value) + 1) / 2;
};

const getDemoData = (city, district, state, lat, lng) => {
    const commodities = [
        { name: 'Rice', min: 3000, max: 4500, variety: 'Common' },
        { name: 'Wheat', min: 2200, max: 2800, variety: 'Lokwan' },
        { name: 'Tomato', min: 1500, max: 3500, variety: 'Hybrid' },
        { name: 'Onion', min: 2000, max: 4000, variety: 'Red' },
        { name: 'Potato', min: 1200, max: 1800, variety: 'Jyoti' },
        { name: 'Cotton', min: 5500, max: 6500, variety: 'Bt Cotton' },
        { name: 'Maize', min: 1800, max: 2200, variety: 'Hybrid' },
        { name: 'Turmeric', min: 6000, max: 8000, variety: 'Finger' },
        { name: 'Chilli', min: 8000, max: 12000, variety: 'Red Dry' },
        { name: 'Groundnut', min: 5000, max: 6000, variety: 'Bold' }
    ];

    // Generate 5-8 commodities for this market
    const count = 5 + Math.floor(pseudoRandom(city + 'count') * 4);
    const selectedCommodities = [];

    for (let i = 0; i < count; i++) {
        const commodity = commodities[Math.floor(pseudoRandom(city + i) * commodities.length)];
        // Avoid duplicates
        if (selectedCommodities.find(c => c.commodity === commodity.name)) continue;

        const variance = pseudoRandom(city + commodity.name + new Date().toDateString());
        const priceVariance = (variance - 0.5) * 0.2; // +/- 10%

        const modalPrice = Math.round(commodity.min + (commodity.max - commodity.min) * variance);
        const minPrice = Math.round(modalPrice * 0.95);
        const maxPrice = Math.round(modalPrice * 1.05);

        selectedCommodities.push({
            id: `${city}-${commodity.name}-${i}`,
            commodity: commodity.name,
            variety: commodity.variety,
            market: city + ' Mandi',
            district: district || city,
            state: state || 'Unknown',
            min_price: minPrice,
            max_price: maxPrice,
            modal_price: modalPrice,
            trend: variance > 0.6 ? 'up' : variance < 0.4 ? 'down' : 'stable',
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            date: new Date().toISOString().split('T')[0]
        });
    }

    return selectedCommodities;
};

const fetchMarketData = async ({ city, district, state, lat, lng }) => {
    // 1. Try LIVE mode if enabled
    if (MODE === 'LIVE') {
        try {
            console.log(`📡 Fetching live Agmarknet data for ${district || city}...`);
            const response = await axios.get(BASE_URL, {
                params: {
                    'api-key': API_KEY,
                    'format': 'json',
                    'limit': 20,
                    'filters[district]': district || city,
                    // 'filters[state]': state // Optional, sometimes names mismatch
                },
                timeout: 5000
            });

            const records = response.data.records;
            if (records && records.length > 0) {
                return records.map((record, idx) => ({
                    id: `live-${record.market}-${record.commodity}-${idx}`,
                    commodity: record.commodity,
                    variety: record.variety,
                    market: record.market,
                    district: record.district,
                    state: record.state,
                    min_price: parseFloat(record.min_price),
                    max_price: parseFloat(record.max_price),
                    modal_price: parseFloat(record.modal_price),
                    trend: 'stable', // Live API might not have trend, default to stable
                    lat: parseFloat(lat), // Use city lat/lng as market lat/lng for now
                    lng: parseFloat(lng),
                    date: record.arrival_date
                }));
            }
            console.warn(`⚠️ No live data found for ${district || city}, falling back to generator.`);
        } catch (error) {
            console.error('❌ Agmarknet API failed:', error.message);
            // Fallthrough to DEMO
        }
    }

    // 2. DEMO / Fallback Generator
    // This ensures we ALWAYS return data for the requested city, never "Hyderabad" defaults.
    return getDemoData(city, district, state, lat, lng);
};

const fetchTrends = async ({ city, crop }) => {
    // Live API history is often restricted.
    // We will generate a realistic trend based on the current date for the DEMO/Simulation.
    // In a real production app with paid API, this would hit the history endpoint.

    const days = 30;
    const trendData = [];
    const basePrice = 2000 + Math.random() * 1000;

    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Add some seasonality/volatility
        const volatility = Math.sin(i * 0.2) * 100 + (Math.random() - 0.5) * 50;

        trendData.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(basePrice + volatility),
            modal_price: Math.round(basePrice + volatility)
        });
    }

    return trendData;
};

const getSupportedCities = async () => {
    // In a real app, this would fetch from an API.
    // For now, we return a list of major agricultural hubs to populate the dropdown.
    return [
        { city: 'Warangal', state: 'Telangana', latitude: 17.9689, longitude: 79.5941 },
        { city: 'Guntur', state: 'Andhra Pradesh', latitude: 16.3067, longitude: 80.4365 },
        { city: 'Nizamabad', state: 'Telangana', latitude: 18.6725, longitude: 78.0941 },
        { city: 'Khammam', state: 'Telangana', latitude: 17.2473, longitude: 80.1514 },
        { city: 'Karimnagar', state: 'Telangana', latitude: 18.4386, longitude: 79.1288 },
        { city: 'Vijayawada', state: 'Andhra Pradesh', latitude: 16.5062, longitude: 80.6480 },
        { city: 'Rajahmundry', state: 'Andhra Pradesh', latitude: 17.0005, longitude: 81.8040 },
        { city: 'Kurnool', state: 'Andhra Pradesh', latitude: 15.8281, longitude: 78.0373 },
        { city: 'Ongole', state: 'Andhra Pradesh', latitude: 15.5057, longitude: 80.0499 },
        { city: 'Nashik', state: 'Maharashtra', latitude: 19.9975, longitude: 73.7898 },
        { city: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
        { city: 'Nagpur', state: 'Maharashtra', latitude: 21.1458, longitude: 79.0882 },
        { city: 'Indore', state: 'Madhya Pradesh', latitude: 22.7196, longitude: 75.8577 },
        { city: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 },
        { city: 'Shimla', state: 'Himachal Pradesh', latitude: 31.1048, longitude: 77.1734 },
        { city: 'Chandigarh', state: 'Chandigarh', latitude: 30.7333, longitude: 76.7794 }
    ];
};

module.exports = {
    fetchMarketData,
    fetchTrends,
    getSupportedCities
};
