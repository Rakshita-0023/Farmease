import { useState, useEffect } from 'react'

function Weather() {
  const [weatherData, setWeatherData] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState('Delhi')
  const [inputLocation, setInputLocation] = useState('Delhi')
  const [suitableCrops, setSuitableCrops] = useState([])
  const [detectingLocation, setDetectingLocation] = useState(false)

  useEffect(() => {
    loadWeatherData(location)
  }, [location])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputLocation.trim() && inputLocation !== location) {
        setLocation(inputLocation)
      }
    }, 1000) // Wait 1 second after user stops typing
    
    return () => clearTimeout(timer)
  }, [inputLocation, location])

  const loadWeatherData = async (loc) => {
    setLoading(true)
    try {
      const coords = await getCoordinates(loc)
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`)
      const data = await response.json()
      
      const currentWeather = {
        temperature: Math.round(data.current_weather.temperature),
        humidity: data.hourly.relativehumidity_2m[0],
        windSpeed: Math.round(data.current_weather.windspeed),
        pressure: 1013,
        visibility: 10,
        uvIndex: 6,
        condition: getWeatherCondition(data.current_weather.weathercode),
        location: loc
      }
      
      setWeatherData(currentWeather)
      
      // Generate forecast from daily data
      const forecastData = data.daily.temperature_2m_max.slice(0, 5).map((maxTemp, index) => ({
        day: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : ['Wednesday', 'Thursday', 'Friday'][index - 2],
        high: Math.round(maxTemp),
        low: Math.round(data.daily.temperature_2m_min[index]),
        condition: getWeatherCondition(data.daily.weathercode[index]),
        icon: getWeatherIcon(data.daily.weathercode[index])
      }))
      
      setForecast(forecastData)
      getSuitableCrops(currentWeather)
      setLoading(false)
    } catch (error) {
      console.error('Weather API error:', error)
      // Fallback data
      const fallbackWeather = {
        temperature: 28, humidity: 65, windSpeed: 12, pressure: 1013,
        visibility: 10, uvIndex: 6, condition: 'Partly Cloudy', location: loc
      }
      setWeatherData(fallbackWeather)
      setForecast([
        { day: 'Today', high: 32, low: 24, condition: 'Sunny', icon: '☀️' },
        { day: 'Tomorrow', high: 30, low: 22, condition: 'Cloudy', icon: '☁️' },
        { day: 'Wednesday', high: 28, low: 20, condition: 'Rainy', icon: '🌧️' },
        { day: 'Thursday', high: 26, low: 18, condition: 'Stormy', icon: '⛈️' },
        { day: 'Friday', high: 29, low: 21, condition: 'Partly Cloudy', icon: '⛅' }
      ])
      getSuitableCrops(fallbackWeather)
      setLoading(false)
    }
  }
  
  const getCoordinates = async (city) => {
    const predefinedCoords = {
      'Delhi': { lat: 28.6139, lng: 77.2090 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Bangalore': { lat: 12.9716, lng: 77.5946 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Kolkata': { lat: 22.5726, lng: 88.3639 },
      'Hyderabad': { lat: 17.3850, lng: 78.4867 },
      'Pune': { lat: 18.5204, lng: 73.8567 }
    }
    
    if (predefinedCoords[city]) {
      return predefinedCoords[city]
    }
    
    try {
      // Geocode custom city name
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`)
      const data = await response.json()
      
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
    
    return predefinedCoords['Delhi'] // fallback
  }
  
  const getWeatherCondition = (code) => {
    if (code === 0) return 'Clear Sky'
    if (code <= 3) return 'Partly Cloudy'
    if (code <= 48) return 'Foggy'
    if (code <= 67) return 'Rainy'
    if (code <= 77) return 'Snowy'
    if (code <= 82) return 'Showers'
    return 'Stormy'
  }
  
  const getWeatherIcon = (code) => {
    if (code === 0) return '☀️'
    if (code <= 3) return '⛅'
    if (code <= 48) return '🌫️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '❄️'
    if (code <= 82) return '🌦️'
    return '⛈️'
  }
  
  const getSuitableCrops = (weatherData) => {
    const { temperature, humidity } = weatherData
    let crops = []
    
    if (temperature >= 30 && humidity >= 70) {
      crops = ['Rice', 'Sugarcane', 'Coconut']
    } else if (temperature >= 25 && humidity >= 60) {
      crops = ['Cotton', 'Maize', 'Groundnut']
    } else if (temperature >= 20 && temperature < 30 && humidity < 60) {
      crops = ['Wheat', 'Barley', 'Mustard']
    } else if (temperature < 25) {
      crops = ['Potato', 'Onion', 'Cabbage']
    } else {
      crops = ['Tomato', 'Chili', 'Soybean']
    }
    
    setSuitableCrops(crops)
  }
  
  const detectCurrentLocation = () => {
    if (navigator.geolocation) {
      setDetectingLocation(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            // Use OpenStreetMap Nominatim for better accuracy
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`)
            const data = await response.json()
            
            let detectedLocation = data.address?.city || data.address?.town || data.address?.village || data.display_name.split(',')[0]
            
            setInputLocation(detectedLocation)
            setLocation(detectedLocation)
            setDetectingLocation(false)
            alert(`📍 Location detected: ${detectedLocation}`)
          } catch (error) {
            console.error('Geocoding error:', error)
            // Fallback: use coordinates to estimate location
            let estimatedCity = 'Delhi'
            if (latitude > 18 && latitude < 20 && longitude > 72 && longitude < 73) estimatedCity = 'Mumbai'
            else if (latitude > 12 && latitude < 13 && longitude > 77 && longitude < 78) estimatedCity = 'Bangalore'
            else if (latitude > 13 && latitude < 14 && longitude > 80 && longitude < 81) estimatedCity = 'Chennai'
            
            setInputLocation(estimatedCity)
            setLocation(estimatedCity)
            setDetectingLocation(false)
            alert(`📍 Approximate location: ${estimatedCity}`)
          }
        },
        (error) => {
          console.log('Geolocation error:', error)
          setDetectingLocation(false)
          alert('❌ Unable to detect location. Please enter manually.')
        },
        { timeout: 15000, enableHighAccuracy: true, maximumAge: 60000 }
      )
    } else {
      alert('❌ Geolocation not supported by this browser.')
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center' }}>
          🌤️ Weather Dashboard
        </h1>
        <button 
          onClick={detectCurrentLocation}
          disabled={detectingLocation}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {detectingLocation ? '🔄 Detecting...' : '📍 Detect Location'}
        </button>
      </div>
      
      {/* Location Selector */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ fontWeight: '600', minWidth: '80px' }}>Location:</label>
          <input 
            type="text"
            value={inputLocation}
            onChange={(e) => setInputLocation(e.target.value)}
            placeholder="Enter your city name"
            style={{ 
              flex: 1,
              padding: '0.75rem', 
              border: '1px solid #d1d5db', 
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#6b7280', marginRight: '0.5rem' }}>Quick select:</span>
          {['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune'].map(city => (
            <button
              key={city}
              onClick={() => {
                setInputLocation(city)
                setLocation(city)
              }}
              style={{
                padding: '0.25rem 0.75rem',
                background: location === city ? '#22c55e' : '#f3f4f6',
                color: location === city ? 'white' : '#374151',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Current Weather */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Current Weather in {weatherData.location}
            </h2>
            <p style={{ color: '#6b7280' }}>{weatherData.condition}</p>
          </div>
          <div style={{ fontSize: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
              {weatherData.temperature}°C
            </div>
          </div>
        </div>

        <div className="grid grid-3">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: '#3b82f6', marginBottom: '0.5rem' }}>
              💧
            </div>
            <div style={{ fontWeight: '500' }}>Humidity</div>
            <div style={{ color: '#6b7280' }}>{weatherData.humidity}%</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: '#10b981', marginBottom: '0.5rem' }}>
              💨
            </div>
            <div style={{ fontWeight: '500' }}>Wind Speed</div>
            <div style={{ color: '#6b7280' }}>{weatherData.windSpeed} km/h</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
              🌡️
            </div>
            <div style={{ fontWeight: '500' }}>Pressure</div>
            <div style={{ color: '#6b7280' }}>{weatherData.pressure} hPa</div>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>5-Day Forecast</h3>
        <div className="grid grid-5" style={{ gap: '1rem' }}>
          {forecast.map((day, index) => (
            <div key={index} style={{ 
              textAlign: 'center', 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px' 
            }}>
              <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                {day.day}
              </div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {day.icon}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                {day.condition}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>{day.high}°</span>
                <span style={{ color: '#6b7280' }}>{day.low}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suitable Crops */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>🌱 Suitable Crops for {location}</h3>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          Based on current weather conditions (Temp: {weatherData?.temperature}°C, Humidity: {weatherData?.humidity}%):
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {suitableCrops.map((crop, index) => (
            <span 
              key={index}
              style={{
                background: '#22c55e',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              {crop}
            </span>
          ))}
        </div>
        <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px', fontSize: '0.9rem' }}>
          💡 <strong>Recommendation:</strong> These crops are most suitable for the current weather conditions in {location}. Consider soil type and water availability before planting.
        </div>
      </div>
      
      {/* Farming Recommendations */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>🌾 Farming Recommendations</h3>
        <div className="grid grid-2">
          <div>
            <h4 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>✅ Good Conditions For:</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '0.25rem 0' }}>• Planting new crops</li>
              <li style={{ padding: '0.25rem 0' }}>• Applying fertilizers</li>
              <li style={{ padding: '0.25rem 0' }}>• Harvesting mature crops</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>⚠️ Weather Alerts:</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '0.25rem 0' }}>• Monitor temperature changes</li>
              <li style={{ padding: '0.25rem 0' }}>• Check humidity levels daily</li>
              <li style={{ padding: '0.25rem 0' }}>• Plan irrigation accordingly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Weather