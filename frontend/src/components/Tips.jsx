import { useState } from 'react'

const Tips = () => {
  const [activeCategory, setActiveCategory] = useState('general')

  const tips = {
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