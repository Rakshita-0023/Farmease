import { useState, useEffect } from 'react'
import { MapPin, Loader2, AlertCircle, RefreshCw, Navigation, TrendingUp, TrendingDown } from 'lucide-react'
import { useLocation } from '../LocationContext'
import { apiClient } from '../config'

const Market = () => {
  const { location: userLocation, loading: locationLoading, error: locationError } = useLocation()
  
  const [marketData, setMarketData] = useState({
    prices: [],
    markets: [],
    loading: false,
    error: null
  })

  // Fetch data based on user's actual location
  const fetchMarketData = async () => {
    if (!userLocation?.latitude || !userLocation?.longitude) {
      console.log('❌ No user location available')
      return
    }

    setMarketData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      console.log(`🔄 Fetching data for user location: ${userLocation.latitude}, ${userLocation.longitude}`)
      
      // Fetch nearby markets for user's location
      const marketsResponse = await apiClient.get('/market/nearby', {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        radius: 50 // 50km radius
      })

      setMarketData({
        prices: [], // Remove aggregated prices - we'll show market-specific prices
        markets: marketsResponse?.success ? marketsResponse.markets : [],
        loading: false,
        error: null
      })

      console.log(`✅ Loaded ${marketsResponse?.markets?.length || 0} markets`)
      
    } catch (error) {
      console.error('❌ Failed to fetch market data:', error)
      setMarketData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to load market data. Please try again.' 
      }))
    }
  }

  // Load data when user location is available
  useEffect(() => {
    if (userLocation?.latitude && userLocation?.longitude) {
      fetchMarketData()
    }
  }, [userLocation])

  // Show loading while getting location
  if (locationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Getting Your Location</h2>
          <p className="text-gray-600">Please allow location access to find nearby markets</p>
        </div>
      </div>
    )
  }

  // Show error if location failed
  if (locationError || !userLocation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Location Required</h2>
          <p className="text-gray-600 mb-6">
            We need your location to show nearby markets and crop prices in your area.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Enable Location & Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user's actual location */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agricultural Markets</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <MapPin size={16} />
                <span>Your Location: {userLocation.city}, {userLocation.state}</span>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                </span>
              </div>
            </div>
            <button
              onClick={fetchMarketData}
              disabled={marketData.loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={18} className={marketData.loading ? 'animate-spin' : ''} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {marketData.loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Market Data</h3>
            <p className="text-gray-600">Finding crop prices and markets near you...</p>
          </div>
        ) : marketData.error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-6">{marketData.error}</p>
            <button
              onClick={fetchMarketData}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Agricultural Markets Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Navigation className="text-green-600" size={24} />
                  Agricultural Markets Near You
                </h2>
                <p className="text-gray-600 mt-1">
                  {marketData.markets.length} verified agricultural markets within 50km
                </p>
                <div className="mt-3 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-block">
                  📊 Data source: AGMARKNET (Government of India) • Updated daily
                </div>
              </div>
              
              <div className="p-6">
                {marketData.markets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketData.markets.map((market) => (
                      <div key={market.id} className="bg-gray-50 rounded-lg p-5 hover:bg-gray-100 transition-colors cursor-pointer"
                           onClick={() => window.location.href = `/market/${market.id}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {market.name === 'Unknown' ? 'Unverified Market' : market.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {market.address || `${market.city}, ${market.state}`}
                            </p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                            {market.distance}km
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin size={14} className="mr-2" />
                            <span>{market.marketType || 'Agricultural Market'}</span>
                          </div>
                          {market.has_live_prices ? (
                            <div className="flex items-center text-sm text-green-600">
                              <TrendingUp size={14} className="mr-2" />
                              <span>Live prices available</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-sm text-gray-500">
                              <AlertCircle size={14} className="mr-2" />
                              <span>Contact for current rates</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${market.lat},${market.lng}`
                              window.open(url, '_blank')
                            }}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <Navigation size={12} />
                            Directions
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/market/${market.id}`
                            }}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            View Prices
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Agricultural Markets Found</h3>
                    <p className="text-gray-600 mb-6">
                      No verified agricultural markets found within 50km of your location.
                    </p>
                    <button
                      onClick={fetchMarketData}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Search Again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            {marketData.markets.length > 0 && (
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{marketData.markets.length}</div>
                    <div className="text-sm text-gray-600">Agricultural Markets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {marketData.markets.filter(m => m.has_live_prices).length}
                    </div>
                    <div className="text-sm text-gray-600">With Live Prices</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {marketData.markets.length > 0 ? 
                        `${Math.round(marketData.markets.reduce((sum, m) => sum + m.distance, 0) / marketData.markets.length)}km` : 
                        '0km'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Average Distance</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Market