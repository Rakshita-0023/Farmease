import { useState } from 'react'
import './WeatherEnhancements.css'

const DetailedAnalytics = ({ farm, onClose, onDelete }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detailed-analytics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{farm.name} - Detailed Analytics</h2>
          <div className="header-actions">
            <button 
              className="delete-btn-small" 
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete Farm"
            >
              🗑️
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'growth' ? 'active' : ''} 
            onClick={() => setActiveTab('growth')}
          >
            Growth Analysis
          </button>
          <button 
            className={activeTab === 'environment' ? 'active' : ''} 
            onClick={() => setActiveTab('environment')}
          >
            Environment
          </button>
          <button 
            className={activeTab === 'insights' ? 'active' : ''} 
            onClick={() => setActiveTab('insights')}
          >
            AI Insights
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <div className="stats-grid">
                <div className="stat-card green">
                  <div className="stat-value">{farm.progress}%</div>
                  <div className="stat-label">Growth Progress</div>
                </div>
                <div className="stat-card blue">
                  <div className="stat-value">{farm.daysToHarvest}</div>
                  <div className="stat-label">Days to Harvest</div>
                </div>
                <div className="stat-card yellow">
                  <div className="stat-value">{farm.area}</div>
                  <div className="stat-label">Hectares</div>
                </div>
                <div className="stat-card purple">
                  <div className="stat-value">{farm.healthScore || 85}%</div>
                  <div className="stat-label">Health Score</div>
                </div>
              </div>

              <div className="chart-container">
                <h4>Weekly Growth Progress</h4>
                <div className="simple-chart">
                  {(farm.growthStages || [12, 25, 38, 52, 67, 78, 85, 92]).map((value, index) => (
                    <div key={index} className="chart-bar">
                      <div 
                        className="bar-fill animated-bar" 
                        style={{ 
                          height: `${value * 1.5}px`,
                          animationDelay: `${index * 0.1}s`
                        }}
                      ></div>
                      <div className="bar-label">W{index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'growth' && (
            <div className="growth-content">
              <div className="growth-grid">
                <div className="growth-chart">
                  <h4>Growth Trend</h4>
                  <div className="trend-chart">
                    {(farm.growthStages || [12, 25, 38, 52, 67, 78, 85, 92]).map((value, index) => (
                      <div 
                        key={index} 
                        className="trend-bar animated-bar" 
                        style={{ 
                          height: `${value * 2.2}px`,
                          animationDelay: `${index * 0.15}s`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="growth-stats">
                  <div className="growth-rate">
                    <h5>Growth Rate</h5>
                    <div className="rate-value">12%/week</div>
                  </div>
                  <div className="current-stage">
                    <h5>Current Stage</h5>
                    <div className="stage-value">
                      {farm.progress < 50 ? 'Growing' : farm.progress < 80 ? 'Flowering' : 'Mature'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'environment' && (
            <div className="environment-content">
              <div className="env-grid">
                <div className="env-card moisture">
                  <h4>💧 Soil Moisture</h4>
                  <div className="env-value">79%</div>
                  <div className="env-label">Current Level</div>
                </div>
                <div className="env-card temperature">
                  <h4>🌡️ Temperature</h4>
                  <div className="env-value">30°C</div>
                  <div className="env-label">Current Temp</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="insights-content">
              <div className="insight-card success">
                <h4>✅ Excellent Growth</h4>
                <p>Your {farm.cropType} is growing 15% faster than average for {farm.soilType} soil.</p>
              </div>
              <div className="insight-card warning">
                <h4>⚠️ Irrigation Needed</h4>
                <p>Soil moisture trending down. Consider watering within 2-3 days.</p>
              </div>
              <div className="insight-card info">
                <h4>📊 Harvest Prediction</h4>
                <p>Expected harvest in {farm.daysToHarvest} days with 85% yield confidence.</p>
              </div>
            </div>
          )}
        </div>
        
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-modal">
              <h3>⚠️ Confirm Deletion</h3>
              <p>Are you sure you want to delete <strong>{farm.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
              <div className="confirm-actions">
                <button 
                  className="confirm-delete-btn"
                  onClick={() => {
                    onDelete(farm.id)
                    onClose()
                  }}
                >
                  Yes, Delete Farm
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DetailedAnalytics