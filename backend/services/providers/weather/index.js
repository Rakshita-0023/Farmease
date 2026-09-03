const { OpenMeteoWeatherProvider } = require('./openMeteo.provider');

const createWeatherProvider = () => new OpenMeteoWeatherProvider();

module.exports = { createWeatherProvider, OpenMeteoWeatherProvider };
