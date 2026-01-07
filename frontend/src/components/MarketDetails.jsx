import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, Phone, Globe, AlertCircle, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { apiClient } from '../config'

const MarketDetails = () => {
  const { marketId } = useParams()
  const navigate = useNavigate()
  
  const [marketData, setMarketData] = useState({
    market: null,
    prices: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    if (marketId) {
      fetchMarketDetails()
    }
  }, [marketId])

  const fetchMarketDetails = async () => {
    try {
      setMarketData(prev => ({ ...prev, loading: true, error: null }))
      
      console.log(`🔍 Fetching details for market: ${marketId}`)
      
      const response = await apiClient.get(`/markets/${marketId}/prices`)
      
      setMarketData({
        market: response.market,
        prices: response.prices || [],
        metadata: response.metadata,
        loading: false,
        error: null
      })
      
      console.log(`✅ Loaded market details: ${response.market?.name}`)
      
    } catch (error) {
      console.error('❌ Failed to fetch market details:', error)
      setMarketData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load market details. Please try again.'
      }))
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (marketData.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Market Details</h2>
          <p className="text-gray-600">Fetching live crop prices...</p>
        </div>
      </div>
    )
  }

  if (marketData.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Market</h2>
          <p className="text-gray-600 mb-6">{marketData.error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchMarketDetails}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/market')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/market')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{market?.name || 'Market Details'}</h1>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{market?.address || `${market?.city}, ${market?.state}`}</span>
              </div>
            </div>
          </div>
          
          {/* Market Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Total Crops</div>
              <div className="text-2xl font-bold text-green-700">{metadata?.total_crops || 0}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Data Source</div>
              <div className="text-sm font-semibold text-blue-700">AGMARKNET (Govt)</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">Last Updated</div>
              <div className="text-sm font-semibold text-orange-700">
                {metadata?.last_updated ? new Date(metadata.last_updated).toLocaleDateString('en-IN') : 'Today'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {prices.length > 0 ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Live Crop Prices</h2>
                <p className="text-gray-600 mt-1">
                  {metadata?.unit || 'Prices in ₹ per Quintal (100 kg)'}
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {prices.map((crop, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{crop.commodity}</h3>
                          {crop.variety && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                              {crop.variety}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Market: {crop.market_name || market?.name}</div>
                          <div>Range: ₹{crop.min_price} - ₹{crop.max_price}</div>
                          <div>Date: {crop.date || new Date().toLocaleDateString('en-IN')}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          ₹{crop.modal_price}
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${getTrendColor(crop.trend)}`}>
                          {getTrendIcon(crop.trend)}
                          <span className="capitalize">{crop.trend || 'stable'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${market?.lat},${market?.lng}`
                    window.open(url, '_blank')
                  }}
                  className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <MapPin className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium text-green-700">Get Directions</div>
                    <div className="text-sm text-green-600">Navigate to market</div>
                  </div>
                </button>
                
                {market?.phone && (
                  <button
                    onClick={() => window.open(`tel:${market.phone}`, '_self')}
                    className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium text-blue-700">Call Market</div>
                      <div className="text-sm text-blue-600">{market.phone}</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Price Data Available</h3>
            <p className="text-gray-600 mb-6">
              {metadata?.note || 'No crop prices are currently available for this market.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={fetchMarketDetails}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Refresh Data
              </button>
              <div className="text-sm text-gray-500">
                Data source: {metadata?.data_source || 'AGMARKNET (Government of India)'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MarketDetails