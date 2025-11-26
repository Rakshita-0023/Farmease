import { useState, useEffect } from 'react'
import './MarketMap.css'
import './WeatherEnhancements.css'

const MarketMap = ({ userLocation }) => {
  const [nearbyMarkets, setNearbyMarkets] = useState([])
  const [selectedMarket, setSelectedMarket] = useState(null)
  const [sortBy, setSortBy] = useState('distance')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    wholesale: false,
    mandi: false,
    government: false,
    private: false
  })
  const [favorites, setFavorites] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalMarket, setModalMarket] = useState(null)

  const calculateDrivingDistance = async (userLat, userLng, marketLat, marketLng) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${marketLng},${marketLat}?overview=false`
      )
      const data = await response.json()
      if (data.routes && data.routes[0]) {
        const distanceKm = (data.routes[0].distance / 1000).toFixed(1)
        const durationMin = Math.round(data.routes[0].duration / 60)
        return { distance: parseFloat(distanceKm), duration: durationMin }
      }
    } catch (error) {
      console.log('Routing API unavailable, using straight-line distance')
    }
    // Fallback to straight-line distance
    const R = 6371 // Earth's radius in km
    const dLat = (marketLat - userLat) * Math.PI / 180
    const dLng = (marketLng - userLng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLat * Math.PI / 180) * Math.cos(marketLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = (R * c).toFixed(1)
    return { distance: parseFloat(distance), duration: Math.round(parseFloat(distance) * 3) }
  }

  const generateNearbyMarkets = async (location) => {
    const baseMarkets = [
      {
        id: 1,
        name: 'Central Mandi',
        lat: location.latitude + 0.02,
        lng: location.longitude + 0.01,
        type: 'mandi',
        ownership: 'government',
        hours: '6:00 AM - 8:00 PM',
        crowdLevel: 'medium',
        crops: {
          'Wheat': { price: 2200, trend: 'up', change: '+5%' },
          'Rice': { price: 2000, trend: 'down', change: '-2%' },
          'Tomatoes': { price: 3400, trend: 'up', change: '+8%' }
        }
      },
      {
        id: 2,
        name: 'Farmers Market',
        lat: location.latitude - 0.03,
        lng: location.longitude + 0.02,
        type: 'retail',
        ownership: 'private',
        hours: '7:00 AM - 6:00 PM',
        crowdLevel: 'low',
        crops: {
          'Wheat': { price: 2150, trend: 'up', change: '+3%' },
          'Onions': { price: 2900, trend: 'down', change: '-4%' },
          'Potatoes': { price: 1700, trend: 'up', change: '+6%' }
        }
      },
      {
        id: 3,
        name: 'Wholesale Market',
        lat: location.latitude + 0.05,
        lng: location.longitude - 0.03,
        type: 'wholesale',
        ownership: 'private',
        hours: '5:00 AM - 10:00 PM',
        crowdLevel: 'high',
        crops: {
          'Rice': { price: 1950, trend: 'up', change: '+1%' },
          'Corn': { price: 1800, trend: 'down', change: '-3%' },
          'Tomatoes': { price: 3200, trend: 'up', change: '+4%' }
        }
      }
    ]
    
    // Calculate real driving distances
    const marketsWithDistances = await Promise.all(
      baseMarkets.map(async (market) => {
        const { distance, duration } = await calculateDrivingDistance(
          location.latitude, location.longitude, market.lat, market.lng
        )
        return {
          ...market,
          distance,
          distanceText: `${distance} km`,
          drivingTime: `${duration} min`
        }
      })
    )
    
    return marketsWithDistances
  }

  useEffect(() => {
    if (userLocation) {
      generateNearbyMarkets(userLocation).then(markets => {
        setNearbyMarkets(markets)
      })
    }
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteMarkets')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [userLocation])

  const handleMarketClick = (market) => {
    setModalMarket(market)
    setShowModal(true)
  }

  const toggleFavorite = (marketId) => {
    const newFavorites = favorites.includes(marketId)
      ? favorites.filter(id => id !== marketId)
      : [...favorites, marketId]
    setFavorites(newFavorites)
    localStorage.setItem('favoriteMarkets', JSON.stringify(newFavorites))
  }

  const openGoogleMaps = (market) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${market.lat},${market.lng}`
    window.open(url, '_blank')
  }

  const getBestMarketRecommendation = () => {
    if (nearbyMarkets.length === 0) return null
    // Simple algorithm: best price + reasonable distance
    const scored = nearbyMarkets.map(market => {
      const avgPrice = Object.values(market.crops).reduce((sum, crop) => sum + crop.price, 0) / Object.keys(market.crops).length
      const score = (1 / market.distance) * (3000 / avgPrice) // Higher score = better
      return { ...market, score }
    })
    return scored.sort((a, b) => b.score - a.score)[0]
  }

  const filteredAndSortedMarkets = nearbyMarkets
    .filter(market => {
      if (searchQuery && !market.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filters.wholesale && market.type !== 'wholesale') return false
      if (filters.mandi && market.type !== 'mandi') return false
      if (filters.government && market.ownership !== 'government') return false
      if (filters.private && market.ownership !== 'private') return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance
      if (sortBy === 'price') {
        const avgPriceA = Object.values(a.crops).reduce((sum, crop) => sum + crop.price, 0) / Object.keys(a.crops).length
        const avgPriceB = Object.values(b.crops).reduce((sum, crop) => sum + crop.price, 0) / Object.keys(b.crops).length
        return avgPriceA - avgPriceB
      }
      return 0
    })

  const bestMarket = getBestMarketRecommendation()

  return (
    <div className="market-map-enhanced">
      {/* Header with AI Insight */}
      <div className="map-header">
        <h2 className="section-title">🗺️ Market Finder</h2>
        <p className="section-subtitle">Discover the best markets for your crops</p>
        {bestMarket && (
          <div className="ai-insight">
            <span className="ai-badge">🤖 AI Recommendation</span>
            <p>Best market today: <strong>{bestMarket.name}</strong> - Great prices + close distance</p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="market-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search markets or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="sort-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="distance">Sort by Distance</option>
            <option value="price">Sort by Price</option>
          </select>
        </div>

        <div className="filter-controls">
          {Object.entries(filters).map(([key, value]) => (
            <label key={key} className="filter-checkbox">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setFilters(prev => ({ ...prev, [key]: e.target.checked }))}
              />
              <span className="filter-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Improved Map */}
      <div className="map-container-enhanced">
        <div className="map-view-enhanced">
          {/* User Location with Pulse Animation */}
          <div className="map-marker user-marker-enhanced">
            <div className="marker-icon user-enhanced">
              <div className="pulse-ring"></div>
              📌
            </div>
            <div className="marker-label-enhanced">Your Location</div>
          </div>

          {/* Market Markers */}
          {filteredAndSortedMarkets.map((market, index) => (
            <div
              key={market.id}
              className={`map-marker market-marker-enhanced ${favorites.includes(market.id) ? 'favorite' : ''}`}
              style={{
                top: `${25 + (index % 3) * 25}%`,
                left: `${20 + (index * 15) % 60}%`,
                animationDelay: `${index * 0.1}s`
              }}
              onClick={() => handleMarketClick(market)}
            >
              <div className="marker-icon market-enhanced">
                🏪
                <div className="marker-shadow"></div>
              </div>
              <div className="marker-label-enhanced">
                {market.name.length > 12 ? market.name.substring(0, 12) + '...' : market.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Market Cards */}
      <div className="markets-list-enhanced">
        {filteredAndSortedMarkets.map((market) => (
          <div
            key={market.id}
            className={`market-card-enhanced ${selectedMarket?.id === market.id ? 'selected' : ''}`}
            onClick={() => handleMarketClick(market)}
          >
            <div className="market-card-header">
              <div className="market-info-enhanced">
                <h4 className="market-name">{market.name}</h4>
                <div className="market-meta">
                  <span className="distance-badge">📍 {market.distanceText}</span>
                  {market.drivingTime && (
                    <span className="time-badge">🚗 {market.drivingTime}</span>
                  )}
                  <span className={`crowd-badge crowd-${market.crowdLevel}`}>
                    {market.crowdLevel === 'low' ? '🟢' : market.crowdLevel === 'medium' ? '🟡' : '🔴'} 
                    {market.crowdLevel} crowd
                  </span>
                </div>
              </div>
              <button 
                className={`favorite-btn ${favorites.includes(market.id) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(market.id)
                }}
              >
                {favorites.includes(market.id) ? '❤️' : '🤍'}
              </button>
            </div>
            
            <div className="market-preview">
              <div className="price-preview">
                {Object.entries(market.crops).slice(0, 2).map(([crop, data]) => (
                  <div key={crop} className="price-item">
                    <span className="crop">{crop}</span>
                    <span className="price">₹{data.price}</span>
                    <span className={`trend-indicator ${data.trend}`}>
                      {data.trend === 'up' ? '📈' : '📉'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Market Detail Modal */}
      {showModal && modalMarket && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="market-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMarket.name}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="modal-info">
                <div className="info-item">
                  <span className="info-label">📍 Distance:</span>
                  <span>{modalMarket.distanceText}</span>
                </div>
                {modalMarket.drivingTime && (
                  <div className="info-item">
                    <span className="info-label">🚗 Driving Time:</span>
                    <span>{modalMarket.drivingTime}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">🕒 Hours:</span>
                  <span>{modalMarket.hours}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">👥 Crowd Level:</span>
                  <span className={`crowd-level ${modalMarket.crowdLevel}`}>
                    {modalMarket.crowdLevel.charAt(0).toUpperCase() + modalMarket.crowdLevel.slice(1)}
                  </span>
                </div>
              </div>

              <div className="modal-prices">
                <h4>Current Crop Prices</h4>
                {Object.entries(modalMarket.crops).map(([crop, data]) => (
                  <div key={crop} className="price-row-modal">
                    <span className="crop-name">{crop}</span>
                    <span className="price">₹{data.price}/quintal</span>
                    <span className={`trend ${data.trend}`}>
                      {data.change} {data.trend === 'up' ? '📈' : '📉'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button 
                  className="action-btn primary"
                  onClick={() => openGoogleMaps(modalMarket)}
                >
                  🗺️ Navigate on Google Maps
                </button>
                <button 
                  className={`action-btn ${favorites.includes(modalMarket.id) ? 'favorited' : 'secondary'}`}
                  onClick={() => toggleFavorite(modalMarket.id)}
                >
                  {favorites.includes(modalMarket.id) ? '❤️ Saved' : '🤍 Save as Favorite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketMap