import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Search, MapPin, TrendingUp, TrendingDown, LayoutGrid, Table,
  RefreshCw, ArrowLeft, ChevronRight, Info, AlertCircle, ArrowRightLeft,
  Map as MapIcon, BarChart3, Globe, Zap, Loader2, Store, Navigation,
  Filter, Download, Share2, Calendar
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import 'leaflet/dist/leaflet.css'
import { useFarmLocation } from '../hooks/useFarmLocation'
import { apiClient } from '../config'
import NearbyMarketsMap from './NearbyMarketsMap'
import L from 'leaflet'

// Fix for default markers
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
  'Jowar': '/corn.jpg',
  'Maize': '/corn.jpg',
  'Corn': '/corn.jpg',
  'Rice': '/rice.jpg',
  'Paddy': '/rice.jpg',
  'Bajra': '/corn.jpg',
  'Ragi': '/rice.jpg',
  'Arhar Dal': '/Arhar_Dal.webp',
  'Chana Dal': '/Arhar_Dal.webp',
  'Moong Dal': '/Arhar_Dal.webp',
  'Chilli': '/tomato.jpeg',
  'Red Chilli': '/tomato.jpeg',
  'Turmeric': '/turmeric.jpeg',
  'Mustard': '/Sunflower.jpg',
  'Onion': '/onions.avif',
  'Tomato': '/tomato.jpeg',
  'Potato': '/potato.jpg',
  'Cabbage': '/potato.jpg',
  'Cauliflower': '/potato.jpg',
  'Banana': '/Sunflower.jpg',
  'Mango': '/Sunflower.jpg',
  'Apple': '/tomato.jpeg',
  'Orange': '/tomato.jpeg',
  'Cotton': '/Rubber.jpg',
  'Groundnut': '/Sunflower.jpg',
  'Sunflower': '/Sunflower.jpg',
  'Jute': '/sugercane.jpg',
  'Sugarcane': '/sugercane.jpg',
  'Coffee': '/tea.jpg',
  'Tea': '/tea.jpg',
  'Rubber': '/Rubber.jpg',
  'Brinjal': '/tomato.jpeg',
  'Papaya': '/Sunflower.jpg',
  'Pomegranate': '/tomato.jpeg',
  'Soybean': '/Sunflower.jpg'
}

