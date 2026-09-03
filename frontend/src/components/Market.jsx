import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, RefreshCw, Navigation, TrendingUp, TrendingDown,
  Store, Clock, ChevronRight, Sparkles, Activity
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useFarmLocation } from '../hooks/useFarmLocation'
import { apiClient } from '../config'
import marketCache from '../services/marketCache'

const Market = () => {
  const navigate = useNavigate()
  const { location: userLocation, loading: locationLoading, error: locationError, updateLocation, retryLocationDetection } = useFarmLocation()

  const [marketData, setMarketData] = useState({
    markets: [],
    loading: false,
    error: null
  })
  const [selectedCrop, setSelectedCrop] = useState('all')
  const [sortBy, setSortBy] = useState('best_price')
  const premiumGlass = 'bg-[rgba(32,40,24,0.68)] backdrop-blur-[6px] border border-white/10 rounded-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.28)]'

  const normalizeName = useCallback((text) => String(text || '').toLowerCase().replace(/[^a-z0-9]/g, ''), [])

  const enrichMarketsWithCropCatalog = useCallback(async (markets) => {
    if (!Array.isArray(markets) || !markets.length) return markets
    const hasCropsAlready = markets.some(m => Array.isArray(m.commodities) && m.commodities.length > 0)
    if (hasCropsAlready) return markets

    try {
      const cityName = userLocation?.city || 'Sonipat'
      const cityPayload = await apiClient.get(`/market/city/${encodeURIComponent(cityName)}`)
      const cityRecords = Array.isArray(cityPayload?.markets) ? cityPayload.markets : []
      if (!cityRecords.length) return markets

      const byMarket = new Map()
      cityRecords.forEach((row) => {
        const key = normalizeName(row.market)
        if (!key) return
        if (!byMarket.has(key)) byMarket.set(key, [])
        byMarket.get(key).push({
          commodity: row.commodity,
          variety: row.variety,
          trend: row.trend || 'stable',
          modal_price: Number(row.modal_price || 0),
          min_price: Number(row.min_price || 0),
          max_price: Number(row.max_price || 0),
          last_updated: row.date || new Date().toISOString()
        })
      })

      return markets.map((market) => {
        const marketKey = normalizeName(market.name)
        const exact = byMarket.get(marketKey) || []
        let inferred = exact

        if (!inferred.length) {
          for (const [key, list] of byMarket.entries()) {
            if (marketKey.includes(key) || key.includes(marketKey)) {
              inferred = list
              break
            }
          }
        }

        if (!inferred.length) return market
        const avg = inferred.reduce((sum, row) => sum + Number(row.modal_price || 0), 0) / inferred.length

        return {
          ...market,
          commodities: inferred.slice(0, 12),
          commodityCount: inferred.length,
          has_live_prices: Number.isFinite(avg) && avg > 0,
          avgPrice: Number.isFinite(avg) ? Math.round(avg) : market.avgPrice
        }
      })
    } catch {
      return markets
    }
  }, [normalizeName, userLocation?.city])

  const cropOptions = useMemo(() => {
    const set = new Set()
    marketData.markets.forEach((market) => {
      ;(market.commodities || []).forEach((item) => {
        if (item?.commodity) set.add(item.commodity)
      })
    })
    return ['all', ...Array.from(set).slice(0, 20)]
  }, [marketData.markets])

  const filteredMarkets = useMemo(() => {
    const base = marketData.markets.filter((market) => {
      if (selectedCrop === 'all') return true
      return (market.commodities || []).some((item) => String(item.commodity).toLowerCase() === selectedCrop.toLowerCase())
    })

    const sorted = [...base]
    if (sortBy === 'nearest') {
      sorted.sort((a, b) => Number(a.distance || 999) - Number(b.distance || 999))
    } else if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.last_price_update || b.lastPriceUpdate || 0) - new Date(a.last_price_update || a.lastPriceUpdate || 0))
    } else {
      sorted.sort((a, b) => Number(b.avgPrice || 0) - Number(a.avgPrice || 0))
    }
    return sorted
  }, [marketData.markets, selectedCrop, sortBy])

  const liveMarkets = filteredMarkets.filter((m) => m.has_live_prices || m.hasLivePrices || (m.avgPrice && m.avgPrice > 0))
  const bestPriceToday = liveMarkets.length
    ? [...liveMarkets]
      .filter((m) => m.verification_status !== 'district_level_estimate')
      .sort((a, b) => Number(b.avgPrice || 0) - Number(a.avgPrice || 0))[0] || [...liveMarkets].sort((a, b) => Number(b.avgPrice || 0) - Number(a.avgPrice || 0))[0]
    : null

  const getDisplayMarketName = (market, index = 0) => {
    const raw = String(market?.name || '').trim()
    const lower = raw.toLowerCase()
    const generic = ['', 'unknown', 'market', 'mandi', 'agricultural market', 'local marketplace', 'market area']
    if (!generic.includes(lower)) return raw
    const city = market?.city && market.city !== 'Unknown' ? market.city : (userLocation?.city || 'Local')
    return `${city} Mandi ${index + 1}`
  }

  const getDisplayCity = (market) => {
    return market?.city && market.city !== 'Unknown'
      ? market.city
      : (userLocation?.city || 'Regional Market')
  }

  const getTrendLabel = (market) => {
    const trend = market?.commodities?.[0]?.trend
    if (!trend) return 'Stable'
    if (trend === 'up') return 'Rising'
    if (trend === 'down') return 'Falling'
    return 'Stable'
  }

  const getDecision = (market) => {
    const trend = getTrendLabel(market)
    const distance = Number(market.distance || 999)

    if (trend === 'Rising' && distance <= 25) return { label: 'Sell Today', tone: 'text-emerald-300' }
    if (trend === 'Falling') return { label: 'Hold', tone: 'text-amber-300' }
    return { label: 'Watch Market', tone: 'text-white/75' }
  }

  const getLastUpdated = (market) => {
    const raw = market.last_price_update || market.lastPriceUpdate || market.commodities?.[0]?.last_updated
    if (!raw) return 'Not available'
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return 'Not available'
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const getDataQuality = (market) => {
    if (market?.verification_status === 'district_level_estimate') {
      return { label: 'Estimated', cls: 'text-amber-300' }
    }
    const raw = market.last_price_update || market.lastPriceUpdate || market.commodities?.[0]?.last_updated
    if (!raw || !(market.has_live_prices || market.hasLivePrices || Number(market.avgPrice || 0) > 0)) {
      return { label: 'Unavailable', cls: 'text-red-300' }
    }
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return { label: 'Delayed', cls: 'text-amber-300' }
    const hours = (Date.now() - d.getTime()) / (1000 * 60 * 60)
    if (hours <= 24) return { label: 'Verified', cls: 'text-emerald-300' }
    return { label: 'Delayed', cls: 'text-amber-300' }
  }

  const fetchMarketData = useCallback(async (forceRefresh = false) => {
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

      const rawMarkets = response?.success ? response.markets : []
      const markets = await enrichMarketsWithCropCatalog(rawMarkets)
      if (markets.length > 0) {
        marketCache.set(userLocation.latitude, userLocation.longitude, markets, 50)
      }

      setMarketData({ markets, loading: false, error: null })
    } catch (error) {
      setMarketData(prev => ({ ...prev, loading: false, error: error.message }))
    }
  }, [enrichMarketsWithCropCatalog, userLocation?.latitude, userLocation?.longitude])

  useEffect(() => {
    if (userLocation?.latitude && userLocation?.longitude) {
      fetchMarketData()
    }
  }, [fetchMarketData, userLocation?.latitude, userLocation?.longitude])

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
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[rgba(8,14,10,0.42)]" />
      <div className="relative page-container custom-scrollbar pb-12">
      {/* Premium Hero Header */}
      <header className="page-header flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Real-time Trading</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">Mandi Prices</h1>
          <p className="text-white/65 mt-3 text-base">Live signals from {userLocation.city} and surrounding local markets.</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/market-map')}
            className={`flex items-center gap-2 px-6 py-4 text-white rounded-2xl hover:bg-white/15 transition-all font-semibold ${premiumGlass}`}
          >
            <Navigation size={20} />
            Market Places
          </button>
          <button
            onClick={() => {
              marketCache.clear()
              fetchMarketData(true)
            }}
            disabled={marketData.loading}
            className="flex items-center gap-2 px-6 py-4 bg-emerald-500 text-black rounded-2xl hover:bg-emerald-400 transition-all font-black shadow-lg shadow-emerald-500/20"
          >
            <RefreshCw size={20} className={marketData.loading ? 'animate-spin' : ''} />
            Sync Live Rates
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { icon: <Store size={20} />, label: "Nearby Mandis", value: marketData.markets.length },
          { icon: <Activity size={20} />, label: "Live Trading", value: marketData.markets.filter(m => m.has_live_prices).length },
          { icon: <Navigation size={20} />, label: "Coverage", value: "50km" },
          { icon: <Clock size={20} />, label: "Last Update", value: "Today" }
        ].map((stat, i) => (
          <div key={i} className={`${premiumGlass} p-5`}>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/85 mb-4">
              {stat.icon}
            </div>
            <div className="text-3xl font-black mb-1">{stat.value}</div>
            <div className="text-[10px] text-white/45 font-bold uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Featured Best Price */}
      {bestPriceToday && (
        <div className={`mb-8 p-6 md:p-7 ${premiumGlass} border-emerald-400/25 bg-[linear-gradient(135deg,rgba(32,40,24,0.56),rgba(18,26,20,0.6))]`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-3">
                <Sparkles size={12} />
                Best Price Today
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                {getDisplayMarketName(bestPriceToday)}
              </h3>
              <p className="text-white/60 text-sm mt-1">
                {getDisplayCity(bestPriceToday)} • {bestPriceToday.distance} km away
              </p>
              <p className="text-white/50 text-xs mt-1">
                Last updated: {getLastUpdated(bestPriceToday)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-white">₹{Number(bestPriceToday.avgPrice || 0).toLocaleString()}</p>
              <p className={`text-xs font-bold uppercase tracking-wide ${getTrendLabel(bestPriceToday) === 'Rising' ? 'text-emerald-300' : getTrendLabel(bestPriceToday) === 'Falling' ? 'text-red-300' : 'text-white/70'}`}>
                {getTrendLabel(bestPriceToday)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`${premiumGlass} p-4 mb-8 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4`}>
        <div className="w-full md:w-auto">
          <label className="text-[11px] text-white/60 font-bold uppercase tracking-widest block mb-1">Choose Crop</label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full md:w-60 bg-black/30 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
          >
            {cropOptions.map((crop) => (
              <option key={crop} value={crop}>
                {crop === 'all' ? 'All Crops' : crop}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-auto">
          <label className="text-[11px] text-white/60 font-bold uppercase tracking-widest block mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-52 bg-black/30 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
          >
            <option value="best_price">Best Price</option>
            <option value="nearest">Nearest</option>
            <option value="recent">Recently Updated</option>
          </select>
        </div>

        <div className="md:ml-auto text-sm text-white/65 pt-1">
          Showing <span className="text-white font-bold">{filteredMarkets.length}</span> markets
        </div>
      </div>

      {/* Loading Skeleton */}
      {marketData.loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className={`${premiumGlass} p-6 h-64 animate-pulse`}>
              <div className="h-5 w-2/3 bg-white/15 rounded mb-4" />
              <div className="h-3 w-1/2 bg-white/10 rounded mb-6" />
              <div className="h-10 w-full bg-white/10 rounded-xl mb-6" />
              <div className="h-8 w-24 bg-white/20 rounded mb-6" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 bg-white/10 rounded-xl" />
                <div className="h-10 bg-white/20 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {marketData.error && !marketData.loading && (
        <div className="glass-card p-20 text-center border-red-500/20">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-500">
            <TrendingDown size={40} />
          </div>
          <h3 className="text-2xl font-black mb-4">Market Sync Failed</h3>
          <p className="text-white/40 mb-10 max-w-sm mx-auto">{marketData.error}</p>
          <button
            onClick={() => fetchMarketData(true)}
            className="px-8 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all shadow-xl"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Markets Grid */}
      {!marketData.loading && !marketData.error && filteredMarkets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/market/${market.id}?lat=${userLocation.latitude}&lng=${userLocation.longitude}`)}
              className={`${premiumGlass} overflow-hidden group cursor-pointer transition-all hover:-translate-y-0.5 ${market.has_live_prices ? 'border-emerald-500/25' : ''}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1">
                    <h3 className="text-xl font-extrabold group-hover:text-white transition-colors tracking-tight mb-1">
                      {getDisplayMarketName(market, index)}
                    </h3>
                    <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-widest">
                      <MapPin size={12} />
                      {getDisplayCity(market)}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-black/30 text-white/85 rounded-lg text-xs font-semibold border border-white/10">
                    {market.distance}km
                  </span>
                </div>

                <div className="mb-6">
                  {market.has_live_prices || market.hasLivePrices || Number(market.avgPrice || 0) > 0 ? (
                    <div className="p-4 bg-black/25 rounded-2xl border border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white/55 uppercase tracking-wide font-semibold">Avg Modal Price</p>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${getTrendLabel(market) === 'Rising' ? 'text-emerald-300' : getTrendLabel(market) === 'Falling' ? 'text-red-300' : 'text-white/70'}`}>
                          {getTrendLabel(market) === 'Rising' ? <TrendingUp size={12} /> : getTrendLabel(market) === 'Falling' ? <TrendingDown size={12} /> : <Activity size={12} />}
                          {getTrendLabel(market)}
                        </span>
                      </div>
                      <p className="text-3xl font-black text-white mt-1">₹{Number(market.avgPrice || 0).toLocaleString()}</p>
                      <p className="text-xs text-white/45 mt-1">
                        {market.commodityCount || market.commodities?.length || 0} commodity signals
                      </p>
                      <p className={`text-xs font-bold mt-1 ${getDecision(market).tone}`}>
                        Recommendation: {getDecision(market).label}
                      </p>
                      <p className="text-[11px] text-white/55 mt-1">
                        Last updated: {getLastUpdated(market)}
                      </p>
                      <p className={`text-[11px] font-bold uppercase ${getDataQuality(market).cls}`}>
                        Data quality: {getDataQuality(market).label}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-black/20 rounded-2xl border border-white/10 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/70 text-[11px] font-semibold">
                        <Clock size={12} />
                        Awaiting Live Feed
                      </span>
                      <div className="h-2 w-16 rounded-full bg-white/15 overflow-hidden">
                        <div className="h-full w-2/3 bg-white/25 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(`https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${market.lat},${market.lng}`, '_blank')
                    }}
                    className="flex-1 py-3.5 bg-black/30 text-white rounded-xl font-semibold hover:bg-black/45 transition-all border border-white/10"
                  >
                    Directions
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/market/${market.id}?lat=${userLocation.latitude}&lng=${userLocation.longitude}`)
                    }}
                    className="flex-1 py-3.5 bg-emerald-500 text-black rounded-xl font-black hover:bg-emerald-400 transition-all"
                  >
                    View Rates
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!marketData.loading && !marketData.error && filteredMarkets.length === 0 && (
        <div className="glass-card p-20 text-center border-dashed border-2">
          <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white/20">
            <Store size={48} />
          </div>
          <h3 className="text-3xl font-black mb-4 text-white/40">No Mandis Detected</h3>
          <p className="text-white/40 mb-10 max-w-sm mx-auto text-lg italic">
            Nearby markets aren't showing up. Try refreshing or check your location settings.
          </p>
          <button
            onClick={() => fetchMarketData(true)}
            className="px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-emerald-50 transition-all shadow-xl"
          >
            Expand Search
          </button>
        </div>
      )}

      {/* Data Source Footer */}
      <div className="mt-12 p-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 opacity-40">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest leading-none">
          <Sparkles size={14} className="text-emerald-500" />
          <span>Source: AGMARKNET India</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-tighter">Updated daily @ 09:00 AM IST</span>
      </div>
      </div>
    </div>
  )
}

export default Market
