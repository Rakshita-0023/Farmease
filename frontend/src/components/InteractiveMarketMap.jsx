import { useState, useEffect, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './WeatherEnhancements.css'
import { useMarketComparison } from '../hooks/useMandiData'
import { MapPin, BarChart3, ChevronDown, RefreshCw, TrendingUp, TrendingDown, Navigation } from 'lucide-react'
import { useLocation } from '../LocationContext'

// Fix for default markers in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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

const InteractiveMarketMap = () => {
  const { location: userLocation } = useLocation()
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedCrop, setSelectedCrop] = useState('')
  const [selectedMarket, setSelectedMarket] = useState(null)

  // Fetch real comparison data from backend
  const { data: marketData = [], isLoading, refetch } = useMarketComparison(selectedCrop, selectedCity)

  const cities = ['Hyderabad', 'Vijayawada', 'Guntur', 'Warangal', 'Nizamabad', 'Kurnool']
  const crops = [
    'Wheat', 'Rice', 'Maize', 'Jowar', 'Bajra', 'Paddy', 'Ragi',
    'Tomato', 'Onion', 'Potato', 'Cabbage', 'Cauliflower',
    'Cotton', 'Groundnut', 'Sunflower', 'Turmeric', 'Chilli', 'Sugarcane',
    'Banana', 'Mango', 'Orange', 'Apple',
    'Arhar Dal', 'Chana Dal', 'Moong Dal', 'Mustard', 'Coffee', 'Tea', 'Rubber'
  ]

  // Calculate straight-line distance to user
  const getDistance = useCallback((lat, lng) => {
    if (!userLocation) return null
    const R = 6371
    const dLat = (lat - userLocation.latitude) * Math.PI / 180
    const dLng = (lng - userLocation.longitude) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return (R * c).toFixed(1)
  }, [userLocation])

  const groupedMarkets = useMemo(() => {
    if (!Array.isArray(marketData)) return []

    const groups = {}
    marketData.forEach(item => {
      const key = item.market
      if (!groups[key]) {
        groups[key] = {
          name: item.market,
          lat: item.lat,
          lng: item.lng,
          district: item.district,
          state: item.state,
          distance: getDistance(item.lat, item.lng),
          crops: []
        }
      }
      groups[key].crops.push(item)
    })

    return Object.values(groups).sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }, [marketData, getDistance])

  const openGoogleMaps = (market) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${market.lat},${market.lng}`
    window.open(url, '_blank')
  }

  // Auto-center logic
  const centerPos = useMemo(() => {
    if (selectedCity && groupedMarkets.length > 0) {
      return [groupedMarkets[0].lat, groupedMarkets[0].lng]
    }
    return userLocation ? [userLocation.latitude, userLocation.longitude] : [17.3850, 78.4867]
  }, [selectedCity, groupedMarkets, userLocation])

  const zoomLevel = selectedCity ? 11 : 8

  return (
    <div className="interactive-market-map space-y-6">
      <div className="map-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Navigation className="text-blue-600" />
            Interactive Market Map
          </h2>
          <p className="text-gray-500">Real geographic view of markets and prices</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          title="Refresh Data"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Comparison Filters Integrated into Map View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Filter by City</label>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value)
                setSelectedCrop('')
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
              <option value="">All Locations</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Filter by Crop</label>
          <div className="relative">
            <select
              value={selectedCrop}
              onChange={(e) => {
                setSelectedCrop(e.target.value)
                setSelectedCity('')
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
            >
              <option value="">All Crops</option>
              {crops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
            </select>
            <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      <div className="leaflet-map-container relative z-0">
        <MapContainer
          key={`${centerPos[0]}-${centerPos[1]}-${zoomLevel}`}
          center={centerPos}
          zoom={zoomLevel}
          style={{ height: '450px', width: '100%', borderRadius: '16px', border: '1px solid #e5e7eb' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userLocation && (
            <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
              <Popup>
                <div className="font-bold text-blue-600">📍 Your Location</div>
              </Popup>
            </Marker>
          )}

          {groupedMarkets.map((market) => (
            <Marker
              key={market.name}
              position={[market.lat, market.lng]}
              icon={marketIcon}
              eventHandlers={{ click: () => setSelectedMarket(market) }}
            >
              <Popup>
                <div className="p-2 min-w-[220px]">
                  <h4 className="font-bold text-gray-900 border-b pb-1 mb-2 flex justify-between items-center">
                    <span>🏪 {market.name}</span>
                    {market.distance && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{market.distance} km</span>}
                  </h4>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                    {market.crops.map(crop => (
                      <div key={crop.id} className="flex justify-between items-center text-xs border-b border-gray-50 pb-1 last:border-0">
                        <div>
                          <div className="font-bold text-gray-800">{crop.commodity}</div>
                          <div className="text-[10px] text-gray-400">{crop.variety}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-green-600">₹{crop.modal_price}</div>
                          <div className={`text-[9px] font-bold ${crop.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                            {crop.trend === 'up' ? '↑' : '↓'} {crop.trend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    onClick={() => openGoogleMaps(market)}
                  >
                    <Navigation size={12} /> Get Directions
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="markets-list-below">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-green-600" />
          Market Price Analysis
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-gray-300" size={32} />
          </div>
        ) : groupedMarkets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedMarkets.map((market) => (
              <div
                key={market.name}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedMarket?.name === market.name
                  ? 'border-blue-500 bg-blue-50/50 shadow-md'
                  : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'
                  }`}
                onClick={() => setSelectedMarket(market)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight">{market.name}</h4>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{market.district}, {market.state}</p>
                  </div>
                  {market.distance && (
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {market.distance} km
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Top Commodities</p>
                  <div className="flex flex-wrap gap-2">
                    {market.crops.slice(0, 3).map(crop => (
                      <div key={crop.id} className="bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-700">{crop.commodity}</span>
                        <span className="text-[10px] font-black text-green-600 ml-1">₹{crop.modal_price}</span>
                      </div>
                    ))}
                    {market.crops.length > 3 && (
                      <span className="text-[10px] text-gray-400 font-bold flex items-center">+{market.crops.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No results found for your selection</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InteractiveMarketMap