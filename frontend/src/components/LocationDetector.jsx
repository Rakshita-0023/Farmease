import { useLocation } from '../LocationContext'
import { RefreshCw, MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const LocationDetector = () => {
  const { location, status, error, detectLocation } = useLocation()

  return (
    <div className="flex flex-col gap-2">
      <div className="relative group">
        <div className={`
          flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 border
          ${status === 'set'
            ? 'bg-white/10 border-white/10 hover:bg-white/15'
            : status === 'detecting' || status === 'loading'
              ? 'bg-white/5 border-white/5 animate-pulse'
              : 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/15'}
        `}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`
              p-1.5 rounded-lg transition-colors duration-500
              ${status === 'set' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
            `}>
              {status === 'set' ? <MapPin size={14} /> : <Loader2 size={14} className="animate-spin" />}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${status === 'set' ? 'text-green-400' : 'text-yellow-400'}`}>
                {status === 'set' ? 'Location Active' : status === 'detecting' ? 'Detecting...' : 'Action Required'}
              </span>
              <span className="text-white text-xs font-bold truncate">
                {status === 'set' ? location?.city : 'Select your city'}
              </span>
            </div>
          </div>

          <button
            onClick={detectLocation}
            disabled={status === 'detecting' || status === 'loading'}
            className={`
              p-2 rounded-xl transition-all duration-300
              ${status === 'detecting' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 text-white/60 hover:text-white'}
            `}
            title="Auto-detect Location"
          >
            <RefreshCw size={14} className={status === 'detecting' ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Status Glow Effect */}
        {status === 'set' && (
          <div className="absolute -inset-0.5 bg-green-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
        )}
      </div>

      <AnimatePresence>
        {status === 'unset' && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-2"
          >
            <p className="text-[9px] text-yellow-400/80 font-medium leading-tight flex items-center gap-1.5">
              <AlertCircle size={10} />
              Please select a city in the Market page to see local data.
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-2"
          >
            <p className="text-[9px] text-red-400 font-medium leading-tight flex items-start gap-1.5">
              <AlertCircle size={10} className="mt-0.5 shrink-0" />
              {error}
            </p>
          </motion.div>
        )}

        {status === 'set' && location && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-0.5 px-2"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={10} className="text-green-400" />
              <p className="text-[10px] text-green-400/80 font-bold">
                {location.state}, {location.country}
              </p>
            </div>
            <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-black mt-1">
              Precision v3.0 Active
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LocationDetector