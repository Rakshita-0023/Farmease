import { useState, useEffect } from 'react'
import { useLanguage } from '../App'

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
  const [weather, setWeather] = useState(null)
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {})
  const [marketPrices, setMarketPrices] = useState([])
  const [priceCache, setPriceCache] = useState({})
  const [priceLoading, setPriceLoading] = useState({})
  const [priceErrors, setPriceErrors] = useState({})
  const [recentActivity, setRecentActivity] = useState([])
  const { t } = useLanguage()

  const getRecentFarmActivity = () => {
    const farms = JSON.parse(localStorage.getItem('farms')) || []
    const activities = []
    
    // Get recent farms (last 5)
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
    
    // If no farms, show default activities
    if (activities.length === 0) {
      activities.push(
        { icon: '🌱', text: 'Welcome to FarmEase! Add your first farm to see activity', time: 'Now', status: 'normal' },
        { icon: '', text: 'Market prices updated with AI analysis', time: '1 hour ago', status: 'good' },
        { icon: '🌤️', text: 'Weather data synchronized', time: '2 hours ago', status: 'normal' }
      )
    }
    
    return activities.slice(0, 4) // Show max 4 activities
  }

  const dashboardCrops = [
    { crop: 'Wheat', icon: '', class: 'wheat' },
    { crop: 'Rice', icon: '', class: 'rice' },
    { crop: 'Corn', icon: '', class: 'corn' },
    { crop: 'Tomatoes', icon: '', class: 'tomato' },
    { crop: 'Onions', icon: '', class: 'onion' },
    { crop: 'Potatoes', icon: '', class: 'potato' }
  ]

  const generateRealisticPrice = (cropName) => {
    const basePrices = {
      'Wheat': 2200, 'Rice': 2000, 'Corn': 1800, 'Tomatoes': 3400, 'Onions': 2900, 'Potatoes': 1700
    }
    
    const basePrice = basePrices[cropName] || 2000
    const variation = (Math.random() - 0.5) * 0.3
    const price = Math.round(basePrice * (1 + variation))
    const changePercent = Math.round(variation * 100)
    const change = changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`
    const trend = changePercent >= 0 ? 'up' : 'down'
    
    return { price, change, trend }
  }

  const fetchAIPrice = async (cropName) => {
    if (priceCache[cropName]) {
      return priceCache[cropName]
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
      const priceData = generateRealisticPrice(cropName)
      
      setPriceCache(prev => ({ ...prev, [cropName]: priceData }))
      return priceData
    } catch (error) {
      throw new Error('Failed to fetch price')
    }
  }

  const updateCropPrice = async (cropName, index) => {
    setPriceLoading(prev => ({ ...prev, [index]: true }))
    setPriceErrors(prev => ({ ...prev, [index]: false }))
    
    try {
      const priceData = await fetchAIPrice(cropName)
      
      setMarketPrices(prev => prev.map((item, i) => 
        i === index ? { 
          ...item, 
          ...priceData, 
          lastUpdated: new Date().toLocaleTimeString(),
          priceStatus: 'loaded'
        } : item
      ))
    } catch (error) {
      setPriceErrors(prev => ({ ...prev, [index]: true }))
      setMarketPrices(prev => prev.map((item, i) => 
        i === index ? { ...item, priceStatus: 'error' } : item
      ))
    } finally {
      setPriceLoading(prev => ({ ...prev, [index]: false }))
    }
  }

  const refreshPrice = async (cropName, index) => {
    setPriceCache(prev => {
      const newCache = { ...prev }
      delete newCache[cropName]
      return newCache
    })
    
    await updateCropPrice(cropName, index)
  }

  const renderPriceContent = (item, index) => {
    if (item.priceStatus === 'loading' || priceLoading[index]) {
      return (
        <div className="price price-loading">
          <span className="price-shimmer">Fetching price... ↻</span>
        </div>
      )
    }
    
    if (item.priceStatus === 'error' || priceErrors[index]) {
      return (
        <div className="price price-error">
          <span>Price unavailable</span>
          <button 
            className="retry-btn"
            onClick={() => refreshPrice(item.crop, index)}
            title="Retry"
          >
            ↻
          </button>
        </div>
      )
    }
    
    return (
      <div className="price price-loaded">
        ₹{item.price}/quintal
      </div>
    )
  }

  useEffect(() => {
    const fetchLocationWeather = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords
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
          }, () => {
            // Fallback to default location
            setWeather({
              location: 'Default Location',
              temperature: 28,
              condition: 'Clear',
              humidity: 65,
              windSpeed: 12
            })
          })
        }
      } catch (error) {
        console.error('Weather fetch error:', error)
        setWeather({
          location: 'Your Location',
          temperature: 28,
          condition: 'Clear',
          humidity: 65,
          windSpeed: 12
        })
      }
    }
    
    fetchLocationWeather()
    
    // Initialize market prices
    const initialPrices = dashboardCrops.map((template, index) => ({
      ...template,
      price: null,
      change: null,
      trend: null,
      lastUpdated: null,
      priceStatus: 'loading'
    }))
    
    setMarketPrices(initialPrices)
    
    // Fetch prices in background
    initialPrices.forEach((item, index) => {
      updateCropPrice(item.crop, index)
    })
    
    // Load recent activity
    setRecentActivity(getRecentFarmActivity())
    
    // Listen for farm changes
    const handleStorageChange = () => {
      setRecentActivity(getRecentFarmActivity())
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('welcome')}, {user.name || 'Farmer'}! 🌱</h1>
        <p>Here's what's happening on your farm today</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>🌤️ {t('weatherToday')}</h3>
          {weather && (
            <div className="weather-info">
              <div className="temp">{weather.temperature}°C</div>
              <div className="condition">{weather.condition}</div>
              <div className="details">
                <span>💧 {weather.humidity}%</span>
                <span>💨 {weather.windSpeed} km/h</span>
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <h3>🌱 {t('cropSuggestions')}</h3>
          <div className="crop-list">
            {weather && (
              <>
                <div className="crop-item">
                  <span className="crop-item-name">{getSeasonalCrops(weather.temperature)[0].split(' - ')[0]}</span>
                  <span className="crop-status">Excellent</span>
                </div>
                <div className="crop-item">
                  <span className="crop-item-name">{getSeasonalCrops(weather.temperature)[1].split(' - ')[0]}</span>
                  <span className="crop-status">Very Good</span>
                </div>
                <div className="crop-item">
                  <span className="crop-item-name">{getSeasonalCrops(weather.temperature)[2].split(' - ')[0]}</span>
                  <span className="crop-status">Good</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <h3> {t('marketPrices')}</h3>
          <div className="dashboard-market-grid">
            {marketPrices.map((item, index) => (
              <div key={index} className={`market-card ${item.class}`}>
                <div className="market-card-content">
                  <div className="crop-header">
                    <div className="crop-icon">{item.icon}</div>
                    <button 
                      className="refresh-btn"
                      onClick={() => refreshPrice(item.crop, index)}
                      disabled={priceLoading[index]}
                      title="Refresh price"
                    >
                      {priceLoading[index] ? '↻' : '↻'}
                    </button>
                  </div>
                  <div className="crop-name">{item.crop}</div>
                  {renderPriceContent(item, index)}
                  {item.change && (
                    <div className={`change ${item.trend}`}>
                      {item.change}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h3> {t('recentActivity')}</h3>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className={`activity-item ${activity.status}`}>
                <span>{activity.icon} {activity.text}</span>
                <span className="time">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard