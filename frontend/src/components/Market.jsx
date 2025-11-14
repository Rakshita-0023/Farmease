import { useState, useEffect } from 'react'

function Market() {
  const [marketData, setMarketData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadMarketData()
  }, [])

  const loadMarketData = () => {
    // Mock market data
    setTimeout(() => {
      setMarketData([
        { 
          id: 1, 
          crop: 'Rice', 
          price: 2500, 
          change: 2.5, 
          market: 'Delhi Mandi',
          category: 'cereals',
          unit: 'quintal',
          lastUpdated: '2 hours ago'
        },
        { 
          id: 2, 
          crop: 'Wheat', 
          price: 2200, 
          change: -1.2, 
          market: 'Punjab Mandi',
          category: 'cereals',
          unit: 'quintal',
          lastUpdated: '1 hour ago'
        },
        { 
          id: 3, 
          crop: 'Cotton', 
          price: 5800, 
          change: 3.2, 
          market: 'Gujarat Mandi',
          category: 'cash_crops',
          unit: 'quintal',
          lastUpdated: '3 hours ago'
        },
        { 
          id: 4, 
          crop: 'Tomato', 
          price: 1200, 
          change: -5.8, 
          market: 'Karnataka Mandi',
          category: 'vegetables',
          unit: 'quintal',
          lastUpdated: '30 minutes ago'
        },
        { 
          id: 5, 
          crop: 'Onion', 
          price: 800, 
          change: 8.5, 
          market: 'Maharashtra Mandi',
          category: 'vegetables',
          unit: 'quintal',
          lastUpdated: '1 hour ago'
        },
        { 
          id: 6, 
          crop: 'Sugarcane', 
          price: 350, 
          change: 1.8, 
          market: 'UP Mandi',
          category: 'cash_crops',
          unit: 'quintal',
          lastUpdated: '4 hours ago'
        }
      ])
      setLoading(false)
    }, 1000)
  }

  const filteredData = selectedCategory === 'all' 
    ? marketData 
    : marketData.filter(item => item.category === selectedCategory)

  const categories = [
    { value: 'all', label: 'All Crops' },
    { value: 'cereals', label: 'Cereals' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'cash_crops', label: 'Cash Crops' }
  ]

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center' }}>
          📈 Market Prices
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

      {/* Market Summary */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: '#22c55e', marginBottom: '0.5rem' }}>
            {marketData.filter(item => item.change > 0).length}
          </div>
          <div style={{ fontWeight: '500' }}>Prices Up</div>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: '#ef4444', marginBottom: '0.5rem' }}>
            {marketData.filter(item => item.change < 0).length}
          </div>
          <div style={{ fontWeight: '500' }}>Prices Down</div>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: '#3b82f6', marginBottom: '0.5rem' }}>
            ₹{Math.round(marketData.reduce((sum, item) => sum + item.price, 0) / marketData.length)}
          </div>
          <div style={{ fontWeight: '500' }}>Avg Price</div>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: '#8b5cf6', marginBottom: '0.5rem' }}>
            {marketData.length}
          </div>
          <div style={{ fontWeight: '500' }}>Total Crops</div>
        </div>
      </div>

      {/* Price Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Current Market Prices</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Crop</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Price</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Change</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Market</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500' }}>{item.crop}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      per {item.unit}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '600' }}>
                    ₹{item.price.toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      color: item.change > 0 ? '#22c55e' : '#ef4444',
                      fontWeight: '500'
                    }}>
                      {item.change > 0 ? '+' : ''}{item.change}%
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>
                    {item.market}
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    {item.lastUpdated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Market Insights */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>📊 Market Insights</h3>
        <div className="grid grid-2">
          <div>
            <h4 style={{ color: '#22c55e', marginBottom: '1rem' }}>🔥 Trending Up</h4>
            {marketData
              .filter(item => item.change > 0)
              .sort((a, b) => b.change - a.change)
              .slice(0, 3)
              .map(item => (
                <div key={item.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <span>{item.crop}</span>
                  <span style={{ color: '#22c55e', fontWeight: '500' }}>
                    +{item.change}%
                  </span>
                </div>
              ))
            }
          </div>
          
          <div>
            <h4 style={{ color: '#ef4444', marginBottom: '1rem' }}>📉 Trending Down</h4>
            {marketData
              .filter(item => item.change < 0)
              .sort((a, b) => a.change - b.change)
              .slice(0, 3)
              .map(item => (
                <div key={item.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <span>{item.crop}</span>
                  <span style={{ color: '#ef4444', fontWeight: '500' }}>
                    {item.change}%
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default Market