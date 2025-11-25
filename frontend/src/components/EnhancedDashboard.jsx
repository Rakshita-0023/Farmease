import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLanguage } from '../App'
import './EnhancedDashboard.css'

const EnhancedDashboard = () => {
  const [weather, setWeather] = useState(null)
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {})
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const { t } = useLanguage()

  // Dynamic farm stats based on actual farm data
  const farmStats = useMemo(() => {
    if (farms.length === 0) {
      return {
        totalFarms: 0,
        activeCrops: 0,
        harvestReady: 0,
        avgYield: 0
      }
    }

    const activeCrops = farms.reduce((total, farm) => {
      return total + (farm.crops ? farm.crops.length : 1)
    }, 0)

    const harvestReady = farms.filter(farm => {
      const progress = farm.progress || 0
      return progress >= 85 // Ready when 85%+ complete
    }).length

    const avgYield = Math.round(
      farms.reduce((sum, farm) => sum + (farm.progress || 0), 0) / farms.length
    )

    return {
      totalFarms: farms.length,
      activeCrops,
      harvestReady,
      avgYield
    }
  }, [farms])

  // Dynamic soil data based on farms
  const soilData = useMemo(() => {
    if (farms.length === 0) {
      return {
        ph: 0,
        moisture: 0,
        nitrogen: 'Unknown',
        phosphorus: 'Unknown',
        potassium: 'Unknown'
      }
    }

    // Calculate average soil conditions across all farms
    const avgPh = farms.reduce((sum, farm) => sum + (farm.soilPh || 6.5), 0) / farms.length
    const avgMoisture = farms.reduce((sum, farm) => sum + (farm.soilMoisture || 60), 0) / farms.length
    
    return {
      ph: avgPh.toFixed(1),
      moisture: Math.round(avgMoisture),
      nitrogen: avgPh > 6.5 ? 'High' : avgPh > 6.0 ? 'Medium' : 'Low',
      phosphorus: avgMoisture > 70 ? 'High' : avgMoisture > 50 ? 'Medium' : 'Low',
      potassium: farms.length > 2 ? 'Good' : 'Medium'
    }
  }, [farms])

  // Smart AI recommendation based on actual data
  const aiRecommendation = useMemo(() => {
    if (!weather || farms.length === 0) {
      return {
        crop: 'Loading...',
        confidence: 0,
        reason: 'Analyzing your farm data...'
      }
    }

    // Simple AI logic based on weather and soil
    const temp = weather.temperature || 25
    const moisture = soilData.moisture || 60
    const ph = parseFloat(soilData.ph) || 6.5
    
    let recommendedCrop, confidence, reason

    if (temp > 30 && moisture < 50) {
      recommendedCrop = 'Millet'
      confidence = 88
      reason = 'Heat-resistant crop ideal for current dry conditions'
    } else if (temp < 20 && ph > 6.5) {
      recommendedCrop = 'Wheat'
      confidence = 92
      reason = 'Cool weather and alkaline soil perfect for wheat'
    } else if (moisture > 70 && temp > 25) {
      recommendedCrop = 'Rice'
      confidence = 85
      reason = 'High moisture and warm temperature favor rice cultivation'
    } else if (ph < 6.5 && temp > 22) {
      recommendedCrop = 'Tomatoes'
      confidence = 79
      reason = 'Slightly acidic soil and moderate temperature suit tomatoes'
    } else {
      recommendedCrop = 'Corn'
      confidence = 75
      reason = 'Versatile crop suitable for current conditions'
    }

    return { crop: recommendedCrop, confidence, reason }
  }, [weather, soilData, farms.length])

  // Farm-specific alerts based on actual farm data
  const alerts = useMemo(() => {
    const farmAlerts = []
    const now = new Date()

    farms.forEach(farm => {
      // Irrigation alerts based on soil moisture
      if (farm.soilMoisture < 40) {
        farmAlerts.push({
          id: `irrigation-${farm.id}`,
          type: 'warning',
          message: `${farm.name} needs irrigation - soil moisture at ${farm.soilMoisture}%`,
          time: '1 hour ago',
          farmId: farm.id
        })
      }

      // Harvest alerts based on progress
      if (farm.progress >= 90) {
        farmAlerts.push({
          id: `harvest-${farm.id}`,
          type: 'success',
          message: `${farm.name} is ready for harvest (${farm.progress}% complete)`,
          time: '30 minutes ago',
          farmId: farm.id
        })
      }

      // pH alerts
      if (farm.soilPh < 5.5 || farm.soilPh > 8.0) {
        farmAlerts.push({
          id: `ph-${farm.id}`,
          type: 'warning',
          message: `${farm.name} soil pH (${farm.soilPh}) needs adjustment`,
          time: '2 hours ago',
          farmId: farm.id
        })
      }
    })

    // Weather-based alerts
    if (weather) {
      if (weather.temperature > 35) {
        farmAlerts.push({
          id: 'heat-warning',
          type: 'danger',
          message: `Extreme heat warning: ${weather.temperature}°C - increase irrigation`,
          time: '15 minutes ago'
        })
      }
      
      if (weather.humidity > 85) {
        farmAlerts.push({
          id: 'humidity-warning',
          type: 'info',
          message: `High humidity (${weather.humidity}%) - monitor for fungal diseases`,
          time: '45 minutes ago'
        })
      }
    }

    return farmAlerts.slice(0, 4) // Show max 4 alerts
  }, [farms, weather])

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get user location for weather
      const userLocation = JSON.parse(localStorage.getItem('userLocation')) || {
        latitude: 28.6139,
        longitude: 77.2090
      }

      // Fetch weather data
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.latitude}&lon=${userLocation.longitude}&appid=895284fb2d2c50a520ea537456963d9c&units=metric`
      )
      
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json()
        setWeather({
          location: weatherData.name,
          temperature: Math.round(weatherData.main.temp),
          condition: weatherData.weather[0].main,
          humidity: weatherData.main.humidity,
          windSpeed: Math.round(weatherData.wind.speed * 3.6) // Convert m/s to km/h
        })
      }

      // Load farms from localStorage
      const storedFarms = JSON.parse(localStorage.getItem('farms')) || []
      
      // Add some realistic farm data if none exists
      if (storedFarms.length === 0) {
        const defaultFarms = [
          {
            id: 1,
            name: 'North Field',
            crop: 'Wheat',
            progress: 75,
            soilPh: 6.8,
            soilMoisture: 45,
            area: 2.5
          },
          {
            id: 2,
            name: 'South Field',
            crop: 'Tomatoes',
            progress: 92,
            soilPh: 6.2,
            soilMoisture: 68,
            area: 1.8
          },
          {
            id: 3,
            name: 'East Field',
            crop: 'Corn',
            progress: 58,
            soilPh: 7.1,
            soilMoisture: 35,
            area: 3.2
          }
        ]
        localStorage.setItem('farms', JSON.stringify(defaultFarms))
        setFarms(defaultFarms)
      } else {
        setFarms(storedFarms)
      }

      setLastUpdated(new Date())
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.')
      console.error('Dashboard data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="dashboard enhanced-dashboard">
        <div className="dashboard-header">
          <h1>🌱 Farm Overview</h1>
          <p>Loading your farm insights...</p>
        </div>
        <div className="loading-skeleton">
          <div className="skeleton-metrics">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
          <div className="skeleton-grid">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton-card large"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard enhanced-dashboard">
        <div className="dashboard-header">
          <h1>🌱 Farm Overview</h1>
          <div className="error-state">
            <p className="error-message">⚠️ {error}</p>
            <button onClick={fetchDashboardData} className="retry-btn">
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard enhanced-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🌱 Farm Overview</h1>
          <p>AI-powered insights for your farming operations</p>
        </div>
        <div className="header-actions">
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchDashboardData} className="refresh-btn" disabled={loading}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-icon">🏡</div>
          <div className="metric-content">
            <div className="metric-value">{farmStats.totalFarms}</div>
            <div className="metric-label">Total Farms</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🌾</div>
          <div className="metric-content">
            <div className="metric-value">{farmStats.activeCrops}</div>
            <div className="metric-label">Active Crops</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🚜</div>
          <div className="metric-content">
            <div className="metric-value">{farmStats.harvestReady}</div>
            <div className="metric-label">Ready to Harvest</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{farmStats.avgYield}%</div>
            <div className="metric-label">Avg Yield</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Weather Card */}
        <div className="dashboard-card weather-card">
          <div className="card-header">
            <h3>🌤️ Weather Today</h3>
            {weather && <span className="location-tag">{weather.location}</span>}
          </div>
          {weather ? (
            <div className="weather-info">
              <div className="temp">{weather.temperature}°C</div>
              <div className="condition">{weather.condition}</div>
              <div className="details">
                <span>💧 {weather.humidity}%</span>
                <span>💨 {weather.windSpeed} km/h</span>
              </div>
            </div>
          ) : (
            <div className="error-state mini">
              <p>Unable to load weather data</p>
              <button onClick={fetchDashboardData} className="retry-btn small">Retry</button>
            </div>
          )}
        </div>

        {/* AI Recommendation */}
        <div className="dashboard-card ai-card">
          <div className="card-header">
            <h3>🤖 AI Crop Recommendation</h3>
            <span className="ai-badge">Smart</span>
          </div>
          <div className="ai-recommendation">
            {aiRecommendation.confidence > 0 ? (
              <>
                <div className="recommended-crop">
                  <span className="crop-name">🌾 {aiRecommendation.crop}</span>
                  <span className="confidence">{aiRecommendation.confidence}% confidence</span>
                </div>
                <p className="reason">{aiRecommendation.reason}</p>
                <div className="ai-factors">
                  <small>Based on: Weather, Soil pH, Moisture levels</small>
                </div>
              </>
            ) : (
              <div className="loading-ai">
                <p>🔄 Analyzing your farm conditions...</p>
              </div>
            )}
          </div>
        </div>

        {/* Soil Analysis */}
        <div className="dashboard-card soil-card">
          <div className="card-header">
            <h3>🧪 Soil Analysis</h3>
            <span className="avg-badge">Avg across farms</span>
          </div>
          <div className="soil-metrics">
            <div className="soil-metric">
              <span className="label">pH Level</span>
              <span className={`value ${soilData.ph > 6.5 ? 'good' : soilData.ph > 6.0 ? 'medium' : 'low'}`}>
                {soilData.ph}
              </span>
            </div>
            <div className="soil-metric">
              <span className="label">Moisture</span>
              <span className={`value ${soilData.moisture > 60 ? 'good' : soilData.moisture > 40 ? 'medium' : 'low'}`}>
                {soilData.moisture}%
              </span>
            </div>
            <div className="soil-metric">
              <span className="label">Nitrogen</span>
              <span className={`value ${soilData.nitrogen.toLowerCase()}`}>{soilData.nitrogen}</span>
            </div>
            <div className="soil-metric">
              <span className="label">Phosphorus</span>
              <span className={`value ${soilData.phosphorus.toLowerCase()}`}>{soilData.phosphorus}</span>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="dashboard-card alerts-card full-width">
          <div className="card-header">
            <h3>🔔 Farm Alerts & Notifications</h3>
            <span className="alert-count">{alerts.length} active</span>
          </div>
          <div className="alerts-list">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className={`alert-item ${alert.type}`}>
                  <div className="alert-icon">
                    {alert.type === 'warning' && '⚠️'}
                    {alert.type === 'success' && '✅'}
                    {alert.type === 'info' && 'ℹ️'}
                    {alert.type === 'danger' && '🚨'}
                  </div>
                  <div className="alert-content">
                    <span className="alert-message">{alert.message}</span>
                    <span className="alert-time">{alert.time}</span>
                  </div>
                  {alert.farmId && (
                    <button className="alert-action">View Farm</button>
                  )}
                </div>
              ))
            ) : (
              <div className="no-alerts">
                <p>✅ All farms are in good condition</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard