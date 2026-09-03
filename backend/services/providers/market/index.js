const { AgmarknetMarketProvider } = require('./agmarknet.provider');

const createMarketProvider = () => new AgmarknetMarketProvider();

module.exports = { createMarketProvider, AgmarknetMarketProvider };
