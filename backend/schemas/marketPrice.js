const { normalizeLocation } = require('./location');
const { normalizeCommodity } = require('./commodity');

const numeric = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeIndianDate = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (date.getUTCFullYear() === Number(year) && date.getUTCMonth() === Number(month) - 1 && date.getUTCDate() === Number(day)) return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return null;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
};

const normalizeMarketPrice = (record, { provider = 'agmarknet' } = {}) => {
  const commodity = normalizeCommodity(record.commodity);
  const modalInrPerQuintal = numeric(record.modal_price);
  if (!commodity || !record.market || modalInrPerQuintal === null) return null;
  const location = normalizeLocation({ country: 'IN', state: record.state, district: record.district, market: record.market });
  const arrivalDate = normalizeIndianDate(record.arrival_date);
  const identity = [location.state, location.district, location.market, commodity.canonicalName, arrivalDate].map(value => String(value || '').toLowerCase().replace(/\s+/g, '-')).join(':');
  return {
    id: `${provider}:${identity}`,
    commodity,
    variety: record.variety ? { name: String(record.variety).trim() } : null,
    market: { name: location.market, location },
    price: {
      minimumInrPerQuintal: numeric(record.min_price),
      maximumInrPerQuintal: numeric(record.max_price),
      modalInrPerQuintal,
      unit: { currency: 'INR', quantity: 'quintal', verified: true }
    },
    arrivalDate,
    source: { provider, recordUpdatedAt: arrivalDate }
  };
};

module.exports = { normalizeMarketPrice, normalizeIndianDate, numeric };
