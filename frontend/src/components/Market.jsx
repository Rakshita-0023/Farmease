import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MapPin, RefreshCw, Navigation, TrendingUp, TrendingDown, 
  Store, Clock, ChevronRight, Sparkles, Activity
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useLocation } from '../LocationContext'
import { apiClient } from '../config'
import marketCache from '../services/marketCache'

const Market = () => {
  const navigate = useNavigate()
  const { location: userLocation, loading: locationLoading, error: locationError, updateLocation, retryLocationDetection } = useLocation()
  
  const [marketData, setMarketData] = useState({
    markets: [],
    loading: false,
    error: null
  })

  const fetchMarketData = async (forceRefresh = false) => {
    if (!userLocation?.latitude || !userLocation?.longitude) return

    if (!forceRefresh) {
      const cached = marketCache.get(userLocation.latitude, userLocation.longitude, 50)
      if (cached) {
        setMarketData({ markets: cached, loading: false, error: null })
        return
      }
    }

    setMarketData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await apiClient.get('/market/nearby', {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        radius: 50
      })

      const markets = response?.success ? response.markets : []
      if (markets.length > 0) {
        marketCache.set(userLocation.latitude, userLocation.longitude, markets, 50)
      }

      setMarketData({ markets, loading: false, error: null })
    } catch (error) {
      setMarketData(prev => ({ ...prev, loading: false, error: error.message }))
    }
  }

  useEffect(() => {
    if (userLocation?.latitude && userLocation?.longitude) {
      fetchMarketData()
    }
  }, [userLocation])

  // Premium Loading State
  if (locationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse mx-auto mb-6" />
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-ping opacity-20 mx-auto" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Detecting Location</h2>
          <p className="text-white/50">Finding markets near you...</p>
        </div>
      </div>
    )
  }

  // Location Error State - with manual city selector
  if (locationError || !userLocation) {
    const cities = [
      { name: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
      { name: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
      { name: 'Bangalore', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
      { name: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
      { name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
      { name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
      { name: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
      { name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
      { name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 }
    ]
    
    const handleCitySelect = (city) => {
      console.log('📍 Manual city selection for Market:', city.name)
      if (updateLocation) {
        updateLocation(city)
      }
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="text-emerald-400" size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Location Required</h2>
          <p className="text-white/50 mb-6">Enable location access to discover agricultural markets and live prices near you.</p>
          
          <button
            onClick={retryLocationDetection}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all mb-4"
          >
            Enable Location
          </button>
          
          <p className="text-white/40 text-sm mb-4">Or select your city manually:</p>
          
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {cities.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCitySelect(city)}
                className="p-2 bg-white/5 hover:bg-emerald-500/20 rounded-xl transition-all text-left border border-transparent hover:border-emerald-500/30"
              >
                <span className="text-white font-medium text-xs block">{city.name}</span>
                <span className="text-white/40 text-[10px]">{city.state}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Premium Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600/80 via-teal-600/80 to-cyan-600/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 mb-6 border border-white/10 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-sm font-medium">Live Data</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Mandi Prices</h1>
            <div className="flex items-center gap-2 text-white/80">
              <MapPin size={16} />
              <span className="font-medium">{userLocation.city}, {userLocation.state}</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              marketCache.clear()
              fetchMarketData(true)
            }}
            disabled={marketData.loading}
            className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-semibold"
          >
            <RefreshCw size={18} className={marketData.loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Store className="text-emerald-400" size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{marketData.markets.length}</div>
          <div className="text-sm text-white/50">Markets Found</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Activity className="text-emerald-400" size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{marketData.markets.filter(m => m.has_live_prices).length}</div>
          <div className="text-sm text-white/50">With Live Prices</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Navigation className="text-emerald-400" size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-white">50km</div>
          <div className="text-sm text-white/50">Search Radius</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Clock className="text-emerald-400" size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-white">Today</div>
          <div className="text-sm text-white/50">Last Updated</div>
        </motion.div>
      </div>

      {/* Loading Skeleton */}
      {marketData.loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-6 bg-white/10 rounded-lg w-32" />
                <div className="h-6 bg-white/10 rounded-full w-16" />
              </div>
              <div className="h-4 bg-white/10 rounded w-48 mb-4" />
              <div className="flex gap-2">
                <div className="h-10 bg-white/10 rounded-xl flex-1" />
                <div className="h-10 bg-white/10 rounded-xl flex-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {marketData.error && !marketData.loading && (
        <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="text-red-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Failed to Load Markets</h3>
          <p className="text-white/50 mb-6">{marketData.error}</p>
          <button
            onClick={() => fetchMarketData(true)}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Markets Grid */}
      {!marketData.loading && !marketData.error && marketData.markets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketData.markets.map((market, index) => (
            <motion.div 
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/market/${market.id}?lat=${userLocation.latitude}&lng=${userLocation.longitude}`)}
              className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer hover:-translate-y-1"
            >
              {/* Market Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors mb-1">
                    {market.name === 'Unknown' ? 'Agricultural Market' : market.name}
                  </h3>
                  <p className="text-sm text-white/50">
                    {market.address || `${market.city || ''}, ${market.state || ''}`}
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-bold">
                  {market.distance}km
                </span>
              </div>

              {/* Market Info */}
              <div className="flex items-center gap-4 mb-5">
                <div className="flex items-center gap-1.5 text-sm text-white/60">
                  <Store size={14} />
                  <span>{market.marketType || 'Market'}</span>
                </div>
                {market.has_live_prices ? (
                  <div className="flex items-center gap-1.5 text-sm text-emerald-400">
                    <TrendingUp size={14} />
                    <span>Live Prices</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-white/40">
                    <Clock size={14} />
                    <span>Contact for rates</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(`https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${market.lat},${market.lng}`, '_blank')
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
                >
                  <Navigation size={16} />
                  Directions
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/market/${market.id}?lat=${userLocation.latitude}&lng=${userLocation.longitude}`)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                  View Prices
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!marketData.loading && !marketData.error && marketData.markets.length === 0 && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/10">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Store className="text-white/40" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No Markets Found</h3>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            No agricultural markets found within 50km of your location. Try expanding your search or check back later.
          </p>
          <button
            onClick={() => fetchMarketData(true)}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:opacity-90 transition-all"
          >
            Search Again
          </button>
        </div>
      )}

      {/* Data Source Footer */}
      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white/30">
        <Sparkles size={14} className="text-emerald-500" />
        <span>Data source: AGMARKNET (Government of India) • Updated daily</span>
      </div>
    </div>
  )
}

export default Market
