import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { MapPin, BarChart3, ChevronDown, RefreshCw, TrendingUp, TrendingDown, Navigation, Target, Globe } from 'lucide-react'
import { useLocation } from '../LocationContext'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import { useMandiData } from '../hooks/useMandiData'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTYgNDhMMjYuNjYgMjBDMjguODcgMTYuNSAzMCAxMi41IDMwIDhDMzAgMy41OCAyNi40MiAwIDIyIDBIMTBDNS41OCAwIDIgMy41OCAyIDhDMiAxMi41IDMuMTMgMTYuNSA1LjM0IDIwTDE2IDQ4WiIgZmlsbD0iIzAwN0JGRiIvPgogIDx0ZXh0IHg9IjE2IiB5PSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIj7wn5OMPC90ZXh0Pgo8L3N2Zz4K',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48]
})

const marketIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTYgNDhMMjYuNjYgMjBDMjguODcgMTYuNSAzMCAxMi41IDMwIDhDMzAgMy41OCAyNi40MiAwIDIyIDBIMTBDNS41OCAwIDIgMy41OCAyIDhDMiAxMi41IDMuMTMgMTYuNSA1LjM0IDIwTDE2IDQ4WiIgZmlsbD0iIzI4QTc0NSIvPgogIDx0ZXh0IHg9IjE2IiB5PSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIj7wn4+qPC90ZXh0Pgo8L3N2Zz4K',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48]
})


