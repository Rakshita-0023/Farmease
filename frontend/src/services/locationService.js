/**
 * Location Detection Service
 * Handles browser geolocation and backend resolution
 * With robust fallbacks and caching
 */
class LocationService {
  constructor() {
    this.isDetecting = false
    this.cachedLocation = null
    this.CACHE_KEY = 'farmease_location_cache'
    this.CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  }

  /**
   * Get cached location from localStorage
   */
  getCachedLocation() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < this.CACHE_DURATION && data?.latitude && data?.longitude) {
          console.log('📍 Using cached location:', data.city)
          return data
        }
      }
    } catch (e) {
      console.warn('Cache read failed:', e)
    }
    return null
  }

  /**
   * Cache location to localStorage
   */
  setCachedLocation(locationData) {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        data: locationData,
        timestamp: Date.now()
      }))
    } catch (e) {
      console.warn('Cache write failed:', e)
    }
  }

  /**
   * Check if geolocation is available and in secure context
   */
  isGeolocationAvailable() {
    if (!navigator.geolocation) {
      console.log('📍 Geolocation API not available')
      return false
    }
    
    // Check secure context (HTTPS or localhost)
    const isSecure = window.isSecureContext || 
                     location.protocol === 'https:' || 
                     location.hostname === 'localhost' || 
                     location.hostname === '127.0.0.1'
    
    if (!isSecure) {
      console.warn('⚠️ Not in secure context - geolocation requires HTTPS')
      return false
    }
    
    return true
  }

  /**
   * Request browser geolocation permission and get coordinates
   */
  async getBrowserLocation(timeout = 20000) {
    return new Promise((resolve, reject) => {
      if (!this.isGeolocationAvailable()) {
        reject(new Error('Geolocation not available. Please select your city manually.'))
        return
      }

      console.log('📍 Requesting browser location...')

      const timeoutId = setTimeout(() => {
        reject(new Error('Location request timed out. Please select your city manually.'))
      }, timeout)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId)
          const { latitude, longitude, accuracy } = position.coords
          console.log('✅ Browser location obtained:', { latitude, longitude, accuracy })
          resolve({ latitude, longitude, accuracy })
        },
        (error) => {
          clearTimeout(timeoutId)
          console.log('❌ Geolocation error:', error.code, error.message)
          
          let message = 'Location access failed'
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              message = 'Location permission denied. Please enable location in browser settings or select your city manually.'
              break
            case 2: // POSITION_UNAVAILABLE
              message = 'Location unavailable. Please select your city manually.'
              break
            case 3: // TIMEOUT
              message = 'Location request timed out. Please try again or select manually.'
              break
            default:
              message = 'Could not detect location. Please select your city manually.'
          }
          reject(new Error(message))
        },
        {
          enableHighAccuracy: false, // Faster, less accurate - good enough for city-level
          timeout: timeout - 2000,
          maximumAge: 10 * 60 * 1000 // 10 minutes - reuse recent position
        }
      )
    })
  }

  /**
   * Resolve coordinates to city using backend
   */
  async resolveCoordinates(latitude, longitude) {
    console.log('🌍 Resolving coordinates:', { latitude, longitude })

    try {
      const API_BASE_URL = import.meta.env.PROD
        ? (import.meta.env.VITE_API_BASE_URL || 'https://farmease-tqgy.onrender.com/api')
        : '/api'
      
      // Use POST endpoint which expects body data
      const response = await fetch(`${API_BASE_URL}/locations/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ latitude, longitude })
      })

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const data = await response.json()

      // Handle both response formats
      if (data?.city) {
        const locationData = {
          city: data.city,
          state: data.state || 'Unknown',
          country: data.country || 'India',
          latitude: data.latitude || latitude,
          longitude: data.longitude || longitude
        }
        console.log('✅ Location resolved:', locationData.city)
        return locationData
      }
      
      throw new Error('Invalid response from server')
    } catch (error) {
      console.error('❌ Resolution failed:', error.message)
      
      // Fallback: return coordinates with generic city
      return {
        city: 'Your Location',
        state: 'India',
        country: 'India',
        latitude,
        longitude
      }
    }
  }

  /**
   * Save location to user profile (non-blocking, never causes logout)
   */
  async saveLocationToProfile(locationData) {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('⚠️ No token, skipping profile save')
        return false
      }

      console.log('💾 Saving location to profile...')
      
      // Use fetch directly to avoid apiClient's auth error handling
      const API_BASE_URL = import.meta.env.PROD
        ? (import.meta.env.VITE_API_BASE_URL || 'https://farmease-tqgy.onrender.com/api')
        : '/api'
      
      const response = await fetch(`${API_BASE_URL}/user/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(locationData)
      })
      
      if (response.ok) {
        console.log('✅ Location saved to profile')
        return true
      } else {
        // Don't throw - just log and return false
        console.warn('⚠️ Profile save returned:', response.status)
        return false
      }
    } catch (error) {
      // Silently fail - location save is non-critical
      console.warn('⚠️ Profile save failed (non-critical):', error.message)
      return false
    }
  }

  /**
   * Complete location detection flow with fallbacks
   */
  async detectAndSaveLocation() {
    if (this.isDetecting) {
      console.log('⏳ Detection already in progress')
      return this.cachedLocation
    }

    this.isDetecting = true

    try {
      // Step 1: Check local cache first (fast path)
      const cached = this.getCachedLocation()
      if (cached) {
        this.cachedLocation = cached
        // Save to profile in background (don't await)
        this.saveLocationToProfile(cached).catch(() => {})
        return cached
      }

      // Step 2: Try browser geolocation
      let coordinates
      try {
        coordinates = await this.getBrowserLocation()
      } catch (geoError) {
        console.log('📍 Browser geolocation failed:', geoError.message)
        throw geoError
      }

      // Step 3: Resolve coordinates to city
      const locationData = await this.resolveCoordinates(
        coordinates.latitude,
        coordinates.longitude
      )

      // Step 4: Cache locally
      this.setCachedLocation(locationData)
      this.cachedLocation = locationData

      // Step 5: Save to profile (non-blocking)
      this.saveLocationToProfile(locationData).catch(() => {})

      return locationData
    } catch (error) {
      console.log('📍 Detection failed:', error.message)
      throw error
    } finally {
      this.isDetecting = false
    }
  }

  /**
   * Get saved location from user profile (non-blocking)
   */
  async getSavedLocation() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null

      // Check local cache first (fast path)
      const cached = this.getCachedLocation()
      if (cached) {
        return cached
      }

      console.log('📖 Fetching saved location from profile...')
      
      // Use fetch directly to avoid apiClient's auth error handling
      const API_BASE_URL = import.meta.env.PROD
        ? (import.meta.env.VITE_API_BASE_URL || 'https://farmease-tqgy.onrender.com/api')
        : '/api'
      
      const response = await fetch(`${API_BASE_URL}/user/location`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        console.log('📍 Could not fetch saved location:', response.status)
        return null
      }
      
      const data = await response.json()

      if (data?.city && data?.latitude && data?.longitude) {
        const locationData = {
          city: data.city,
          state: data.state,
          country: data.country || 'India',
          latitude: data.latitude,
          longitude: data.longitude
        }
        
        // Cache it
        this.setCachedLocation(locationData)
        this.cachedLocation = locationData
        
        console.log('✅ Saved location found:', locationData.city)
        return locationData
      }
      
      return null
    } catch (error) {
      console.log('📍 No saved location:', error.message)
      return null
    }
  }

  /**
   * Manual city selection
   */
  async selectAndSaveCity(cityData) {
    console.log('📍 selectAndSaveCity called with:', cityData)
    
    const locationData = {
      city: cityData.name || cityData.city,
      state: cityData.state,
      country: cityData.country || 'India',
      latitude: cityData.latitude,
      longitude: cityData.longitude
    }

    console.log('📍 Created locationData:', locationData)

    // Cache locally
    this.setCachedLocation(locationData)
    this.cachedLocation = locationData
    console.log('📍 Cached location locally')

    // Save to profile (non-blocking)
    this.saveLocationToProfile(locationData).catch((err) => {
      console.warn('📍 Profile save failed (non-critical):', err.message)
    })

    console.log('📍 Returning locationData:', locationData)
    return locationData
  }

  /**
   * Clear cached location
   */
  clearCache() {
    localStorage.removeItem(this.CACHE_KEY)
    this.cachedLocation = null
    console.log('🗑️ Location cache cleared')
  }
}

export const locationService = new LocationService()
export default locationService
