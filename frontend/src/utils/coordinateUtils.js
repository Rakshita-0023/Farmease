/**
 * Coordinate Utilities
 * Safely handle coordinate conversions and formatting
 */

/**
 * Normalize coordinates to numbers
 * @param {*} lat - Latitude (can be string, number, or null)
 * @param {*} lon - Longitude (can be string, number, or null)
 * @returns {{ lat: number, lon: number }} Normalized coordinates
 */
export function normalizeCoords(lat, lon) {
  const latitude = Number(lat)
  const longitude = Number(lon)
  
  return {
    lat: Number.isFinite(latitude) ? latitude : null,
    lon: Number.isFinite(longitude) ? longitude : null
  }
}

/**
 * Format coordinate for display with safe toFixed
 * @param {*} coord - Coordinate value
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted coordinate or 'N/A'
 */
export function formatCoord(coord, decimals = 4) {
  const num = Number(coord)
  return Number.isFinite(num) ? num.toFixed(decimals) : 'N/A'
}

/**
 * Format coordinates pair for display
 * @param {*} lat - Latitude
 * @param {*} lon - Longitude
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted "lat, lon" or "N/A, N/A"
 */
export function formatCoordsPair(lat, lon, decimals = 4) {
  return `${formatCoord(lat, decimals)}, ${formatCoord(lon, decimals)}`
}
