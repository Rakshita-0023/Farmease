/**
 * Weather Cache Service
 * Caches weather data for 10 minutes to reduce API calls
 */
class WeatherCache {
  constructor() {
    this.cache = new Map()
    this.CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  }

  /**
   * Generate cache key from coordinates
   */
  getCacheKey(lat, lon) {
    return `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`
  }

  /**
   * Get cached weather data if valid
   */
  get(lat, lon) {
    if (!lat || !lon) return null

    const key = this.getCacheKey(lat, lon)
    const cached = this.cache.get(key)

    if (!cached) return null

    const isExpired = Date.now() - cached.cachedAt > this.CACHE_TTL
    if (isExpired) {
      this.cache.delete(key)
      console.log('🗑️ Weather cache expired for', key)
      return null
    }

    console.log('✅ Weather cache hit for', key)
    return cached.data
  }

  /**
   * Set weather data in cache
   */
  set(lat, lon, data) {
    if (!lat || !lon) return

    const key = this.getCacheKey(lat, lon)
    this.cache.set(key, {
      data,
      cachedAt: Date.now()
    })

    console.log('💾 Weather cached for', key)
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear()
    console.log('🗑️ Weather cache cleared')
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.cachedAt > this.CACHE_TTL) {
        this.cache.delete(key)
      }
    }
  }
}

export const weatherCache = new WeatherCache()
export default weatherCache
