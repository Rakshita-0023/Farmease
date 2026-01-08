import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../config'
import OnboardingWizard from './OnboardingWizard'
import { Cloud, Sun, CloudRain, Wind, Droplets, MapPin, TrendingUp, Leaf, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLocation } from '../LocationContext'
import { useMandiData } from '../hooks/useMandiData'

const EnhancedDashboard = () => {
  const { location: globalLocation, loading: locationLoading, locationStatus, retryLocationDetection, updateLocation, error: locationError } = useLocation()
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {})

  const { data: farms = [], isLoading: farmsLoading, refetch: refetchFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => apiClient.get('/farms')
  })

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
        location: data.name || globalLocation.city,
        icon: data.weather?.[0]?.main
      }
    },
    enabled: !!globalLocation?.latitude && !!globalLocation?.longitude,
    staleTime: 5 * 60 * 1000
  })

  const { data: marketPrices = [], isLoading: pricesLoading } = useMandiData(
    globalLocation?.state || '',
    globalLocation?.city || '',
    ''
  )

  const trendingCrops = useMemo(() => {
    return Array.isArray(marketPrices)
      ? marketPrices.filter(p => p.trend === 'up').slice(0, 4)
      : []
  }, [marketPrices])

  const getWeatherIcon = (condition) => {
    const icons = {
      'Clear': <Sun className="text-amber-400" size={28} />,
      'Clouds': <Cloud className="text-slate-300" size={28} />,
      'Rain': <CloudRain className="text-blue-400" size={28} />,
      'Drizzle': <CloudRain className="text-blue-300" size={28} />,
      'Thunderstorm': <Wind className="text-purple-400" size={28} />
    }
    return icons[condition] || <Sun className="text-amber-400" size={28} />
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

  const alerts = useMemo(() => {
    const list = []
    if (farms.length > 0 && weather?.temperature > 35) {
      list.push({ id: 'heat', type: 'danger', message: `High heat alert (${weather.temperature}°C)`, severity: 'high' })
    }
    farms.forEach(farm => {
      if ((farm.progress || 0) > 90) {
        list.push({ id: `harvest-${farm.id}`, type: 'success', message: `${farm.name} ready for harvest`, severity: 'high' })
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

  // Loading State
  if (locationStatus === 'detecting' || locationLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 bg-emerald-500/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-emerald-500/30"
        >
          <MapPin className="text-emerald-400 animate-pulse" size={40} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Detecting Location...</h2>
          <p className="text-white/50 mt-2">Setting up your dashboard</p>
        </div>
      </div>
    )
  }

  // Location Failed - Show manual city selector
  if (locationStatus === 'failed') {
    const cities = [
      { name: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
      { name: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
      { name: 'Bangalore', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
      { name: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
      { name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
      { name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
      { name: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
      { name: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
      { name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
      { name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
      { name: 'Chandigarh', state: 'Punjab', latitude: 30.7333, longitude: 76.7794 },
      { name: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 }
    ]
    
    const handleCitySelect = (city) => {
      console.log('📍 Dashboard: Manual city selection:', city.name)
      if (updateLocation) {
        updateLocation(city)
      }
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 p-6">
        <div className="w-20 h-20 bg-amber-500/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-amber-500/30">
          <MapPin className="text-amber-400" size={40} />
        </div>
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-white">Select Your Location</h2>
          <p className="text-white/50">{locationError || 'Auto-detection failed. Please select your city manually.'}</p>
          
          {/* Manual City Selector */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-left">
            <p className="text-white/70 text-sm mb-4">Choose your city to continue:</p>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {cities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleCitySelect(city)}
                  className="flex flex-col items-start p-3 bg-white/5 hover:bg-emerald-500/20 rounded-xl transition-all text-left border border-transparent hover:border-emerald-500/30"
                >
                  <span className="text-white font-medium text-sm">{city.name}</span>
                  <span className="text-white/40 text-xs">{city.state}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={retryLocationDetection}
              className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <MapPin size={16} />
              Retry Auto-detect
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (farmsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    )
  }

  const showOnboarding = farms.length === 0 && !hasDismissedOnboarding

  return (
    <div className="p-6 space-y-6 min-h-full">
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => { refetchFarms(); dismissOnboarding() }}
          onSkip={dismissOnboarding}
        />
      )}

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Live Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome back, {user.name || 'Farmer'}
            </h1>
            <p className="text-white/50 mt-1">Here's your farm overview for today</p>
          </div>

          {/* Weather Card */}
          {weather ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[200px]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                  {getWeatherIcon(weather.icon)}
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{weather.temperature}°C</div>
                  <div className="text-white/50 text-sm flex items-center gap-1">
                    <MapPin size={12} /> {weather.location}
                  </div>
                </div>
              </div>
            </div>
          ) : weatherLoading ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-6 w-16 bg-white/10 rounded" />
                  <div className="h-4 w-24 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Farms', value: farmMetrics.totalFarms, icon: '🏡', color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/20' },
          { label: 'Active Crops', value: farmMetrics.activeCrops, icon: '🌾', color: 'from-emerald-500/15 to-teal-500/15', border: 'border-emerald-500/20' },
          { label: 'Harvest Ready', value: farmMetrics.harvestReady, icon: '✅', color: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-500/20' },
          { label: 'Health Score', value: `${farmMetrics.healthScore}%`, icon: '💚', color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/20' }
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-br ${metric.color} backdrop-blur-xl rounded-2xl p-5 border ${metric.border} hover:bg-white/10 transition-all cursor-default`}
          >
            <div className="text-2xl mb-3">{metric.icon}</div>
            <div className="text-2xl font-bold text-white">{metric.value}</div>
            <div className="text-white/50 text-sm mt-1">{metric.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-emerald-400" />
              Recent Alerts
            </h2>
            <span className="text-xs bg-white/10 text-white/60 px-3 py-1 rounded-full">
              {alerts.length} New
            </span>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-white/40">All clear! No alerts right now.</p>
              </div>
            ) : (
              alerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-xl border-l-4 ${
                    alert.severity === 'high' 
                      ? 'bg-red-500/10 border-red-500 text-red-200' 
                      : 'bg-amber-500/10 border-amber-500 text-amber-200'
                  }`}
                >
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-xs opacity-60 mt-1">Just now</p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Market Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-400" />
              Market Trends
            </h2>
            <button 
              onClick={() => window.location.hash = '#/market'}
              className="text-xs text-emerald-400 font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {pricesLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))
            ) : trendingCrops.length > 0 ? (
              trendingCrops.map((crop, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => window.location.hash = '#/market'}
                  className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      {crop.commodity === 'Rice' ? '🌾' : crop.commodity === 'Wheat' ? '🍞' : crop.commodity === 'Tomato' ? '🍅' : '🌱'}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{crop.commodity}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">{crop.market}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">₹{crop.modal_price}</p>
                    <p className="text-[10px] text-emerald-400 flex items-center justify-end gap-0.5">
                      <TrendingUp size={10} /> Rising
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-white/40 text-sm">No trending crops</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default EnhancedDashboard
