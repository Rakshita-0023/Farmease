import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { apiClient } from '../config'
import { Lightbulb, Sprout, CloudSun, Leaf, BookOpen } from 'lucide-react'

const Tips = () => {
  const [activeCategory, setActiveCategory] = useState('my-crops')

  const { data: farms = [] } = useQuery({
    queryKey: ['farms'],
    queryFn: () => apiClient.get('/farms')
  })

  const userCrops = useMemo(() => {
    return [...new Set(farms.map(f => f.crop))]
  }, [farms])

  useMemo(() => {
    if (userCrops.length === 0 && activeCategory === 'my-crops') {
      setActiveCategory('general')
    }
  }, [userCrops, activeCategory])

  const cropSpecificTips = {
    'Wheat': [
      { title: 'Irrigation for Wheat', content: 'Wheat needs critical irrigation at the crown root initiation stage (20-25 days after sowing).' },
      { title: 'Rust Prevention', content: 'Monitor for yellow rust if temperatures drop. Use resistant varieties like HD-2967.' }
    ],
    'Rice': [
      { title: 'Water Level', content: 'Maintain 2-5 cm water level during the vegetative stage. Drain field before harvest.' },
      { title: 'Blast Disease', content: 'Avoid excessive nitrogen fertilizer to prevent blast disease susceptibility.' }
    ],
    'Corn': [
      { title: 'Fertilizer Timing', content: 'Apply nitrogen in splits: 1/3 at sowing, 1/3 at knee height, 1/3 at tasseling.' },
      { title: 'Pest Watch', content: 'Check for Fall Armyworm in the whorls of young plants.' }
    ],
    'Cotton': [
      { title: 'Leaf Reddening', content: 'Magnesium deficiency causes leaf reddening. Spray MgSO4 if observed.' },
      { title: 'Bollworm Control', content: 'Install pheromone traps to monitor pink bollworm activity.' }
    ],
    'Sugarcane': [
      { title: 'Earthing Up', content: 'Perform earthing up at 4 months to prevent lodging during heavy winds.' },
      { title: 'Red Rot', content: 'Use disease-free setts. Remove and destroy clumps affected by red rot.' }
    ],
    'Tomato': [
      { title: 'Staking', content: 'Stake tomato plants to keep fruits off the ground and reduce rotting.' },
      { title: 'Blossom End Rot', content: 'Ensure consistent watering and calcium availability to prevent blossom end rot.' }
    ],
    'Potato': [
      { title: 'Earthing Up', content: 'Cover tubers properly to prevent greening (solanine formation).' },
      { title: 'Late Blight', content: 'Spray fungicides preventively during cloudy, humid weather.' }
    ]
  }

  const myCropTips = userCrops.flatMap(crop =>
    cropSpecificTips[crop] || [
      { title: `${crop} Care`, content: `Ensure timely irrigation and weed management for your ${crop} crop.` }
    ]
  )

  const tips = {
    'my-crops': myCropTips.length > 0 ? myCropTips : [{ title: 'Add Farms', content: 'Add farms to see personalized tips here!' }],
    general: [
      { title: 'Soil Testing', content: 'Test your soil pH regularly. Most crops prefer pH between 6.0-7.0.' },
      { title: 'Crop Rotation', content: 'Rotate crops annually to maintain soil fertility and reduce pest buildup.' },
      { title: 'Water Management', content: 'Water early morning or late evening to reduce evaporation losses.' }
    ],
    seasonal: [
      { title: 'Summer Care', content: 'Provide shade for sensitive crops and increase watering frequency.' },
      { title: 'Monsoon Prep', content: 'Ensure proper drainage to prevent waterlogging during heavy rains.' },
      { title: 'Winter Protection', content: 'Cover sensitive plants during frost and reduce watering.' }
    ],
    organic: [
      { title: 'Composting', content: 'Create compost from kitchen waste and farm residue for natural fertilizer.' },
      { title: 'Natural Pesticides', content: 'Use neem oil and soap solution for eco-friendly pest control.' },
      { title: 'Beneficial Insects', content: 'Encourage ladybugs and bees by planting diverse flowering plants.' }
    ]
  }

  const categories = [
    { id: 'my-crops', label: 'My Crops', icon: <Sprout size={18} /> },
    { id: 'general', label: 'General', icon: <BookOpen size={18} /> },
    { id: 'seasonal', label: 'Seasonal', icon: <CloudSun size={18} /> },
    { id: 'organic', label: 'Organic', icon: <Leaf size={18} /> }
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600/80 via-teal-600/80 to-emerald-700/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">Expert Advice</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Farming Tips</h1>
        <p className="text-white/60">Personalized advice to improve your farming practices</p>
      </motion.div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 bg-white/10 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 w-fit">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeCategory === cat.id
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tips[activeCategory].map((tip, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 hover:-translate-y-1 transition-all cursor-default group"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
              <Lightbulb size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{tip.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">{tip.content}</p>
          </motion.div>
        ))}
      </div>

      {/* Tip of the Day */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <Lightbulb size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">🌟 Tip of the Day</h3>
            <p className="text-white/70">
              Monitor your crops daily for early signs of pests or diseases.
              Early detection can save your entire harvest!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Tips
