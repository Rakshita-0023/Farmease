import { useLocation } from '../LocationContext'
import { RefreshCw, MapPin, Loader2 } from 'lucide-react'

const LocationDetector = () => {
  const { location, status, error, detectLocation } = useLocation()

  console.log('LocationDetector render:', { location, status, error })

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 animate-pulse">
        <Loader2 size={14} className="text-white/40 animate-spin" />
        <span className="text-white/60 text-[10px] uppercase tracking-wider font-medium">Updating...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2 group hover:bg-white/15 transition-colors">
        <div className="flex items-center gap-2 overflow-hidden">
          <MapPin size={14} className={status === 'set' ? 'text-green-400' : 'text-yellow-400'} />
          <span className={`text-[11px] font-bold truncate ${status === 'set' ? 'text-white' : 'text-yellow-200'}`}>
            {status === 'set' ? location?.city : 'Select City'}
          </span>
        </div>
        <button
          onClick={detectLocation}
          className="p-1 hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
          title="Auto-detect Location"
        >
          <RefreshCw size={12} className="text-white/60" />
        </button>
      </div>

      {status === 'unset' && (
        <div className="px-1">
          <p className="text-[9px] text-yellow-400/80 font-medium leading-tight">
            ⚠️ No location set. Please select a city to see local market data.
          </p>
        </div>
      )}

      {status === 'error' && error && (
        <div className="px-1">
          <p className="text-[9px] text-red-400 font-medium leading-tight">
            ❌ {error}
          </p>
        </div>
      )}

      {status === 'set' && location && (
        <div className="flex flex-col gap-0 px-1">
          <p className="text-[10px] text-green-400 font-medium">
            📍 {location.city}, {location.state}
          </p>
          <p className="text-[8px] text-white/40 uppercase tracking-tighter">
            v2.2 - Backend Driven
          </p>
        </div>
      )}
    </div>
  )
}

export default LocationDetector