import { useState } from 'react'

function Tips() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const tips = [
    {
      id: 1,
      category: 'planting',
      title: 'Best Time to Plant Rice',
      content: 'Plant rice during monsoon season (June-July) for optimal growth.',
      icon: '🌱'
    },
    {
      id: 2,
      category: 'watering',
      title: 'Efficient Irrigation',
      content: 'Water crops early morning or evening to reduce evaporation.',
      icon: '💧'
    },
    {
      id: 3,
      category: 'fertilizer',
      title: 'Organic Fertilizers',
      content: 'Use compost and organic matter to improve soil health naturally.',
      icon: '🌿'
    }
  ]

  const categories = [
    { value: 'all', label: 'All Tips' },
    { value: 'planting', label: 'Planting' },
    { value: 'watering', label: 'Watering' },
    { value: 'fertilizer', label: 'Fertilizer' }
  ]

  const filteredTips = selectedCategory === 'all' 
    ? tips 
    : tips.filter(tip => tip.category === selectedCategory)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center' }}>
          💡 Farming Tips
        </h1>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ 
            padding: '0.5rem 1rem', 
            border: '1px solid #d1d5db', 
            borderRadius: '6px',
            fontSize: '1rem'
          }}
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-3">
        {filteredTips.map((tip) => (
          <div key={tip.id} className="card">
            <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>
              {tip.icon}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              {tip.title}
            </h3>
            <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
              {tip.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Tips