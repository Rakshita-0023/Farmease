import { useState, useEffect } from 'react'

function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalFarms: 0,
    activeCrops: 0,
    alerts: 0,
    daysToHarvest: 0
  })
  const [weather, setWeather] = useState(null)
  const [location, setLocation] = useState(user?.location || 'Delhi')
  const [suitableCrops, setSuitableCrops] = useState([])

  useEffect(() => {
    // Load farm stats from localStorage
    const farms = JSON.parse(localStorage.getItem('farmease_farms') || '[]')
    const activeFarms = farms.filter(farm => farm.progress < 100)
    
    setStats({
      totalFarms: farms.length,
      activeCrops: activeFarms.length,
      alerts: activeFarms.filter(farm => farm.progress < 50).length,
      daysToHarvest: activeFarms.length > 0 ? Math.min(...activeFarms.map(f => f.daysToHarvest)) : 0
    })

    // Load weather for current location
    loadWeatherData(location)
  }, [user, location])

  const loadWeatherData = async (loc) => {
    try {
      // Free weather API - no key required
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${getCoordinates(loc).lat}&longitude=${getCoordinates(loc).lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m&timezone=auto`)
      const data = await response.json()
      
      const weatherData = {
        temperature: Math.round(data.current_weather.temperature),
        humidity: data.hourly.relativehumidity_2m[0],
        condition: getWeatherCondition(data.current_weather.weathercode),
        location: loc
      }
      
      setWeather(weatherData)
      getSuitableCrops(weatherData)
    } catch (error) {
      console.error('Weather API error:', error)
      // Fallback to mock data if API fails
      const fallbackWeather = {
        temperature: 28,
        humidity: 65,
        condition: 'Partly Cloudy',
        location: loc
      }
      setWeather(fallbackWeather)
      getSuitableCrops(fallbackWeather)
    }
  }
  
  const getCoordinates = (city) => {
    const coords = {
      'Delhi': { lat: 28.6139, lng: 77.2090 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Bangalore': { lat: 12.9716, lng: 77.5946 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Kolkata': { lat: 22.5726, lng: 88.3639 },
      'Hyderabad': { lat: 17.3850, lng: 78.4867 },
      'Pune': { lat: 18.5204, lng: 73.8567 }
    }
    return coords[city] || coords['Delhi']
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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            // Reverse geocoding to get city name
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            const data = await response.json()
            
            let detectedLocation = data.city || data.locality || 'Delhi'
            
            // Map to our supported cities
            const cityMapping = {
              'New Delhi': 'Delhi',
              'Mumbai': 'Mumbai',
              'Bengaluru': 'Bangalore',
              'Bangalore': 'Bangalore',
              'Chennai': 'Chennai',
              'Kolkata': 'Kolkata',
              'Hyderabad': 'Hyderabad',
              'Pune': 'Pune'
            }
            
            detectedLocation = cityMapping[detectedLocation] || 'Delhi'
            
            setLocation(detectedLocation)
            alert(`📍 Location detected: ${detectedLocation}`)
            // This will trigger useEffect to reload weather data
          } catch (error) {
            console.error('Geocoding error:', error)
            alert('📍 Location detected but city name unavailable. Using Delhi.')
            setLocation('Delhi')
            // This will trigger useEffect to reload weather data
          }
        },
        (error) => {
          console.log('Geolocation error:', error)
          alert('❌ Unable to detect location. Please select manually.')
        },
        { timeout: 10000, enableHighAccuracy: true }
      )
    } else {
      alert('❌ Geolocation not supported by this browser.')
    }
  }

  return (
    <div>
      <div style={{ 
        marginBottom: '2rem', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid #e0f2fe'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          marginBottom: '0.5rem',
          color: '#1f2937',
          fontWeight: '700'
        }}>
          Welcome back, {user.name}! 👋
        </h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '16px',
          fontWeight: '500'
        }}>
          Here's what's happening on your farm today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', color: '#22c55e', marginBottom: '0.5rem', fontWeight: '700' }}>
            {stats.totalFarms}
          </div>
          <div style={{ fontWeight: '500', fontSize: '0.9rem', color: '#6b7280' }}>Total Farms</div>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', color: '#3b82f6', marginBottom: '0.5rem', fontWeight: '700' }}>
            {stats.activeCrops}
          </div>
          <div style={{ fontWeight: '500', fontSize: '0.9rem', color: '#6b7280' }}>Active Crops</div>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', color: '#f59e0b', marginBottom: '0.5rem', fontWeight: '700' }}>
            {stats.alerts}
          </div>
          <div style={{ fontWeight: '500', fontSize: '0.9rem', color: '#6b7280' }}>Alerts</div>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', color: '#8b5cf6', marginBottom: '0.5rem', fontWeight: '700' }}>
            {stats.daysToHarvest}
          </div>
          <div style={{ fontWeight: '500', fontSize: '0.9rem', color: '#6b7280' }}>Days to Harvest</div>
        </div>
      </div>

      {/* Weather and Crops */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9',
          height: 'fit-content'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#22c55e' }}>
              🌤️ Weather Today
            </h3>
            <button 
              onClick={getCurrentLocation}
              style={{
                padding: '0.5rem 1rem',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              🔄 Refresh
            </button>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Location:</label>
            <select 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px' 
              }}
            >
              <option value="Delhi">Delhi</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option>
            </select>
          </div>
          
          {weather && (
            <div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e', marginBottom: '0.5rem' }}>
                {weather.temperature}°C
              </div>
              <div style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '16px', fontWeight: '500' }}>
                {weather.condition} in {weather.location}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#9ca3af' }}>
                <span>Humidity: {weather.humidity}%</span>
                <span>Feels like {weather.temperature + 2}°C</span>
              </div>
            </div>
          )}
        </div>
        
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9',
          height: 'fit-content'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#22c55e', marginBottom: '1rem' }}>
            🌱 Suitable Crops
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1rem', fontWeight: '500' }}>
            Based on current weather in {location}:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            {suitableCrops.map((crop, index) => (
              <div 
                key={index}
                style={{
                  background: '#E6F4EA',
                  color: '#166534',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                🌾 {crop}
              </div>
            ))}
          </div>
          <div style={{ 
            padding: '1rem', 
            background: '#E6F4EA', 
            borderRadius: '12px', 
            fontSize: '14px', 
            color: '#166534',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            💡 <strong>Tip:</strong> Good weather for outdoor farming
          </div>
        </div>
      </div>

      {/* Market Prices & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#22c55e', marginBottom: '1rem' }}>
            📈 Market Prices
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { crop: 'Rice', price: 2500, change: 2.5 },
              { crop: 'Wheat', price: 2200, change: -1.2 },
              { crop: 'Cotton', price: 5800, change: 3.2 }
            ].map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>{item.crop}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>₹{item.price}</div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: item.change > 0 ? '#22c55e' : '#ef4444',
                    fontWeight: '600'
                  }}>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#22c55e', marginBottom: '1rem' }}>
            📋 Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', borderLeft: '4px solid #22c55e', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>🌤️ Weather Updated</div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>Location changed to {location}</div>
              </div>
              <span style={{ fontSize: '12px', color: '#9ca3af', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Just now</span>
            </div>
            <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>🌱 Crop Update</div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>Suitable crops updated</div>
              </div>
              <span style={{ fontSize: '12px', color: '#9ca3af', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>2m ago</span>
            </div>
            <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', borderLeft: '4px solid #f59e0b', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>🎯 Farm Alert</div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>All farms healthy</div>
              </div>
              <span style={{ fontSize: '12px', color: '#9ca3af', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>1h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard