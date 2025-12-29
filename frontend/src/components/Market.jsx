import { useState, useMemo, useCallback } from 'react'
import { Search, MapPin, TrendingUp, TrendingDown, LayoutGrid, Table, RefreshCw } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useLocation } from '../LocationContext'
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// CROP IMAGES MAPPING
const CROP_IMAGES = {
  'Wheat': '/wheat.jpeg',
  'Jowar': '/jowar.webp',
  'Maize': '/corn.jpg',
  'Corn': '/corn.jpg',
  'Rice': '/rice.jpg',
  'Paddy': '/rice.jpg',
  'Bajra': '/bajra.jpg',
  'Ragi': '/ragi.webp',
  'Arhar Dal': '/Arhar_Dal.webp',
  'Chana Dal': '/Chana_Dal.webp',
  'Moong Dal': '/Moong_Dal.jpg',
  'Chilli': '/tomato.jpeg',
  'Turmeric': '/Mustard.jpg',
  'Mustard': '/Mustard.jpg',
  'Onion': '/onions.avif',
  'Tomato': '/tomato.jpeg',
  'Potato': '/potato.jpg',
  'Cabbage': '/cabbage.jpeg',
  'Cauliflower': '/Cauliflower.jpg',
  'Banana': '/Bananas.jpg',
  'Mango': '/Mangoes.jpg',
  'Apple': '/Apples.jpeg',
  'Orange': '/Oranges.jpg',
  'Cotton': '/cotton.jpg',
  'Groundnut': '/Groundnut.jpg',
  'Sunflower': '/Sunflower.jpg',
  'Jute': '/Jute.jpg',
  'Sugarcane': '/sugercane.jpg',
  'Coffee': '/coffee.jpeg',
  'Tea': '/tea.jpg',
  'Rubber': '/Rubber.jpg'
}

const Market = () => {
  const { location: userLocation, markets: marketData, loading: isLoading, error, detectLocation: refetch } = useLocation()

  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')

  const getImageForCommodity = useCallback((commodity) => {
    return CROP_IMAGES[commodity] || '/wheat.jpeg'
  }, [])

  const filteredData = useMemo(() => {
    if (!Array.isArray(marketData)) return []
    if (!searchTerm) return marketData

    const lower = searchTerm.toLowerCase()
    return marketData.filter(item =>
      item.commodity?.toLowerCase().includes(lower) ||
      item.market?.toLowerCase().includes(lower) ||
      item.variety?.toLowerCase().includes(lower)
    )
  }, [marketData, searchTerm])

  // Debug logging
  console.log('Market component state:', {
    userLocation,
    currentCity,
    marketDataLength: marketData?.length,
    isLoading,
    isError,
    error: error?.message
  })

  // Show location status in UI for debugging
  if (!userLocation) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-4">📍</div>
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Location Required</h2>
          <p className="text-yellow-700 mb-4">
            We need your location to show nearby market prices. Please allow location access or wait for detection to complete.
          </p>
          <button
            onClick={handleUseLocation}
            disabled={isLocating}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
          >
            {isLocating ? 'Detecting Location...' : 'Enable Location'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📈 Market Prices
            <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
              Live Updates
            </span>
          </h1>
          <p className="text-gray-500 text-sm">Real-time Mandi rates based on your location</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Card View"
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
            title="List View"
          >
            <Table size={20} />
          </button>
        </div>
      </div>

      {/* Smart Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Location Display */}
          <div className="flex gap-3 flex-1">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2 w-full md:w-auto">
              <MapPin size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {userLocation?.city || 'Unknown Location'}, {userLocation?.state || ''}
              </span>
              {userLocation?.source === 'ip' && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full ml-2">
                  IP Detected
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search commodity..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Map Section */}
      {filteredData.length > 0 && userLocation?.lat && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-64 z-0">
          <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={9}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User Location Marker */}
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>You are here</Popup>
            </Marker>

            {filteredData.map((item, idx) => (
              (item.lat || item.latitude) && (item.lng || item.longitude) && (
                <Marker key={`${item.id}-${idx}`} position={[item.lat || item.latitude, item.lng || item.longitude]}>
                  <Popup>
                    <div className="text-sm font-sans">
                      <strong className="block text-green-700">{item.market}</strong>
                      {item.commodity}: ₹{item.modal_price}
                      <br />
                      <span className="text-xs text-gray-500">{item.distanceKm} km away</span>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-medium">Error loading market data</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-100">
              <div className="h-32 bg-gray-100 rounded-t-xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                <div className="h-6 bg-gray-100 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredData.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="relative h-64 rounded-2xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
                  {/* Full Background Image */}
                  <img
                    src={getImageForCommodity(item.commodity)}
                    alt={item.commodity}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = '/wheat.jpeg'
                    }}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>

                  {/* Content */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                      <span className="bg-black/30 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-medium">
                        {item.market}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${item.trend === 'up' ? 'bg-green-500/80' :
                        item.trend === 'down' ? 'bg-red-500/80' :
                          'bg-gray-500/80'
                        } backdrop-blur-sm`}>
                        {item.trend === 'up' ? <TrendingUp size={12} /> :
                          item.trend === 'down' ? <TrendingDown size={12} /> : '📊'}
                        {item.trend === 'up' ? 'Rising' :
                          item.trend === 'down' ? 'Falling' : 'Stable'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold mb-1 shadow-sm">{item.commodity}</h3>
                      <p className="text-gray-300 text-sm mb-3">{item.variety}</p>

                      <div className="flex items-end justify-between border-t border-white/20 pt-3">
                        <div>
                          <p className="text-xs text-gray-400">Modal Price</p>
                          <p className="text-xl font-bold">₹{item.modal_price?.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Distance</p>
                          <p className="text-sm font-medium">{item.distanceKm} km</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-gray-700">Commodity</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Market</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Distance</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Modal Price</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredData.map((item, idx) => (
                      <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getImageForCommodity(item.commodity)}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = '/wheat.jpeg'
                              }}
                            />
                            <div>
                              <div className="font-medium text-gray-900">{item.commodity}</div>
                              <div className="text-xs text-gray-500">{item.variety}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{item.market}</td>
                        <td className="px-6 py-4 text-gray-600">{item.distanceKm} km</td>
                        <td className="px-6 py-4 font-bold text-gray-900">₹{item.modal_price?.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 ${item.trend === 'up' ? 'text-green-600' :
                            item.trend === 'down' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                            {item.trend === 'up' ? <TrendingUp size={16} /> :
                              item.trend === 'down' ? <TrendingDown size={16} /> : '📊'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!isLoading && !error && filteredData.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No market data found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? `No results for "${searchTerm}"` : `No markets found near your location.`}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Market