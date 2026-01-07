import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, Info, AlertCircle,
  Map as MapIcon, ArrowRight, Zap, ArrowLeft, ChevronRight,
  Target, Activity, Layers, Globe, Sparkles, Navigation, MapPin
} from 'lucide-react'
import { Line, Bar } from 'react-chartjs-2'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useLocation } from '../LocationContext'
import { apiClient } from '../config'
import InteractiveMarketMap from './InteractiveMarketMap'
import NearbyMarketsMap from './NearbyMarketsMap'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const AdvancedFeatures = () => {
  const { location: userLocation, loading: locationLoading, allCities, updateLocation, locationStatus, error: locationError } = useLocation()

  const [viewMode, setViewMode] = useState('CITY_SELECTION') // 'CITY_SELECTION' | 'MARKET_SELECTION' | 'ANALYTICS' | 'NEARBY_MARKETS'
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedMarkets, setSelectedMarkets] = useState([])
  const [availableMarkets, setAvailableMarkets] = useState([])

  const [trends, setTrends] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [comparisonData, setComparisonData] = useState([])
  const [cityComparison, setCityComparison] = useState([])
  const [dataTimestamp, setDataTimestamp] = useState(null)
  const [dataSource, setDataSource] = useState(null)

  // STRICT VALIDATION: Only proceed if location is confirmed
  const isLocationValid = userLocation && userLocation.latitude && userLocation.longitude && userLocation.city
  const canProceedWithAnalytics = isLocationValid && selectedCity && selectedMarkets.length > 0

  const fetchCityMarkets = async (cityName) => {
    if (!cityName || cityName === 'undefined' || cityName === 'null') {
      console.error('❌ Invalid city name provided to fetchCityMarkets')
      setAvailableMarkets([])
      return
    }

    setIsLoading(true)
    try {
      console.log(`📊 Fetching markets for city: ${cityName}`)
      const data = await apiClient.get(`/market/city/${encodeURIComponent(cityName)}`)
      
      if (data && data.markets && Array.isArray(data.markets)) {
        setAvailableMarkets(data.markets)
        setDataTimestamp(new Date().toISOString())
        setDataSource(`Backend API - City: ${cityName}`)
        console.log(`✅ Loaded ${data.markets.length} markets for ${cityName}`)
      } else {
        console.warn(`⚠️ No market data returned for ${cityName}`)
        setAvailableMarkets([])
      }
    } catch (err) {
      console.error('❌ Failed to fetch city markets:', err)
      setAvailableMarkets([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnalyticsData = async () => {
    // STRICT VALIDATION: Block analytics if requirements not met
    if (!canProceedWithAnalytics) {
      console.error('❌ Cannot fetch analytics - missing required data:', {
        hasLocation: !!isLocationValid,
        hasCity: !!selectedCity,
        hasMarkets: selectedMarkets.length > 0
      })
      return
    }

    setIsLoading(true)
    try {
      console.log(`📈 Fetching analytics for ${selectedCity} with ${selectedMarkets.length} markets`)
      
      // 1. Fetch Market Comparison for the city to identify top crops
      const marketCompData = await apiClient.get(`/market/compare?location=${encodeURIComponent(selectedCity)}`)
      
      if (marketCompData && Array.isArray(marketCompData)) {
        setComparisonData(marketCompData)
        console.log(`✅ Market comparison data loaded: ${marketCompData.length} items`)
      } else {
        console.warn('⚠️ No market comparison data returned')
        setComparisonData([])
      }

      // 2. Determine active crop
      let activeCrop = selectedCrop
      if (!activeCrop && marketCompData?.length > 0) {
        activeCrop = marketCompData[0].commodity
        setSelectedCrop(activeCrop)
        console.log(`📊 Auto-selected crop: ${activeCrop}`)
      }

      // 3. Fetch Trends for the active crop (only if we have a valid crop)
      if (activeCrop && activeCrop !== 'undefined') {
        try {
          const trendData = await apiClient.get(`/market/trends?city=${encodeURIComponent(selectedCity)}&crop=${encodeURIComponent(activeCrop)}`)
          
          if (trendData && Array.isArray(trendData)) {
            setTrends(trendData)
            console.log(`✅ Trend data loaded for ${activeCrop}`)
          } else {
            console.warn(`⚠️ No trend data for ${activeCrop}`)
            setTrends([])
          }
        } catch (trendErr) {
          console.error('❌ Failed to fetch trend data:', trendErr)
          setTrends([])
        }
      }

      // 4. Fetch Regional Benchmark (City Comparison)
      if (activeCrop && activeCrop !== 'undefined') {
        try {
          const cityCompData = await apiClient.get(`/market/compare?crop=${encodeURIComponent(activeCrop)}`)
          
          if (cityCompData && Array.isArray(cityCompData)) {
            setCityComparison(cityCompData)
            console.log(`✅ City comparison data loaded: ${cityCompData.length} cities`)
          } else {
            console.warn('⚠️ No city comparison data returned')
            setCityComparison([])
          }
        } catch (cityErr) {
          console.error('❌ Failed to fetch city comparison:', cityErr)
          setCityComparison([])
        }
      }

      // Update metadata
      setDataTimestamp(new Date().toISOString())
      setDataSource(`Analytics Engine - ${selectedCity}`)

    } catch (err) {
      console.error('❌ Failed to fetch analytics data:', err)
      // Reset all data on error
      setComparisonData([])
      setTrends([])
      setCityComparison([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCitySelect = async (cityName) => {
    setSelectedCity(cityName)
    setViewMode('MARKET_SELECTION')
    await fetchCityMarkets(cityName)
  }

  const handleMarketToggle = (market) => {
    setSelectedMarkets(prev => {
      const exists = prev.find(m => m.id === market.id)
      if (exists) {
        return prev.filter(m => m.id !== market.id)
      } else {
        return [...prev, market]
      }
    })
  }

  const handleCropSelect = async (crop) => {
    if (!crop || crop === 'undefined' || crop === 'null') {
      console.error('❌ Invalid crop selected')
      return
    }

    setSelectedCrop(crop)
    console.log(`🌾 Crop selected: ${crop}`)
    
    try {
      // Fetch trends for the selected crop
      const trendData = await apiClient.get(`/market/trends?city=${encodeURIComponent(selectedCity)}&crop=${encodeURIComponent(crop)}`)
      
      if (trendData && Array.isArray(trendData)) {
        setTrends(trendData)
        console.log(`✅ Updated trends for ${crop}`)
      } else {
        setTrends([])
      }

      // Update Regional Benchmark for the selected crop
      const cityCompData = await apiClient.get(`/market/compare?crop=${encodeURIComponent(crop)}`)
      
      if (cityCompData && Array.isArray(cityCompData)) {
        setCityComparison(cityCompData)
        console.log(`✅ Updated city comparison for ${crop}`)
      } else {
        setCityComparison([])
      }
    } catch (err) {
      console.error('❌ Failed to update crop data:', err)
      setTrends([])
      setCityComparison([])
    }
  }

  const proceedToAnalytics = () => {
    setViewMode('ANALYTICS')
    fetchAnalyticsData()
  }

  const selectedTrend = useMemo(() => {
    return trends.find(t => t.commodity === selectedCrop)
  }, [trends, selectedCrop])

  const chartData = useMemo(() => {
    if (!selectedTrend) return null
    return {
      labels: selectedTrend.history.map(h => h.date),
      datasets: [
        {
          label: `${selectedCrop} Price Trend (₹)`,
          data: selectedTrend.history.map(h => h.price),
          fill: true,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }
      ]
    }
  }, [selectedTrend, selectedCrop])

  const barChartData = useMemo(() => {
    const topCrops = comparisonData.slice(0, 6)
    return {
      labels: topCrops.map(c => c.commodity),
      datasets: [
        {
          label: 'Price Variance (₹)',
          data: topCrops.map(c => c.variance || 0),
          backgroundColor: topCrops.map(c => (c.variance || 0) >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
          borderRadius: 12,
        }
      ]
    }
  }, [comparisonData])

  const cityComparisonChart = useMemo(() => {
    const topCities = cityComparison.slice(0, 8)
    return {
      labels: topCities.map(c => c.market),
      datasets: [
        {
          label: 'Avg Price (₹)',
          data: topCities.map(c => c.modal_price),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderRadius: 12,
        }
      ]
    }
  }, [cityComparison])

  return (
    <div className="p-4 md:p-8 space-y-10 max-w-7xl mx-auto min-h-screen bg-[#F9FAFB]/50">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-green-500/20 to-transparent"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-500 rounded-2xl shadow-xl shadow-green-500/20">
              <Sparkles size={28} className="text-white fill-white" />
            </div>
            <span className="text-xs font-black tracking-[0.2em] uppercase text-green-400">Advanced Intelligence</span>
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tight leading-tight">
            Market <span className="text-green-500">Predictive</span> Analytics
          </h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed">
            {viewMode === 'CITY_SELECTION' ? 'Select a strategic regional hub to begin your deep-dive market analysis.' :
              viewMode === 'MARKET_SELECTION' ? `Refine your scope by selecting specific markets within ${selectedCity || 'the selected city'}.` :
              viewMode === 'NEARBY_MARKETS' ? 'Explore nearby markets with real-time navigation and contact information.' :
                'Harnessing real-time data and historical trends to provide actionable agricultural insights.'}
          </p>
          
          {/* Data Provenance */}
          {dataTimestamp && dataSource && (
            <div className="mt-6 flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
              <span>•</span>
              <span>Source: {dataSource}</span>
              <span>•</span>
              <span>Updated: {new Date(dataTimestamp).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12">
          <Activity size={400} />
        </div>
      </div>

      {/* STRICT LOCATION VALIDATION */}
      {locationStatus === 'detecting' || locationLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
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
              Detecting Your Location...
            </h2>
            <p className="text-gray-500 text-lg font-medium">Advanced analytics require precise location data</p>
          </div>
        </div>
      ) : locationStatus === 'failed' ? (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-2xl rounded-[4rem] p-16 border border-white shadow-2xl text-center space-y-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full -mr-32 -mt-32 opacity-50"></div>

            <div className="w-28 h-28 bg-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-red-200 rotate-12">
              <AlertCircle className="text-white" size={56} />
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-black text-gray-900 tracking-tight">
                Location Required for <span className="text-red-600">Analytics</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
                {locationError || 'Advanced market analytics require your precise location to provide accurate, region-specific insights.'}
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.hash = '#/market'}
                className="px-10 py-5 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all shadow-xl shadow-green-200"
              >
                Set Location
              </button>
            </div>
          </motion.div>
        </div>
      ) : !isLocationValid ? (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-blue-600 rounded-3xl p-8 text-white text-center shadow-xl shadow-blue-600/20">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Info size={32} />
              </div>
              <div>
                <h3 className="font-bold text-2xl">Location Setup Required</h3>
                <p className="text-blue-100 text-lg">Advanced analytics need your location for accurate market intelligence.</p>
              </div>
            </div>
            <button
              onClick={() => window.location.hash = '#/market'}
              className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-50 transition-all active:scale-95"
            >
              Configure Location
            </button>
          </div>
        </div>
      ) : null}

      {/* Navigation Breadcrumbs */}
      <AnimatePresence>
        {isLocationValid && viewMode !== 'CITY_SELECTION' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 text-sm font-bold"
          >
            <button
              onClick={() => setViewMode('CITY_SELECTION')}
              className="text-slate-400 hover:text-green-600 transition-colors flex items-center gap-2"
            >
              <Globe size={16} /> Cities
            </button>
            <ChevronRight size={16} className="text-slate-300" />
            {viewMode === 'MARKET_SELECTION' ? (
              <span className="text-slate-900 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">{selectedCity} Markets</span>
            ) : viewMode === 'NEARBY_MARKETS' ? (
              <span className="text-slate-900 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">Nearby Markets</span>
            ) : (
              <>
                <button
                  onClick={() => setViewMode('MARKET_SELECTION')}
                  className="text-slate-400 hover:text-green-600 transition-colors"
                >
                  {selectedCity} Markets
                </button>
                <ChevronRight size={16} className="text-slate-300" />
                <span className="text-slate-900 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">Intelligence Report</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Sections - Only show if location is valid */}
      {isLocationValid && (
        <AnimatePresence mode="wait">
          {viewMode === 'CITY_SELECTION' && (
            <motion.div
              key="city-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">Regional Hubs</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{allCities.length} Regions Active</span>
                  </div>
                  <button
                    onClick={() => setViewMode('NEARBY_MARKETS')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-green-700 transition-all shadow-lg"
                  >
                    <Navigation size={18} />
                    Nearby Markets
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allCities.length > 0 ? allCities.map((city, idx) => (
                  <motion.div
                    key={`${city.city}-${city.state}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleCitySelect(city.city)}
                    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-green-900/5 hover:-translate-y-2 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 group-hover:bg-green-600 transition-colors duration-500 opacity-20 group-hover:opacity-10"></div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-green-600 transition-colors">
                          {city.city}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{city.state}</p>
                      </div>
                      <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-green-600 group-hover:text-white rounded-2xl transition-all duration-500">
                        <BarChart3 size={24} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Analyze Hub</span>
                      <div className="flex items-center text-green-600 text-xs font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                        Select <ChevronRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-full py-20 text-center bg-white/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Globe size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">No regional hubs available</h3>
                    <p className="text-gray-500 font-medium">Please check your connection and try again.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {viewMode === 'NEARBY_MARKETS' && (
            <motion.div
              key="nearby-markets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Nearby Markets</h2>
                  <p className="text-slate-500 font-medium">Real-time market locations with navigation support</p>
                </div>
                <button
                  onClick={() => setViewMode('CITY_SELECTION')}
                  className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-100 text-slate-700 rounded-3xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  <ArrowLeft size={20} /> Back to Hubs
                </button>
              </div>
              
              <NearbyMarketsMap />
            </motion.div>
          )}

        {viewMode === 'MARKET_SELECTION' && (
          <motion.div
            key="market-selection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Markets in {selectedCity}</h2>
                <p className="text-slate-500 font-medium">Select specific commodities to generate intelligence reports.</p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={() => setViewMode('CITY_SELECTION')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-100 text-slate-700 rounded-3xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  <ArrowLeft size={20} /> Back
                </button>
                {selectedMarkets.length > 0 && (
                  <button
                    onClick={proceedToAnalytics}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-green-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all shadow-xl shadow-green-600/20"
                  >
                    Generate Report <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-40 bg-white/40 rounded-[2rem] animate-pulse border border-slate-100" />
                ))
              ) : availableMarkets.length > 0 ? (
                availableMarkets.map((market, idx) => {
                  const isSelected = selectedMarkets.find(m => m.id === market.id)
                  return (
                    <motion.div
                      key={market.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleMarketToggle(market)}
                      className={`p-6 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer relative overflow-hidden ${isSelected
                        ? 'border-green-500 bg-green-50/50 shadow-xl shadow-green-900/5'
                        : 'border-white bg-white hover:border-green-200 shadow-sm'
                        }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 p-4">
                          <div className="bg-green-600 text-white p-1 rounded-full">
                            <Target size={14} />
                          </div>
                        </div>
                      )}
                      <div className="mb-6">
                        <h3 className="text-xl font-black text-slate-900">{market.commodity}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{market.variety}</p>
                      </div>
                      <div className="flex justify-between items-end pt-6 border-t border-slate-100/50">
                        <div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Modal Price</p>
                          <p className="text-2xl font-black text-slate-900">₹{market.modal_price?.toLocaleString()}</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${market.trend === 'up' ? 'bg-green-100 text-green-700' :
                          market.trend === 'down' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                          {market.trend === 'up' ? '↗ Rising' :
                            market.trend === 'down' ? '↘ Falling' :
                              '→ Stable'}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <div className="col-span-full py-24 text-center bg-white/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 font-bold text-lg">No market data available for {selectedCity}.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {viewMode === 'ANALYTICS' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* VALIDATION BLOCK - Only show analytics if we have valid data */}
            {!canProceedWithAnalytics ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-yellow-600" size={32} />
                </div>
                <h3 className="text-xl font-black text-yellow-900 mb-2">Insufficient Data for Analytics</h3>
                <p className="text-yellow-700 font-medium mb-6">
                  Analytics require valid location data and selected markets. Please ensure:
                </p>
                <ul className="text-left text-yellow-700 text-sm space-y-2 max-w-md mx-auto mb-6">
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isLocationValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    Location detected: {isLocationValid ? '✓' : '✗'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedCity ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    City selected: {selectedCity ? '✓' : '✗'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedMarkets.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    Markets selected: {selectedMarkets.length > 0 ? '✓' : '✗'}
                  </li>
                </ul>
                <button
                  onClick={() => setViewMode('CITY_SELECTION')}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-yellow-700 transition-all"
                >
                  Complete Setup
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Charts */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Trend Analysis Card */}
                  <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-900/5 border border-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-900">Price Dynamics</h2>
                          {selectedCrop && (
                            <p className="text-xs text-slate-400 uppercase tracking-widest">Active: {selectedCrop}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
                        {comparisonData.length > 0 ? comparisonData.map(t => (
                          <button
                            key={t.commodity}
                            onClick={() => handleCropSelect(t.commodity)}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCrop === t.commodity
                              ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20'
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }`}
                          >
                            {t.commodity}
                          </button>
                        )) : (
                          <div className="text-xs text-slate-400 font-bold">Loading commodities...</div>
                        )}
                      </div>
                    </div>

                    <div className="h-[400px]">
                      {chartData && selectedTrend ? (
                        <Line
                          data={chartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { 
                              legend: { display: false },
                              title: {
                                display: true,
                                text: `${selectedCrop} - ${selectedCity} Market Trend`,
                                font: { weight: 'bold' }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: false,
                                grid: { color: '#F1F5F9', drawBorder: false },
                                ticks: { font: { weight: 'bold' }, color: '#94A3B8' }
                              },
                              x: {
                                grid: { display: false },
                                ticks: { font: { weight: 'bold' }, color: '#94A3B8' }
                              }
                            }
                          }}
                        />
                      ) : isLoading ? (
                        <div className="h-full flex items-center justify-center text-slate-400 font-bold">
                          <div className="animate-spin w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full mr-3"></div>
                          Loading trend data...
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold">
                          <AlertCircle size={48} className="mb-4" />
                          <p>No trend data available</p>
                          <p className="text-xs mt-2">Select a commodity to view price trends</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Regional Comparison Card */}
                  <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-900/5 border border-white">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <Layers size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">Regional Benchmark</h2>
                        {selectedCrop && cityComparison.length > 0 && (
                          <p className="text-xs text-slate-400 uppercase tracking-widest">
                            {selectedCrop} across {cityComparison.length} markets
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="h-[300px]">
                      {cityComparison.length > 0 && cityComparisonChart ? (
                        <Bar
                          data={cityComparisonChart}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { 
                              legend: { display: false },
                              title: {
                                display: true,
                                text: `${selectedCrop || 'Commodity'} Price Comparison Across Markets`,
                                font: { weight: 'bold' }
                              }
                            },
                            scales: {
                              y: {
                                grid: { color: '#F1F5F9', drawBorder: false },
                                ticks: { font: { weight: 'bold' }, color: '#94A3B8' }
                              },
                              x: {
                                grid: { display: false },
                                ticks: { font: { weight: 'bold' }, color: '#94A3B8' }
                              }
                            }
                          }}
                        />
                      ) : isLoading ? (
                        <div className="h-full flex items-center justify-center text-slate-400 font-bold">
                          <div className="animate-spin w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full mr-3"></div>
                          Loading regional data...
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold">
                          <BarChart3 size={48} className="mb-4" />
                          <p>No regional comparison data</p>
                          <p className="text-xs mt-2">Data will appear once commodity is selected</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Heatmap Integration */}
                  <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-900/5 border border-white">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-slate-900 text-white rounded-2xl">
                        <MapIcon size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">Geospatial Intelligence</h2>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">Interactive market mapping</p>
                      </div>
                    </div>
                    <div className="rounded-[2rem] overflow-hidden border border-slate-100 grayscale hover:grayscale-0 transition-all duration-700">
                      <InteractiveMarketMap />
                    </div>
                  </div>
                </div>

                {/* Right Column: Insights & Actions */}
                <div className="space-y-8">
                  {/* AI Insights Card */}
                  <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-900/5 border border-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <Zap size={80} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                      <Zap size={24} className="text-green-600 fill-green-600" />
                      Smart Insights
                    </h2>
                    <div className="space-y-6">
                      {/* Dynamic insights based on actual data */}
                      {selectedCrop && comparisonData.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-6 bg-green-50 rounded-[2rem] border border-green-100"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                              <TrendingUp className="text-green-600" size={20} />
                            </div>
                            <div>
                              <p className="font-black text-green-900 text-sm">Market Analysis</p>
                              <p className="text-green-700 text-xs mt-2 leading-relaxed font-medium">
                                {selectedCrop} in {selectedCity}: Current modal price ₹{comparisonData[0]?.modal_price?.toLocaleString() || 'N/A'}. 
                                {comparisonData[0]?.variance > 0 ? 
                                  ` Trading ${Math.abs(comparisonData[0].variance).toFixed(0)}₹ above regional average.` :
                                  ` Trading ${Math.abs(comparisonData[0]?.variance || 0).toFixed(0)}₹ below regional average.`
                                }
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {selectedMarkets.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                              <Info className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <p className="font-black text-blue-900 text-sm">Market Coverage</p>
                              <p className="text-blue-700 text-xs mt-2 leading-relaxed font-medium">
                                Analyzing {selectedMarkets.length} market{selectedMarkets.length > 1 ? 's' : ''} in {selectedCity}. 
                                {trends.length > 0 ? 
                                  ` Historical data shows ${trends[0]?.history?.length || 0} days of price movement.` :
                                  ' Gathering historical trend data...'
                                }
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Location-based insight */}
                      {userLocation && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="p-6 bg-purple-50 rounded-[2rem] border border-purple-100"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                              <MapPin className="text-purple-600" size={20} />
                            </div>
                            <div>
                              <p className="font-black text-purple-900 text-sm">Location Intelligence</p>
                              <p className="text-purple-700 text-xs mt-2 leading-relaxed font-medium">
                                Your location: {userLocation.city}, {userLocation.state || userLocation.country}. 
                                Coordinates: {userLocation.latitude?.toFixed(4)}, {userLocation.longitude?.toFixed(4)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Market Variance Card */}
                  {comparisonData.length > 0 && (
                    <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-900/5 border border-white">
                      <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                        <PieChart size={24} className="text-slate-900" />
                        Market Variance
                      </h2>
                      <div className="h-64">
                        {barChartData ? (
                          <Bar
                            data={barChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { 
                                legend: { display: false },
                                title: {
                                  display: true,
                                  text: `Price Variance Analysis - ${selectedCity}`,
                                  font: { weight: 'bold' }
                                }
                              },
                              scales: {
                                y: {
                                  grid: { color: '#F1F5F9', drawBorder: false },
                                  ticks: { font: { weight: 'bold' }, color: '#94A3B8' }
                                },
                                x: {
                                  grid: { display: false },
                                  ticks: { font: { weight: 'bold' }, color: '#94A3B8' }
                                }
                              }
                            }}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 font-bold">
                            Loading variance analysis...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Data Provenance Card */}
                  <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black mb-4">Data Integrity</h3>
                      <div className="space-y-3 text-sm text-slate-400 mb-8">
                        <div className="flex justify-between">
                          <span>Location Source:</span>
                          <span className="text-white font-bold">
                            {userLocation ? 'GPS + Backend Resolution' : 'Not Set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Market Data:</span>
                          <span className="text-white font-bold">
                            {dataSource || 'Backend API'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span className="text-white font-bold">
                            {dataTimestamp ? new Date(dataTimestamp).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Analytics Status:</span>
                          <span className="text-green-400 font-bold">
                            {canProceedWithAnalytics ? 'Active' : 'Pending Setup'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => fetchAnalyticsData()}
                        disabled={!canProceedWithAnalytics || isLoading}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-600/20"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Refreshing Data
                          </>
                        ) : (
                          <>
                            <ArrowRight size={18} />
                            Refresh Analytics
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </div>
  )
}

export default AdvancedFeatures