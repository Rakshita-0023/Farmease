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
  const [alertFilter, setAlertFilter] = useState('all')
  const { t } = useLanguage()

  // Real-time farm calculations
  const calculateFarmMetrics = useCallback((farmData) => {
    if (!farmData.length) return { totalFarms: 0, activeCrops: 0, harvestReady: 0, healthScore: 0 }

    const totalFarms = farmData.length
    const activeCrops = farmData.filter(farm => farm.progress < 100).length
    const harvestReady = farmData.filter(farm => {
      const progress = farm.progress || 0
      return progress >= 90
    }).length

    // Calculate Health Score based on soil data
    const healthScore = Math.round(farmData.reduce((sum, farm) => {
      let score = 100
      if (farm.soilMoisture < 40 || farm.soilMoisture > 80) score -= 20
      if (farm.soilPh < 6 || farm.soilPh > 7.5) score -= 15
      if (farm.pestRisk === 'High') score -= 30
      return sum + Math.max(0, score)
    }, 0) / (totalFarms || 1))

    return { totalFarms, activeCrops, harvestReady, healthScore }
  }, [])

  // Financial Snapshot Calculation
  const calculateFinancials = useCallback((farmData) => {
    const estimatedRevenue = farmData.reduce((sum, farm) => sum + (farm.expectedYield * farm.marketPrice || 50000), 0)
    const inputCosts = farmData.reduce((sum, farm) => sum + (farm.inputCosts || 15000), 0)
    return { revenue: estimatedRevenue, costs: inputCosts, profit: estimatedRevenue - inputCosts }
  }, [])

  // Dynamic soil analysis from real farm data
  const calculateSoilMetrics = useCallback((farmData) => {
    if (!farmData.length) return null

    const avgPh = farmData.reduce((sum, farm) => sum + (farm.soilPh || 6.5), 0) / farmData.length
    const avgMoisture = farmData.reduce((sum, farm) => sum + (farm.soilMoisture || 50), 0) / farmData.length
    const avgNitrogen = farmData.reduce((sum, farm) => sum + (farm.nitrogen || 50), 0) / farmData.length
    const avgPhosphorus = farmData.reduce((sum, farm) => sum + (farm.phosphorus || 50), 0) / farmData.length

    const evaluateLevel = (value, thresholds) => {
      if (value >= thresholds.high) return { level: 'High', status: 'good', trend: '📈' }
      if (value >= thresholds.medium) return { level: 'Medium', status: 'medium', trend: '📊' }
      return { level: 'Low', status: 'poor', trend: '📉' }
    }

    return {
      ph: {
        value: avgPh.toFixed(1),
        ...evaluateLevel(avgPh, { high: 6.5, medium: 6.0 }),
        suggestion: avgPh < 6.0 ? 'Apply lime to increase pH' : avgPh > 7.5 ? 'Add sulfur to lower pH' : null
      },
      moisture: {
        value: Math.round(avgMoisture),
        ...evaluateLevel(avgMoisture, { high: 60, medium: 40 }),
        suggestion: avgMoisture < 40 ? 'Increase irrigation frequency' : null
      },
      nitrogen: {
        value: Math.round(avgNitrogen),
        ...evaluateLevel(avgNitrogen, { high: 70, medium: 50 }),
        suggestion: avgNitrogen < 50 ? 'Apply organic compost' : null
      },
      phosphorus: {
        value: Math.round(avgPhosphorus),
        ...evaluateLevel(avgPhosphorus, { high: 70, medium: 50 }),
        suggestion: avgPhosphorus < 50 ? 'Add phosphate fertilizer' : null
      }
    }
  }, [])

  // Real-time alert generation
  const generateAlerts = useCallback((farmData, weatherData) => {
    const alerts = []

    farmData.forEach(farm => {
      const farmId = farm.id
      const farmName = farm.name

      // Harvest ready alerts - exact match with farm progress
      if (farm.progress >= 90) {
        alerts.push({
          id: `harvest-${farmId}`,
          type: 'success',
          severity: 'high',
          farmId,
          message: `${farmName} is ready for harvest (Maturity: ${farm.progress}%)`,
          time: '30 minutes ago',
          action: 'Schedule harvest'
        })
      }

      // Irrigation alerts
      if (farm.soilMoisture < 30) {
        alerts.push({
          id: `irrigation-${farmId}`,
          type: 'warning',
          severity: 'high',
          farmId,
          message: `${farmName} needs urgent irrigation - moisture at ${farm.soilMoisture}%`,
          time: '1 hour ago',
          action: 'Start irrigation'
        })
      } else if (farm.soilMoisture < 40) {
        alerts.push({
          id: `irrigation-low-${farmId}`,
          type: 'warning',
          severity: 'medium',
          farmId,
          message: `${farmName} moisture getting low - ${farm.soilMoisture}%`,
          time: '2 hours ago',
          action: 'Plan irrigation'
        })
      }

      // pH alerts
      if (farm.soilPh < 5.5 || farm.soilPh > 8.0) {
        alerts.push({
          id: `ph-${farmId}`,
          type: 'warning',
          severity: 'medium',
          farmId,
          message: `${farmName} soil pH needs adjustment (${farm.soilPh})`,
          time: '3 hours ago',
          action: 'Adjust pH'
        })
      }

      // Growth stage alerts
      const daysSincePlanted = farm.daysSincePlanted || 0
      const growthDays = farm.analysis?.growthDays || 100
      const growthStage = Math.floor((daysSincePlanted / growthDays) * 5)

      if (growthStage === 2 && farm.progress > 30 && farm.progress < 50) {
        alerts.push({
          id: `fertilizer-${farmId}`,
          type: 'info',
          severity: 'medium',
          farmId,
          message: `${farmName} ready for mid-growth fertilizer application`,
          time: '4 hours ago',
          action: 'Apply fertilizer'
        })
      }
    })

    // Weather-based alerts
    if (weatherData) {
      if (weatherData.temperature > 35) {
        alerts.push({
          id: 'heat-warning',
          type: 'danger',
          severity: 'high',
          message: `Extreme heat warning: ${weatherData.temperature}°C - protect crops`,
          time: '15 minutes ago',
          action: 'Increase irrigation'
        })
      }

      if (weatherData.humidity > 85) {
        alerts.push({
          id: 'humidity-warning',
          type: 'info',
          severity: 'medium',
          message: `High humidity (${weatherData.humidity}%) - monitor for fungal diseases`,
          time: '1 hour ago',
          action: 'Check plants'
        })
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }, [])

  // Dynamic AI crop recommendation engine
  const generateAIRecommendation = useCallback((farmData, weatherData, soilData) => {
    if (!weatherData) {
      return { crop: 'Loading...', confidence: 0, breakdown: {}, alternatives: [], reasons: [], actions: [] }
    }

    // Crop database with ideal conditions
    const cropDatabase = [
      {
        crop: 'Wheat',
        idealTempRange: [10, 25],
        idealPHRange: [6, 7.5],
        idealSeason: ['November', 'December', 'January', 'February'],
        waterNeeds: 'Medium',
        harvestDays: [90, 120]
      },
      {
        crop: 'Rice',
        idealTempRange: [20, 35],
        idealPHRange: [5, 7],
        idealSeason: ['May', 'June', 'July', 'August'],
        waterNeeds: 'High',
        harvestDays: [120, 150]
      },
      {
        crop: 'Maize',
        idealTempRange: [18, 27],
        idealPHRange: [5.5, 7.2],
        idealSeason: ['February', 'March', 'June', 'July'],
        waterNeeds: 'Medium',
        harvestDays: [80, 110]
      },
      {
        crop: 'Bajra',
        idealTempRange: [25, 35],
        idealPHRange: [6, 8],
        idealSeason: ['April', 'May', 'June'],
        waterNeeds: 'Low',
        harvestDays: [70, 90]
      },
      {
        crop: 'Cotton',
        idealTempRange: [21, 30],
        idealPHRange: [5.8, 8],
        idealSeason: ['April', 'May', 'June'],
        waterNeeds: 'High',
        harvestDays: [150, 180]
      }
    ]

    const currentMonth = new Date().toLocaleString('default', { month: 'long' })
    const temp = weatherData.temperature
    const humidity = weatherData.humidity
    const ph = parseFloat(soilData?.ph?.value || 6.5)
    const moisture = soilData?.moisture?.value || 50

    // Calculate score for each crop
    const calculateCropScore = (crop) => {
      let score = 100
      const reasons = []

      // Temperature scoring
      if (temp >= crop.idealTempRange[0] && temp <= crop.idealTempRange[1]) {
        reasons.push(`Temperature (${temp}°C) is ideal.`)
      } else {
        score -= 30
        reasons.push(`Temperature (${temp}°C) is ${temp < crop.idealTempRange[0] ? 'too low' : 'too high'}.`)
      }

      // pH scoring
      if (ph >= crop.idealPHRange[0] && ph <= crop.idealPHRange[1]) {
        reasons.push(`Your soil pH (${ph}) is perfect.`)
      } else {
        score -= 25
        reasons.push(`Soil pH (${ph}) needs adjustment.`)
      }

      // Season scoring
      if (crop.idealSeason.includes(currentMonth)) {
        reasons.push(`${currentMonth} is the right season.`)
      } else {
        score -= 20
        reasons.push(`${currentMonth} is not ideal season.`)
      }

      // Water requirement scoring
      if (crop.waterNeeds === 'High' && moisture < 50) {
        score -= 15
        reasons.push(`Needs more water than available.`)
      } else if (crop.waterNeeds === 'Low' && moisture > 70) {
        reasons.push(`Good for current moisture levels.`)
      } else if (crop.waterNeeds === 'Medium') {
        reasons.push(`Water needs match current conditions.`)
      }

      return { ...crop, score: Math.max(0, score), reasons }
    }

    // Score all crops and find the best
    const scoredCrops = cropDatabase.map(calculateCropScore)
    const bestCrop = scoredCrops.sort((a, b) => b.score - a.score)[0]
    const alternatives = scoredCrops.filter(c => c.crop !== bestCrop.crop).slice(0, 3)

    // Generate dynamic actions based on conditions
    const generateActions = () => {
      const actions = []

      if (moisture < 40) {
        actions.push('Start irrigation immediately — moisture is low')
      } else if (moisture < 60 && humidity < 60) {
        actions.push('Plan irrigation in 2-3 days')
      } else {
        actions.push('Moisture levels are good — no irrigation needed')
      }

      if (ph < 6) {
        actions.push('Apply lime to increase soil pH')
      } else if (ph > 7.5) {
        actions.push('Add sulfur to lower soil pH')
      }

      if (temp > 30) {
        actions.push('Provide shade during peak hours')
      }

      actions.push('Monitor crop health weekly')

      return actions
    }

    // Calculate harvest estimate
    const harvestDays = bestCrop.harvestDays[0] + Math.round((bestCrop.harvestDays[1] - bestCrop.harvestDays[0]) / 2)

    return {
      crop: bestCrop.crop,
      confidence: bestCrop.score,
      reasons: bestCrop.reasons,
      alternatives: alternatives.map(alt => ({
        crop: alt.crop,
        score: alt.score,
        reason: alt.score > 70 ? 'Good alternative' : alt.score > 50 ? 'Needs better conditions' : 'Not recommended now'
      })),
      actions: generateActions(),
      harvestDays,
      breakdown: {
        soilPh: { value: ph, status: ph >= 6 && ph <= 7.5 ? 'good' : 'needs improvement' },
        temperature: { value: `${temp}°C`, status: temp >= 15 && temp <= 30 ? 'good' : 'needs improvement' },
        moisture: { value: `${moisture}%`, status: moisture >= 50 ? 'good' : 'needs improvement' },
        season: { value: currentMonth, status: bestCrop.idealSeason.includes(currentMonth) ? 'good' : 'needs improvement' }
      }
    }
  }, [])

  // Generate dynamic crop timeline
  const generateCropTimeline = useCallback((farmData) => {
    if (!farmData.length) return null

    // Find the most active farm (highest progress but not harvested)
    const activeFarm = farmData
      .filter(farm => farm.progress < 95)
      .sort((a, b) => b.progress - a.progress)[0]

    if (!activeFarm) return null

    const progress = activeFarm.progress || 0
    const stages = [
      { name: '🌱 Planting', threshold: 0, active: progress >= 0 },
      { name: '🌿 Growing', threshold: 20, active: progress >= 20 },
      { name: '💧 Irrigation', threshold: 40, active: progress >= 40 },
      { name: '🧪 Fertilizer', threshold: 60, active: progress >= 60 },
      { name: '🚜 Harvest', threshold: 85, active: progress >= 85 }
    ]

    const currentStage = stages.findIndex(stage => !stage.active)

    return {
      farmName: activeFarm.name,
      progress,
      stages,
      currentStage: currentStage === -1 ? stages.length - 1 : Math.max(0, currentStage - 1)
    }
  }, [])

  // Memoized calculations
  const farmStats = useMemo(() => calculateFarmMetrics(farms), [farms, calculateFarmMetrics])
  const financialStats = useMemo(() => calculateFinancials(farms), [farms, calculateFinancials])
  const soilData = useMemo(() => calculateSoilMetrics(farms), [farms, calculateSoilMetrics])
  const alerts = useMemo(() => generateAlerts(farms, weather), [farms, weather, generateAlerts])
  const aiRecommendation = useMemo(() => generateAIRecommendation(farms, weather, soilData), [farms, weather, soilData, generateAIRecommendation])
  const cropTimeline = useMemo(() => generateCropTimeline(farms), [farms, generateCropTimeline])

  // Enhanced Weather Context
  const weatherContext = useMemo(() => {
    if (!weather) return null
    const sprayFeasibility = weather.windSpeed > 15 ? 'High Wind - Do Not Spray' : weather.humidity > 90 ? 'High Humidity - Avoid Spraying' : 'Good Conditions for Spraying'
    const soilMoistureEst = weather.humidity > 80 ? 'High (Recent Rain)' : weather.humidity < 40 ? 'Low (Dry Spell)' : 'Moderate'
    return { sprayFeasibility, soilMoistureEst }
  }, [weather])

  // Filter alerts based on selected filter
  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'all') return alerts
    if (alertFilter === 'critical') return alerts.filter(alert => alert.severity === 'high')
    if (alertFilter === 'warnings') return alerts.filter(alert => alert.type === 'warning')
    if (alertFilter === 'success') return alerts.filter(alert => alert.type === 'success')
    return alerts
  }, [alerts, alertFilter])

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Load farms from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user')) || {}
      const userFarms = localStorage.getItem(`farms_${currentUser.id}`) || localStorage.getItem('farms')
      const storedFarms = userFarms ? JSON.parse(userFarms) : []

      let farmsToSet = storedFarms
      if (storedFarms.length === 0) {
        farmsToSet = [
          {
            id: 'demo-1',
            name: 'North Field',
            cropType: 'Wheat',
            progress: 100,
            daysToHarvest: 0
          },
          {
            id: 'demo-2',
            name: 'South Field',
            cropType: 'Rice',
            progress: 96,
            daysToHarvest: 2
          }
        ]
      }
      setFarms(farmsToSet)

      // Get user location for weather
      const userLocation = JSON.parse(localStorage.getItem('userLocation')) || {
        latitude: 28.6139,
        longitude: 77.2090
      }

      // Fetch weather data (optional - don't fail if this fails)
      try {
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
            windSpeed: Math.round(weatherData.wind.speed * 3.6)
          })
        } else {
          // Set default weather if API fails
          setWeather({
            location: 'Unknown',
            temperature: 25,
            condition: 'Clear',
            humidity: 60,
            windSpeed: 10
          })
        }
      } catch (weatherErr) {
        console.warn('Weather fetch failed:', weatherErr)
        // Set default weather data
        setWeather({
          location: 'Unknown',
          temperature: 25,
          condition: 'Clear',
          humidity: 60,
          windSpeed: 10
        })
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      // Only set error if critical failure and no fallback data
      setError('Some features may be limited due to connection issues.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Load data immediately on mount
    const loadInitialData = () => {
      // Load farms immediately from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user')) || {}
      const userFarms = localStorage.getItem(`farms_${currentUser.id}`) || localStorage.getItem('farms')
      let storedFarms = userFarms ? JSON.parse(userFarms) : []

      // If no farms exist, create sample data for demo
      if (storedFarms.length === 0) {
        storedFarms = [
          {
            id: 'demo-1',
            name: 'North Field',
            cropType: 'Wheat',
            progress: 100,
            daysToHarvest: 0
          },
          {
            id: 'demo-2',
            name: 'South Field',
            cropType: 'Rice',
            progress: 96,
            daysToHarvest: 2
          }
        ]
      }

      setFarms(storedFarms)

      // Set default weather to prevent empty cards
      setWeather({
        location: 'Loading...',
        temperature: 25,
        condition: 'Clear',
        humidity: 60,
        windSpeed: 10
      })

      setLoading(false)
    }

    loadInitialData()

    // Then fetch fresh data
    setTimeout(() => {
      fetchDashboardData()
    }, 100)

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  // Reduce loading time to prevent cards from disappearing
  if (loading && farms.length === 0) {
    return (
      <div className="dashboard enhanced-dashboard">
        <div className="dashboard-header">
          <h1>🌱 Farm Overview</h1>
          <p>Loading your farm insights...</p>
        </div>
        <div className="loading-skeleton">
          <div className="skeleton-metrics">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
          <div className="skeleton-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-card large"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Don't block the entire dashboard for minor errors
  // if (error) {
  //   return (
  //     <div className="dashboard enhanced-dashboard">
  //       <div className="dashboard-header">
  //         <h1>🌱 Farm Overview</h1>
  //         <div className="error-state">
  //           <p className="error-message">⚠️ {error}</p>
  //           <button onClick={fetchDashboardData} className="retry-btn">
  //             🔄 Try Again
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="dashboard enhanced-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🌱 Farm Overview</h1>
          <p>Real-time insights for your farming operations</p>
        </div>
        <div className="header-actions">
          {error && (
            <span className="error-indicator" title={error} role="alert" aria-live="polite">
              ⚠️ Connection issues
            </span>
          )}
          <button
            onClick={fetchDashboardData}
            className="refresh-link"
            disabled={loading}
            aria-label="Refresh dashboard data"
          >
            {loading ? '🔄 Refreshing...' : 'Refresh Data'}
          </button>
          {lastUpdated && (
            <span className="last-updated" aria-live="polite">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-row">
        <div className="metric-card" role="button" tabIndex="0" aria-label={`Total Farms: ${farmStats.totalFarms}`}>

          <div className="metric-content">
            <div className="metric-value">{farmStats.totalFarms}</div>
            <div className="metric-label">Total Farms</div>
          </div>
        </div>
        <div className="metric-card" role="button" tabIndex="0" aria-label={`Active Crops: ${farmStats.activeCrops}`}>

          <div className="metric-content">
            <div className="metric-value">{farmStats.activeCrops}</div>
            <div className="metric-label">Active Crops</div>
          </div>
        </div>
        <div className="metric-card" role="button" tabIndex="0" aria-label={`Crop Health Score: ${farmStats.healthScore}`}>

          <div className="metric-content">
            <div className={`metric-value ${farmStats.healthScore >= 80 ? 'text-green' : farmStats.healthScore >= 50 ? 'text-orange' : 'text-red'}`}>
              {farmStats.healthScore}/100
            </div>
            <div className="metric-label">Crop Health Score</div>
          </div>
        </div>
        <div className="metric-card financial-card" role="button" tabIndex="0" aria-label="Financial Snapshot">

          <div className="metric-content">
            <div className="financial-row">
              <span className="label">Rev:</span>
              <span className="value text-green">₹{(financialStats.revenue / 1000).toFixed(1)}k</span>
            </div>
            <div className="financial-row">
              <span className="label">Cost:</span>
              <span className="value text-red">₹{(financialStats.costs / 1000).toFixed(1)}k</span>
            </div>
            <div className="metric-label">Financial Snapshot</div>
          </div>
        </div>
      </div>

      {/* Top Row - Weather and Alerts */}
      <div className="top-row">
        <div className="dashboard-card weather-card">
          <div className="card-header">
            <h3>🌤️ Weather Intelligence</h3>
            {weather && <span className="location-tag">{weather.location}</span>}
          </div>
          {weather ? (
            <div className="weather-content">
              <div className="weather-main">
                <div className="weather-icon-large" style={{ fontSize: '4rem', marginBottom: '10px' }}>
                  {weather.condition.toLowerCase().includes('cloud') ? '☁️' :
                    weather.condition.toLowerCase().includes('rain') ? '🌧️' :
                      weather.condition.toLowerCase().includes('clear') ? '☀️' : '🌤️'}
                </div>
                <div className="temp" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937' }}>{weather.temperature}°C</div>
                <div className="condition" style={{ fontSize: '1.2rem', color: '#4b5563', fontWeight: '500' }}>{weather.condition}</div>
              </div>
              <div className="weather-details-grid">
                <div className="weather-detail">
                  <span className="icon">💧</span>
                  <span className="label">Humidity</span>
                  <span className="value">{weather.humidity}%</span>
                </div>
                <div className="weather-detail">
                  <span className="icon">💨</span>
                  <span className="label">Wind</span>
                  <span className="value">{weather.windSpeed} km/h</span>
                </div>
              </div>
              <div className="agri-context">
                <div className={`context-item ${weatherContext.sprayFeasibility.includes('Do Not') ? 'danger' : 'success'}`}>
                  <span className="icon">🚿</span>
                  <span className="text">{weatherContext.sprayFeasibility}</span>
                </div>
                <div className="context-item info">
                  <span className="icon">🌱</span>
                  <span className="text">Soil Moisture: {weatherContext.soilMoistureEst}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="error-state mini">
              <p>Unable to load weather data</p>
              <button onClick={fetchDashboardData} className="retry-btn small">Retry</button>
            </div>
          )}
        </div>

        <div className="dashboard-card alerts-card p-6 rounded-xl shadow-soft">
          <div className="card-header">
            <h3>🔔 Farm Alerts</h3>
            <span className="alert-count">{filteredAlerts.length} active</span>
          </div>
          <div className="alerts-controls">
            <div className="alert-filters">
              <button
                className={`filter-btn ${alertFilter === 'all' ? 'active' : ''}`}
                onClick={() => setAlertFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${alertFilter === 'critical' ? 'active' : ''}`}
                onClick={() => setAlertFilter('critical')}
              >
                Critical
              </button>
              <button
                className={`filter-btn ${alertFilter === 'warnings' ? 'active' : ''}`}
                onClick={() => setAlertFilter('warnings')}
              >
                Warnings
              </button>
            </div>
          </div>
          <div className="alerts-list">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`alert-item ${alert.type} severity-${alert.severity}`}>
                  <div className="alert-header-row">
                    <div className="alert-icon-wrapper">
                      {alert.type === 'warning' && '⚠️'}
                      {alert.type === 'success' && '✅'}
                      {alert.type === 'info' && '🔔'}
                      {alert.type === 'danger' && '🚨'}
                    </div>
                    <div className="alert-meta">
                      <span className={`urgency-tag pill-shape ${alert.severity}`}>{alert.severity.toUpperCase()}</span>
                      <span className="alert-time">{alert.time}</span>
                    </div>
                  </div>
                  <div className="alert-content">
                    <span className="alert-message">{alert.message}</span>
                    {alert.farmId && (
                      <span className="farm-tag">Farm: {farms.find(f => f.id === alert.farmId)?.name}</span>
                    )}
                  </div>
                  {alert.action && (
                    <button
                      className="alert-action-btn"
                      onClick={() => {
                        if (alert.action === 'Schedule harvest') {
                          alert(`Harvest scheduled for ${farms.find(f => f.id === alert.farmId)?.name}!`)
                        } else {
                          alert(`Action triggered: ${alert.action}`)
                        }
                      }}
                    >
                      {alert.action}
                      <span className="arrow">→</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="no-alerts">
                <p>{farms.length > 0 ? '✅ All farms are in good condition' : '🌱 Add farms to get personalized alerts'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommendation - Full Width */}
      <div className="ai-row">
        <div className="dashboard-card ai-card ai-card-wide">
          <div className="card-header">
            <h3>AI Crop Recommendation</h3>
            <span className="ai-badge">Smart Analysis</span>
          </div>
          <div className="ai-recommendation">
            {aiRecommendation.confidence > 0 ? (
              <>
                <div className="ai-simple">
                  <div className="crop-rec">
                    <h4>🌾 Recommended Crop: <strong>{aiRecommendation.crop}</strong></h4>
                    <p>Confidence: <strong>{aiRecommendation.confidence}%</strong></p>
                  </div>

                  <div className="why-section">
                    <h4>👍 Why {aiRecommendation.crop}?</h4>
                    <ul className="why-list">
                      {aiRecommendation.reasons?.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="status-section">
                    <h4>⏳ Timeline</h4>
                    <p><strong>📅 Estimated harvest: {aiRecommendation.harvestDays} days</strong></p>
                  </div>

                  <hr className="divider" />

                  <div className="alternatives-simple">
                    <h4>🔁 Alternatives (if you plan new crops):</h4>
                    <ul className="alt-list">
                      {aiRecommendation.alternatives?.map((alt, index) => (
                        <li key={index}>• {alt.crop} — {alt.score}% → {alt.reason}</li>
                      ))}
                    </ul>
                  </div>

                  <hr className="divider" />

                  <div className="next-steps">
                    <h4>🧭 What to do next:</h4>
                    <ul className="steps-list">
                      {aiRecommendation.actions?.map((action, index) => (
                        <li key={index}>✔ {action}</li>
                      ))}
                    </ul>
                  </div>

                  <hr className="divider" />

                  <div className="summary">
                    <h4>💡 Summary</h4>
                    <p>{aiRecommendation.confidence > 80 ? 'Excellent conditions — proceed with confidence.' : aiRecommendation.confidence > 60 ? 'Good conditions with minor adjustments needed.' : 'Consider alternatives or improve conditions first.'}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="loading-ai">
                <p>🔄 Analyzing your farm conditions...</p>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  )
}

export default EnhancedDashboard