const { normalizeSatelliteObservation, trendFor } = require('./vegetation');

const normalizeFieldHealth = ({ current, previous = null, provider = 'sentinel-2' } = {}) => {
  const observation = normalizeSatelliteObservation(current, { provider });
  if (!observation) return { status: 'unavailable', observations: [], provider: { id: provider }, reason: 'No usable vegetation observation was returned' };
  return { status: observation.quality.usable ? 'ok' : 'low_quality', observation, trend: trendFor(observation, previous ? normalizeSatelliteObservation(previous, { provider }) : null) };
};

module.exports = { normalizeFieldHealth };
