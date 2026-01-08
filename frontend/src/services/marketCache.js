/**
 * Market Cache Service
 * Caches market data for 30 minutes to reduce API calls
 */
class MarketCache {
  constructor() {
    this.cache = new Map()
    this.CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  }

  /**
   * Generate cache key from coordinates
   */
  getCacheKey(lat, lon, radius = 50) {
    return `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100},${radius}`
  }

  /**
   * Get cached market data if valid
   */
  get(lat, lon, radius = 50) {
    if (!lat || !lon) return null

    const key = this.getCacheKey(lat, lon, radius)
    const cached = this.cache.get(key)

    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    console.log('✅ Market cache hit for', key)
    return cached.data
  }

  /**
   * Set market data in cache
   */
  set(lat, lon, data, radius = 50) {
    if (!lat || !lon) return

    const key = this.getCacheKey(lat, lon, radius)
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })

    console.log('💾 Market data cached for', key)
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear()
    console.log('🗑️ Market cache cleared')
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key)
      }
    }
  }
}

export const marketCache = new MarketCache()
export default marketCache
