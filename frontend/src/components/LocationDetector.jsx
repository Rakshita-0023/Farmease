import { useLocation } from '../LocationContext'
import { RefreshCw, MapPin } from 'lucide-react'

const LocationDetector = () => {
  const { location, loading, error, detectLocation } = useLocation()

  console.log('LocationDetector render:', { location, loading, error })

  if (loading && !location) {
    return (
      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 animate-pulse">
        <div className="w-4 h-4 bg-white/20 rounded-full"></div>
        <div className="h-3 w-20 bg-white/20 rounded"></div>
        <span className="text-white/60 text-xs">Detecting...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2 group">
        <div className="flex items-center gap-2 overflow-hidden">
          <MapPin size={16} className="text-green-400" />
          <span className="text-white/90 text-xs font-bold truncate">
            {location?.city || 'Select City'}
          </span>
        </div>
        <button
          onClick={detectLocation}
          disabled={loading}
          className={`p-1 hover:bg-white/10 rounded-md transition-all ${loading ? 'animate-spin' : 'opacity-0 group-hover:opacity-100'}`}
          title="Refresh Location"
        >
          <RefreshCw size={12} className="text-white/60" />
        </button>
      </div>
      {error && (
        <div className="flex flex-col gap-1 px-1">
          <p className="text-[10px] text-red-400 font-medium">
            ❌ {error}
          </p>
          <p className="text-[8px] text-white/40 uppercase tracking-tighter">
            v2.1 - Worldwide Search Active
          </p>
        </div>
      )}
      {location && (
        <div className="flex flex-col gap-0 px-1">
          <p className="text-[10px] text-green-400 font-medium">
            📍 {location.city}, {location.state}
          </p>
          <p className="text-[8px] text-white/40 uppercase tracking-tighter">
            v2.1 - Worldwide Search Active
          </p>
        </div>
      )}
    </div>
  )
}

export default LocationDetector