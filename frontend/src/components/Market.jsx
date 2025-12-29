import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Search, MapPin, TrendingUp, TrendingDown, LayoutGrid, Table,
  RefreshCw, ArrowLeft, ChevronRight, Filter, Info, AlertCircle,
  Zap, Map as MapIcon, BarChart3, Globe
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
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
  const {
    location: userLocation,
    allCities,
    loading: isLocLoading,
    error: locError,
    updateLocation,
    detectLocation
  } = useLocation()

  const [marketViewMode, setMarketViewMode] = useState('NEARBY_CITIES')
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

  const fetchNearbyCities = useCallback(async () => {
    if (!userLocation?.latitude || !userLocation?.longitude) return

    setIsLoading(true)
    try {
      const data = await apiClient.get(`/market/cities?lat=${userLocation.latitude}&lng=${userLocation.longitude}`)
      setNearbyCities(data || [])
      setMarketViewMode('NEARBY_CITIES')
    } catch (err) {
      console.error('❌ Failed to fetch nearby cities:', err)
      setNearbyCities([])
    } finally {
      setIsLoading(false)
    }
  }, [userLocation])

  const handleCitySelect = async (cityName) => {
    setActiveCity(cityName)
    setMarketViewMode('CITY_DETAIL')
    setIsLoading(true)

    try {
      const data = await apiClient.get(`/market/city/${encodeURIComponent(cityName)}`)
      setCityMarkets(data.markets || [])
    } catch (err) {
      console.error('❌ Failed to fetch city details:', err)
      setCityMarkets([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userLocation && marketViewMode === 'NEARBY_CITIES') {
      fetchNearbyCities()
    }
  }, [userLocation, fetchNearbyCities, marketViewMode])

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

  if (isLocLoading && !userLocation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
          <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-600" size={32} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Detecting Precision Location</h2>
          <p className="text-gray-500">Syncing with satellite data for local market accuracy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto min-h-screen bg-[#F9FAFB]/50">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-2xl shadow-green-900/5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-xl shadow-lg shadow-green-200">
                <Globe className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Global Market Hub
              </h1>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black uppercase tracking-widest rounded-full border border-green-200">
                Live
              </span>
            </div>
            <p className="text-gray-500 font-medium max-w-xl">
              {marketViewMode === 'NEARBY_CITIES'
                ? `Real-time agricultural intelligence for regions near ${userLocation?.city || 'you'}.`
                : `Comprehensive market breakdown and commodity pricing for ${activeCity}.`
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Location Pill */}
            <button
              onClick={() => setShowCitySelector(!showCitySelector)}
              className="group flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-800 hover:border-green-500 hover:shadow-xl hover:shadow-green-100 transition-all duration-300"
            >
              <div className="p-1.5 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                <MapPin size={18} />
              </div>
              <span className="truncate max-w-[120px]">{userLocation?.city || 'Select Location'}</span>
              <ChevronRight size={16} className={`text-gray-400 transition-transform duration-300 ${showCitySelector ? 'rotate-90' : ''}`} />
            </button>

            {/* View Toggle */}
            <div className="flex items-center p-1.5 bg-gray-100/50 backdrop-blur-md rounded-2xl border border-gray-200/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-white text-green-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'table' ? 'bg-white text-green-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Table size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Animated City Selector */}
        <AnimatePresence>
          {showCitySelector && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 p-6 bg-white/80 backdrop-blur-2xl rounded-3xl border border-white shadow-2xl relative z-20"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                {allCities.map(city => (
                  <button
                    key={`${city.name}-${city.state}`}
                    onClick={() => {
                      updateLocation({
                        city: city.name,
                        state: city.state,
                        latitude: city.latitude,
                        longitude: city.longitude,
                        source: 'manual'
                      })
                      setShowCitySelector(false)
                    }}
                    className="text-left p-4 rounded-2xl bg-gray-50/50 hover:bg-green-600 group transition-all duration-300 border border-transparent hover:border-green-400"
                  >
                    <div className="font-bold text-gray-800 group-hover:text-white transition-colors">{city.name}</div>
                    <div className="text-[10px] text-gray-400 group-hover:text-green-100 uppercase tracking-widest font-black transition-colors">{city.state}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  detectLocation()
                  setShowCitySelector(false)
                }}
                className="w-full py-4 rounded-2xl bg-green-50 text-green-700 font-bold hover:bg-green-100 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={18} className="fill-green-700" />
                Auto-detect Precise Location
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search and Navigation Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder={marketViewMode === 'NEARBY_CITIES' ? "Search cities, states, or crops..." : "Search markets, varieties, or commodities..."}
            className="w-full pl-14 pr-6 py-4 bg-white/60 backdrop-blur-md border border-white rounded-3xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 shadow-xl shadow-green-900/5 text-gray-800 font-medium transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {marketViewMode === 'CITY_DETAIL' && (
            <button
              onClick={() => {
                setMarketViewMode('NEARBY_CITIES')
                setActiveCity(null)
                setSearchTerm('')
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 text-gray-700 rounded-3xl font-bold hover:bg-gray-50 transition-all shadow-lg shadow-gray-200/20"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          )}

          <button
            onClick={marketViewMode === 'NEARBY_CITIES' ? fetchNearbyCities : () => handleCitySelect(activeCity)}
            disabled={isLoading}
            className="flex-1 md:flex-none px-8 py-4 bg-green-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-green-600/20"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {!userLocation ? (
          <motion.div
            key="no-location"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 p-16 text-center max-w-3xl mx-auto shadow-2xl"
          >
            <div className="w-24 h-24 bg-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-200 rotate-12">
              <MapPin size={48} className="text-white" />
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Where are you?</h2>
            <p className="text-gray-500 text-lg mb-12 font-medium">
              We need your location to provide hyper-local market prices, crop trends, and agricultural intelligence.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                  className="p-5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-800 hover:border-green-500 hover:bg-green-50 transition-all duration-300 shadow-sm"
                >
                  {city.city}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCitySelector(true)}
              className="mt-12 text-green-600 font-black uppercase tracking-widest text-xs hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              Browse all cities <ChevronRight size={18} />
            </button>
          </motion.div>
        ) : marketViewMode === 'NEARBY_CITIES' ? (
          <motion.div
            key="nearby-cities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Map Integration */}
            {nearbyCities.length > 0 && userLocation?.latitude && (
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden h-[400px] relative z-0 group">
                <MapContainer
                  center={[userLocation.latitude, userLocation.longitude]}
                  zoom={8}
                  style={{ height: '100%', width: '100%' }}
                  className="grayscale hover:grayscale-0 transition-all duration-700"
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                  <Marker position={[userLocation.latitude, userLocation.longitude]}>
                    <Popup className="custom-popup">
                      <div className="p-2 font-bold text-green-700">📍 Your Location ({userLocation.city})</div>
                    </Popup>
                  </Marker>
                  {nearbyCities.map((city, idx) => (
                    <Marker
                      key={idx}
                      position={[
                        parseFloat(city.latitude || userLocation.latitude),
                        parseFloat(city.longitude || userLocation.longitude)
                      ]}
                    >
                      <Popup>
                        <div className="p-3 min-w-[150px]">
                          <p className="font-black text-lg text-gray-900 mb-1">{city.city}</p>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">{city.distanceKm} km away</p>
                          <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">AVG PRICE</span>
                            <span className="text-sm font-black text-green-600">₹{city.avgPrice}</span>
                          </div>
                          <button
                            onClick={() => handleCitySelect(city.city)}
                            className="w-full mt-3 py-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg"
                          >
                            View Markets
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                <div className="absolute top-6 left-6 z-[1000] bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Regional Coverage</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">{nearbyCities.length} active market hubs detected</p>
                </div>
              </div>
            )}

            {/* Cities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 bg-white/40 rounded-[2rem] animate-pulse border border-white" />
                ))
              ) : filteredCities.length > 0 ? (
                filteredCities.map((city, idx) => (
                  <motion.div
                    key={city.city}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleCitySelect(city.city)}
                    className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-green-900/5 hover:-translate-y-2 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 group-hover:bg-green-600 transition-colors duration-500 opacity-20 group-hover:opacity-10"></div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-green-700 transition-colors">
                          {city.city}
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{city.state} • {city.distanceKm} km</p>
                      </div>
                      <div className={`p-3 rounded-2xl shadow-sm ${city.trend === 'up' ? 'bg-green-50 text-green-600' :
                        city.trend === 'down' ? 'bg-red-50 text-red-600' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                        {city.trend === 'up' ? <TrendingUp size={24} /> :
                          city.trend === 'down' ? <TrendingDown size={24} /> :
                            <BarChart3 size={24} />}
                      </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                      <div className="flex flex-wrap gap-2">
                        {city.majorCrops.map(crop => (
                          <span key={crop} className="px-3 py-1.5 bg-green-50/50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-green-100/50">
                            {crop}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-between items-end pt-6 border-t border-gray-50">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">Market Avg</p>
                          <p className="text-2xl font-black text-gray-900">₹{city.avgPrice?.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 text-xs font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                          Explore <ChevronRight size={18} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-white/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-bold text-lg">
                    {searchTerm ? `No cities match "${searchTerm}"` : 'No nearby market hubs found.'}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">Try expanding your search or selecting a major city manually.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="city-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <MapIcon className="text-green-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    {activeCity} Market Directory
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">{cityMarkets.length} commodities currently trading</p>
                </div>
              </div>
            </div>

            {/* Markets Grid/Table */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                  [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-72 bg-white/40 rounded-[2rem] animate-pulse border border-white" />
                  ))
                ) : filteredMarkets.length > 0 ? (
                  filteredMarkets.map((market, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="relative h-80 rounded-[2.5rem] shadow-xl overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                    >
                      <img
                        src={getImageForCommodity(market.commodity)}
                        alt={market.commodity}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        onError={(e) => { e.target.src = '/wheat.jpeg' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                      <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                          <span className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {market.name}
                          </span>
                          <div className={`p-2 rounded-xl backdrop-blur-md border border-white/30 ${market.trend === 'up' ? 'bg-green-500/40' :
                            market.trend === 'down' ? 'bg-red-500/40' :
                              'bg-gray-500/40'
                            }`}>
                            {market.trend === 'up' ? <TrendingUp size={18} /> :
                              market.trend === 'down' ? <TrendingDown size={18} /> :
                                <RefreshCw size={18} />}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="text-3xl font-black mb-1 leading-tight">{market.commodity}</h3>
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{market.variety}</p>
                          </div>

                          <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                            <div>
                              <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Modal Price</p>
                              <p className="text-2xl font-black">₹{market.modal_price?.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Range</p>
                              <p className="text-xs font-bold">₹{market.min_price} - {market.max_price}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-24 text-center bg-white/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 font-bold text-lg">
                      {searchTerm ? `No commodities match "${searchTerm}"` : `No market data available for ${activeCity}.`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden"
              >
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Commodity</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Variety</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Modal Price</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Trading Range</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Market Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredMarkets.map((market, idx) => (
                      <tr key={idx} className="group hover:bg-green-50/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md group-hover:scale-110 transition-transform">
                              <img
                                src={getImageForCommodity(market.commodity)}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = '/wheat.jpeg' }}
                              />
                            </div>
                            <div className="font-black text-gray-900">{market.commodity}</div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-gray-500">{market.variety}</td>
                        <td className="px-8 py-6 font-black text-lg text-gray-900">₹{market.modal_price?.toLocaleString()}</td>
                        <td className="px-8 py-6 text-sm font-bold text-gray-400">₹{market.min_price} - ₹{market.max_price}</td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${market.trend === 'up' ? 'bg-green-100 text-green-700' :
                            market.trend === 'down' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                            {market.trend === 'up' ? <TrendingUp size={16} /> :
                              market.trend === 'down' ? <TrendingDown size={16} /> :
                                <RefreshCw size={16} />}
                            {market.trend || 'Stable'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Alerts / Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Info size={24} className="opacity-80" />
              <span className="text-xs font-black uppercase tracking-widest opacity-80">Market Tip</span>
            </div>
            <h3 className="text-xl font-black mb-2">Optimize Your Harvest</h3>
            <p className="text-blue-100 text-sm font-medium">
              Based on current trends in {userLocation?.city || 'your region'}, prices for seasonal crops are expected to peak in the next 14 days.
            </p>
          </div>
          <Info size={120} className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-amber-500 rounded-[2rem] p-8 text-white shadow-xl shadow-amber-200 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="opacity-80" />
              <span className="text-xs font-black uppercase tracking-widest opacity-80">Price Alert</span>
            </div>
            <h3 className="text-xl font-black mb-2">Volatility Warning</h3>
            <p className="text-amber-50 text-sm font-medium">
              High price fluctuations detected for perishable commodities. Monitor live updates closely for the best selling window.
            </p>
          </div>
          <AlertCircle size={120} className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>

      {/* Error State Overlay */}
      <AnimatePresence>
        {locError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-md px-4"
          >
            <div className="bg-red-600 text-white p-6 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-widest">Location Error</p>
                  <p className="text-xs opacity-90">{locError}</p>
                </div>
              </div>
              <button
                onClick={detectLocation}
                className="px-4 py-2 bg-white text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Market