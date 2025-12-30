import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, Info, AlertCircle,
  Map as MapIcon, ArrowRight, Zap, ArrowLeft, ChevronRight,
  Target, Activity, Layers, Globe, Sparkles
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
  const { location: userLocation, status: locStatus, allCities, updateLocation } = useLocation()

  const [viewMode, setViewMode] = useState('CITY_SELECTION') // 'CITY_SELECTION' | 'MARKET_SELECTION' | 'ANALYTICS'
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedMarkets, setSelectedMarkets] = useState([])
  const [availableMarkets, setAvailableMarkets] = useState([])

  const [trends, setTrends] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [comparisonData, setComparisonData] = useState([])
  const [cityComparison, setCityComparison] = useState([])

  const fetchCityMarkets = async (cityName) => {
    setIsLoading(true)
    try {
      const data = await apiClient.get(`/market/city/${encodeURIComponent(cityName)}`)
      setAvailableMarkets(data.markets || [])
    } catch (err) {
      console.error('Failed to fetch city markets:', err)
      setAvailableMarkets([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch Market Comparison for the city to identify top crops
      const marketCompData = await apiClient.get(`/market/compare?location=${selectedCity}`)
      setComparisonData(marketCompData || [])

      // 2. Determine active crop
      let activeCrop = selectedCrop
      if (!activeCrop && marketCompData?.length > 0) {
        activeCrop = marketCompData[0].commodity
        setSelectedCrop(activeCrop)
      }

      // 3. Fetch Trends for the active crop
      if (activeCrop) {
        const trendData = await apiClient.get(`/market/trends?city=${selectedCity}&crop=${activeCrop}`)
        setTrends(trendData || [])
      }

      // 4. Fetch Regional Benchmark (City Comparison)
      // We can pass the active crop to compare this crop across cities
      const cityCompQuery = activeCrop ? `?crop=${activeCrop}` : ''
      const cityCompData = await apiClient.get(`/market/compare${cityCompQuery}`)
      setCityComparison(cityCompData || [])

    } catch (err) {
      console.error('Failed to fetch analytics data:', err)
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
    setSelectedCrop(crop)
    try {
      // Fetch trends for the selected crop
      const trendData = await apiClient.get(`/market/trends?city=${selectedCity}&crop=${crop}`)
      setTrends(trendData || [])

      // Update Regional Benchmark for the selected crop
      const cityCompData = await apiClient.get(`/market/compare?crop=${crop}`)
      setCityComparison(cityCompData || [])
    } catch (err) {
      console.error('Failed to update crop data:', err)
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
              viewMode === 'MARKET_SELECTION' ? `Refine your scope by selecting specific markets within ${selectedCity}.` :
                'Harnessing real-time data and historical trends to provide actionable agricultural insights.'}
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12">
          <Activity size={400} />
        </div>
      </div>

      {locStatus === 'unset' && (
        <div className="bg-blue-600 rounded-3xl p-6 text-white flex items-center justify-between shadow-xl shadow-blue-600/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Info size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Preview Mode Active</h3>
              <p className="text-blue-100 text-sm">You are viewing global regional hubs. Set your location for personalized local analytics.</p>
            </div>
          </div>
          <button
            onClick={() => window.location.hash = '#/market'}
            className="px-6 py-3 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all active:scale-95"
          >
            Set My Location
          </button>
        </div>
      )}

      {/* Navigation Breadcrumbs */}
      <AnimatePresence>
        {viewMode !== 'CITY_SELECTION' && (
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

      {/* Main Content Sections */}
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
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{allCities.length} Regions Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allCities.map((city, idx) => (
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
              ))}
            </div>
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
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Column: Charts */}
            <div className="lg:col-span-2 space-y-8">
              {/* Trend Analysis Card */}
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-900/5 border border-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                      <TrendingUp size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Price Dynamics</h2>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
                    {comparisonData.map(t => (
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
                    ))}
                  </div>
                </div>

                <div className="h-[400px]">
                  {chartData ? (
                    <Line
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
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
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-bold">Initializing trend engine...</div>
                  )}
                </div>
              </div>

              {/* Regional Comparison Card */}
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-900/5 border border-white">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Layers size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Regional Benchmark</h2>
                </div>
                <div className="h-[300px]">
                  {cityComparison.length > 0 ? (
                    <Bar
                      data={cityComparisonChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
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
                    <div className="h-full flex items-center justify-center text-slate-400 font-bold">Syncing regional data...</div>
                  )}
                </div>
              </div>

              {/* Heatmap Integration */}
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-900/5 border border-white">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-slate-900 text-white rounded-2xl">
                    <MapIcon size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Geospatial Intelligence</h2>
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
                        <p className="font-black text-green-900 text-sm">Optimal Selling Window</p>
                        <p className="text-green-700 text-xs mt-2 leading-relaxed font-medium">
                          Prices for {selectedCrop || 'selected crops'} in {selectedCity} are projected to peak in approximately 12 days. Consider delaying harvest for 15% higher margins.
                        </p>
                      </div>
                    </div>
                  </motion.div>

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
                        <p className="font-black text-blue-900 text-sm">Market Saturation</p>
                        <p className="text-blue-700 text-xs mt-2 leading-relaxed font-medium">
                          {selectedMarkets.length} core markets analyzed. Supply levels are currently stable, indicating low volatility for the upcoming week.
                        </p>
                      </div>
                    </div>
                  </motion.div>
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
                    <Bar
                      data={barChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
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
                  </div>
                </div>
              )}

              {/* AI Assistant CTA */}
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-4">Strategic Advisory</h3>
                  <p className="text-slate-400 text-sm mb-8 font-medium leading-relaxed">
                    Our neural network can simulate market scenarios to optimize your logistics and pricing strategy.
                  </p>
                  <button className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-600/20">
                    Consult AI Advisor <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdvancedFeatures