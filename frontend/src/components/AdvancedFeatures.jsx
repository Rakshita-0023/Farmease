import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, BarChart3, PieChart, Info, AlertCircle, Map as MapIcon, ArrowRight, Zap } from 'lucide-react'
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
  const { location: userLocation } = useLocation()
  const [trends, setTrends] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [comparisonData, setComparisonData] = useState([])

  useEffect(() => {
    const fetchAdvancedData = async () => {
      setIsLoading(true)
      try {
        // Fetch trends
        const trendData = await apiClient.get('/market/trends')
        setTrends(trendData || [])
        if (trendData?.length > 0) setSelectedCrop(trendData[0].commodity)

        // Fetch comparison
        const compData = await apiClient.get('/market/compare?location=Telangana')
        setComparisonData(compData || [])
      } catch (err) {
        console.error('Failed to fetch advanced data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAdvancedData()
  }, [])

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
          data: topCrops.map(c => c.variance),
          backgroundColor: topCrops.map(c => c.variance >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
          borderRadius: 8,
        }
      ]
    }
  }, [comparisonData])

  if (!userLocation) {
    return (
      <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center max-w-2xl mx-auto mt-12">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapIcon size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Location Required</h2>
          <p className="text-gray-500 mb-8">
            Advanced market intelligence and predictive analytics require an active location. Please select your city in the Market page or via the location detector.
          </p>
          <a
            href="/market"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
          >
            Go to Market Page
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    )
  }

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
            Deep analytics and predictive trends to help you make better selling decisions.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12">
          <TrendingUp size={300} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Price Trends Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp size={24} className="text-green-600" />
                Price Trends
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
                    <p className="text-blue-700 text-xs mt-1">Prices for {selectedCrop} are expected to rise by 5-8% in the next 2 weeks.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-orange-600 mt-1" size={20} />
                  <div>
                    <p className="font-bold text-orange-900 text-sm">Volatility Alert</p>
                    <p className="text-orange-700 text-xs mt-1">High price fluctuations detected in neighboring districts.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Comparison Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BarChart3 size={24} className="text-green-600" />
              Market Variance
            </h2>
            <div className="h-64">
              {comparisonData.length > 0 ? (
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
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">Loading comparison...</div>
              )}
            </div>
          </div>

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
    </div>
  )
}

export default AdvancedFeatures