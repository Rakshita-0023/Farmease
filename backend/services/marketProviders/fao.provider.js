// FAO Provider (Global Fallback)
// Simulates global commodity indices

const fetchMarketData = async ({ city, country, lat, lng }) => {
    const commodities = [
        { name: 'Rice (Global)', price: 400 },
        { name: 'Wheat (Global)', price: 250 },
        { name: 'Maize (Global)', price: 200 },
        { name: 'Sugar (Global)', price: 500 }
    ];

    return commodities.map((c, i) => ({
        id: `fao-${city}-${i}`,
        commodity: c.name,
        variety: 'Global Index',
        market: `${country || 'Global'} Market Index`,
        district: city || 'Global',
        state: 'International',
        min_price: c.price * 0.9 * 83,
        max_price: c.price * 1.1 * 83,
        modal_price: c.price * 83,
        trend: 'stable',
        lat: parseFloat(lat || 0),
        lng: parseFloat(lng || 0),
        date: new Date().toISOString().split('T')[0]
    }));
};

module.exports = {
    fetchMarketData
};
