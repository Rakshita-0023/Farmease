import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../config'
import OnboardingWizard from './OnboardingWizard'
import {
  Cloud, Sun, CloudRain, Wind, Droplets, MapPin, TrendingUp,
  Leaf, Activity, Home, Sprout, CheckCircle, Heart,
  AlertTriangle, Navigation, Shovel, Calendar, TrendingDown
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useLocation } from '../LocationContext'
import { useMandiData } from '../hooks/useMandiData'
import './EnhancedDashboard.css'

const EnhancedDashboard = () => {
  const { location: globalLocation, loading: locationLoading, locationStatus, retryLocationDetection, updateLocation, error: locationError } = useLocation()
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {})

  // Fetch Farms
  const { data: farms = [], isLoading: farmsLoading, refetch: refetchFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => apiClient.get('/farms')
  })

  // Fetch Current Weather
  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather', globalLocation?.latitude, globalLocation?.longitude],
    queryFn: async () => {
      if (!globalLocation?.latitude || !globalLocation?.longitude) return null
      const data = await apiClient.get('/weather/current', {
        lat: globalLocation.latitude,
        lon: globalLocation.longitude
      })
      if (!data?.main?.temp) return null
      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather?.[0]?.main || 'Clear',
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert to km/h if it's m/s
        location: data.name || globalLocation.city,
        icon: data.weather?.[0]?.main,
        rainProb: data.clouds?.all || 0 // Using cloud cover as proxy if pop is missing
      }
    },
    enabled: !!globalLocation?.latitude && !!globalLocation?.longitude,
    staleTime: 5 * 60 * 1000
  })

  // Fetch Forecast
  const { data: forecastData } = useQuery({
    queryKey: ['weather-forecast', globalLocation?.latitude, globalLocation?.longitude],
    queryFn: async () => {
      if (!globalLocation?.latitude || !globalLocation?.longitude) return null
      const data = await apiClient.get('/weather/forecast', {
        lat: globalLocation.latitude,
        lon: globalLocation.longitude
      })
      // Normalize forecast data (handle both 3-hourly and daily formats)
      const list = data.list || []
      const daily = list.length > 10
        ? list.filter((item, index) => index % 8 === 0).slice(0, 5)
        : list.slice(0, 5)

      return daily.map(day => ({
        day: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        temp: Math.round(day.main.temp_max || day.main.temp),
        icon: day.weather[0].main
      }))
    },
    enabled: !!globalLocation?.latitude && !!globalLocation?.longitude,
    staleTime: 30 * 60 * 1000
  })

  // Market Data (Sonipat Mandi context)
  const { data: marketPrices = [], isLoading: pricesLoading } = useMandiData(
    globalLocation?.state || 'Haryana',
    globalLocation?.city || 'Sonipat',
    ''
  )

  const trendingCrops = useMemo(() => {
    return Array.isArray(marketPrices)
      ? marketPrices.slice(0, 4)
      : []
  }, [marketPrices])

  const getWeatherIcon = (condition, size = 28) => {
    const icons = {
      'Clear': <Sun className="text-amber-400" size={size} />,
      'Clouds': <Cloud className="text-slate-300" size={size} />,
      'Rain': <CloudRain className="text-blue-400" size={size} />,
      'Drizzle': <CloudRain className="text-blue-300" size={size} />,
      'Thunderstorm': <Wind className="text-purple-400" size={size} />
    }
    return icons[condition] || <Sun className="text-amber-400" size={size} />
  }

  const farmMetrics = useMemo(() => {
    if (!farms.length) return { totalFarms: 0, activeCrops: 0, harvestReady: 0, healthScore: 0 }
    return {
      totalFarms: farms.length,
      activeCrops: farms.filter(f => (f.progress || 0) < 100).length,
      harvestReady: farms.filter(f => (f.progress || 0) >= 90).length,
      healthScore: farms.length > 0 ? Math.round(farms.reduce((s, f) => s + (f.health_score || 0), 0) / farms.length) : 0
    }
  }, [farms])

  // Derived Actionable Insights
  const weatherInsights = useMemo(() => {
    if (!weather) return { crop: 'Detecting conditions...', irrigation: 'Awaiting data...', alertText: 'Analyzing...', alertType: 'favorable' }

    let crop = 'Cabbage, Carrots, Spinach – Cold-hardy crops recommended'
    if (weather.temperature > 28) crop = 'Maize, Okra, Brinjal – Heat-tolerant crops suggested'

    let irrigation = 'Light watering suggested – Moderate conditions'
    if (weather.humidity > 75) irrigation = 'Low watering suggested – High humidity present'
    if (weather.temperature > 32 && weather.humidity < 40) irrigation = 'Deep watering required – Low soil moisture likely'

    let alertText = 'Favorable farming conditions today'
    let alertType = 'favorable'
    if (weather.temperature > 38) { alertText = 'Extreme Heat Alert – Limit outdoor activities'; alertType = 'danger'; }
    else if (weather.rainProb > 70) { alertText = 'Heavy Rain Forecast – Protect sensitive crops'; alertType = 'warning'; }
    else if (weather.windSpeed > 25) { alertText = 'High Winds – Avoid spraying pesticides'; alertType = 'warning'; }

    return { crop, irrigation, alertText, alertType }
  }, [weather])

  const alertsList = useMemo(() => {
    const list = []
    if (farms.length > 0 && weather?.temperature > 35) {
      list.push({ id: 'heat', type: 'danger', message: `High heat alert: ${weather.temperature}°C reported in Sonipat`, severity: 'high' })
    }
    farms.forEach(farm => {
      if ((farm.progress || 0) > 90) {
        list.push({ id: `harvest-${farm.id}`, type: 'success', message: `${farm.name} is reaching peak harvest maturity`, severity: 'medium' })
      }
    })
    return list
  }, [farms, weather])

  const [hasDismissedOnboarding, setHasDismissedOnboarding] = useState(
    sessionStorage.getItem('onboarding_dismissed') === 'true'
  )

  const dismissOnboarding = () => {
    setHasDismissedOnboarding(true)
    sessionStorage.setItem('onboarding_dismissed', 'true')
  }

  // Loading Screen
  if (locationStatus === 'detecting' || locationLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 bg-emerald-500/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-emerald-500/30"
        >
          <Navigation className="text-emerald-400 animate-pulse" size={40} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Detecting Farm Location...</h2>
          <p className="text-white/50 mt-2">Personalizing your agricultural dashboard</p>
        </div>
      </div>
    )
  }

  const showOnboarding = farms.length === 0 && !hasDismissedOnboarding

  return (
    <div className="dashboard-container custom-scrollbar">
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => { refetchFarms(); dismissOnboarding() }}
          onSkip={dismissOnboarding}
        />
      )}

      {/* Header & Compact Weather */}
      <header className="hero-header">
        <div className="welcome-section">
          <h1>Welcome back, {user.name || 'Farmer'}</h1>
          <p>Here’s your farm overview for today</p>
        </div>

        <div className="glass-card compact-weather-card">
          {weather ? (
            <>
              <div className="weather-main-info">
                <div className="weather-icon-wrapper">
                  {getWeatherIcon(weather.condition, 24)}
                </div>
                <div className="weather-temp-group">
                  <span className="current-temp">{weather.temperature}°C</span>
                  <span className="weather-location text-teal-400">
                    <MapPin size={10} /> {weather.location || 'Sonipat'}
                  </span>
                </div>
              </div>
              <div className="weather-stats-grid">
                <div className="weather-stat-item">
                  <span className="stat-value">{weather.humidity}%</span>
                  <span className="stat-label">Humidity</span>
                </div>
                <div className="weather-stat-item">
                  <span className="stat-value">{weather.windSpeed}k/h</span>
                  <span className="stat-label">Wind</span>
                </div>
                <div className="weather-stat-item">
                  <span className="stat-value">{weather.rainProb}%</span>
                  <span className="stat-label">Rain</span>
                </div>
              </div>
            </>
          ) : (
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 w-12 bg-white/10 rounded" />
                <div className="h-2 w-16 bg-white/10 rounded" />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Row 1: Farm Stats */}
      <div className="metrics-grid">
        {[
          { label: 'Total Farms', value: farmMetrics.totalFarms, icon: Home },
          { label: 'Active Crops', value: farmMetrics.activeCrops, icon: Sprout },
          { label: 'Harvest Ready', value: farmMetrics.harvestReady, icon: CheckCircle },
          { label: 'Health Score', value: `${farmMetrics.healthScore}%`, icon: Heart }
        ].map((metric, i) => (
          <div key={metric.label} className="glass-card metric-card-inner">
            <div className="metric-icon-box">
              <metric.icon size={20} />
            </div>
            <div className="metric-value-text">{metric.value}</div>
            <div className="metric-label-text">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Today's Farm Conditions (Weather Driven) */}
      <div className="conditions-row">
        {/* Crop Advice */}
        <div className="glass-card advice-card">
          <div className="advice-header">
            <Leaf className="advice-icon" size={18} />
            <span className="advice-title">Crop Advice</span>
          </div>
          <div className="advice-content">
            {weatherInsights.crop}
          </div>
        </div>

        {/* Irrigation Advice */}
        <div className="glass-card advice-card">
          <div className="advice-header">
            <Droplets className="advice-icon" size={18} />
            <span className="advice-title">Irrigation Advice</span>
          </div>
          <div className="advice-content">
            {weatherInsights.irrigation}
          </div>
        </div>

        {/* Weather Alert */}
        <div className="glass-card advice-card">
          <div className="advice-header">
            <Activity className="advice-icon" size={18} />
            <span className="advice-title">Weather Status</span>
          </div>
          <div className="advice-content flex items-center justify-between">
            <span className={`status-indicator status-${weatherInsights.alertType}`}>
              {weatherInsights.alertType === 'favorable' ? '✔' : '⚠'} {weatherInsights.alertText}
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Alerts & Market */}
      <div className="mid-row">
        {/* Recent Alerts */}
        <div className="glass-card section-card">
          <div className="section-header">
            <h2><AlertTriangle className="text-amber-400" size={20} /> Recent Alerts</h2>
            {alertsList.length > 0 && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{alertsList.length} Active</span>}
          </div>
          <div className="section-content">
            {alertsList.length > 0 ? (
              alertsList.map(alert => (
                <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                  <Activity size={16} className="mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{alert.message}</p>
                    <span className="text-[10px] text-white/40 uppercase">Action required</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-placeholder">
                <span className="empty-icon">✨</span>
                <p>All clear! No alerts right now</p>
              </div>
            )}
          </div>
        </div>

        {/* Market Trends */}
        <div className="glass-card section-card">
          <div className="section-header">
            <h2><TrendingUp className="text-emerald-400" size={20} /> Market Trends</h2>
            <span className="text-[10px] text-white/40 font-bold uppercase">Sonipat Mandi</span>
          </div>
          <div className="section-content">
            {pricesLoading ? (
              [1, 2, 3].map(i => <div key={i} className="animate-pulse h-16 bg-white/5 rounded-xl mb-3" />)
            ) : trendingCrops.length > 0 ? (
              trendingCrops.map((crop, i) => (
                <div key={i} className="market-item">
                  <div className="market-crop-info">
                    <div className="crop-icon-mini">
                      <Leaf size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{crop.commodity}</p>
                      <p className="text-[10px] text-white/40 capitalize">{crop.district}</p>
                    </div>
                  </div>
                  <div className="market-price-info">
                    <p className="font-bold">₹{crop.modal_price}</p>
                    <div className="trend-indicator trend-up">
                      <TrendingUp size={10} /> Rising
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-placeholder">
                <Activity className="empty-icon" />
                <p>Syncing market data...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Mini 5-Day Forecast */}
      <div className="forecast-strip-container">
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4 px-2">5-Day Outlook</h2>
        <div className="glass-card forecast-strip">
          {forecastData ? (
            forecastData.map((day, i) => (
              <div key={i} className="forecast-day-card">
                <span className="forecast-day-name">{day.day}</span>
                {getWeatherIcon(day.icon, 20)}
                <span className="forecast-temp">{day.temp}°C</span>
              </div>
            ))
          ) : (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex flex-col items-center gap-2">
                <div className="h-3 w-8 bg-white/10 rounded" />
                <div className="w-6 h-6 bg-white/10 rounded-full" />
                <div className="h-4 w-10 bg-white/10 rounded" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard
