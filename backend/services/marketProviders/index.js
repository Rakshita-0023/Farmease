const agmarknetProvider = require('./agmarknet.provider');
const usdaProvider = require('./usda.provider');
const faoProvider = require('./fao.provider');

/**
 * Factory to get the appropriate market data provider based on location.
 * @param {string} country - The country name.
 * @returns {object} - The provider instance.
 */
const getProvider = (country) => {
    if (!country) return faoProvider; // Default to global

    const normalizedCountry = country.toLowerCase().trim();

    if (normalizedCountry === 'india') {
        return agmarknetProvider;
    } else if (normalizedCountry === 'usa' || normalizedCountry === 'united states') {
        return usdaProvider;
    } else {
        return faoProvider;
    }
};

module.exports = {
    getProvider
};
