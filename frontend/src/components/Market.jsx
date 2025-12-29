import { useState, useMemo, useCallback, useEffect } from 'react'
import { Search, MapPin, TrendingUp, TrendingDown, LayoutGrid, Table, RefreshCw, ArrowLeft, ChevronRight } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useLocation } from '../LocationContext'
import { apiClient } from '../config'
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
  'Red Chilli': '/tomato.jpeg',
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
  'Rubber': '/Rubber.jpg',
  'Brinjal': '/tomato.jpeg',
  'Papaya': '/Bananas.jpg',
  'Pomegranate': '/Apples.jpeg',
  'Soybean': '/Groundnut.jpg'
}

const Market = () => {
  const { location: userLocation, allCities, loading: isLocLoading, error: locError, updateLocation, detectLocation } = useLocation()

  // REQUIRED STATE MODEL (NON-NEGOTIABLE)
  const [marketViewMode, setMarketViewMode] = useState('NEARBY_CITIES') // 'NEARBY_CITIES' | 'CITY_DETAIL'
  const [activeCity, setActiveCity] = useState(null)
  const [nearbyCities, setNearbyCities] = useState([])
  const [cityMarkets, setCityMarkets] = useState([])

  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [showCitySelector, setShowCitySelector] = useState(false)

  const getImageForCommodity = useCallback((commodity) => {
    return CROP_IMAGES[commodity] || '/wheat.jpeg'
  }, [])

  // Fetch nearby cities when user location is available
  const fetchNearbyCities = useCallback(async () => {
    if (!userLocation?.latitude || !userLocation?.longitude) return
    
    setIsLoading(true)
    try {
      console.log('📊 Fetching nearby cities for:', userLocation.city)
      const data = await apiClient.get(`/market/cities?lat=${userLocation.latitude}&lng=${userLocation.longitude}`)
      console.log('📊 Received nearby cities:', data)
      setNearbyCities(data || [])
      setMarketViewMode('NEARBY_CITIES')
    } catch (err) {
      console.error('❌ Failed to fetch nearby cities:', err)
      setNearbyCities([])
    } finally {
      setIsLoading(false)
    }
  }, [userLocation])

  // Fetch city details when a city is selected
  const handleCitySelect = async (cityName) => {
    console.log('🏙️ City selected:', cityName)
    setActiveCity(cityName)
    setMarketViewMode('CITY_DETAIL')
    setIsLoading(true)
    
    try {
      const data = await apiClient.get(`/market/city/${encodeURIComponent(cityName)}`)
      console.log('🏪 Received city markets:', data)
      setCityMarkets(data.markets || [])
    } catch (err) {
      console.error('❌ Failed to fetch city details:', err)
      setCityMarkets([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load nearby cities when location changes
  useEffect(() => {
    if (userLocation && marketViewMode === 'NEARBY_CITIES') {
      fetchNearbyCities()
    }
  }, [userLocation, fetchNearbyCities, marketViewMode])

  // Filter data based on search term
  const filteredCities = useMemo(() => {
    if (!searchTerm) return nearbyCities
    const lower = searchTerm.toLowerCase()
    return nearbyCities.filter(city =>
      city.city.toLowerCase().includes(lower) ||
      city.state.toLowerCase().includes(lower) ||
      city.majorCrops.some(crop => crop.toLowerCase().includes(lower))
    )
  }, [nearbyCities, searchTerm])

  const filteredMarkets = useMemo(() => {
    if (!searchTerm) return cityMarkets
    const lower = searchTerm.toLowerCase()
    return cityMarkets.filter(market =>
      market.commodity.toLowerCase().includes(lower) ||
      market.variety.toLowerCase().includes(lower) ||
      market.name.toLowerCase().includes(lower)
    )
  }, [cityMarkets, searchTerm])

  // Show loading state during location detection
  if (isLocLoading && !userLocation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="animate-spin text-green-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Detecting your location...</p>
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
          <p className="text-gray-500 text-sm">
            {marketViewMode === 'NEARBY_CITIES' 
              ? 'Cities with agricultural markets near you' 
              : `Markets and crops in ${activeCity}`
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Location Selector */}
          <button
            onClick={() => setShowCitySelector(!showCitySelector)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <MapPin size={16} className="text-green-600" />
            {userLocation?.city || 'Select Location'}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Table size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* City Selector Dropdown */}
      {showCitySelector && (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
            {allCities.map(city => (
              <button
                key={`${city.city}-${city.state}`}
                onClick={() => {
                  updateLocation({
                    city: city.city,
                    state: city.state,
                    latitude: city.latitude,
                    longitude: city.longitude,
                    source: 'manual'
                  })
                  setShowCitySelector(false)
                }}
                className="text-left px-3 py-2 rounded-lg hover:bg-green-50 text-sm transition-colors border border-transparent hover:border-green-100"
              >
                <div className="font-medium text-gray-800">{city.city}</div>
                <div className="text-xs text-gray-500">{city.state}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              detectLocation()
              setShowCitySelector(false)
            }}
            className="w-full py-2 text-center text-sm text-green-600 font-medium hover:underline border-t border-gray-100 pt-3"
          >
            📍 Auto-detect my location
          </button>
        </div>
      )}

      {/* Search and Navigation */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={marketViewMode === 'NEARBY_CITIES' ? "Search cities or crops..." : "Search markets or commodities..."}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {marketViewMode === 'CITY_DETAIL' && (
          <button
            onClick={() => {
              setMarketViewMode('NEARBY_CITIES')
              setActiveCity(null)
              setSearchTerm('')
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Cities
          </button>
        )}
        
        <button
          onClick={marketViewMode === 'NEARBY_CITIES' ? fetchNearbyCities : () => handleCitySelect(activeCity)}
          disabled={isLoading}
          className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-green-100"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Main Content */}
      {!userLocation ? (
        /* No Location Selected State */
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center max-w-2xl mx-auto mt-12">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Your Location</h2>
          <p className="text-gray-500 mb-8">
            Choose your city to view real-time market prices and agricultural data in your region.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allCities.slice(0, 9).map(city => (
              <button
                key={`${city.city}-${city.state}`}
                onClick={() => {
                  updateLocation({
                    city: city.city,
                    state: city.state,
                    latitude: city.latitude,
                    longitude: city.longitude,
                    source: 'manual'
                  })
                }}
                className="px-4 py-3 bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-xl text-sm font-semibold text-gray-700 transition-all"
              >
                {city.city}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCitySelector(true)}
            className="mt-8 text-green-600 font-bold hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            View all cities <ChevronRight size={18} />
          </button>
        </div>
      ) : marketViewMode === 'NEARBY_CITIES' ? (
        /* NEARBY CITIES VIEW */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <MapPin size={20} className="text-green-600" />
              Cities within 150km of {userLocation.city}
            </h2>
            {nearbyCities.length > 0 && (
              <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                {nearbyCities.length} cities found
              </span>
            )}
          </div>

          {/* Map showing nearby cities */}
          {nearbyCities.length > 0 && userLocation?.latitude && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-72 z-0">
              <MapContainer
                center={[userLocation.latitude, userLocation.longitude]}
                zoom={8}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[userLocation.latitude, userLocation.longitude]}>
                  <Popup>📍 You are here ({userLocation.city})</Popup>
                </Marker>
                {nearbyCities.map((city, idx) => (
                  <Marker key={idx} position={[userLocation.latitude + (Math.random() - 0.5) * 2, userLocation.longitude + (Math.random() - 0.5) * 2]}>
                    <Popup>
                      <div className="font-sans">
                        <p className="font-bold text-green-700">{city.city}</p>
                        <p className="text-sm">{city.distanceKm} km away</p>
                        <p className="text-xs text-gray-500">Avg: ₹{city.avgPrice}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}

          {/* Cities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
              ))
            ) : filteredCities.length > 0 ? (
              filteredCities.map(city => (
                <div
                  key={city.city}
                  onClick={() => handleCitySelect(city.city)}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                        {city.city}
                      </h3>
                      <p className="text-sm text-gray-500">{city.state} • {city.distanceKm} km away</p>
                    </div>
                    <div className={`p-2 rounded-full ${
                      city.trend === 'up' ? 'bg-green-50 text-green-600' : 
                      city.trend === 'down' ? 'bg-red-50 text-red-600' : 
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {city.trend === 'up' ? <TrendingUp size={20} /> : 
                       city.trend === 'down' ? <TrendingDown size={20} /> : 
                       <div className="w-5 h-5 bg-gray-400 rounded-full"></div>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {city.majorCrops.map(crop => (
                        <span key={crop} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-100">
                          {crop}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-end pt-3 border-t border-gray-50">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Avg Price</p>
                        <p className="text-lg font-bold text-gray-800">₹{city.avgPrice?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center text-green-600 text-sm font-medium group-hover:text-green-700">
                        View Markets <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">
                  {searchTerm ? `No cities found matching "${searchTerm}"` : 'No nearby cities found. Try selecting a different location.'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CITY DETAIL VIEW */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              🏪 Markets in {activeCity}
            </h2>
            {cityMarkets.length > 0 && (
              <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                {cityMarkets.length} commodities available
              </span>
            )}
          </div>

          {/* Markets Grid/Table */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                ))
              ) : filteredMarkets.length > 0 ? (
                filteredMarkets.map((market, idx) => (
                  <div key={idx} className="relative h-64 rounded-2xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <img
                      src={getImageForCommodity(market.commodity)}
                      alt={market.commodity}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = '/wheat.jpeg'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
                    <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                      <div className="flex justify-between items-start">
                        <span className="bg-black/30 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-medium">
                          {market.name}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                          market.trend === 'up' ? 'bg-green-500/80' : 
                          market.trend === 'down' ? 'bg-red-500/80' : 
                          'bg-gray-500/80'
                        }`}>
                          {market.trend === 'up' ? 'Rising' : 
                           market.trend === 'down' ? 'Falling' : 
                           'Stable'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{market.commodity}</h3>
                        <p className="text-gray-300 text-sm mb-3">{market.variety}</p>
                        <div className="flex items-end justify-between border-t border-white/20 pt-3">
                          <div>
                            <p className="text-xs text-gray-400">Modal Price</p>
                            <p className="text-xl font-bold">₹{market.modal_price?.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Range</p>
                            <p className="text-xs">₹{market.min_price} - ₹{market.max_price}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium">
                    {searchTerm ? `No markets found matching "${searchTerm}"` : `No market data available for ${activeCity}`}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700">Commodity</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Variety</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Modal Price</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Range</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMarkets.map((market, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageForCommodity(market.commodity)}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = '/wheat.jpeg'
                            }}
                          />
                          <div className="font-medium text-gray-900">{market.commodity}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{market.variety}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{market.modal_price?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-600">₹{market.min_price} - ₹{market.max_price}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 ${
                          market.trend === 'up' ? 'text-green-600' :
                          market.trend === 'down' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {market.trend === 'up' ? <TrendingUp size={16} /> :
                           market.trend === 'down' ? <TrendingDown size={16} /> : 
                           <div className="w-4 h-4 bg-gray-400 rounded-full"></div>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {locError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-medium">Location Error</p>
          <p className="text-sm">{locError}</p>
          <button
            onClick={detectLocation}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

export default Market