import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import locationPinAnimation from '../../public/Location Pin.json'

const LocationDetector = ({ onLocationDetected }) => {
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
      // Use default location if detection fails
      const defaultLocation = {
        latitude: 28.6139,
        longitude: 77.2090,
        city: 'New Delhi',
        state: 'Delhi',
        country: 'IN'
      }
      setLocation(defaultLocation)
      onLocationDetected(defaultLocation)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if location is already stored
    const storedLocation = localStorage.getItem('userLocation')
    if (storedLocation) {
      const locationInfo = JSON.parse(storedLocation)
      setLocation(locationInfo)
      onLocationDetected(locationInfo)
      setLoading(false)
    } else {
      detectLocation()
    }
  }, [])

  if (loading) {
    return (
      <div className="location-detector loading">
        <div className="location-spinner"></div>
        <p>Detecting your location...</p>
      </div>
    )
  }

  return (
    <div className="location-detector compact">
      <div className="location-info">
        <Lottie 
          animationData={locationPinAnimation} 
          style={{ width: 24, height: 24 }} 
          loop={true}
        />
        <span className="location-text">
          {location?.city}
        </span>
      </div>
    </div>
  )
}

export default LocationDetector