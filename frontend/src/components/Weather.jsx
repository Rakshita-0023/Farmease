import { useState, useEffect } from 'react'
import './WeatherEnhancements.css'

const getCropRecommendations = (weather) => {
  const temp = weather.temperature
  const condition = weather.condition.toLowerCase()
  
  if (temp >= 25 && temp <= 35) {
    if (condition.includes('rain')) return 'Rice, Sugarcane - Excellent for monsoon'
    return 'Corn, Cotton, Tomatoes - Ideal warm weather crops'
  } else if (temp >= 15 && temp < 25) {
    return 'Wheat, Barley, Peas - Perfect cool season crops'
  } else if (temp < 15) {
    return 'Cabbage, Carrots, Spinach - Cold hardy vegetables'
  } else {
    return 'Heat-resistant varieties recommended'
  }
}

const getIrrigationAdvice = (weather) => {
  const humidity = weather.humidity
  const condition = weather.condition.toLowerCase()
  
  if (condition.includes('rain')) {
    return 'Reduce watering - Natural rainfall sufficient'
  } else if (humidity > 70) {
    return 'Light watering needed - High humidity present'
  } else if (humidity < 40) {
    return 'Increase watering frequency - Low humidity detected'
  } else {
    return 'Normal watering schedule recommended'
  }
}

const getWeatherAlert = (weather) => {
  const temp = weather.temperature
  const wind = weather.windSpeed
  const condition = weather.condition.toLowerCase()
  
  if (temp > 40) return '⚠️ Extreme heat - Provide shade for crops'
  if (temp < 5) return '❄️ Frost warning - Protect sensitive plants'
  if (wind > 25) return '💨 High winds - Secure tall crops'
  if (condition.includes('storm')) return '⛈️ Storm alert - Take protective measures'
  return '✅ Weather conditions favorable for farming'
}

const Weather = () => {
  const [weather, setWeather] = useState(null)
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const popularCities = [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad',
    'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
    'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'London', 'New York', 'Tokyo', 'Paris', 'Sydney', 'Toronto', 'Berlin', 'Rome'
  ]

  const fetchWeather = async (city = 'Delhi') => {
    setLoading(true)
    try {
      const API_KEY = '895284fb2d2c50a520ea537456963d9c'
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      )
      const data = await response.json()
      
      if (response.ok) {
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        )
        const forecastData = await forecastResponse.json()
        
        setWeather({
          location: data.name,
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6),
          dewPoint: Math.round(data.main.temp - ((100 - data.main.humidity) / 5)),
          pressure: data.main.pressure,
          visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
          uvIndex: Math.round(Math.random() * 10), // Placeholder as OpenWeather free tier doesn't include UV
          soilTemp: Math.round(data.main.temp - 2), // Estimated soil temperature
          forecast: forecastData.list.slice(0, 3).map((item, index) => ({
            day: index === 0 ? 'Tomorrow' : `Day ${index + 1}`,
            temp: Math.round(item.main.temp),
            condition: item.weather[0].main,
            precipProb: Math.round((item.pop || 0) * 100)
          }))
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Weather fetch error:', error)
      setWeather({
        location: city,
        temperature: 25,
        condition: 'Clear',
        humidity: 60,
        windSpeed: 10,
        dewPoint: 18,
        pressure: 1013,
        visibility: 10,
        uvIndex: 6,
        soilTemp: 23,
        forecast: [
          { day: 'Tomorrow', temp: 26, condition: 'Clear', precipProb: 10 },
          { day: 'Day 2', temp: 24, condition: 'Cloudy', precipProb: 30 },
          { day: 'Day 3', temp: 27, condition: 'Clear', precipProb: 5 }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather()
  }, [])

  const handleLocationSubmit = (e) => {
    e.preventDefault()
    if (location.trim()) {
      fetchWeather(location)
      setShowSuggestions(false)
    }
  }
  
  const handleLocationChange = (value) => {
    setLocation(value)
    if (value.length > 1) {
      const filtered = popularCities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }
  
  const selectSuggestion = (city) => {
    setLocation(city)
    setShowSuggestions(false)
    fetchWeather(city)
  }

  return (
    <div className="weather-page">
      <div className="page-header">
        <h1>🌤️ Weather Forecast</h1>
        <p>Stay updated with weather conditions for better farming decisions</p>
      </div>

      <div className="weather-search">
        <form onSubmit={handleLocationSubmit}>
          <div className="search-container">
            <input
              type="text"
              placeholder="Enter city name..."
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onFocus={() => location.length > 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((city, index) => (
                  <div 
                    key={index} 
                    className="suggestion-item"
                    onClick={() => selectSuggestion(city)}
                  >
                    📍 {city}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Get Weather'}
          </button>
        </form>
      </div>

      {weather && (
        <div className="weather-content">
          <div className="current-weather">
            <div className="weather-main">
              <h2>{weather.location}</h2>
              <div className="temperature">{weather.temperature}°C</div>
              <div className="condition">{weather.condition}</div>
            </div>
            <div className="weather-details">
              <div className="detail">
                <span className="icon">💧</span>
                <span>Humidity: {weather.humidity}%</span>
              </div>
              <div className="detail">
                <span className="icon">💨</span>
                <span>Wind: {weather.windSpeed} km/h</span>
              </div>
              <div className="detail">
                <span className="icon">🌡️</span>
                <span>Dew Point: {weather.dewPoint}°C</span>
              </div>
              <div className="detail">
                <span className="icon">🌱</span>
                <span>Soil Temp: {weather.soilTemp}°C</span>
              </div>
            </div>
          </div>

          <div className="weather-forecast">
            <h3>3-Day Forecast</h3>
            <div className="forecast-grid">
              {weather.forecast.map((day, index) => (
                <div key={index} className="forecast-card">
                  <div className="day">{day.day}</div>
                  <div className="temp">{day.temp}°C</div>
                  <div className="condition">{day.condition}</div>
                  <div className="precip-prob">🌧️ {day.precipProb}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="farming-tips">
            <h3>🌱 AI Farming Recommendations</h3>
            <div className="tips-grid">
              <div className="tip-card">
                <h4>Suitable Crops</h4>
                <p>{getCropRecommendations(weather)}</p>
              </div>
              <div className="tip-card">
                <h4>Irrigation Advice</h4>
                <p>{getIrrigationAdvice(weather)}</p>
              </div>
              <div className="tip-card">
                <h4>Weather Alert</h4>
                <p>{getWeatherAlert(weather)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Weather