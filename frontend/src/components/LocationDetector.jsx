import { useState } from 'react'
import { useFarmLocation } from '../hooks/useFarmLocation'
import { MapPin, Loader2, AlertCircle, ChevronDown, Search, X, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Popular Indian cities with coordinates
const POPULAR_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Bangalore', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
  { name: 'Chandigarh', state: 'Punjab', latitude: 30.7333, longitude: 76.7794 },
  { name: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 },
  { name: 'Patna', state: 'Bihar', latitude: 25.5941, longitude: 85.1376 },
  { name: 'Indore', state: 'Madhya Pradesh', latitude: 22.7196, longitude: 75.8577 },
  { name: 'Nagpur', state: 'Maharashtra', latitude: 21.1458, longitude: 79.0882 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', latitude: 17.6868, longitude: 83.2185 },
  { name: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0168, longitude: 76.9558 },
  { name: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673 },
  { name: 'Guwahati', state: 'Assam', latitude: 26.1445, longitude: 91.7362 },
  { name: 'Ranchi', state: 'Jharkhand', latitude: 23.3441, longitude: 85.3096 }
]

const LocationDetector = () => {
  const { location, loading, error, locationStatus, updateLocation, retryLocationDetection } = useFarmLocation()
  const [showSelector, setShowSelector] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCities = POPULAR_CITIES.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCitySelect = async (city) => {
    await updateLocation(city)
    setShowSelector(false)
    setSearchQuery('')
  }

  const status = loading ? 'loading' : location ? 'set' : locationStatus === 'failed' ? 'failed' : 'unset'

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setShowSelector(!showSelector)}
        className={`
          w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all border
          ${status === 'set'
            ? 'bg-white/10 border-white/10 hover:bg-white/15'
            : status === 'loading'
              ? 'bg-white/5 border-white/5'
              : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15'}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`
            p-1.5 rounded-lg transition-colors
            ${status === 'set' ? 'bg-emerald-500/20 text-emerald-400' : 
              status === 'loading' ? 'bg-white/10 text-white/50' : 'bg-amber-500/20 text-amber-400'}
          `}>
            {status === 'loading' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MapPin size={14} />
            )}
          </div>
          <div className="flex flex-col items-start overflow-hidden">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              status === 'set' ? 'text-emerald-400' : 
              status === 'loading' ? 'text-white/50' : 'text-amber-400'
            }`}>
              {status === 'set' ? 'Location' : status === 'loading' ? 'Detecting...' : 'Select City'}
            </span>
            <span className="text-white text-xs font-semibold truncate max-w-[120px]">
              {location ? `${location.city}` : 'Tap to select'}
            </span>
          </div>
        </div>
        <ChevronDown size={16} className={`text-white/50 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
      </button>

      {/* Error Display */}
      <AnimatePresence>
        {error && !showSelector && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
              <span className="text-red-300 text-[10px]">{error}</span>
            </div>
            <button
              onClick={retryLocationDetection}
              className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
            >
              <RefreshCw size={10} /> Retry Detection
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* City Selector Dropdown */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold text-sm">Select Your City</span>
                <button onClick={() => setShowSelector(false)} className="text-white/50 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-emerald-500/50"
                  autoFocus
                />
              </div>

              {/* Retry Auto-detect */}
              <button
                onClick={() => {
                  setShowSelector(false)
                  retryLocationDetection()
                }}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
              >
                <MapPin size={12} />
                Auto-detect My Location
              </button>
            </div>

            {/* City List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleCitySelect(city)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left ${
                    location?.city === city.name ? 'bg-emerald-500/20' : ''
                  }`}
                >
                  <MapPin size={14} className={location?.city === city.name ? 'text-emerald-400' : 'text-white/40'} />
                  <div>
                    <div className={`text-sm font-medium ${location?.city === city.name ? 'text-emerald-400' : 'text-white'}`}>
                      {city.name}
                    </div>
                    <div className="text-[10px] text-white/40">{city.state}</div>
                  </div>
                </button>
              ))}
              
              {filteredCities.length === 0 && (
                <div className="px-4 py-6 text-center text-white/40 text-sm">
                  No cities found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LocationDetector
