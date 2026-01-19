import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../config'
import { useLocation } from '../LocationContext'
import weatherCache from '../services/weatherCache'
import { formatCoordsPair } from '../utils/coordinateUtils'
import {
  Cloud, Sun, CloudRain, Wind, Droplets, Thermometer,
  MapPin, RefreshCw, AlertTriangle, Sunrise, Sunset,
  CloudLightning, CloudSnow, CloudFog, Gauge, Eye, Navigation
} from 'lucide-react'

// Weather icon component with animations
const WeatherIcon = ({ condition, size = 64 }) => {
  const cond = (condition || '').toLowerCase()
  const iconClass = "transition-all duration-500"
  
  if (cond.includes('clear') || cond.includes('sunny')) {
    return (
      <div className="relative">
        <Sun size={size} className={`${iconClass} text-amber-400 animate-pulse`} />
        <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
      </div>
    )
  }
  if (cond.includes('cloud') && cond.includes('sun')) {
    return <Cloud size={size} className={`${iconClass} text-slate-300`} />
  }
  if (cond.includes('cloud')) {
    return <Cloud size={size} className={`${iconClass} text-slate-400`} />
  }
  if (cond.includes('rain') || cond.includes('drizzle')) {
    return (
      <div className="relative">
        <CloudRain size={size} className={`${iconClass} text-blue-400`} />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-0.5 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    )
  }
  if (cond.includes('thunder') || cond.includes('storm')) {
    return <CloudLightning size={size} className={`${iconClass} text-purple-400 animate-pulse`} />
  }
  if (cond.includes('snow')) {
    return <CloudSnow size={size} className={`${iconClass} text-blue-200`} />
  }
  if (cond.includes('mist') || cond.includes('fog') || cond.includes('haze')) {
    return <CloudFog size={size} className={`${iconClass} text-slate-400`} />
  }
  return <Sun size={size} className={`${iconClass} text-amber-400`} />
}

// Get background gradient based on weather - simplified to emerald theme
const getWeatherGradient = (condition) => {
  const cond = (condition || '').toLowerCase()
  // Use emerald-based gradients for consistency
  if (cond.includes('clear') || cond.includes('sunny')) return 'from-emerald-600 via-teal-600 to-emerald-700'
  if (cond.includes('cloud')) return 'from-slate-600 via-slate-700 to-emerald-900'
  if (cond.includes('rain')) return 'from-slate-700 via-emerald-800 to-slate-800'
  if (cond.includes('thunder')) return 'from-slate-800 via-emerald-900 to-slate-900'
  if (cond.includes('snow')) return 'from-slate-500 via-slate-600 to-emerald-800'
  if (cond.includes('mist') || cond.includes('fog')) return 'from-slate-600 via-slate-700 to-emerald-800'
  return 'from-emerald-600 via-teal-600 to-emerald-700'
}

// Farming advice based on weather
const getFarmingAdvice = (weather) => {
  if (!weather) return { crop: '', irrigation: '', alert: '' }
  
  const temp = weather.temperature
  const humidity = weather.humidity
  const cond = (weather.condition || '').toLowerCase()
  
  let crop = '', irrigation = '', alert = ''
  
  // Crop advice
  if (temp >= 25 && temp <= 35) {
    crop = cond.includes('rain') ? 'Rice, Sugarcane - Excellent monsoon conditions' : 'Cotton, Maize, Tomatoes - Ideal warm weather'
  } else if (temp >= 15 && temp < 25) {
    crop = 'Wheat, Barley, Peas - Perfect cool season crops'
  } else if (temp < 15) {
    crop = 'Cabbage, Carrots, Spinach - Cold hardy vegetables'
  } else {
    crop = 'Heat-resistant varieties recommended'
  }
  
  // Irrigation advice
  if (cond.includes('rain')) {
    irrigation = 'Skip watering - Natural rainfall sufficient'
  } else if (humidity > 70) {
    irrigation = 'Light watering - High humidity present'
  } else if (humidity < 40) {
    irrigation = 'Increase watering - Low humidity detected'
  } else {
    irrigation = 'Normal watering schedule'
  }
  
  // Alerts
  if (temp > 40) alert = '🔥 Extreme heat - Provide shade for crops'
  else if (temp < 5) alert = '❄️ Frost warning - Protect sensitive plants'
  else if (weather.windSpeed > 25) alert = '💨 High winds - Secure tall crops'
  else if (cond.includes('storm') || cond.includes('thunder')) alert = '⛈️ Storm alert - Take protective measures'
  else alert = '✅ Favorable conditions for farming'
  
  return { crop, irrigation, alert }
}

const Weather = () => {
  const { location: globalLocation, loading: locationLoading, locationStatus, retryLocationDetection, updateLocation, error: locationError } = useLocation()
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchWeather = useCallback(async (lat, lon, forceRefresh = false) => {
    if (!lat || !lon) return
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = weatherCache.get(lat, lon)
      if (cached?.current) {
        console.log('✅ Using cached weather data')
        setWeather(cached.current)
        setForecast(cached.forecast || [])
        setLastUpdated(cached.timestamp)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`🌤️ Fetching weather for: ${lat}, ${lon}`)
      
      // Fetch current weather with coordinates
      const data = await apiClient.get('/weather/current', { lat, lon })
      
      console.log('📊 Weather API Response:', data)
      
      // Validate response
      if (!data || !data.main || !data.weather?.[0]) {
        throw new Error('Invalid weather data received')
      }

      const weatherData = {
        location: data.name || globalLocation?.city || 'Your Location',
        country: data.sys?.country || 'IN',
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
        windDeg: data.wind?.deg || 0,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
        sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
        sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
        clouds: data.clouds?.all || 0,
        timestamp: data.dt,
        lat,
        lon
      }

      console.log('✅ Processed weather:', weatherData)
      setWeather(weatherData)
      setLastUpdated(new Date())

      // Fetch forecast
      try {
        const forecastData = await apiClient.get('/weather/forecast', { lat, lon })
        
        if (forecastData?.list) {
          // Get one forecast per day (every 8th item = 24 hours)
          const dailyForecast = forecastData.list
            .filter((_, i) => i % 8 === 0)
            .slice(0, 5)
            .map(item => ({
              date: new Date(item.dt * 1000),
              day: new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short' }),
              temp: Math.round(item.main.temp),
              tempMin: Math.round(item.main.temp_min),
              tempMax: Math.round(item.main.temp_max),
              condition: item.weather[0].main,
              description: item.weather[0].description,
              humidity: item.main.humidity,
              rain: Math.round((item.pop || 0) * 100),
              windSpeed: Math.round((item.wind?.speed || 0) * 3.6)
            }))
          
          setForecast(dailyForecast)
          
          // Cache the data
          weatherCache.set(lat, lon, { 
            current: weatherData, 
            forecast: dailyForecast,
            timestamp: new Date()
          })
        }
      } catch (forecastErr) {
        console.warn('Forecast fetch failed:', forecastErr)
      }

    } catch (err) {
      console.error('❌ Weather fetch error:', err)
      setError(err.message || 'Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }, [globalLocation?.city])

  // Fetch weather when location is available
  useEffect(() => {
    if (globalLocation?.latitude && globalLocation?.longitude) {
      fetchWeather(globalLocation.latitude, globalLocation.longitude)
    }
  }, [globalLocation?.latitude, globalLocation?.longitude, fetchWeather])

  const handleRefresh = () => {
    if (globalLocation?.latitude && globalLocation?.longitude) {
      // Clear both weather cache and location cache to force fresh data
      weatherCache.clear()
      localStorage.removeItem('weatherData') // Clear any localStorage cache
      console.log('🔄 Forcing fresh weather fetch...')
      console.log('📍 Current location:', globalLocation)
      fetchWeather(globalLocation.latitude, globalLocation.longitude, true)
    }
  }

  const advice = getFarmingAdvice(weather)

  // Loading state - Premium skeleton
  if (locationLoading || (loading && !weather)) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Skeleton Header */}
          <div className="animate-pulse mb-8">
            <div className="h-8 bg-white/10 rounded-lg w-48 mb-2" />
            <div className="h-4 bg-white/10 rounded w-32" />
          </div>
          
          {/* Skeleton Main Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-6 animate-pulse border border-white/10">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white/10 rounded-full" />
                <div>
                  <div className="h-16 bg-white/10 rounded-lg w-32 mb-2" />
                  <div className="h-6 bg-white/10 rounded w-24" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-20 h-20 bg-white/10 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Skeleton Forecast */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 animate-pulse border border-white/10">
                <div className="h-4 bg-white/10 rounded w-12 mb-3" />
                <div className="h-12 bg-white/10 rounded-xl mb-3" />
                <div className="h-6 bg-white/10 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Location error state - with manual city selector
  if (locationStatus === 'failed' || locationError || !globalLocation) {
    const cities = [
      { name: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
      { name: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
      { name: 'Bangalore', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
      { name: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
      { name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
      { name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
      { name: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
      { name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
      { name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 }
    ]
    
    const handleCitySelect = (city) => {
      console.log('📍 Manual city selection:', city.name)
      if (updateLocation) {
        updateLocation(city)
      }
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-12">
            <Navigation className="text-white" size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Location Required</h2>
          <p className="text-white/50 mb-6">
            {locationError || 'Enable location access to get accurate weather for your farm.'}
          </p>
          
          <button
            onClick={retryLocationDetection}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all mb-4"
          >
            Enable Location
          </button>
          
          <p className="text-white/40 text-sm mb-4">Or select your city manually:</p>
          
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {cities.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCitySelect(city)}
                className="p-2 bg-white/5 hover:bg-emerald-500/20 rounded-xl transition-all text-left border border-transparent hover:border-emerald-500/30"
              >
                <span className="text-white font-medium text-xs block">{city.name}</span>
                <span className="text-white/40 text-[10px]">{city.state}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !weather) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-10 text-center border border-white/10">
          <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-red-400" size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Weather Unavailable</h2>
          <p className="text-white/50 mb-8">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">Weather Forecast</h1>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin size={16} />
              <span>{weather?.location || globalLocation?.city}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs">
                {formatCoordsPair(globalLocation?.latitude, globalLocation?.longitude)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-500">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all font-medium"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {weather && (
          <>
            {/* Main Weather Card */}
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getWeatherGradient(weather.condition)} p-8 mb-6 shadow-2xl`}>
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
              
              {/* Animated background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-2xl" />
              
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                  {/* Temperature Section */}
                  <div className="flex items-center gap-6">
                    <div className="transform hover:scale-110 transition-transform duration-300">
                      <WeatherIcon condition={weather.condition} size={80} />
                    </div>
                    <div>
                      <div className="flex items-start">
                        <span className="text-8xl font-black text-white tracking-tighter animate-fade-in">
                          {weather.temperature}
                        </span>
                        <span className="text-4xl font-bold text-white/80 mt-2">°C</span>
                      </div>
                      <p className="text-xl text-white/90 capitalize font-medium">{weather.description}</p>
                      <p className="text-white/60 text-sm mt-1">Feels like {weather.feelsLike}°C</p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/20 transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplets size={18} className="text-white/70 group-hover:text-white transition-colors" />
                        <span className="text-xs text-white/60 uppercase tracking-wider">Humidity</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{weather.humidity}%</span>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/20 transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <Wind size={18} className="text-white/70 group-hover:text-white transition-colors" />
                        <span className="text-xs text-white/60 uppercase tracking-wider">Wind</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{weather.windSpeed} <span className="text-sm">km/h</span></span>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/20 transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge size={18} className="text-white/70 group-hover:text-white transition-colors" />
                        <span className="text-xs text-white/60 uppercase tracking-wider">Pressure</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{weather.pressure} <span className="text-sm">hPa</span></span>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/20 transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye size={18} className="text-white/70 group-hover:text-white transition-colors" />
                        <span className="text-xs text-white/60 uppercase tracking-wider">Visibility</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{weather.visibility || '—'} <span className="text-sm">km</span></span>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/20 transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <Sunrise size={18} className="text-amber-300 group-hover:text-amber-200 transition-colors" />
                        <span className="text-xs text-white/60 uppercase tracking-wider">Sunrise</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{weather.sunrise || '—'}</span>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/20 transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <Sunset size={18} className="text-orange-300 group-hover:text-orange-200 transition-colors" />
                        <span className="text-xs text-white/60 uppercase tracking-wider">Sunset</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{weather.sunset || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast Section */}
            {forecast.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-4">5-Day Forecast</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {forecast.map((day, index) => (
                    <div 
                      key={index}
                      className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:bg-white/15 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                    >
                      <p className="text-sm font-bold text-white/50 mb-3 group-hover:text-white transition-colors">
                        {index === 0 ? 'Today' : day.day}
                      </p>
                      <div className="flex justify-center mb-3 transform group-hover:scale-110 transition-transform">
                        <WeatherIcon condition={day.condition} size={40} />
                      </div>
                      <p className="text-2xl font-black text-white text-center mb-1">{day.temp}°</p>
                      <p className="text-xs text-white/40 text-center capitalize mb-3">{day.description}</p>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <Droplets size={12} className="text-blue-400" />
                        <span className="text-white/50">{day.rain}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Farming Advice Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Thermometer className="text-emerald-400" size={20} />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Crop Advice</span>
                </div>
                <p className="text-white font-medium">{advice.crop}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Droplets className="text-emerald-400" size={20} />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Irrigation</span>
                </div>
                <p className="text-white font-medium">{advice.irrigation}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="text-amber-400" size={20} />
                  </div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Alert</span>
                </div>
                <p className="text-white font-medium">{advice.alert}</p>
              </div>
            </div>

            {/* Data Source Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-white/30">
                Data source: OpenWeatherMap API • Coordinates: {formatCoordsPair(weather.lat, weather.lon)}
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Weather
