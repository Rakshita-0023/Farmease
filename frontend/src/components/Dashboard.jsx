import { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '../App'
import { useLocation } from '../LocationContext'
import { useMandiData } from '../hooks/useMandiData'
import { TrendingUp, TrendingDown, RefreshCw, MapPin, Loader2 } from 'lucide-react'

const getSeasonalCrops = (temperature) => {
  if (temperature >= 25) {
    return ['Corn', 'Tomatoes', 'Peppers']
  } else if (temperature >= 15) {
    return ['Wheat', 'Carrots', 'Lettuce']
  } else {
    return ['Cabbage', 'Carrots', 'Spinach']
  }
}

const Dashboard = () => {
  const { location, status: locStatus } = useLocation()
  const [weather, setWeather] = useState(null)
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {})
  const [recentActivity, setRecentActivity] = useState([])
  const { t } = useLanguage()

  // Fetch real market data for the dashboard (trending crops)
  // Use location data if available to get relevant market prices
  const { data: marketPrices = [], isLoading: pricesLoading, refetch: refreshPrices } = useMandiData(
    location?.state || '',
    location?.city || '',
    ''
  )

  // Get top 6 trending crops for dashboard
  const trendingCrops = useMemo(() => {
    return Array.isArray(marketPrices)
      ? marketPrices.filter(p => p.trend === 'up').slice(0, 6)
      : []
  }, [marketPrices])

  const getRecentFarmActivity = () => {
    const farms = JSON.parse(localStorage.getItem('farms')) || []
    const activities = []

    const recentFarms = farms.slice(-5).reverse()

    recentFarms.forEach((farm, index) => {
      const daysAgo = index === 0 ? 'Today' : index === 1 ? 'Yesterday' : `${index + 1} days ago`
      const statusIcon = farm.progress >= 80 ? '🌟' : farm.progress >= 60 ? '🌱' : farm.progress >= 40 ? '🌿' : '🌾'
      const statusText = farm.progress >= 80 ? 'Excellent' : farm.progress >= 60 ? 'Growing Well' : farm.progress >= 40 ? 'Developing' : 'Recently Planted'

      activities.push({
        icon: statusIcon,
        text: `${farm.cropType} farm "${farm.name}" - ${statusText}`,
        time: daysAgo,
        status: farm.progress >= 60 ? 'good' : 'normal'
      })
    })

    if (activities.length === 0) {
      activities.push(
        { icon: '🌱', text: 'Welcome to FarmEase! Add your first farm to see activity', time: 'Now', status: 'normal' },
        { icon: '📊', text: 'Market prices updated with real-time data', time: '1 hour ago', status: 'good' },
        { icon: '🌤️', text: 'Weather data synchronized', time: '2 hours ago', status: 'normal' }
      )
    }

    return activities.slice(0, 4)
  }

  useEffect(() => {
    const fetchLocationWeather = async () => {
      if (!location?.latitude || !location?.longitude) return

      try {
        const { latitude, longitude } = location
        const API_KEY = '895284fb2d2c50a520ea537456963d9c'
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        )
        const data = await response.json()

        if (response.ok) {
          setWeather({
            location: data.name,
            temperature: Math.round(data.main.temp),
            condition: data.weather[0].main,
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * 3.6)
          })
        }
      } catch (error) {
        console.error('Weather fetch error:', error)
        // Fallback or error state could be set here
      }
    }

    fetchLocationWeather()
    setRecentActivity(getRecentFarmActivity())

    const handleStorageChange = () => {
      setRecentActivity(getRecentFarmActivity())
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [location]) // Re-run when location changes

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('welcome')}, {user.name || 'Farmer'}! 🌱</h1>
        <p>Here's what's happening on your farm today</p>
      </div>

      {locStatus === 'unset' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-bold text-yellow-900">Location not set</h3>
              <p className="text-yellow-700 text-sm">Set your location to see local weather and market prices.</p>
            </div>
          </div>
          <button
            onClick={() => window.location.hash = '#/market'}
            className="px-6 py-2 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700 transition-colors"
          >
            Set Location
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Weather Card */}
        <div className="dashboard-card">
          <h3 className="flex items-center gap-2">🌤️ {t('weatherToday')}</h3>
          {weather ? (
            <div className="weather-info">
              <div className="temp">{weather.temperature}°C</div>
              <div className="condition">{weather.condition}</div>
              <div className="details">
                <span>💧 {weather.humidity}%</span>
                <span>💨 {weather.windSpeed} km/h</span>
              </div>
              <div className="location-tag flex items-center gap-1 text-xs text-gray-400 mt-2">
                <MapPin size={12} /> {weather.location}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="animate-spin text-green-500" />
            </div>
          )}
        </div>

        {/* Crop Suggestions */}
        <div className="dashboard-card">
          <h3 className="flex items-center gap-2">🌱 {t('cropSuggestions')}</h3>
          <div className="crop-list">
            {weather ? (
              getSeasonalCrops(weather.temperature).map((crop, i) => (
                <div key={i} className="crop-item">
                  <span className="crop-item-name">{crop}</span>
                  <span className={`crop-status ${i === 0 ? 'excellent' : 'good'}`}>
                    {i === 0 ? 'Excellent' : i === 1 ? 'Very Good' : 'Good'}
                  </span>
                </div>
              ))
            ) : (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-gray-100 rounded"></div>
                <div className="h-8 bg-gray-100 rounded"></div>
              </div>
            )}
          </div>
        </div>

        {/* Market Prices Card */}
        <div className="dashboard-card lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center gap-2">📈 {t('marketPrices')} (Trending)</h3>
            <button
              onClick={() => refreshPrices()}
              disabled={pricesLoading}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw size={16} className={pricesLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="dashboard-market-grid">
            {pricesLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="market-card animate-pulse bg-gray-50 h-24 rounded-xl"></div>
              ))
            ) : trendingCrops.length > 0 ? (
              trendingCrops.map((item) => (
                <div key={item.id} className="market-card">
                  <div className="market-card-content">
                    <div className="flex justify-between items-start">
                      <div className="crop-name font-bold">{item.commodity}</div>
                      <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.trend === 'up' ? '↑' : '↓'}
                      </div>
                    </div>
                    <div className="price font-black text-lg">₹{item.modal_price.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 uppercase">{item.market}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400">
                No trending crops found today.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card lg:col-span-2">
          <h3 className="flex items-center gap-2">🕒 {t('recentActivity')}</h3>
          <div className="activity-list mt-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className={`activity-item ${activity.status} flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors`}>
                <span className="flex items-center gap-3">
                  <span className="text-xl">{activity.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{activity.text}</span>
                </span>
                <span className="time text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard