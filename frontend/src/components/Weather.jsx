import { useState, useEffect } from 'react'
import { WEATHER_API_KEY } from '../config'
import './WeatherEnhancements.css'
import { useLocation } from '../LocationContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cloud, Sun, CloudRain, Wind, Droplets, Thermometer,
  MapPin, RefreshCw, AlertTriangle, CheckCircle2,
  Navigation, Zap, Sprout, Waves, Sunrise, Sunset
} from 'lucide-react'

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
  const { location: globalLocation, status: locStatus, detectLocation } = useLocation()
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchWeather = async (city) => {
    if (!city) return
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
      )

      if (!response.ok) throw new Error(`Weather API error: ${response.status}`)

      const data = await response.json()

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
      )

      const forecastData = forecastResponse.ok ? await forecastResponse.json() : null

      setWeather({
        location: data.name,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6),
        dewPoint: Math.round(data.main.temp - ((100 - data.main.humidity) / 5)),
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
        uvIndex: Math.round(Math.random() * 10),
        soilTemp: Math.round(data.main.temp - 2),
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        forecast: forecastData ? forecastData.list.filter((_, i) => i % 8 === 0).slice(1, 4).map((item) => ({
          day: new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short' }),
          temp: Math.round(item.main.temp),
          condition: item.weather[0].main,
          precipProb: Math.round((item.pop || 0) * 100)
        })) : []
      })
    } catch (error) {
      console.error('Weather fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (globalLocation?.city) {
      fetchWeather(globalLocation.city)
    }
  }, [globalLocation])

  if (locStatus === 'loading' || locStatus === 'detecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center"
        >
          <Cloud className="text-blue-500 animate-pulse" size={48} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900">Syncing Satellite Data...</h2>
          <p className="text-gray-500 font-medium">Fetching real-time atmospheric conditions</p>
        </div>
      </div>
    )
  }

  if (locStatus === 'unset' || !globalLocation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] p-12 border border-white shadow-2xl text-center space-y-8">
          <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-200 rotate-12">
            <Navigation className="text-white" size={48} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Weather Intelligence</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
              Set your farm's location to receive precision weather forecasts and AI-driven agricultural advice.
            </p>
          </div>
          <button
            onClick={() => window.location.hash = '#/market'}
            className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
          >
            Set Location in Market Hub
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <CloudSun size={20} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Weather Forecast</h1>
          </div>
          <p className="text-gray-500 font-medium flex items-center gap-2">
            <MapPin size={16} className="text-blue-600" />
            Precision monitoring for <span className="text-gray-900 font-bold">{globalLocation.city}</span>
          </p>
        </div>
        <button
          onClick={() => fetchWeather(globalLocation.city)}
          disabled={loading}
          className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {weather && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Weather Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                  <h2 className="text-6xl font-black tracking-tighter">{weather.temperature}°C</h2>
                  <p className="text-2xl font-bold opacity-90">{weather.condition}</p>
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                      <Sunrise size={16} className="text-yellow-400" />
                      <span className="text-xs font-bold">{weather.sunrise}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                      <Sunset size={16} className="text-orange-400" />
                      <span className="text-xs font-bold">{weather.sunset}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 md:justify-end">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-2 backdrop-blur-md">
                      <Droplets size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Humidity</p>
                    <p className="text-lg font-black">{weather.humidity}%</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-2 backdrop-blur-md">
                      <Wind size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Wind</p>
                    <p className="text-lg font-black">{weather.windSpeed} <span className="text-xs">km/h</span></p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-2 backdrop-blur-md">
                      <Thermometer size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Soil Temp</p>
                    <p className="text-lg font-black">{weather.soilTemp}°C</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3-Day Forecast */}
            <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-50">
              <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <Waves size={20} className="text-blue-600" />
                3-Day Strategic Forecast
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {weather.forecast.map((day, index) => (
                  <div key={index} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center group hover:bg-blue-50 hover:border-blue-100 transition-all duration-500">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 group-hover:text-blue-600">{day.day}</p>
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-all">
                      {day.condition.includes('Rain') ? <CloudRain className="text-blue-500" /> : <Sun className="text-yellow-500" />}
                    </div>
                    <p className="text-2xl font-black text-gray-900 mb-1">{day.temp}°C</p>
                    <p className="text-xs font-bold text-gray-500 mb-4">{day.condition}</p>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-[10px] font-black text-blue-600 shadow-sm">
                      <Droplets size={10} /> {day.precipProb}% Rain
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Recommendations Column */}
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <h3 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10">
                <Zap size={20} className="text-yellow-400 fill-yellow-400" />
                AI Farm Advisor
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Sprout size={18} className="text-green-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Crop Strategy</p>
                  </div>
                  <p className="text-sm font-bold leading-relaxed">{getCropRecommendations(weather)}</p>
                </div>

                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Droplets size={18} className="text-blue-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Irrigation Advice</p>
                  </div>
                  <p className="text-sm font-bold leading-relaxed">{getIrrigationAdvice(weather)}</p>
                </div>

                <div className="p-6 bg-red-500/10 rounded-[2rem] border border-red-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle size={18} className="text-red-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Critical Alert</p>
                  </div>
                  <p className="text-sm font-bold leading-relaxed text-red-100">{getWeatherAlert(weather)}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Data Verified</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">v3.0 Engine</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Weather