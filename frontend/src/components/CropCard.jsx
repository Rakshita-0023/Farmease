import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getCropImage } from '../utils/cropImages'

/**
 * Premium Crop Card Component
 * Category-based background for visual consistency
 * Dark glass card with subtle image texture
 */
const CropCard = ({ 
  commodity, 
  variety, 
  minPrice, 
  maxPrice, 
  modalPrice, 
  trend = 'stable',
  market,
  onClick 
}) => {
  const cropImage = getCropImage(commodity) || getCropImage(variety)
  
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={16} className="text-emerald-400" />
    if (trend === 'down') return <TrendingDown size={16} className="text-red-400" />
    return <Minus size={16} className="text-white/50" />
  }
  
  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-400'
    if (trend === 'down') return 'text-red-400'
    return 'text-white/50'
  }

  return (
    <div 
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10"
    >
      {/* Background Image Layer - Subtle, consistent */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 group-hover:scale-105"
        style={{ 
          backgroundImage: `url(${cropImage})`,
          filter: 'blur(2px) brightness(0.4)',
          transform: 'scale(1.05)'
        }}
      />
      
      {/* Dark Overlay - Stronger for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />
      
      {/* Glass Effect Border */}
      <div className="absolute inset-0 border border-white/10 rounded-2xl" />
      
      {/* Content Layer */}
      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{commodity}</h3>
            {variety && (
              <span className="text-xs text-white/60">{variety}</span>
            )}
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-xs font-medium capitalize">{trend}</span>
          </div>
        </div>
        
        {/* Price Range */}
        <div className="flex items-center gap-3 mb-4 text-sm">
          <div className="flex-1">
            <span className="text-white/50 text-xs">Min</span>
            <p className="text-white font-semibold">₹{minPrice?.toLocaleString()}</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="flex-1">
            <span className="text-white/50 text-xs">Max</span>
            <p className="text-white font-semibold">₹{maxPrice?.toLocaleString()}</p>
          </div>
        </div>
        
        {/* Modal Price - Highlighted */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 text-center">
          <span className="text-white/50 text-xs block mb-1">Modal Price</span>
          <span className="text-2xl font-black text-white">₹{modalPrice?.toLocaleString()}</span>
          <span className="text-white/40 text-xs ml-1">/quintal</span>
        </div>
        
        {/* Market Name */}
        {market && (
          <p className="text-white/40 text-xs mt-3 text-center truncate">{market}</p>
        )}
      </div>
    </div>
  )
}

export default CropCard
