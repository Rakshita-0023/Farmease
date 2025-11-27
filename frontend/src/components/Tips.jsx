import { useState } from 'react'

const Tips = () => {
  const [activeCategory, setActiveCategory] = useState('my-crops')
  const [userCrops, setUserCrops] = useState([])

  // Load user crops on mount
  useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userFarms = localStorage.getItem(`farms_${user.id}`) || localStorage.getItem('farms')
    if (userFarms) {
      const farms = JSON.parse(userFarms)
      const crops = [...new Set(farms.map(f => f.cropType))]
      setUserCrops(crops)
      if (crops.length === 0) setActiveCategory('general')
    } else {
      setActiveCategory('general')
    }
  }, [])

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

  return (
    <div className="tips-page">
      <div className="page-header">
        <h1>💡 Farming Tips</h1>
        <p>Expert advice to improve your farming practices</p>
      </div>

      <div className="tips-categories">
        <button
          className={activeCategory === 'my-crops' ? 'active' : ''}
          onClick={() => setActiveCategory('my-crops')}
        >
          My Crops
        </button>
        <button
          className={activeCategory === 'general' ? 'active' : ''}
          onClick={() => setActiveCategory('general')}
        >
          General Tips
        </button>
        <button
          className={activeCategory === 'seasonal' ? 'active' : ''}
          onClick={() => setActiveCategory('seasonal')}
        >
          Seasonal Care
        </button>
        <button
          className={activeCategory === 'organic' ? 'active' : ''}
          onClick={() => setActiveCategory('organic')}
        >
          Organic Farming
        </button>
      </div>

      <div className="tips-grid">
        {tips[activeCategory].map((tip, index) => (
          <div key={index} className="tip-card">
            <h3>{tip.title}</h3>
            <p>{tip.content}</p>
          </div>
        ))}
      </div>

      <div className="featured-tip">
        <h3>🌟 Tip of the Day</h3>
        <p>
          Monitor your crops daily for early signs of pests or diseases.
          Early detection can save your entire harvest!
        </p>
      </div>
    </div>
  )
}

export default Tips