import { useState } from 'react'
import InteractiveMarketMap from './InteractiveMarketMap'
import YieldPredictor from './YieldPredictor'

const AdvancedFeatures = ({ userLocation }) => {
  const [activeTab, setActiveTab] = useState('map')
  const [selectedFarm, setSelectedFarm] = useState(null)

  // Get farms from localStorage
  const farms = JSON.parse(localStorage.getItem('farms') || '[]')
  const sampleFarm = farms[0] || {
    name: 'Sample Farm',
    cropType: 'Wheat',
    area: 3,
    soilType: 'Loamy',
    progress: 75,
    plantingDate: '2024-01-15'
  }

  const weatherData = {
    temperature: 25,
    humidity: 65,
    condition: 'Clear'
  }

  return (
    <div className="advanced-features">
      <div className="features-header">
        <h1>🚀 Advanced Features</h1>
        <p>AI-powered tools for modern farming</p>
      </div>

      <div className="features-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <button
          className={`feature-card-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <span className="feature-card-icon">🗺️</span>
          <span className="feature-card-title">Market Map</span>
        </button>
        <button
          className={`feature-card-btn ${activeTab === 'yield' ? 'active' : ''}`}
          onClick={() => setActiveTab('yield')}
        >
          <span className="feature-card-icon">🧠</span>
          <span className="feature-card-title">AI Yield Prediction</span>
        </button>
        <button
          className={`feature-card-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span className="feature-card-icon">📊</span>
          <span className="feature-card-title">Farm Analytics</span>
        </button>
      </div>

      <div className="features-content">
        {activeTab === 'map' && (
          <div className="feature-section">
            <InteractiveMarketMap userLocation={userLocation} />
          </div>
        )}

        {activeTab === 'yield' && (
          <div className="feature-section">
            <div className="farm-selector">
              <h3>Select Farm for Prediction:</h3>
              <select
                value={selectedFarm?.id || ''}
                onChange={(e) => {
                  const farm = farms.find(f => f.id === parseInt(e.target.value))
                  setSelectedFarm(farm || sampleFarm)
                }}
              >
                <option value="">Sample Farm (Demo)</option>
                {farms.map(farm => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name} - {farm.cropType}
                  </option>
                ))}
              </select>
            </div>
            <YieldPredictor
              farmData={selectedFarm || sampleFarm}
              weatherData={weatherData}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="feature-section">
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>📈 Farm Performance</h3>
                <div className="performance-metrics">
                  <div className="metric">
                    <span className="metric-label">Total Farms</span>
                    <span className="metric-value">{farms.length}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Avg Progress</span>
                    <span className="metric-value">
                      {farms.length > 0
                        ? Math.round(farms.reduce((acc, f) => acc + f.progress, 0) / farms.length)
                        : 0}%
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Ready to Harvest</span>
                    <span className="metric-value">
                      {farms.filter(f => f.progress >= 90).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>🌡️ Weather Impact</h3>
                <div className="weather-impact">
                  <div className="impact-item">
                    <span className="impact-label">Temperature</span>
                    <span className="impact-value good">Optimal</span>
                  </div>
                  <div className="impact-item">
                    <span className="impact-label">Humidity</span>
                    <span className="impact-value good">Good</span>
                  </div>
                  <div className="impact-item">
                    <span className="impact-label">Overall Impact</span>
                    <span className="impact-value excellent">Excellent</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>💰 Revenue Projection</h3>
                <div className="revenue-projection">
                  <div className="projection-item">
                    <span className="projection-label">Expected Revenue</span>
                    <span className="projection-value">₹{(farms.length * 45000).toLocaleString()}</span>
                  </div>
                  <div className="projection-item">
                    <span className="projection-label">Cost Savings</span>
                    <span className="projection-value">₹{(farms.length * 8000).toLocaleString()}</span>
                  </div>
                  <div className="projection-item">
                    <span className="projection-label">ROI</span>
                    <span className="projection-value">+{Math.round(15 + Math.random() * 10)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedFeatures