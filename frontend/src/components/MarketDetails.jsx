import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, MapPin, Clock, TrendingUp, TrendingDown, Minus, 
  Navigation, RefreshCw, Sparkles, Store, ChevronRight
} from 'lucide-react'
import { apiClient } from '../config'
import CropCard from './CropCard'

const MarketDetails = () => {
  const { marketId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  
  const [marketData, setMarketData] = useState({
    market: null,
    prices: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    if (marketId && lat && lng) {
      fetchMarketDetails()
    } else if (marketId && (!lat || !lng)) {
      setMarketData(prev => ({
        ...prev,
        loading: false,
        error: 'Location coordinates required. Please go back and try again.'
      }))
    }
  }, [marketId, lat, lng])

  const fetchMarketDetails = async () => {
    try {
      setMarketData(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await apiClient.get(`/markets/${marketId}/prices`, { lat, lng })
      
      setMarketData({
        market: response.market,
        prices: response.prices || [],
        metadata: response.metadata,
        loading: false,
        error: null
      })
    } catch (error) {
      setMarketData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load market details'
      }))
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="text-emerald-400" />
      case 'down': return <TrendingDown size={16} className="text-red-400" />
      default: return <Minus size={16} className="text-white/40" />
    }
  }

  const getTrendBg = (trend) => {
    switch (trend) {
      case 'up': return 'bg-emerald-500/20 text-emerald-400'
      case 'down': return 'bg-red-500/20 text-red-400'
      default: return 'bg-white/10 text-white/60'
    }
  }

  // Premium Loading State
  if (marketData.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse mx-auto mb-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Loading Prices</h2>
          <p className="text-white/50">Fetching live crop prices...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (marketData.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-10 text-center border border-white/10">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingDown className="text-red-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Error Loading Market</h2>
          <p className="text-white/50 mb-8">{marketData.error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchMarketDetails}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/market')}
              className="w-full py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
            >
              Back to Markets
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { market, prices, metadata } = marketData

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600/80 via-teal-600/80 to-cyan-600/80 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-white/10 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        <div className="relative">
          <button
            onClick={() => navigate('/market')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Markets</span>
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/90 text-sm font-medium">Live Prices</span>
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
                {market?.name || 'Market Details'}
              </h1>
              <div className="flex items-center gap-2 text-white/80">
                <MapPin size={16} />
                <span>{market?.address || `${market?.city}, ${market?.state}`}</span>
              </div>
            </div>
            
            <button
              onClick={fetchMarketDetails}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
            >
              <RefreshCw size={20} className="text-white" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Crops', value: metadata?.total_crops || prices.length },
          { label: 'Distance', value: `${market?.distance || '—'}km` },
          { label: 'Updated', value: 'Today' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
          >
            <div className="text-sm text-white/50 mb-1">{stat.label}</div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Prices Grid - Premium Crop Cards */}
      {prices.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">Crop Prices</h2>
            <span className="text-sm text-white/50">{metadata?.unit || '₹ per Quintal'}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prices.map((crop, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CropCard
                  commodity={crop.commodity}
                  variety={crop.variety}
                  minPrice={crop.min_price}
                  maxPrice={crop.max_price}
                  modalPrice={crop.modal_price}
                  trend={crop.trend}
                  market={market?.name}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/10">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Store className="text-white/40" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No Price Data</h3>
          <p className="text-white/50 mb-6">
            {metadata?.note || 'No crop prices available for this market today.'}
          </p>
          <button
            onClick={fetchMarketDetails}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Actions */}
      {market && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${market.lat},${market.lng}`, '_blank')
              }}
              className="flex items-center gap-4 p-4 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl transition-all border border-emerald-500/20"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Navigation className="text-white" size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-emerald-400">Get Directions</div>
                <div className="text-sm text-emerald-400/60">Navigate to market</div>
              </div>
              <ChevronRight className="ml-auto text-emerald-400" size={20} />
            </button>
            
            <button
              onClick={() => navigate('/market')}
              className="flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Store className="text-white" size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-white">Browse Markets</div>
                <div className="text-sm text-white/50">View all nearby markets</div>
              </div>
              <ChevronRight className="ml-auto text-white/40" size={20} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Data Source Footer */}
      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white/30">
        <Sparkles size={14} className="text-emerald-500" />
        <span>Data source: {metadata?.data_source || 'AGMARKNET (Government of India)'}</span>
      </div>
    </div>
  )
}

export default MarketDetails
