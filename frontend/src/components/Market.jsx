import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Search, MapPin, TrendingUp, TrendingDown, LayoutGrid, Table,
  RefreshCw, ArrowLeft, ChevronRight, Info, AlertCircle,
  Map as MapIcon, BarChart3, Globe, Zap, Loader2
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
    status: locStatus,
    error: locError,
    allCities,
    updateLocation,
    detectLocation,
    searchCities
  } = useLocation()

  const [marketViewMode, setMarketViewMode] = useState('NEARBY_CITIES')
  const [activeCity, setActiveCity] = useState(null)
  const [nearbyCities, setNearbyCities] = useState([])
  const [cityMarkets, setCityMarkets] = useState([])

  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [citySearchQuery, setCitySearchQuery] = useState('')
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
    if (locStatus === 'set' && userLocation && marketViewMode === 'NEARBY_CITIES') {
      fetchNearbyCities()
    }
  }, [userLocation, locStatus, fetchNearbyCities, marketViewMode])

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

  // Loading State
  if (locStatus === 'loading' || locStatus === 'detecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 border-4 border-green-100 border-t-green-600 rounded-full"
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <MapPin className="text-green-600 animate-bounce" size={40} />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {locStatus === 'detecting' ? 'Detecting Precision Location...' : 'Syncing Market Data...'}
          </h2>
          <p className="text-gray-500 text-lg font-medium">Connecting with regional agricultural hubs</p>
        </div>
      </div>
    )
  }

  // Unset State (Onboarding)
  if (locStatus === 'unset' || !userLocation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-2xl rounded-[4rem] p-16 border border-white shadow-2xl text-center space-y-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full -mr-32 -mt-32 opacity-50"></div>

          <div className="w-28 h-28 bg-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-200 rotate-12">
            <Globe className="text-white" size={56} />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-black text-gray-900 tracking-tight">
              Where is your <span className="text-green-600">farm?</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
              We need your location to provide real-time market prices, local mandi trends, and precision weather alerts.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-6">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={24} />
              <input
                type="text"
                placeholder="Search your city (e.g. Hyderabad, London...)"
                value={citySearchQuery}
                onChange={(e) => {
                  setCitySearchQuery(e.target.value)
                  searchCities(e.target.value)
                }}
                className="w-full pl-14 pr-6 py-6 rounded-[2rem] border-2 border-gray-100 focus:border-green-500 focus:outline-none text-xl shadow-sm transition-all font-bold placeholder:text-gray-300"
              />
            </div>

            <AnimatePresence>
              {allCities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar"
                >
                  {allCities.map((city, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateLocation(city)}
                      className="w-full px-8 py-5 text-left hover:bg-green-50 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="font-black text-gray-900 text-lg">{city.name || city.city}</p>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{city.state}, {city.country}</p>
                      </div>
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-green-500 transition-all group-hover:translate-x-1" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-6 bg-white text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">or</span>
              </div>
            </div>

            <button
              onClick={detectLocation}
              className="w-full py-6 rounded-[2rem] bg-gray-900 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 hover:bg-gray-800 transition-all shadow-2xl active:scale-95 group"
            >
              <Zap size={20} className="text-yellow-400 fill-yellow-400 group-hover:scale-125 transition-transform" />
              Auto-detect My Location
            </button>
          </div>

          {locError && (
            <p className="text-red-500 text-sm font-bold bg-red-50 py-3 px-6 rounded-2xl inline-block">
              ⚠️ {locError}
            </p>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto min-h-screen bg-[#F9FAFB]/50">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-2xl shadow-green-900/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-600 rounded-xl text-white shadow-lg shadow-green-200">
                <Store size={20} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Market Intelligence</h1>
            </div>
            <p className="text-gray-500 font-medium flex items-center gap-2">
              <MapPin size={16} className="text-green-600" />
              Real-time prices for <span className="text-gray-900 font-bold">{userLocation.city}</span> and surrounding regions
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search commodities..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 bg-white/50 text-sm font-bold transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowCitySelector(!showCitySelector)}
              className={`p-3.5 rounded-2xl border transition-all ${showCitySelector ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200' : 'bg-white border-gray-200 text-gray-600 hover:border-green-500 hover:text-green-600'}`}
            >
              <MapIcon size={20} />
            </button>
          </div>
        </div>

        {/* City Selector Dropdown */}
        <AnimatePresence>
          {showCitySelector && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-2xl space-y-6"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search another city..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 focus:border-green-500 focus:outline-none text-sm font-bold transition-all"
                    value={citySearchQuery}
                    onChange={(e) => {
                      setCitySearchQuery(e.target.value)
                      searchCities(e.target.value)
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    detectLocation()
                    setShowCitySelector(false)
                    setCitySearchQuery('')
                  }}
                  className="px-6 py-4 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                  Auto-detect
                </button>
              </div>

              {allCities.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allCities.slice(0, 12).map((city, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        updateLocation(city)
                        setShowCitySelector(false)
                        setCitySearchQuery('')
                      }}
                      className="px-4 py-3 rounded-xl border border-gray-50 bg-gray-50/50 text-xs font-bold text-gray-700 hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-all text-left truncate"
                    >
                      {city.name || city.city}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {marketViewMode === 'NEARBY_CITIES' ? (
          <motion.div
            key="nearby-cities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Nearby Cities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-48 bg-white/40 rounded-[2.5rem] animate-pulse border border-white" />
                ))
              ) : filteredCities.length > 0 ? (
                filteredCities.map((city, idx) => (
                  <motion.div
                    key={city.city}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleCitySelect(city.city)}
                    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-green-900/5 hover:-translate-y-2 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 group-hover:bg-green-600 transition-colors duration-500 opacity-20 group-hover:opacity-10"></div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-green-600 transition-colors">{city.city}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{city.state}</p>
                      </div>
                      <div className="p-3 bg-gray-50 text-gray-400 group-hover:bg-green-600 group-hover:text-white rounded-2xl transition-all duration-500">
                        <TrendingUp size={24} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Major Crops</p>
                      <div className="flex flex-wrap gap-2">
                        {city.majorCrops.map(crop => (
                          <span key={crop} className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-500 group-hover:bg-green-50 group-hover:text-green-700 transition-colors">
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-xs font-black text-green-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">View Mandis</span>
                      <ChevronRight className="text-gray-300 group-hover:text-green-600 group-hover:translate-x-2 transition-all" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">No markets found</h3>
                  <p className="text-gray-500 font-medium">Try searching for a different city or region.</p>
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
            {/* City Detail View */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMarketViewMode('NEARBY_CITIES')}
                className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-black uppercase tracking-widest text-xs transition-colors group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Regions
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-gray-900 text-white shadow-xl' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-gray-900 text-white shadow-xl' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                >
                  <Table size={20} />
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMarkets.map((market, idx) => (
                  <motion.div
                    key={`${market.name}-${market.commodity}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-green-900/5 transition-all duration-500 group"
                  >
                    <div className="h-48 relative overflow-hidden">
                      <img
                        src={getImageForCommodity(market.commodity)}
                        alt={market.commodity}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] mb-1">{market.variety}</p>
                            <h3 className="text-xl font-black text-white leading-tight">{market.commodity}</h3>
                          </div>
                          <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${market.trend === 'up' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {market.trend === 'up' ? '↑ Rising' : '↓ Falling'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-8 space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Current Price</p>
                          <p className="text-3xl font-black text-gray-900">₹{market.modal_price?.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Range</p>
                          <p className="text-sm font-bold text-gray-500">₹{market.min_price} - ₹{market.max_price}</p>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-gray-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                          <MapPin size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Market Hub</p>
                          <p className="text-xs font-bold text-gray-700 truncate">{market.name}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Commodity</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Variety</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Market</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Min Price</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Max Price</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Modal Price</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredMarkets.map((market, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                              <img src={getImageForCommodity(market.commodity)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-black text-gray-900">{market.commodity}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-gray-500">{market.variety}</td>
                        <td className="px-8 py-6 text-sm font-bold text-gray-500">{market.name}</td>
                        <td className="px-8 py-6 text-sm font-black text-gray-900">₹{market.min_price}</td>
                        <td className="px-8 py-6 text-sm font-black text-gray-900">₹{market.max_price}</td>
                        <td className="px-8 py-6 text-lg font-black text-green-600">₹{market.modal_price}</td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${market.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {market.trend === 'up' ? '↑ Rising' : '↓ Falling'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State Overlay */}
      <AnimatePresence>
        {locError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-red-500">
              <div className="p-2 bg-white/20 rounded-xl">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-widest">Location Error</p>
                <p className="text-xs opacity-90">{locError}</p>
              </div>
              <button
                onClick={detectLocation}
                className="ml-4 px-6 py-2 bg-white text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
              >
                Retry Detection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Market