const InteractiveMarketMap = () => {
  const { location: userLocation } = useLocation()
  const { data: marketData = [], isLoading, refetch } = useMandiData(
    '',
    userLocation?.city || '',
    ''
  )
  const [selectedCrop, setSelectedCrop] = useState('')
  const [selectedMarket, setSelectedMarket] = useState(null)

  const crops = useMemo(() => {
    if (!Array.isArray(marketData)) return []
    const uniqueCrops = new Set(marketData.map(m => m.commodity))
    return Array.from(uniqueCrops).sort()
  }, [marketData])

  const groupedMarkets = useMemo(() => {
    if (!Array.isArray(marketData)) return []

    const groups = {}
    marketData.forEach(item => {
      if (selectedCrop && item.commodity !== selectedCrop) return

      const key = item.market
      if (!groups[key]) {
        groups[key] = {
          name: item.market,
          lat: item.lat || item.latitude,
          lng: item.lng || item.longitude,
          district: item.district,
          state: item.state,
          distance: item.distanceKm,
          crops: []
        }
      }
      groups[key].crops.push(item)
    })

    return Object.values(groups).sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }, [marketData, selectedCrop])

  const openGoogleMaps = (market) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${market.lat},${market.lng}`
    window.open(url, '_blank')
  }

  const centerPos = useMemo(() => {
    if (selectedMarket) {
      return [selectedMarket.lat || selectedMarket.latitude, selectedMarket.lng || selectedMarket.longitude]
    }
    if (userLocation?.latitude) {
      return [userLocation.latitude, userLocation.longitude]
    }
    if (userLocation?.lat) {
      return [userLocation.lat, userLocation.lng]
    }
    // If no location, center on the first market available
    if (groupedMarkets.length > 0) {
      return [groupedMarkets[0].lat, groupedMarkets[0].lng]
    }
    return [20.5937, 78.9629] // India Center as last resort
  }, [selectedMarket, userLocation, groupedMarkets])

  const zoomLevel = selectedMarket ? 12 : 8

  return (
    <div className="interactive-market-map space-y-6">
      <div className="map-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Globe className="text-blue-600" />
            Geospatial Market Hub
          </h2>
          <p className="text-slate-500 font-medium">Real-time geographic distribution of agricultural commodities</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl shadow-sm transition-all group"
          title="Refresh Data"
        >
          <RefreshCw size={20} className={`text-slate-400 group-hover:text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Commodity Filter</label>
            <div className="relative">
              <select
                value={selectedCrop}
                onChange={(e) => {
                  setSelectedCrop(e.target.value)
                  setSelectedMarket(null)
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl appearance-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700"
              >
                <option value="">All Commodities</option>
                {crops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
              </select>
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-xl">
                <Navigation size={18} />
              </div>
              <h3 className="font-black text-sm uppercase tracking-widest">Active Markets</h3>
            </div>
            <p className="text-3xl font-black text-white mb-1">{groupedMarkets.length}</p>
            <p className="text-slate-400 text-xs font-medium">Regional hubs detected</p>
          </div>
        </div>

        {/* Map Area */}
        <div className="md:col-span-3">
          <div className="leaflet-map-container relative z-0 rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-900/5">
            <MapContainer
              key={`${centerPos[0]}-${centerPos[1]}-${zoomLevel}`}
              center={centerPos}
              zoom={zoomLevel}
              style={{ height: '500px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />

              {(userLocation?.latitude || userLocation?.lat) && (
                <Marker position={[userLocation.latitude || userLocation.lat, userLocation.longitude || userLocation.lng]} icon={userIcon}>
                  <Popup>
                    <div className="font-black text-blue-600 p-1">📍 Your Precise Location</div>
                  </Popup>
                </Marker>
              )}

              {groupedMarkets.map((market) => (
                <Marker
                  key={market.name}
                  position={[market.lat, market.lng]}
                  icon={marketIcon}
                  eventHandlers={{ click: () => setSelectedMarket(market) }}
                >
                  <Popup>
                    <div className="p-3 min-w-[240px]">
                      <h4 className="font-black text-slate-900 border-b border-slate-100 pb-2 mb-3 flex justify-between items-center">
                        <span className="truncate mr-2">🏪 {market.name}</span>
                        {market.distance && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-black">{market.distance} KM</span>}
                      </h4>
                      <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 scrollbar-hide">
                        {market.crops.map(crop => (
                          <div key={crop.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                              <div className="font-black text-slate-800 text-xs">{crop.commodity}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">{crop.variety}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-green-600 text-sm">₹{crop.modal_price}</div>
                              <div className={`text-[9px] font-black uppercase ${crop.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                {crop.trend === 'up' ? '↗' : '↘'} {crop.trend}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        onClick={() => openGoogleMaps(market)}
                      >
                        <Navigation size={12} /> Route to Market
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Market List Section */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <BarChart3 size={24} className="text-green-600" />
            Detailed Market Intelligence
          </h3>
        </div>

        {!userLocation ? (
          <div className="flex flex-col items-center justify-center h-[500px] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <MapPin className="text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-gray-800">Location Required</h3>
            <p className="text-gray-500 text-sm max-w-xs text-center mt-2">Please set your location to view nearby market hubs and price intelligence.</p>
            <button
              onClick={() => window.location.hash = '#/market'}
              className="mt-6 px-6 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all"
            >
              Set Location
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="animate-spin text-slate-200" size={48} />
          </div>
        ) : groupedMarkets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedMarkets.map((market) => (
              <div
                key={market.name}
                className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer relative overflow-hidden ${selectedMarket?.name === market.name
                  ? 'border-blue-500 bg-blue-50/30 shadow-xl shadow-blue-900/5'
                  : 'border-slate-50 bg-white hover:border-blue-200 hover:shadow-lg'
                  }`}
                onClick={() => setSelectedMarket(market)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-black text-slate-900 text-lg leading-tight">{market.name}</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{market.district}</p>
                  </div>
                  {market.distance && (
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                      {market.distance} KM
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">Top Commodities</p>
                  <div className="flex flex-wrap gap-2">
                    {market.crops.slice(0, 3).map(crop => (
                      <div key={crop.id} className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-700">{crop.commodity}</span>
                        <span className="text-[10px] font-black text-green-600">₹{crop.modal_price}</span>
                      </div>
                    ))}
                    {market.crops.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-black flex items-center ml-1">+{market.crops.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
            <Globe size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No markets detected in this region</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InteractiveMarketMap