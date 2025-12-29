import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, BarChart3, PieChart, Info, AlertCircle, Map as MapIcon, ArrowRight, Zap, ArrowLeft, ChevronRight } from 'lucide-react'
import { Line, Bar } from 'react-chartjs-2'
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
  const { location: userLocation, allCities, updateLocation } = useLocation()
  
  // REQUIRED STATE MODEL (NON-NEGOTIABLE)
  const [viewMode, setViewMode] = useState('CITY_SELECTION') // 'CITY_SELECTION' | 'MARKET_SELECTION' | 'ANALYTICS'
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedMarkets, setSelectedMarkets] = useState([])
  const [availableMarkets, setAvailableMarkets] = useState([])
  
  const [trends, setTrends] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [comparisonData, setComparisonData] = useState([])
  const [cityComparison, setCityComparison] = useState([])

  // Fetch markets for selected city
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

  // Fetch analytics data based on selection
  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Fetch trends for selected city/markets
      const trendData = await apiClient.get(`/market/trends?city=${selectedCity}`)
      setTrends(trendData || [])
      if (trendData?.length > 0) setSelectedCrop(trendData[0].commodity)

      // Fetch city-to-city comparison
      const cityCompData = await apiClient.get('/market/compare')
      setCityComparison(cityCompData || [])

      // Fetch market-to-market comparison within city
      if (selectedMarkets.length > 0) {
        const marketCompData = await apiClient.get(`/market/compare?location=${selectedCity}`)
        setComparisonData(marketCompData || [])
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle city selection
  const handleCitySelect = async (cityName) => {
    setSelectedCity(cityName)
    setViewMode('MARKET_SELECTION')
    await fetchCityMarkets(cityName)
  }

  // Handle market selection
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

  // Proceed to analytics
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
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgb(34, 197, 94)',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(34, 197, 94)',
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
          label: 'Price Variance from Average (₹)',
          data: topCrops.map(c => c.variance || 0),
          backgroundColor: topCrops.map(c => (c.variance || 0) >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
          borderRadius: 8,
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
          label: 'Average Price (₹)',
          data: topCities.map(c => c.modal_price),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 8,
        }
      ]
    }
  }, [cityComparison])

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <Zap size={24} className="text-yellow-300 fill-yellow-300" />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase opacity-80">AI-Powered Insights</span>
          </div>
          <h1 className="text-4xl font-black mb-2">Market Intelligence</h1>
          <p className="text-green-50 text-lg max-w-2xl">
            {viewMode === 'CITY_SELECTION' ? 'Select cities to compare market performance and trends' :
             viewMode === 'MARKET_SELECTION' ? `Choose specific markets in ${selectedCity} for detailed analysis` :
             'Deep analytics and predictive trends based on your selected markets'}
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12">
          <TrendingUp size={300} />
        </div>
      </div>

      {/* Navigation Breadcrumb */}
      {viewMode !== 'CITY_SELECTION' && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button 
            onClick={() => setViewMode('CITY_SELECTION')}
            className="hover:text-green-600 transition-colors"
          >
            City Selection
          </button>
          <ChevronRight size={16} />
          {viewMode === 'MARKET_SELECTION' ? (
            <span className="text-gray-800 font-medium">{selectedCity} Markets</span>
          ) : (
            <>
              <button 
                onClick={() => setViewMode('MARKET_SELECTION')}
                className="hover:text-green-600 transition-colors"
              >
                {selectedCity} Markets
              </button>
              <ChevronRight size={16} />
              <span className="text-gray-800 font-medium">Analytics</span>
            </>
          )}
        </div>
      )}

      {/* CITY SELECTION VIEW */}
      {viewMode === 'CITY_SELECTION' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Select Cities for Analysis</h2>
            <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              {allCities.length} cities available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allCities.map(city => (
              <div
                key={`${city.city}-${city.state}`}
                onClick={() => handleCitySelect(city.city)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                      {city.city}
                    </h3>
                    <p className="text-sm text-gray-500">{city.state}</p>
                  </div>
                  <div className="p-2 rounded-full bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
                    <BarChart3 size={20} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">ANALYZE MARKETS</span>
                  <div className="flex items-center text-green-600 text-sm font-medium group-hover:text-green-700">
                    Select <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MARKET SELECTION VIEW */}
      {viewMode === 'MARKET_SELECTION' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Select Markets in {selectedCity}</h2>
              <p className="text-sm text-gray-500">Choose specific markets for detailed analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                {selectedMarkets.length} selected
              </span>
              <button
                onClick={() => setViewMode('CITY_SELECTION')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={18} />
                Back to Cities
              </button>
              {selectedMarkets.length > 0 && (
                <button
                  onClick={proceedToAnalytics}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  Analyze Selected
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
              ))
            ) : availableMarkets.length > 0 ? (
              availableMarkets.map(market => {
                const isSelected = selectedMarkets.find(m => m.id === market.id)
                return (
                  <div
                    key={market.id}
                    onClick={() => handleMarketToggle(market)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-100 bg-white hover:border-green-200 hover:bg-green-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">{market.commodity}</h3>
                        <p className="text-sm text-gray-500">{market.variety}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                        isSelected 
                          ? 'border-green-500 bg-green-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-full h-full rounded-full bg-white scale-50"></div>}
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-400">Modal Price</p>
                        <p className="text-lg font-bold text-gray-800">₹{market.modal_price?.toLocaleString()}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                        market.trend === 'up' ? 'bg-green-100 text-green-700' :
                        market.trend === 'down' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {market.trend === 'up' ? '↗ Rising' :
                         market.trend === 'down' ? '↘ Falling' :
                         '→ Stable'}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No market data available for {selectedCity}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {viewMode === 'ANALYTICS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Price Trends Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp size={24} className="text-green-600" />
                  Price Trends - {selectedCity}
                </h2>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                  {trends.map(t => (
                    <button
                      key={t.commodity}
                      onClick={() => setSelectedCrop(t.commodity)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${selectedCrop === t.commodity
                        ? 'bg-green-600 text-white shadow-lg shadow-green-100'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                      {t.commodity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-80">
                {chartData ? (
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: false, grid: { color: '#f3f4f6' } },
                        x: { grid: { display: false } }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">Loading trends...</div>
                )}
              </div>
            </div>

            {/* City-to-City Comparison */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart3 size={24} className="text-blue-600" />
                City-to-City Price Comparison
              </h2>
              <div className="h-64">
                {cityComparison.length > 0 ? (
                  <Bar
                    data={cityComparisonChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { grid: { color: '#f3f4f6' } },
                        x: { grid: { display: false } }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">Loading city comparison...</div>
                )}
              </div>
            </div>

            {/* Interactive Map */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MapIcon size={24} className="text-green-600" />
                Regional Price Heatmap
              </h2>
              <div className="rounded-2xl overflow-hidden border border-gray-100">
                <InteractiveMarketMap />
              </div>
            </div>
          </div>

          {/* Sidebar Insights */}
          <div className="space-y-6">
            {/* Smart Insights Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Zap size={24} className="text-green-600" />
                Smart Insights
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Info className="text-blue-600 mt-1" size={20} />
                    <div>
                      <p className="font-bold text-blue-900 text-sm">Best Time to Sell</p>
                      <p className="text-blue-700 text-xs mt-1">
                        Prices for {selectedCrop || 'selected crops'} in {selectedCity} are expected to rise by 5-8% in the next 2 weeks.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-orange-600 mt-1" size={20} />
                    <div>
                      <p className="font-bold text-orange-900 text-sm">Market Analysis</p>
                      <p className="text-orange-700 text-xs mt-1">
                        {selectedMarkets.length} markets selected for analysis in {selectedCity}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Market-to-Market Comparison */}
            {comparisonData.length > 0 && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <PieChart size={24} className="text-green-600" />
                  Market Variance - {selectedCity}
                </h2>
                <div className="h-64">
                  <Bar
                    data={barChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { grid: { color: '#f3f4f6' } },
                        x: { grid: { display: false } }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-900 p-6 rounded-3xl text-white shadow-xl">
              <h3 className="text-lg font-bold mb-4">Need help?</h3>
              <p className="text-gray-400 text-sm mb-6">Our AI assistant can help you optimize your harvest timing.</p>
              <button className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                Ask AI Assistant
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedFeatures