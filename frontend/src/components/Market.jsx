import { useState, useMemo, useCallback, useEffect } from 'react'
import { Search, MapPin, TrendingUp, TrendingDown, LayoutGrid, Table, RefreshCw, ArrowLeft, ChevronRight, Filter } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
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

// Helper to update map center
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

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
  const {
    location: userLocation,
    markets: currentMarkets,
    allCities,
    loading: isLocLoading,
    error: locError,
    updateLocation,
    detectLocation
  } = useLocation()

  const [view, setView] = useState('nearby-cities') // 'nearby-cities' | 'city-detail'
  const [selectedCity, setSelectedCity] = useState(null)
  const [nearbyCities, setNearbyCities] = useState([])
  const [cityMarkets, setCityMarkets] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [showCitySelector, setShowCitySelector] = useState(false)

  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await apiClient.get(`/market/search?q=${encodeURIComponent(searchTerm)}`)
        setSearchResults(results || [])
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  // Fetch nearby cities on mount or location change
  const fetchNearbyCities = useCallback(async () => {
    if (!userLocation) return
    setIsLoading(true)
    try {
      const data = await apiClient.get(`/market/cities?lat=${userLocation.latitude}&lng=${userLocation.longitude}`)
      setNearbyCities(data || [])
    } catch (err) {
      console.error('Failed to fetch nearby cities:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userLocation])

  useEffect(() => {
    fetchNearbyCities()
  }, [fetchNearbyCities])

  // Fetch details when a city is selected
  const handleCitySelect = async (city) => {
    setSelectedCity(city)
    setView('city-detail')
    setIsLoading(true)
    try {
      const data = await apiClient.get(`/market/city/${encodeURIComponent(city)}`)
      setCityMarkets(data.markets || [])
    } catch (err) {
      console.error('Failed to fetch city details:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getImageForCommodity = (commodity) => {
    return CROP_IMAGES[commodity] || '/wheat.jpeg'
  }

  const filteredCities = useMemo(() => {
    if (!searchTerm) return nearbyCities
    const lower = searchTerm.toLowerCase()
    return nearbyCities.filter(c =>
      c.city.toLowerCase().includes(lower) ||
      c.majorCrops.some(crop => crop.toLowerCase().includes(lower))
    )
  }, [nearbyCities, searchTerm])

  const filteredMarkets = useMemo(() => {
    if (!searchTerm) return cityMarkets
    const lower = searchTerm.toLowerCase()
    return cityMarkets.filter(m =>
      m.commodity.toLowerCase().includes(lower) ||
      m.name.toLowerCase().includes(lower)
    )
  }, [cityMarkets, searchTerm])

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
            {view === 'nearby-cities' ? 'Prices in cities near you' : `Markets in ${selectedCity}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCitySelector(!showCitySelector)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <MapPin size={16} className="text-green-600" />
            {userLocation?.city || 'Select City'}
          </button>

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
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 animate-in fade-in slide-in-from-top-2">
          {allCities.map(c => (
            <button
              key={c.city}
              onClick={() => {
                updateLocation(c)
                setShowCitySelector(false)
                handleCitySelect(c.city)
              }}
              className="text-left px-3 py-2 rounded-lg hover:bg-green-50 text-sm transition-colors border border-transparent hover:border-green-100"
            >
              <div className="font-medium text-gray-800">{c.city}</div>
              <div className="text-xs text-gray-500">{c.state}</div>
            </button>
          ))}
          <button
            onClick={detectLocation}
            className="col-span-full mt-2 py-2 text-center text-sm text-green-600 font-medium hover:underline"
          >
            Auto-detect my location
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={view === 'nearby-cities' ? "Search city or crop..." : "Search market or crop..."}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {view === 'city-detail' && (
          <button
            onClick={() => {
              setView('nearby-cities')
              setSelectedCity(null)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Cities
          </button>
        )}
        <button
          onClick={view === 'nearby-cities' ? fetchNearbyCities : () => handleCitySelect(selectedCity)}
          disabled={isLoading}
          className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-green-100"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Main Content */}
      {!userLocation ? (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center max-w-2xl mx-auto mt-12">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Your City</h2>
          <p className="text-gray-500 mb-8">
            Please select a city to view real-time market prices and agricultural insights in your region.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allCities.slice(0, 9).map(c => (
              <button
                key={c.city}
                onClick={() => {
                  updateLocation(c)
                  handleCitySelect(c.city)
                }}
                className="px-4 py-3 bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-xl text-sm font-semibold text-gray-700 transition-all"
              >
                {c.city}
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
      ) : searchTerm && searchTerm.length >= 2 ? (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Search size={20} className="text-green-600" />
            Search Results for "{searchTerm}"
          </h2>
          {isSearching ? (
            <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-green-600" size={32} /></div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((item, idx) => (
                <div key={idx} className="relative h-64 rounded-2xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <img
                    src={getImageForCommodity(item.commodity)}
                    alt={item.commodity}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
                  <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                      <span className="bg-black/30 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-medium">
                        {item.market}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{item.commodity}</h3>
                      <p className="text-gray-300 text-sm mb-3">{item.variety}</p>
                      <div className="flex items-end justify-between border-t border-white/20 pt-3">
                        <div>
                          <p className="text-xs text-gray-400">Modal Price</p>
                          <p className="text-xl font-bold">₹{item.modal_price.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">State</p>
                          <p className="text-xs">{item.state}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No results found for "{searchTerm}"</p>
            </div>
          )}
        </div>
      ) : view === 'nearby-cities' ? (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <MapPin size={20} className="text-green-600" />
            Cities within 150km
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
              ))
            ) : nearbyCities.length > 0 ? (
              nearbyCities.map(city => (
                <div
                  key={city.city}
                  onClick={() => handleCitySelect(city.city)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-700 transition-colors">{city.city}</h3>
                      <p className="text-sm text-gray-500">{city.state} • {city.distanceKm} km away</p>
                    </div>
                    <div className={`p-2 rounded-full ${city.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {city.trend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {city.majorCrops.map(crop => (
                        <span key={crop} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">
                          {crop}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-end pt-2 border-t border-gray-50">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Avg Price</p>
                        <p className="text-lg font-bold text-gray-800">₹{city.avgPrice.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center text-green-600 text-sm font-medium">
                        View Markets <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500">No cities found in this range. Try selecting a city manually.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Map View for City Markets */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-72 z-0">
            <MapContainer
              center={[userLocation.latitude, userLocation.longitude]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[userLocation.latitude, userLocation.longitude]}>
                <Popup>You are here</Popup>
              </Marker>
              {cityMarkets.map((m, idx) => (
                <Marker key={idx} position={[m.latitude || userLocation.latitude, m.longitude || userLocation.longitude]}>
                  <Popup>
                    <div className="font-sans">
                      <p className="font-bold text-green-700">{m.name}</p>
                      <p className="text-sm">{m.commodity}: ₹{m.modal_price}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Markets Grid/Table */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cityMarkets.map((item, idx) => (
                <div key={idx} className="relative h-64 rounded-2xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <img
                    src={getImageForCommodity(item.commodity)}
                    alt={item.commodity}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
                  <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                      <span className="bg-black/30 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-medium">
                        {item.name}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.trend === 'up' ? 'bg-green-500/80' : 'bg-red-500/80'} backdrop-blur-sm`}>
                        {item.trend === 'up' ? 'Rising' : 'Falling'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{item.commodity}</h3>
                      <p className="text-gray-300 text-sm mb-3">{item.variety}</p>
                      <div className="flex items-end justify-between border-t border-white/20 pt-3">
                        <div>
                          <p className="text-xs text-gray-400">Modal Price</p>
                          <p className="text-xl font-bold">₹{item.modal_price.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Range</p>
                          <p className="text-xs">₹{item.min_price} - ₹{item.max_price}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Commodity</th>
                    <th className="px-6 py-4 font-semibold">Market</th>
                    <th className="px-6 py-4 font-semibold">Modal Price</th>
                    <th className="px-6 py-4 font-semibold">Range</th>
                    <th className="px-6 py-4 font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cityMarkets.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium">{item.commodity}</td>
                      <td className="px-6 py-4 text-gray-600">{item.name}</td>
                      <td className="px-6 py-4 font-bold">₹{item.modal_price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-500">₹{item.min_price} - ₹{item.max_price}</td>
                      <td className="px-6 py-4">
                        {item.trend === 'up' ? <TrendingUp className="text-green-600" /> : <TrendingDown className="text-red-600" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Market