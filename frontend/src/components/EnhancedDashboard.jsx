import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, WEATHER_API_KEY } from '../config'
import OnboardingWizard from './OnboardingWizard'
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, MapPin, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import './EnhancedDashboard.css'
import { useLocation } from '../LocationContext'
import { useMandiData } from '../hooks/useMandiData'

const EnhancedDashboard = () => {
  const { location: globalLocation, loading: locationLoading, locationStatus, retryLocationDetection, error: locationError } = useLocation()
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {})
  const [alertFilter, setAlertFilter] = useState('all')

  const { data: farms = [], isLoading: farmsLoading, refetch: refetchFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => apiClient.get('/farms')
  })

  const { data: weather, isLoading: weatherLoading, error: weatherError } = useQuery({
    queryKey: ['weather', globalLocation?.latitude, globalLocation?.longitude, globalLocation?.city],
    queryFn: async () => {
      if (!globalLocation) return null;

      // STRICT VALIDATION: Only use coordinates, never fallback to city name
      if (!globalLocation.latitude || !globalLocation.longitude) {
        console.log('🌤️ Weather fetch blocked - coordinates required for location-dependent data')
        return null
      }

      console.log(`🌤️ Fetching weather for coordinates: ${globalLocation.latitude}, ${globalLocation.longitude}`)

      const params = {
        lat: globalLocation.latitude,
        lon: globalLocation.longitude
      };

      const data = await apiClient.get('/weather/current', params);

      // Validate response structure
      if (!data || !data.main || !data.weather || !data.weather[0]) {
        throw new Error('Invalid weather API response structure')
      }

      const weatherData = {
        temperature: Math.round(data.main.temp),
        condition: mapWeatherCondition(data.weather[0].main, data.weather[0].description),
        humidity: data.main.humidity,
        location: data.name || globalLocation.city,
        coordinates: `${globalLocation.latitude.toFixed(4)}, ${globalLocation.longitude.toFixed(4)}`,
        icon: getWeatherIcon(data.weather[0].main),
        timestamp: new Date().toISOString(),
        source: 'Coordinates-based API call'
      }

      console.log(`✅ Weather validated for ${weatherData.location}: ${weatherData.temperature}°C`)
      return weatherData
    },
    enabled: !!globalLocation?.latitude && !!globalLocation?.longitude, // Only fetch if coordinates exist
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  // Fetch trending market prices
  const { data: marketPrices = [], isLoading: pricesLoading } = useMandiData(
    globalLocation?.state || '',
    globalLocation?.city || '',
    ''
  )

  const trendingCrops = useMemo(() => {
    return Array.isArray(marketPrices)
      ? marketPrices.filter(p => p.trend === 'up').slice(0, 4)
      : [];
  }, [marketPrices])

  // Map raw weather conditions
  const mapWeatherCondition = (main, description) => {
    const conditionMap = {
      'Clear': 'Clear Sky',
      'Clouds': 'Cloudy',
      'Rain': 'Rainy',
      'Drizzle': 'Light Rain',
      'Thunderstorm': 'Stormy',
      'Snow': 'Snowy',
      'Mist': 'Misty',
      'Smoke': 'Hazy',
      'Haze': 'Hazy',
      'Dust': 'Dusty',
      'Fog': 'Foggy',
      'Sand': 'Sandy',
      'Ash': 'Volcanic Ash',
      'Squall': 'Windy',
      'Tornado': 'Severe Weather'
    }
    return conditionMap[main] || description || 'Unknown'
  }

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'Clear': return <Sun className="text-yellow-500" size={32} />
      case 'Clouds': return <Cloud className="text-gray-500" size={32} />
      case 'Rain':
      case 'Drizzle': return <CloudRain className="text-blue-500" size={32} />
      case 'Thunderstorm': return <Wind className="text-purple-500" size={32} />
      case 'Snow': return <Cloud className="text-blue-300" size={32} /> // Snow icon
      default: return <Sun className="text-yellow-500" size={32} />
    }
  }

  // Real-time farm calculations
  const farmMetrics = useMemo(() => {
    if (!farms.length) return { totalFarms: 0, activeCrops: 0, harvestReady: 0, healthScore: 0 }
    const totalFarms = farms.length
    const activeCrops = farms.filter(farm => (farm.progress || 0) < 100).length
    const harvestReady = farms.filter(farm => (farm.progress || 0) >= 90).length
    const totalHealth = farms.reduce((sum, farm) => sum + (farm.health_score || 0), 0)
    const healthScore = totalFarms > 0 ? Math.round(totalHealth / totalFarms) : 0
    return { totalFarms, activeCrops, harvestReady, healthScore }
  }, [farms])

  // STRICT VALIDATION: Only calculate financials if we have real farm data with market prices
  const financials = useMemo(() => {
    if (!farms.length) return { revenue: 0, costs: 0, profit: 0, hasRealData: false }
    
    // Check if we have market price data to make realistic calculations
    if (!marketPrices || marketPrices.length === 0) {
      return { revenue: 0, costs: 0, profit: 0, hasRealData: false }
    }
    
    // Calculate based on actual market prices for crops
    let totalRevenue = 0
    let totalCosts = 0
    
    farms.forEach(farm => {
      // Find market price for this farm's crop
      const cropPrice = marketPrices.find(p => 
        p.commodity.toLowerCase() === farm.crop?.toLowerCase() ||
        p.commodity.toLowerCase().includes(farm.crop?.toLowerCase())
      )
      
      if (cropPrice && farm.area) {
        // Use actual market price per quintal, estimate yield per hectare
        const estimatedYieldPerHectare = 25 // quintals per hectare (conservative estimate)
        const revenuePerHectare = cropPrice.modal_price * estimatedYieldPerHectare
        const farmRevenue = farm.area * revenuePerHectare
        
        // Calculate input costs (seeds, fertilizer, labor) - typically 40-60% of revenue
        const inputCostRatio = 0.45
        const farmCosts = farmRevenue * inputCostRatio
        
        totalRevenue += farmRevenue
        totalCosts += farmCosts
      }
    })
    
    return { 
      revenue: Math.round(totalRevenue), 
      costs: Math.round(totalCosts), 
      profit: Math.round(totalRevenue - totalCosts),
      hasRealData: totalRevenue > 0
    }
  }, [farms, marketPrices])

  // Alerts logic - only show alerts when there are farms
  const alerts = useMemo(() => {
    const list = []

    // Only show weather alerts if there are farms to be affected
    if (farms.length > 0 && weather && weather.temperature > 35) {
      list.push({
        id: 'heat',
        type: 'danger',
        message: `High heat (${weather.temperature}°C). Check irrigation for your ${farms.length} farm${farms.length > 1 ? 's' : ''}.`,
        severity: 'high'
      })
    }

    // Farm-specific alerts
    farms.forEach(farm => {
      if ((farm.progress || 0) > 90) {
        list.push({
          id: `harvest-${farm.id}`,
          type: 'success',
          message: `${farm.name} (${farm.crop}) is ready for harvest!`,
          severity: 'high'
        })
      }

      // Health alerts for farms with low health scores
      if ((farm.health_score || 0) < 70) {
        list.push({
          id: `health-${farm.id}`,
          type: 'warning',
          message: `${farm.name} health score is low (${farm.health_score || 0}%). Consider inspection.`,
          severity: 'medium'
        })
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

  // Loading State - Show when location is being detected
  if (locationStatus === 'detecting' || locationLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center"
        >
          <MapPin className="text-green-500 animate-pulse" size={48} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900">Detecting Your Location...</h2>
          <p className="text-gray-500 font-medium">Setting up your personalized farm dashboard</p>
        </div>
      </div>
    )
  }

  // Location Failed State - Show retry option
  if (locationStatus === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center">
          <MapPin className="text-red-500" size={48} />
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-black text-gray-900">Location Detection Failed</h2>
          <p className="text-gray-500 font-medium max-w-md">
            {locationError || 'Unable to detect your location automatically'}
          </p>
          <div className="flex gap-4 justify-center">
            {locationError && locationError.includes('log in') ? (
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.href = '/login'
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Log In Again
              </button>
            ) : (
              <button
                onClick={retryLocationDetection}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => window.location.hash = '#/market'}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
            >
              Select Manually
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (farmsLoading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>
  }

  const showOnboarding = farms.length === 0 && !hasDismissedOnboarding

  return (
    <div className="p-6 space-y-6 relative">
      {/* Onboarding Overlay - Only shows if no farms and not dismissed */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => {
            refetchFarms()
            dismissOnboarding()
          }}
          onSkip={dismissOnboarding}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🌱 Welcome back, {user.name || 'Farmer'}!</h1>
          <p className="text-gray-500">Here's what's happening on your farms today</p>
        </div>

        {weather ? (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-blue-50 p-3 rounded-full">
                {weather.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-800">{weather.temperature}°C</span>
                  <span className="text-sm text-gray-500 font-medium">{weather.condition}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {weather.location}</span>
                  <span className="flex items-center gap-1"><Droplets size={12} /> {weather.humidity}%</span>
                </div>
              </div>
            </div>
            {/* Data Provenance */}
            <div className="text-xs text-gray-400 border-t border-gray-100 pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="font-mono">{weather.coordinates}</span>
              </div>
              <div className="flex justify-between">
                <span>Source:</span>
                <span>{weather.source}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated:</span>
                <span>{weather.timestamp ? new Date(weather.timestamp).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        ) : weatherLoading ? (
          <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 border border-gray-100 animate-pulse">
            <div className="bg-gray-100 w-12 h-12 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 w-20 rounded"></div>
              <div className="h-3 bg-gray-100 w-32 rounded"></div>
            </div>
          </div>
        ) : locationStatus === 'unset' ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm font-medium">Set your location to view weather data</p>
            <button
              onClick={() => window.location.hash = '#/market'}
              className="mt-2 text-blue-600 text-xs font-bold underline hover:text-blue-800"
            >
              Set Location →
            </button>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800 text-sm font-medium">Weather data unavailable</p>
            <button
              onClick={retryLocationDetection}
              className="mt-2 text-yellow-600 text-xs font-bold underline hover:text-yellow-800"
            >
              Retry Location →
            </button>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg text-green-600">🏡</div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Farms</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{farmMetrics.totalFarms}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600">🌾</div>
            <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Growing</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Active Crops</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{farmMetrics.activeCrops}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">✅</div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Action Needed</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Ready to Harvest</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{farmMetrics.harvestReady}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg text-purple-600">💚</div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Health</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Avg Health Score</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{farmMetrics.healthScore}%</p>
        </div>
      </div>

      {/* Alerts & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            🔔 Recent Alerts
            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{alerts.length} New</span>
          </h2>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No new alerts. Everything looks good!</p>
            ) : (
              alerts.map((alert, i) => (
                <div key={i} className={`p-4 rounded-lg border-l-4 ${alert.severity === 'high' ? 'bg-red-50 border-red-500' :
                  alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  } flex justify-between items-center`}>
                  <div>
                    <p className={`font-medium ${alert.severity === 'high' ? 'text-red-800' :
                      alert.severity === 'medium' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">Just now</p>
                  </div>
                  <button className="text-sm font-medium underline opacity-70 hover:opacity-100">View</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
            📈 Market Highlights
            <button onClick={() => window.location.hash = '#/market'} className="text-xs text-green-600 font-bold hover:underline">View All</button>
          </h2>
          <div className="space-y-4">
            {pricesLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />)
            ) : trendingCrops.length > 0 ? (
              trendingCrops.map((crop, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-green-50 transition-colors cursor-pointer" onClick={() => window.location.hash = '#/market'}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-lg">
                      {crop.commodity === 'Rice' ? '🌾' : crop.commodity === 'Wheat' ? '🍞' : crop.commodity === 'Tomato' ? '🍅' : '🌱'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{crop.commodity}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{crop.market}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900">₹{crop.modal_price}</p>
                    <p className="text-[10px] font-bold text-green-600 flex items-center justify-end gap-0.5">
                      <TrendingUp size={10} /> Rising
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8 text-sm">No trending crops in your area.</p>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">💰 Financial Overview</h2>
            
            {!financials.hasRealData ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-yellow-600 font-bold text-sm mb-2">⚠️ Insufficient Data</div>
                <p className="text-yellow-700 text-xs">
                  Financial projections require market price data. Add farms and ensure market data is available.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Est. Revenue</span>
                  <span className="font-bold text-green-600">₹{financials.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Input Costs</span>
                  <span className="font-bold text-red-500">₹{financials.costs.toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Proj. Profit</span>
                  <span className="font-bold text-xl text-green-700">₹{financials.profit.toLocaleString()}</span>
                </div>
                {/* Data Source */}
                <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                  <div className="flex justify-between">
                    <span>Calculation:</span>
                    <span>Market Price × Yield × Area</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Source:</span>
                    <span>Live Market Prices</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard