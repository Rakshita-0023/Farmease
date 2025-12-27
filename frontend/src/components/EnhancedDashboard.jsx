import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, WEATHER_API_KEY } from '../config'
import OnboardingWizard from './OnboardingWizard'
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, MapPin } from 'lucide-react'
import './EnhancedDashboard.css'

const EnhancedDashboard = () => {
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {})
  const [alertFilter, setAlertFilter] = useState('all')

  const { data: farms = [], isLoading: farmsLoading, refetch: refetchFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => apiClient.get('/farms')
  })

  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      // Try to get location
      let lat = 28.6139, lon = 77.2090 // Default Delhi
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        lat = position.coords.latitude
        lon = position.coords.longitude
      } catch (e) {
        console.log('Location access denied, using default')
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      )
      if (!response.ok) throw new Error('Weather fetch failed')
      const data = await response.json()

      return {
        temperature: Math.round(data.main.temp),
        condition: mapWeatherCondition(data.weather[0].main, data.weather[0].description),
        humidity: data.main.humidity,
        location: data.name,
        icon: getWeatherIcon(data.weather[0].main)
      }
    }
  })

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

  const financials = useMemo(() => {
    if (!farms.length) return { revenue: 0, costs: 0, profit: 0 }
    const estimatedRevenue = farms.reduce((sum, farm) => sum + (farm.area * 40000), 0) // Mock calc
    const inputCosts = farms.reduce((sum, farm) => sum + (farm.area * 15000), 0)
    return { revenue: estimatedRevenue, costs: inputCosts, profit: estimatedRevenue - inputCosts }
  }, [farms])

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

  if (farmsLoading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>
  }

  if (farms.length === 0) {
    return (
      <div className="p-6 space-y-8">
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">👋 Welcome to FarmEase, {user.name}!</h1>
          <p className="text-green-100 text-lg">Let's get your digital farm set up for success.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">🚀 Getting Started Checklist</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-gray-800">Add your first farm</h3>
                  <p className="text-gray-500 text-sm mt-1">Map your land and tell us what you're growing.</p>
                  <button onClick={() => refetchFarms()} className="mt-3 text-green-600 font-medium text-sm hover:underline">
                    Refresh after adding
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm opacity-60">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-gray-800">Check Market Prices</h3>
                  <p className="text-gray-500 text-sm mt-1">See real-time rates for your crops in nearby mandis.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm opacity-60">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-gray-800">Get Weather Alerts</h3>
                  <p className="text-gray-500 text-sm mt-1">Receive personalized forecasts for your exact location.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <OnboardingWizard onComplete={refetchFarms} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🌱 Welcome back, {user.name || 'Farmer'}!</h1>
          <p className="text-gray-500">Here's what's happening on your farms today</p>
        </div>

        {weather && (
          <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 border border-gray-100">
            <div className="bg-blue-50 p-3 rounded-full">
              {weather.icon}
            </div>
            <div>
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
          <h2 className="text-lg font-bold text-gray-800 mb-4">💰 Financial Overview</h2>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard