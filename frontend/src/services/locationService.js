import { apiClient } from '../config'

/**
 * Location Detection Service
 * Handles browser geolocation and backend resolution
 */
class LocationService {
  constructor() {
    this.isDetecting = false
  }

  /**
   * Request browser geolocation permission and get coordinates
   */
  async getBrowserLocation() {
    return new Promise((resolve, reject) => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      // Check if we're in a secure context (HTTPS or localhost)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        reject(new Error('Geolocation requires HTTPS or localhost'))
        return
      }

      console.log('📍 Requesting browser location permission...')

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('✅ Browser location obtained:', { latitude, longitude })
          resolve({ latitude, longitude })
        },
        (error) => {
          console.log('❌ Browser location failed:', error.message)
          let message = 'Location access failed'

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable location access or select your city manually.'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable. Please select your city manually.'
              break
            case error.TIMEOUT:
              message = 'Location request timed out. Please try again or select your city manually.'
              break
            default:
              message = 'Unable to retrieve location. Please select your city manually.'
              break
          }

          reject(new Error(message))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  /**
   * Resolve coordinates to city using backend
   */
  async resolveCoordinates(latitude, longitude) {
    try {
      console.log('🌍 Resolving coordinates with backend...', { latitude, longitude })

      const response = await apiClient.post('/locations/resolve', {
        latitude,
        longitude
      })

      if (response.success) {
        console.log('✅ Location resolved:', response)
        return {
          city: response.city,
          state: response.state,
          country: response.country,
          latitude: response.latitude,
          longitude: response.longitude
        }
      } else {
        throw new Error(response.error || 'Failed to resolve location')
      }
    } catch (error) {
      console.error('❌ Backend location resolution failed:', error)
      throw new Error('Unable to determine your city. Please select manually.')
    }
  }

  /**
   * Save location to user profile
   */
  async saveLocationToProfile(locationData) {
    try {
      console.log('💾 Saving location to user profile...', locationData)

      const response = await apiClient.put('/user/location', locationData)

      console.log('✅ Location saved to profile:', response)
      return true
    } catch (error) {
      console.error('❌ Failed to save location to profile:', error)
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      })
      throw new Error(`Failed to save location: ${error.message}`)
    }
  }

  /**
   * Complete location detection flow
   * 1. Get browser coordinates
   * 2. Resolve with backend
   * 3. Save to user profile
   */
  async detectAndSaveLocation() {
    if (this.isDetecting) {
      console.log('⏳ Location detection already in progress...')
      return null
    }

    this.isDetecting = true

    try {
      // Check if user is authenticated first
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('User not authenticated. Please log in first.')
      }

      // Step 1: Get browser coordinates
      const coordinates = await this.getBrowserLocation()

      // Step 2: Resolve with backend
      const locationData = await this.resolveCoordinates(
        coordinates.latitude,
        coordinates.longitude
      )

      // Step 3: Save to user profile
      try {
        await this.saveLocationToProfile(locationData)
      } catch (saveError) {
        console.warn('⚠️ Failed to save location to profile, but proceeding with detected location:', saveError.message)
        // We do NOT throw here. The user still gets their location for this session.
      }

      return locationData
    } catch (error) {
      console.log('📍 Location detection failed:', error.message)
      throw error
    } finally {
      this.isDetecting = false
    }
  }

  /**
   * Get saved location from user profile
   */
  async getSavedLocation() {
    try {
      console.log('📖 Fetching saved location from profile...')

      const response = await apiClient.get('/user/location')

      if (response && response.city) {
        console.log('✅ Saved location found:', response)
        return {
          city: response.city,
          state: response.state,
          country: response.country || 'India',
          latitude: response.latitude,
          longitude: response.longitude
        }
      } else {
        console.log('📍 No saved location found')
        return null
      }
    } catch (error) {
      console.error('❌ Failed to fetch saved location:', error)
      return null
    }
  }

  /**
   * Manual city selection and save
   */
  async selectAndSaveCity(cityData) {
    try {
      console.log('🏙️ Manually selecting city:', cityData)

      const locationData = {
        city: cityData.name || cityData.city,
        state: cityData.state,
        country: cityData.country || 'India',
        latitude: cityData.latitude,
        longitude: cityData.longitude
      }

      try {
        await this.saveLocationToProfile(locationData)
      } catch (saveError) {
        console.warn('⚠️ Failed to save selected city to profile, but using it for this session:', saveError.message)
      }

      return locationData
    } catch (error) {
      console.error('❌ Failed to process city selection:', error)
      throw new Error('Failed to select city')
    }
  }
}

// Export singleton instance
export const locationService = new LocationService()
export default locationService