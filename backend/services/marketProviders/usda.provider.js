// USDA Provider (Placeholder / Simulation)
// In a real scenario, this would connect to USDA Market News API

const getDemoData = (city, state, lat, lng) => {
    const commodities = [
        { name: 'Corn', price: 180, unit: 'USD/Ton' },
        { name: 'Soybeans', price: 450, unit: 'USD/Ton' },
        { name: 'Wheat', price: 220, unit: 'USD/Ton' },
        { name: 'Cotton', price: 1800, unit: 'USD/Ton' }
    ];

    return commodities.map((c, i) => ({
        id: `usda-${city}-${i}`,
        commodity: c.name,
        variety: 'Standard',
        market: `${city} Exchange`,
        district: city,
        state: state || 'USA',
        min_price: c.price * 0.95 * 83, // Convert to INR roughly for consistency or keep USD
        max_price: c.price * 1.05 * 83,
        modal_price: c.price * 83,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        date: new Date().toISOString().split('T')[0]
    }));
};

const fetchMarketData = async ({ city, state, lat, lng }) => {
    // Simulate API call
    return getDemoData(city, state, lat, lng);
};

module.exports = {
    fetchMarketData
};
