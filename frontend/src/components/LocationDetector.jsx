import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import locationPinAnimation from '../assets/animations/location-pin.json'

const LocationDetector = ({ onLocationDetected, user }) => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const detectLocation = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported')
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        })
      })

      const { latitude, longitude } = position.coords

      // Get location name using reverse geocoding
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=895284fb2d2c50a520ea537456963d9c`
      )
      const locationData = await response.json()

      const locationInfo = {
        latitude,
        longitude,
        city: locationData[0]?.name || 'Unknown',
        state: locationData[0]?.state || 'Unknown',
        country: locationData[0]?.country || 'Unknown'
      }

      setLocation(locationInfo)
      onLocationDetected(locationInfo)

      // Store in localStorage for future use
      localStorage.setItem('userLocation', JSON.stringify(locationInfo))

    } catch (err) {
      setError(err.message)
      // Use user's saved location or default
      const defaultLocation = user?.city ? {
        latitude: user.latitude || 17.4847,
        longitude: user.longitude || 78.4138,
        city: user.city,
        state: user.state,
        country: user.country || 'India'
      } : {
        latitude: 17.4847,
        longitude: 78.4138,
        city: 'Kukatpalli',
        state: 'Telangana',
        country: 'India'
      }
      setLocation(defaultLocation)
      onLocationDetected(defaultLocation)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Priority: 1. User's saved location, 2. Stored location, 3. Detect new
    if (user?.city) {
      const userLocation = {
        latitude: user.latitude || 17.4847,
        longitude: user.longitude || 78.4138,
        city: user.city,
        state: user.state,
        country: user.country || 'India'
      }
      setLocation(userLocation)
      onLocationDetected(userLocation)
      setLoading(false)
    } else {
      const storedLocation = localStorage.getItem('userLocation')
      if (storedLocation) {
        const locationInfo = JSON.parse(storedLocation)
        setLocation(locationInfo)
        onLocationDetected(locationInfo)
        setLoading(false)
      } else {
        detectLocation()
      }
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/60 text-xs">
        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
        <span>Detecting...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
      <Lottie
        animationData={locationPinAnimation}
        style={{ width: 16, height: 16 }}
        loop={true}
      />
      <span className="text-white/90 text-xs font-medium">
        📍 {location?.city || 'Unknown'}
      </span>
    </div>
  )
}

export default LocationDetector