import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiClient } from './config'
import locationService from './services/locationService'

const LocationContext = createContext()

export const useLocation = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}

export const LocationProvider = ({ children, user }) => {
  const [location, setLocation] = useState(null)
  const [allCities, setAllCities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [locationStatus, setLocationStatus] = useState('unset') // 'unset', 'detecting', 'set', 'failed'

  // Fetch cities list (lazy, only when needed)
  const fetchCities = useCallback(async () => {
    if (allCities.length > 0) return
    try {
      const response = await apiClient.get('/locations/cities')
      setAllCities(response.cities || [])
    } catch (err) {
      console.warn('Failed to fetch cities:', err.message)
    }
  }, [allCities.length])

  // Initialize location for authenticated users
  useEffect(() => {
    if (!user?.id) {
      setLocation(null)
      setLocationStatus('unset')
      setLoading(false)
      setError(null)
      return
    }

    let isMounted = true

    const initializeLocation = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check for token
        const token = localStorage.getItem('token')
        if (!token) {
          if (isMounted) {
            setError('Please log in to continue')
            setLocationStatus('failed')
            setLoading(false)
          }
          return
        }

        console.log('📍 Initializing location for user:', user.id)

        // Step 1: Try to get saved/cached location (fast)
        try {
          const savedLocation = await locationService.getSavedLocation()
          
          if (savedLocation && savedLocation.latitude && savedLocation.longitude) {
            if (isMounted) {
              console.log('✅ Using saved location:', savedLocation.city)
              setLocation(savedLocation)
              setLocationStatus('set')
              setLoading(false)
            }
            return
          }
        } catch (savedErr) {
          console.log('📍 No saved location found:', savedErr.message)
        }

        // Step 2: No saved location, attempt auto-detection
        if (isMounted) {
          setLocationStatus('detecting')
        }

        try {
          const detectedLocation = await locationService.detectAndSaveLocation()
          
          if (isMounted && detectedLocation) {
            console.log('✅ Location detected:', detectedLocation.city)
            setLocation(detectedLocation)
            setLocationStatus('set')
          }
        } catch (detectionError) {
          console.log('📍 Auto-detection failed:', detectionError.message)
          
          if (isMounted) {
            // User-friendly error messages
            let friendlyError = detectionError.message
            
            if (friendlyError.includes('permission denied') || friendlyError.includes('Permission denied')) {
              friendlyError = 'Location access denied. Please enable location in browser settings or select your city manually.'
            } else if (friendlyError.includes('timed out')) {
              friendlyError = 'Location detection timed out. Please try again or select manually.'
            } else if (friendlyError.includes('not supported')) {
              friendlyError = 'Location not supported in this browser. Please select your city manually.'
            }
            
            setError(friendlyError)
            setLocationStatus('failed')
          }
        }
      } catch (err) {
        console.error('❌ Location init failed:', err)
        if (isMounted) {
          setError('Failed to initialize location')
          setLocationStatus('failed')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeLocation()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Manual location update - works even without user for initial setup
  const updateLocation = useCallback(async (newLocation) => {
    console.log('📍 updateLocation called with:', newLocation)
    console.log('📍 Current user:', user)
    
    try {
      setLoading(true)
      setError(null)

      console.log('📍 Calling locationService.selectAndSaveCity...')
      const locationData = await locationService.selectAndSaveCity(newLocation)
      console.log('📍 locationService returned:', locationData)
      
      setLocation(locationData)
      setLocationStatus('set')
      console.log('✅ Location state updated to:', locationData.city)
    } catch (err) {
      console.error('❌ Failed to update location:', err)
      setError('Failed to save location')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Retry location detection
  const retryLocationDetection = useCallback(async () => {
    if (loading) return

    try {
      setLoading(true)
      setError(null)
      setLocationStatus('detecting')

      // Clear cache and retry
      locationService.clearCache()
      
      const detectedLocation = await locationService.detectAndSaveLocation()

      if (detectedLocation) {
        setLocation(detectedLocation)
        setLocationStatus('set')
        console.log('✅ Location retry successful:', detectedLocation.city)
      }
    } catch (err) {
      console.log('📍 Retry failed:', err.message)
      setError(err.message)
      setLocationStatus('failed')
    } finally {
      setLoading(false)
    }
  }, [loading])

  // Search cities
  const searchCities = useCallback(async (query) => {
    if (!query || query.length < 2) {
      await fetchCities()
      return
    }

    try {
      const response = await apiClient.get(`/locations/search?q=${encodeURIComponent(query)}`)
      setAllCities(response.cities || [])
    } catch (err) {
      console.warn('City search failed:', err.message)
    }
  }, [fetchCities])

  return (
    <LocationContext.Provider value={{
      location,
      allCities,
      loading,
      error,
      locationStatus,
      updateLocation,
      searchCities,
      retryLocationDetection,
      fetchCities
    }}>
      {children}
    </LocationContext.Provider>
  )
}