const Market = () => {
  const {
    location: userLocation,
    loading: locationLoading,
    error: locationError,
    locationStatus,
    retryLocationDetection,
    allCities,
    updateLocation
  } = useFarmLocation()

  const [marketViewMode, setMarketViewMode] = useState('NEARBY_CITIES')
  const [nearbyCities, setNearbyCities] = useState([])
  const [cityMarkets, setCityMarkets] = useState([])
  const [showNearbyMap, setShowNearbyMap] = useState(false)

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
      // Filter out any "Unknown" results from backend
      const validCities = (data || []).filter(c => c.city && c.city !== 'Unknown' && c.city !== 'Detected Location')
      setNearbyCities(validCities)
      setMarketViewMode('NEARBY_CITIES')
    } catch (err) {
      console.error('❌ Failed to fetch nearby cities:', err)
      setNearbyCities([])
    } finally {
      setIsLoading(false)
    }
  }, [userLocation])

  const handleCitySelect = async (cityName) => {
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
      (city.majorCrops && city.majorCrops.some(crop => crop.toLowerCase().includes(lower)))
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
  if (locationStatus === 'detecting' || locationLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 bg-white/30 backdrop-blur-3xl rounded-[3rem] m-8 border border-white">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-40 h-40 border-8 border-green-100 border-t-green-600 rounded-full shadow-2xl"
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <MapPin className="text-green-600 animate-bounce" size={48} />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">
            Resolving Location...
          </h2>
          <p className="text-gray-500 text-xl font-medium">Connecting to agricultural data network</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto min-h-screen">
      {/* Premium Glassmorphic Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[3rem] p-10 shadow-2xl shadow-green-900/5"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-100 rounded-full -mr-48 -mt-48 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100 rounded-full -ml-32 -mb-32 opacity-20 blur-3xl"></div>

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-2xl text-white shadow-2xl shadow-green-200 transform -rotate-3">
                <Store size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Market Hub</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[10px] font-black uppercase tracking-widest">Live Network</span>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                </div>
              </div>
            </div>
            <p className="text-gray-500 font-bold flex items-center gap-2 text-lg">
              <MapPin size={20} className="text-green-600" />
              Intelligence for <span className="text-gray-900 border-b-2 border-green-500/30">{userLocation?.city || 'Your Region'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <div className="relative flex-1 min-w-[300px] group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={22} />
              <input
                type="text"
                placeholder="Search crops, markets, or regions..."
                className="w-full pl-14 pr-6 py-5 rounded-3xl border border-white bg-white/50 focus:outline-none focus:ring-8 focus:ring-green-500/5 focus:border-green-500/50 text-base font-bold transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNearbyMap(!showNearbyMap)}
                className={`flex items-center gap-3 px-6 py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all ${showNearbyMap
                    ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200'
                    : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-white shadow-lg'
                  }`}
              >
                <Navigation size={18} />
                <span>Nearby Hubs</span>
              </button>

              <button
                onClick={() => window.location.hash = '#/market/comparison'}
                className="flex items-center gap-3 px-6 py-5 rounded-3xl bg-white text-gray-600 hover:bg-green-50 hover:text-green-600 border border-white shadow-lg font-black uppercase tracking-widest text-[10px] transition-all"
              >
                <ArrowRightLeft size={18} />
                <span>Price Index</span>
              </button>

              <button
                onClick={() => setShowCitySelector(!showCitySelector)}
                className={`p-5 rounded-3xl border transition-all ${showCitySelector
                    ? 'bg-green-600 text-white shadow-2xl shadow-green-200'
                    : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600 border border-white shadow-lg'
                  }`}
              >
                <MapIcon size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic City Selector */}
        <AnimatePresence>
          {showCitySelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 pt-8 border-t border-gray-100/50"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Quick Selection</p>
                  <div className="flex flex-wrap gap-2">
                    {allCities.slice(0, 15).map((city, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          updateLocation(city)
                          setShowCitySelector(false)
                        }}
                        className="px-5 py-3 rounded-2xl bg-white/50 border border-white hover:border-green-500 hover:bg-green-50 hover:text-green-700 text-xs font-black transition-all"
                      >
                        {city.name || city.city}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-green-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-green-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <h4 className="text-xl font-black mb-2">Auto-Detect</h4>
                  <p className="text-sm opacity-80 mb-6 font-medium leading-relaxed">Use your device's GPS for the most accurate local mandi prices.</p>
                  <button
                    onClick={() => {
                      retryLocationDetection()
                      setShowCitySelector(false)
                    }}
                    className="w-full py-4 bg-white text-green-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-green-50 transition-all flex items-center justify-center gap-3 shadow-xl"
                  >
                    <Zap size={16} fill="currentColor" />
                    Enable GPS
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {showNearbyMap ? (
          <motion.div
            key="nearby-map"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full"
          >
            <NearbyMarketsMap />
          </motion.div>
        ) : marketViewMode === 'NEARBY_CITIES' ? (
          <motion.div
            key="nearby-cities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <BarChart3 className="text-green-600" />
                Regional Market Hubs
              </h2>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{filteredCities.length} Regions Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="h-64 bg-white/40 rounded-[3rem] animate-pulse border border-white" />
                ))
              ) : filteredCities.length > 0 ? (
                filteredCities.map((city, idx) => (
                  <motion.div
                    key={city.city}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleCitySelect(city.city)}
                    className="group bg-white rounded-[3rem] p-10 shadow-sm border border-gray-50 hover:shadow-2xl hover:shadow-green-900/10 hover:-translate-y-3 transition-all duration-500 cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-green-50 rounded-full -mr-20 -mt-20 group-hover:bg-green-600 transition-colors duration-700 opacity-30 group-hover:opacity-10"></div>

                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h3 className="text-3xl font-black text-gray-900 group-hover:text-green-600 transition-colors leading-tight">{city.city}</h3>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-2">{city.state}</p>
                      </div>
                      <div className="p-4 bg-gray-50 text-gray-400 group-hover:bg-green-600 group-hover:text-white rounded-[1.5rem] transition-all duration-500 shadow-lg group-hover:shadow-green-200">
                        <TrendingUp size={28} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Primary Commodities</p>
                      <div className="flex flex-wrap gap-2">
                        {(city.majorCrops || []).slice(0, 4).map(crop => (
                          <span key={crop} className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black text-gray-500 group-hover:bg-green-50 group-hover:text-green-700 transition-colors">
                            {crop}
                          </span>
                        ))}
                        {city.majorCrops?.length > 4 && (
                          <span className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400">
                            +{city.majorCrops.length - 4} More
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-green-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">Enter Mandi</span>
                        <ChevronRight className="text-gray-300 group-hover:text-green-600 group-hover:translate-x-2 transition-all" size={20} />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Avg. Price</p>
                        <p className="text-sm font-black text-gray-900">₹{city.avgPrice?.toLocaleString() || '---'}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-32 text-center bg-white/40 backdrop-blur-md rounded-[4rem] border-4 border-dashed border-gray-100">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Globe size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4">No Regional Hubs Detected</h3>
                  <p className="text-gray-500 text-lg font-medium max-w-md mx-auto leading-relaxed">
                    We couldn't find active markets for this location. Try searching for a major city or use the map.
                  </p>
                  <button
                    onClick={() => setShowCitySelector(true)}
                    className="mt-10 px-10 py-5 bg-green-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all shadow-2xl shadow-green-200"
                  >
                    Select Major City
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="city-detail"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-10"
          >
            {/* City Detail View Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <button
                onClick={() => setMarketViewMode('NEARBY_CITIES')}
                className="flex items-center gap-3 text-gray-400 hover:text-green-600 font-black uppercase tracking-widest text-[10px] transition-all group bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" />
                Back to Regions
              </button>

              <div className="flex items-center gap-4 bg-white p-2 rounded-3xl shadow-sm border border-gray-50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-gray-900 text-white shadow-2xl' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${viewMode === 'table' ? 'bg-gray-900 text-white shadow-2xl' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Table size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">List</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                {filteredMarkets.map((market, idx) => (
                  <motion.div
                    key={`${market.name}-${market.commodity}-${idx}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group bg-white rounded-[3rem] overflow-hidden shadow-sm border border-gray-50 hover:shadow-2xl hover:shadow-green-900/10 transition-all duration-700"
                  >
                    <div className="h-56 relative overflow-hidden">
                      <img
                        src={getImageForCommodity(market.commodity)}
                        alt={market.commodity}
                        className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                      <div className="absolute top-6 right-6">
                        <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-md border border-white/20 ${market.trend === 'up' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
                          }`}>
                          {market.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {market.trend === 'up' ? 'Bullish' : 'Bearish'}
                        </div>
                      </div>

                      <div className="absolute bottom-8 left-8 right-8">
                        <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.3em] mb-2">{market.variety}</p>
                        <h3 className="text-3xl font-black text-white leading-tight tracking-tighter">{market.commodity}</h3>
                      </div>
                    </div>

                    <div className="p-10 space-y-8">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Market Price</p>
                          <p className="text-4xl font-black text-gray-900 tracking-tighter">₹{market.modal_price?.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Daily Range</p>
                          <p className="text-sm font-bold text-gray-500">₹{market.min_price} - {market.max_price}</p>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-gray-50 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                          <Navigation size={22} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Trading Hub</p>
                          <p className="text-sm font-black text-gray-700 truncate">{market.name}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-green-900/5 border border-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Commodity</th>
                        <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Variety</th>
                        <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Market Hub</th>
                        <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Price Range</th>
                        <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Modal Price</th>
                        <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Market Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredMarkets.map((market, idx) => (
                        <tr key={idx} className="hover:bg-green-50/30 transition-all group cursor-pointer">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                                <img src={getImageForCommodity(market.commodity)} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <span className="font-black text-gray-900 text-lg block">{market.commodity}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{market.date || 'Today'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest">{market.variety}</span>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-2 text-gray-600 font-bold">
                              <MapPin size={14} className="text-green-500" />
                              {market.name}
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <div className="text-sm font-bold text-gray-400">
                              ₹{market.min_price} - <span className="text-gray-600">₹{market.max_price}</span>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <span className="text-2xl font-black text-green-600 tracking-tighter">₹{market.modal_price}</span>
                          </td>
                          <td className="px-10 py-8">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${market.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {market.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {market.trend === 'up' ? 'Rising' : 'Falling'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Action Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-gray-900/90 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center gap-8">
          <div className="flex items-center gap-4 border-r border-white/10 pr-8">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Last Update</p>
              <p className="text-xs font-bold text-white">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Download Report">
              <Download size={20} />
            </button>
            <button className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Share Insights">
              <Share2 size={20} />
            </button>
            <button className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Filter View">
              <Filter size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Overlay */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-red-600 text-white px-10 py-6 rounded-[2rem] shadow-2xl flex items-center gap-6 border border-red-500">
              <div className="p-3 bg-white/20 rounded-2xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="font-black text-base uppercase tracking-widest">Network Error</p>
                <p className="text-sm opacity-80 font-medium">{locationError}</p>
              </div>
              <button
                onClick={() => setShowCitySelector(true)}
                className="ml-6 px-8 py-3 bg-white text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-xl"
              >
                Switch Hub
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Market
