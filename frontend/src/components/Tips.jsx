import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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

  // If no farms, default to general
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

  // Generate dynamic tips based on user crops
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
    { id: 'general', label: 'General Tips', icon: <BookOpen size={18} /> },
    { id: 'seasonal', label: 'Seasonal Care', icon: <CloudSun size={18} /> },
    { id: 'organic', label: 'Organic Farming', icon: <Leaf size={18} /> }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💡 Farming Tips</h1>
          <p className="text-gray-500">Expert advice to improve your farming practices</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-1 rounded-xl border border-gray-200 w-fit">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.id
                ? 'bg-green-100 text-green-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tips[activeCategory].map((tip, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="bg-green-50 w-10 h-10 rounded-full flex items-center justify-center mb-4 text-green-600">
              <Lightbulb size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{tip.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{tip.content}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100 flex items-start gap-4">
        <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 shrink-0">
          <Lightbulb size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">🌟 Tip of the Day</h3>
          <p className="text-gray-700">
            Monitor your crops daily for early signs of pests or diseases.
            Early detection can save your entire harvest!
          </p>
        </div>
      </div>
    </div>
  )
}

export default Tips