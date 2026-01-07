import { useLocation } from '../LocationContext'
import { MapPin, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const LocationDetector = () => {
  const { location, loading, error } = useLocation()

  // Determine status based on new interface
  const status = loading ? 'loading' : location ? 'set' : 'unset'

  return (
    <div className="flex flex-col gap-2">
      <div className="relative group">
        <div className={`
          flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 border
          ${status === 'set'
            ? 'bg-white/10 border-white/10 hover:bg-white/15'
            : status === 'loading'
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
                {status === 'set' ? 'Location Active' : status === 'loading' ? 'Loading...' : 'Select City'}
              </span>
              <span className="text-white text-xs font-bold truncate">
                {location ? `${location.city}, ${location.state}` : 'Please select your city'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
              <span className="text-red-300 text-[10px] font-medium">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LocationDetector