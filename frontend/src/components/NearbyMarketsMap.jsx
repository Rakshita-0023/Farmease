import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Navigation, Phone, Clock, Star, MapPin, ExternalLink, RefreshCw, Shield, Zap, Info, Loader2 } from 'lucide-react'
import { apiClient } from '../config'
import { useFarmLocation } from '../hooks/useFarmLocation'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Custom premium icons
const UserIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-pulse">
          <div class="w-2 h-2 bg-white rounded-full"></div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const MarketIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-10 h-10 bg-green-600 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

// Component to handle map center and zoom
const MapController = ({ center, markers }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const group = new L.featureGroup([
        L.marker(center),
        ...markers.map(m => L.marker([m.lat, m.lng]))
      ]);
      map.fitBounds(group.getBounds().pad(0.2));
    } else {
      map.setView(center, 12);
    }
  }, [center, markers, map]);

  return null;
};

const NearbyMarketsMap = () => {
  const { location: userLocation } = useFarmLocation()
  const [nearbyMarkets, setNearbyMarkets] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState(null)
  const [radius, setRadius] = useState(50) // Increased default radius to 50km
  const [error, setError] = useState(null)
  const [dataSource, setDataSource] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchNearbyMarkets = useCallback(async () => {
    if (!userLocation?.latitude || !userLocation?.longitude) return

    setLoading(true)
    setError(null)
    try {
      console.log('🗺️ Fetching nearby markets with STRICT VERIFICATION...')
      
      const response = await apiClient.get('/market/nearby', {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        radius: radius,
        require_verified: true, // STRICT: Only verified markets
        include_validation: true // Request validation metadata
      })

      if (response.success) {
        setNearbyMarkets(response.markets || [])
        setDataSource(response.dataSource || 'Agricultural Market Providers')
        setLastUpdated(response.timestamp || new Date().toISOString())
        
        // STRICT VERIFICATION: Check if all markets passed verification
        const verificationErrors = response.verification?.errors || []
        if (verificationErrors.length > 0) {
          console.warn('⚠️ Market verification issues:', verificationErrors)
          setError(`Verification issues: ${verificationErrors.slice(0, 2).join(', ')}${verificationErrors.length > 2 ? '...' : ''}`)
        }
        
        if (response.markets?.length === 0) {
          setError(`No verified markets found within ${radius}km of ${userLocation.city}.`)
        }
        
        console.log(`✅ VERIFIED: ${response.markets?.length || 0} markets passed strict verification`)
      } else {
        throw new Error(response.error || 'Failed to fetch markets')
      }
    } catch (error) {
      console.error('❌ Failed to fetch nearby markets:', error)
      setError('Unable to connect to market intelligence service.')
      setNearbyMarkets([])
      setDataSource(null)
      setLastUpdated(null)
    } finally {
      setLoading(false)
    }
  }, [radius, userLocation?.city, userLocation?.latitude, userLocation?.longitude])

  useEffect(() => {
    if (userLocation?.latitude && userLocation?.longitude) {
      fetchNearbyMarkets()
    }
  }, [fetchNearbyMarkets, userLocation?.latitude, userLocation?.longitude])

  const openInMaps = (market) => {
    const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${market.lat},${market.lng}`
    window.open(url, '_blank')
  }

  if (!userLocation) {
    return (
      <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] p-12 text-center border border-white shadow-2xl">
        <MapPin className="mx-auto text-gray-300 mb-6" size={64} />
        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Location Required</h3>
        <p className="text-gray-500 font-medium">Please set your location to view nearby markets</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                <Navigation className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Nearby Agricultural Markets</h2>
                <p className="text-gray-600">Real-time market locations with navigation support</p>
              </div>
            </div>
            
            {/* Enhanced Data Provenance */}
            {dataSource && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Live Market Data</p>
                      <p className="text-xs text-gray-600">Source: {dataSource}</p>
                    </div>
                  </div>
                  {lastUpdated && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(lastUpdated).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-semibold text-gray-700">Search Radius:</label>
              <select 
                value={radius} 
                onChange={(e) => setRadius(Number(e.target.value))}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              >
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
                <option value={150}>150 km</option>
              </select>
            </div>
            <button
              onClick={fetchNearbyMarkets}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  <span>Refresh Markets</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Map Container */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white relative" style={{ height: '600px' }}>
            <MapContainer
              center={[userLocation.latitude, userLocation.longitude]}
              zoom={10}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController
                center={[userLocation.latitude, userLocation.longitude]}
                markers={nearbyMarkets}
              />

              {/* User location marker */}
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={UserIcon}
              >
                <Popup className="premium-popup">
                  <div className="p-2 text-center">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Your Farm</p>
                    <p className="font-bold text-gray-900">{userLocation.city}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Market markers */}
              {nearbyMarkets.map((market) => (
                <Marker
                  key={market.id}
                  position={[market.lat, market.lng]}
                  icon={MarketIcon}
                  eventHandlers={{
                    click: () => setSelectedMarket(market)
                  }}
                >
                  <Popup className="premium-popup">
                    <div className="min-w-[240px] p-2">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-black text-gray-900 text-lg leading-tight">{market.name}</h3>
                        <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-[10px] font-black">
                          {market.distance}km
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-gray-500">
                          <Clock size={14} className="text-green-600" />
                          <span className="text-xs font-bold">{market.openHours}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold">{Number(market.rating)?.toFixed(1) || 'N/A'}/5 • {market.commodityCount} Items</span>
                        </div>
                      </div>

                      <button
                        onClick={() => openInMaps(market)}
                        className="w-full py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                      >
                        <Navigation size={14} />
                        Get Directions
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Floating Info */}
            <div className="absolute bottom-8 left-8 z-10">
              <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Market Density</p>
                  <p className="text-sm font-bold">{nearbyMarkets.length} Hubs in your area</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Markets Sidebar List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Markets Found</h3>
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {nearbyMarkets.length} Results
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white/40 rounded-3xl h-32 animate-pulse border border-white" />
              ))
            ) : nearbyMarkets.length > 0 ? (
              <AnimatePresence>
                {nearbyMarkets.map((market, idx) => (
                  <motion.div
                    key={market.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white rounded-[2rem] p-6 border-2 transition-all cursor-pointer group hover:shadow-2xl hover:shadow-green-900/5 ${selectedMarket?.id === market.id ? 'border-green-600 bg-green-50/30' : 'border-gray-50'
                      }`}
                    onClick={() => setSelectedMarket(market)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-gray-900 text-lg group-hover:text-green-600 transition-colors">{market.name}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{market.city}</p>
                      </div>
                      <div className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-xl text-[10px] font-black group-hover:bg-green-600 group-hover:text-white transition-all">
                        {market.distance} km
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock size={12} className="text-green-600" />
                        <span className="text-[10px] font-bold">{market.openHours}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-bold">{Number(market.rating)?.toFixed(1) || 'N/A'}/5</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openInMaps(market)
                        }}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                      >
                        <Navigation size={12} />
                        Directions
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`tel:${market.phone}`, '_self')
                        }}
                        className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <Phone size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin size={24} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold px-8">
                  {error || `No markets found within ${radius}km. Try expanding your search radius.`}
                </p>
                <button
                  onClick={() => setRadius(Math.min(radius * 2, 200))}
                  className="mt-4 text-green-600 font-black uppercase tracking-widest text-[10px] hover:underline"
                >
                  Expand to {Math.min(radius * 2, 200)}km →
                </button>
              </div>
            )}
          </div>

          {/* Pro Tip */}
          <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-2 bg-white/20 rounded-lg">
                <Info size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Pro Tip</p>
                <p className="text-xs font-bold leading-relaxed">
                  Prices can vary significantly between mandis. Check multiple locations to maximize your profit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NearbyMarketsMap
