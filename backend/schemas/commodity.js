const canonicalCommodityName = (value) => String(value || '').trim().toLocaleLowerCase('en-IN').replace(/\s+/g, ' ');

const normalizeCommodity = (value) => {
  const name = String(value || '').trim();
  return name ? { name, canonicalName: canonicalCommodityName(name) } : null;
};

const parseCommodity = (value) => {
  if (value === undefined || value === '') return { value: null };
  if (typeof value !== 'string' || value.trim().length > 120) return { issue: { field: 'commodity', message: 'must be a string no longer than 120 characters' } };
  return { value: normalizeCommodity(value) };
};

module.exports = { canonicalCommodityName, normalizeCommodity, parseCommodity };
