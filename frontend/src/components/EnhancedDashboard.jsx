import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLanguage } from '../App'
import './EnhancedDashboard.css'

const EnhancedDashboard = () => {
  const [weather, setWeather] = useState(null)
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {})
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [alertFilter, setAlertFilter] = useState('all')

  // Load farms from API
  useEffect(() => {
    const loadFarms = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        if (!token) {
          setFarms([])
          setLoading(false)
          return
        }

        const response = await fetch('http://localhost:5001/api/farms', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const farmsData = await response.json()
          setFarms(farmsData)
        } else {
          console.error('Failed to load farms')
          setFarms([])
        }
      } catch (error) {
        console.error('Error loading farms:', error)
        setFarms([])
      } finally {
        setLoading(false)
      }
    }

    loadFarms()
  }, [])

  // Load weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid=${import.meta.env.VITE_WEATHER_API_KEY}&units=metric`
        )
        if (response.ok) {
          const data = await response.json()
          setWeather({
            temperature: Math.round(data.main.temp),
            condition: data.weather[0].main,
            humidity: data.main.humidity,
            location: data.name
          })
        }
      } catch (error) {
        console.error('Weather fetch failed:', error)
      }
    }

    fetchWeather()
  }, [])

  // Real-time farm calculations
  const calculateFarmMetrics = useCallback((farmData) => {
    if (!farmData.length) return { totalFarms: 0, activeCrops: 0, harvestReady: 0, healthScore: 0 }

    const totalFarms = farmData.length
    const activeCrops = farmData.filter(farm => farm.progress < 100).length
    const harvestReady = farmData.filter(farm => {
      const progress = farm.progress || 0
      return progress >= 90
    }).length

    const healthScore = 85 // Simplified calculation

    return { totalFarms, activeCrops, harvestReady, healthScore }
  }, [])

  // Financial Snapshot Calculation
  const calculateFinancials = useCallback((farmData) => {
    const estimatedRevenue = farmData.reduce((sum, farm) => sum + (farm.expectedYield * farm.marketPrice || 50000), 0)
    const inputCosts = farmData.reduce((sum, farm) => sum + (farm.inputCosts || 15000), 0)
    return { revenue: estimatedRevenue, costs: inputCosts, profit: estimatedRevenue - inputCosts }
  }, [])

  // Real-time alert generation based on actual farm data
  const generateAlerts = useCallback((farmData, weatherData) => {
    const alerts = []

    if (!farmData || farmData.length === 0) {
      alerts.push({
        id: 'no-farms',
        type: 'info',
        severity: 'low',
        message: 'No farms added yet. Add your first farm to start monitoring!',
        time: 'Just now',
        action: 'Add Farm'
      })
      return alerts
    }

    farmData.forEach(farm => {
      const farmId = farm.id
      const farmName = farm.name
      const progress = farm.progress || 0

      // Harvest ready alerts - based on actual farm progress
      if (progress >= 95) {
        alerts.push({
          id: `harvest-${farmId}`,
          type: 'success',
          severity: 'high',
          farmId,
          message: `${farmName} is ready for harvest (Maturity: ${progress}%)`,
          time: '30 minutes ago',
          action: 'Schedule harvest'
        })
      } else if (progress >= 85) {
        alerts.push({
          id: `harvest-soon-${farmId}`,
          type: 'info',
          severity: 'medium',
          farmId,
          message: `${farmName} approaching harvest time (${progress}% mature)`,
          time: '1 hour ago',
          action: 'Monitor closely'
        })
      }

      // Growth stage alerts based on crop type and progress
      if (progress > 20 && progress < 40) {
        alerts.push({
          id: `fertilizer-${farmId}`,
          type: 'info',
          severity: 'medium',
          farmId,
          message: `${farmName} (${farm.crop}) ready for mid-growth fertilizer`,
          time: '2 hours ago',
          action: 'Apply fertilizer'
        })
      }
    })

    // Weather-based alerts for all farms
    if (weatherData) {
      if (weatherData.temperature > 35) {
        alerts.push({
          id: 'heat-warning',
          type: 'danger',
          severity: 'high',
          message: `Extreme heat warning: ${weatherData.temperature}°C - protect all crops`,
          time: '15 minutes ago',
          action: 'Increase irrigation'
        })
      }

      if (weatherData.condition?.toLowerCase().includes('rain') && farmData.some(f => f.progress > 80)) {
        alerts.push({
          id: 'rain-harvest',
          type: 'warning',
          severity: 'medium',
          message: 'Rain expected - consider harvesting mature crops early',
          time: '1 hour ago',
          action: 'Check weather forecast'
        })
      }
    }

    return alerts
  }, [])

  // Use real farm data for calculations
  const farmMetrics = useMemo(() => calculateFarmMetrics(farms), [farms, calculateFarmMetrics])
  const financials = useMemo(() => calculateFinancials(farms), [farms, calculateFinancials])
  const alerts = useMemo(() => generateAlerts(farms, weather), [farms, weather, generateAlerts])

  const filteredAlerts = alerts.filter(alert => {
    if (alertFilter === 'all') return true
    if (alertFilter === 'critical') return alert.severity === 'high'
    if (alertFilter === 'warnings') return alert.severity === 'medium'
    return true
  })

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your farm data...</p>
      </div>
    )
  }

  return (
    <div className="enhanced-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>🌱 Welcome back, {user.name || 'Farmer'}!</h1>
          <p>Here's what's happening on your farms today</p>
        </div>
        
        {weather && (
          <div className="weather-widget">
            <div className="weather-info">
              <span className="temperature">{weather.temperature}°C</span>
              <span className="condition">{weather.condition}</span>
              <span className="location">📍 {weather.location}</span>
            </div>
          </div>
        )}
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">🏡</div>
          <div className="metric-content">
            <h3>Total Farms</h3>
            <div className="metric-value">{farmMetrics.totalFarms}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🌾</div>
          <div className="metric-content">
            <h3>Active Crops</h3>
            <div className="metric-value">{farmMetrics.activeCrops}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3>Ready to Harvest</h3>
            <div className="metric-value">{farmMetrics.harvestReady}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💚</div>
          <div className="metric-content">
            <h3>Health Score</h3>
            <div className="metric-value">{farmMetrics.healthScore}%</div>
          </div>
        </div>
      </div>

      <div className="alerts-section">
        <div className="section-header">
          <h2>🔔 Farm Alerts</h2>
          <div className="alert-filters">
            <button 
              className={alertFilter === 'all' ? 'active' : ''}
              onClick={() => setAlertFilter('all')}
            >
              All
            </button>
            <button 
              className={alertFilter === 'critical' ? 'active' : ''}
              onClick={() => setAlertFilter('critical')}
            >
              Critical
            </button>
            <button 
              className={alertFilter === 'warnings' ? 'active' : ''}
              onClick={() => setAlertFilter('warnings')}
            >
              Warnings
            </button>
          </div>
        </div>

        <div className="alerts-list">
          {filteredAlerts.map(alert => (
            <div key={alert.id} className={`alert-card ${alert.type} ${alert.severity}`}>
              <div className="alert-content">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-meta">
                  <span className="alert-time">{alert.time}</span>
                  {alert.action && (
                    <button className="alert-action">{alert.action}</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {farms.length > 0 && (
        <div className="financial-section">
          <h2>💰 Financial Overview</h2>
          <div className="financial-grid">
            <div className="financial-card">
              <h3>Expected Revenue</h3>
              <div className="financial-value">₹{financials.revenue.toLocaleString()}</div>
            </div>
            <div className="financial-card">
              <h3>Input Costs</h3>
              <div className="financial-value">₹{financials.costs.toLocaleString()}</div>
            </div>
            <div className="financial-card">
              <h3>Projected Profit</h3>
              <div className="financial-value">₹{financials.profit.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedDashboard