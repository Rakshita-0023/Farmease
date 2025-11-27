import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './WeatherEnhancements.css'

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icons
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTYgNDhMMjYuNjYgMjBDMjguODcgMTYuNSAzMCAxMi41IDMwIDhDMzAgMy41OCAyNi40MiAwIDIyIDBIMTBDNS41OCAwIDIgMy41OCAyIDhDMiAxMi41IDMuMTMgMTYuNSA1LjM0IDIwTDE2IDQ4WiIgZmlsbD0iIzAwN0JGRiIvPgogIDx0ZXh0IHg9IjE2IiB5PSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIj7wn5OMPC90ZXh0Pgo8L3N2Zz4K',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48]
})

const marketIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTYgNDhMMjYuNjYgMjBDMjguODcgMTYuNSAzMCAxMi41IDMwIDhDMzAgMy41OCAyNi40MiAwIDIyIDBIMTBDNS41OCAwIDIgMy41OCAyIDhDMiAxMi41IDMuMTMgMTYuNSA1LjM0IDIwTDE2IDQ4WiIgZmlsbD0iIzI4QTc0NSIvPgogIDx0ZXh0IHg9IjE2IiB5PSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIj7wn4+qPC90ZXh0Pgo8L3N2Zz4K',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48]
})

const InteractiveMarketMap = ({ userLocation }) => {
  const [nearbyMarkets, setNearbyMarkets] = useState([])
  const [selectedMarket, setSelectedMarket] = useState(null)

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
  }, [userLocation])

  const openGoogleMaps = (market) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${market.lat},${market.lng}`
    window.open(url, '_blank')
  }

  if (!userLocation) {
    return (
      <div className="map-placeholder" role="alert">
        <p>📍 Enable location access to see nearby markets</p>
        <button 
          onClick={() => window.location.reload()} 
          className="retry-btn"
          aria-label="Retry loading location"
        >
          🔄 Retry
        </button>
      </div>
    )
  }

  return (
    <div className="interactive-market-map">
      <div className="map-header">
        <h2>🗺️ Interactive Market Map</h2>
        <p>Real geographic view of markets near you</p>
      </div>

      <div className="leaflet-map-container">
        <MapContainer
          center={[userLocation.latitude, userLocation.longitude]}
          zoom={12}
          style={{ height: '400px', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User Location Marker */}
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]} 
            icon={userIcon}
          >
            <Popup>
              <div className="popup-content">
                <h4>📍 Your Location</h4>
                <p>This is where you are</p>
              </div>
            </Popup>
          </Marker>

          {/* Market Markers */}
          {nearbyMarkets.map((market) => (
            <Marker
              key={market.id}
              position={[market.lat, market.lng]}
              icon={marketIcon}
              eventHandlers={{
                click: () => setSelectedMarket(market)
              }}
            >
              <Popup>
                <div className="market-popup">
                  <h4>🏪 {market.name}</h4>
                  <div className="popup-details">
                    <p><strong>📍 Distance:</strong> {market.distanceText}</p>
                    {market.drivingTime && (
                      <p><strong>🚗 Drive Time:</strong> {market.drivingTime}</p>
                    )}
                    <p><strong>🕒 Hours:</strong> {market.hours}</p>
                    <p><strong>👥 Crowd:</strong> {market.crowdLevel}</p>
                  </div>
                  
                  <div className="popup-prices">
                    <h5>Current Prices:</h5>
                    {Object.entries(market.crops).slice(0, 2).map(([crop, data]) => (
                      <div key={crop} className="price-item-popup">
                        <span>{crop}: ₹{data.price}</span>
                        <span className={`trend ${data.trend}`}>
                          {data.change} {data.trend === 'up' ? '📈' : '📉'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button 
                    className="navigate-btn"
                    onClick={() => openGoogleMaps(market)}
                  >
                    🗺️ Navigate
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Market List Below Map */}
      <div className="markets-list-below">
        <h3>📋 Nearby Markets</h3>
        <div className="markets-grid">
          {nearbyMarkets.map((market) => (
            <div
              key={market.id}
              className={`market-card-compact ${selectedMarket?.id === market.id ? 'selected' : ''}`}
              onClick={() => setSelectedMarket(market)}
            >
              <div className="market-header-compact">
                <h4>{market.name}</h4>
                <div className="market-badges">
                  <span className="distance-badge">📍 {market.distanceText}</span>
                  {market.drivingTime && (
                    <span className="time-badge">🚗 {market.drivingTime}</span>
                  )}
                </div>
              </div>
              
              <div className="market-preview-compact">
                {Object.entries(market.crops).slice(0, 2).map(([crop, data]) => (
                  <div key={crop} className="price-preview-item">
                    <span className="crop-name">{crop}</span>
                    <span className="price">₹{data.price}</span>
                    <span className={`trend-indicator ${data.trend}`}>
                      {data.trend === 'up' ? '📈' : '📉'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default InteractiveMarketMap