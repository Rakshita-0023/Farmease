import { useState, useEffect } from 'react'
import { apiClient } from '../config'
import './WeatherEnhancements.css'

const FarmManagement = () => {
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFarm, setNewFarm] = useState({
    name: '',
    crop: '',
    area: '',
    soil_type: 'Loamy',
    planting_date: new Date().toISOString().split('T')[0]
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load farms from API
  useEffect(() => {
    loadFarms()
  }, [])

  const loadFarms = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setFarms([])
        setLoading(false)
        return
      }

      const response = await apiClient.get('/farms')

      if (response) {
        setFarms(response)
      } else {
        console.error('Failed to load farms')
        setFarms([])
      }
    } catch (error) {
      console.error('Error loading farms:', error)
      setFarms([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddFarm = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login first')
        return
      }

      // Validate form
      if (!newFarm.name || !newFarm.crop || !newFarm.area || !newFarm.planting_date) {
        setError('Please fill in all required fields')
        return
      }

      // Calculate estimated days to harvest based on crop
      const cropCycles = {
        'Wheat': 120,
        'Rice': 110,
        'Corn': 100,
        'Cotton': 160,
        'Tomatoes': 70,
        'Potatoes': 90,
        'Onions': 100
      }
      const cycleDays = cropCycles[newFarm.crop] || 100

      // Calculate progress
      const planting = new Date(newFarm.planting_date)
      const today = new Date()
      const daysSincePlanting = Math.max(0, Math.floor((today - planting) / (1000 * 60 * 60 * 24)))
      const progress = Math.min(100, Math.floor((daysSincePlanting / cycleDays) * 100))
      const daysToHarvest = Math.max(0, cycleDays - daysSincePlanting)

      const farmData = {
        name: newFarm.name,
        crop: newFarm.crop,
        area: parseFloat(newFarm.area),
        soilType: newFarm.soil_type,
        plantingDate: newFarm.planting_date,
        healthScore: 100, // Default start score
        progress: progress,
        daysToHarvest: daysToHarvest
      }

      const response = await apiClient.post('/farms', farmData)

      if (response.success) {
        // Reset form and reload farms
        setNewFarm({
          name: '',
          crop: '',
          area: '',
          soil_type: 'Loamy',
          planting_date: new Date().toISOString().split('T')[0]
        })
        setShowAddForm(false)
        await loadFarms()
      } else {
        setError(response.error || 'Failed to create farm')
      }
    } catch (error) {
      console.error('Error creating farm:', error)
      setError(error.message || 'Failed to create farm. Try logging out and back in.')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateProgress = (farm) => {
    // Simple progress calculation based on creation date
    const createdDate = new Date(farm.created_at)
    const now = new Date()
    const daysSinceCreated = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24))

    // Assume 120 days growth cycle
    const progress = Math.min(Math.floor((daysSinceCreated / 120) * 100), 100)
    return progress
  }

  const getHealthScore = (farm) => {
    // Simple health score calculation
    const baseScore = 85
    const areaFactor = farm.area > 5 ? 5 : 0 // Bonus for larger farms
    return Math.min(baseScore + areaFactor, 100)
  }

  const getDaysToHarvest = (farm) => {
    const progress = calculateProgress(farm)
    const totalDays = 120 // Assume 120 day cycle
    const remainingDays = Math.max(0, totalDays - Math.floor((progress / 100) * totalDays))
    return remainingDays
  }

  if (loading) {
    return (
      <div className="farm-management-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your farms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="farm-management-page">
      <div className="page-header">
        <div>
          <h1>🚜 My Farms</h1>
          <p>Manage and monitor your agricultural land</p>
        </div>
        <button
          className="add-farm-btn"
          onClick={() => setShowAddForm(true)}
        >
          ➕ Add New Farm
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="empty-state-icon">🏡</div>
            <h2>No farms added yet</h2>
            <p>Start your farming journey by adding your first farm</p>
            <button
              className="get-started-btn"
              onClick={() => setShowAddForm(true)}
            >
              🌱 Add Your First Farm
            </button>
          </div>
        </div>
      ) : (
        <div className="farms-grid">
          {farms.map(farm => {
            const progress = calculateProgress(farm)
            const healthScore = getHealthScore(farm)
            const daysToHarvest = getDaysToHarvest(farm)

            return (
              <div key={farm.id} className="farm-card">
                <div className="farm-header">
                  <div className="farm-info">
                    <h3>{farm.name}</h3>
                    <span className="crop-badge">{farm.crop}</span>
                  </div>
                  <div className="farm-area">
                    <span className="area-value">{farm.area}</span>
                    <span className="area-unit">Acres</span>
                  </div>
                </div>

                <div className="farm-metrics">
                  <div className="metric">
                    <span className="metric-label">Health Score</span>
                    <div className="metric-value">
                      <span className="metric-number">{healthScore}%</span>
                      <div className="metric-icon">💚</div>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Harvest In</span>
                    <div className="metric-value">
                      <span className="metric-number">{daysToHarvest}</span>
                      <span className="metric-unit">Days</span>
                    </div>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-header">
                    <span className="progress-label">Growth Progress</span>
                    <span className="progress-percentage">{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="progress-stages">
                    <span className={progress >= 0 ? 'active' : ''}>🌱 Sowing</span>
                    <span className={progress >= 25 ? 'active' : ''}>🌿 Growth</span>
                    <span className={progress >= 50 ? 'active' : ''}>🌸 Flowering</span>
                    <span className={progress >= 75 ? 'active' : ''}>🌾 Filling</span>
                    <span className={progress >= 90 ? 'active' : ''}>✅ Harvest</span>
                  </div>
                </div>

                <div className="farm-actions">
                  <button className="action-btn primary">📊 View Details</button>
                  <button className="action-btn secondary">📝 Log Activity</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Farm Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="add-farm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏡 Add your first farm</h2>
              <button
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFarm} className="farm-form">
              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}

              <div className="form-group">
                <label>Farm Name</label>
                <input
                  type="text"
                  value={newFarm.name}
                  onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })}
                  placeholder="e.g. North Field"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Crop</label>
                  <select
                    value={newFarm.crop}
                    onChange={(e) => setNewFarm({ ...newFarm, crop: e.target.value })}
                    required
                  >
                    <option value="">Select Crop</option>
                    <option value="Wheat">🌾 Wheat</option>
                    <option value="Rice">🍚 Rice</option>
                    <option value="Corn">🌽 Corn</option>
                    <option value="Cotton">🌿 Cotton</option>
                    <option value="Tomatoes">🍅 Tomatoes</option>
                    <option value="Potatoes">🥔 Potatoes</option>
                    <option value="Onions">🧅 Onions</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newFarm.area}
                    onChange={(e) => setNewFarm({ ...newFarm, area: e.target.value })}
                    placeholder="e.g. 2.5"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Planting Date</label>
                <input
                  type="date"
                  value={newFarm.planting_date}
                  onChange={(e) => setNewFarm({ ...newFarm, planting_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Soil Type</label>
                <select
                  value={newFarm.soil_type}
                  onChange={(e) => setNewFarm({ ...newFarm, soil_type: e.target.value })}
                >
                  <option value="Loamy">🌱 Loamy</option>
                  <option value="Clay">🧱 Clay</option>
                  <option value="Sandy">🏖️ Sandy</option>
                  <option value="Silty">💧 Silty</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="create-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Farm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FarmManagement