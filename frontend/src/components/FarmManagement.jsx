import { useState, useEffect } from 'react'
import GrowthChart from './GrowthChart'

function FarmManagement() {
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFarm, setNewFarm] = useState({
    cropType: '',
    soilType: '',
    area: '',
    sowingDate: ''
  })

  useEffect(() => {
    loadFarms()
  }, [])

  const loadFarms = () => {
    const savedFarms = JSON.parse(localStorage.getItem('farmease_farms') || '[]')
    setFarms(savedFarms)
    setLoading(false)
  }

  const saveFarms = (updatedFarms) => {
    localStorage.setItem('farmease_farms', JSON.stringify(updatedFarms))
    setFarms(updatedFarms)
  }

  const handleAddFarm = (e) => {
    e.preventDefault()
    
    const daysSinceSowing = Math.floor((new Date() - new Date(newFarm.sowingDate)) / (1000 * 60 * 60 * 24))
    const cropHarvestDays = getCropHarvestDays(newFarm.cropType)
    const progress = Math.min((daysSinceSowing / cropHarvestDays) * 100, 100)
    
    const farm = {
      id: Date.now(),
      ...newFarm,
      area: parseFloat(newFarm.area),
      progress: Math.round(progress),
      daysToHarvest: Math.max(cropHarvestDays - daysSinceSowing, 0),
      status: progress > 80 ? 'Harvest Ready' : progress > 50 ? 'Growing' : 'Water Needed'
    }
    
    const updatedFarms = [...farms, farm]
    saveFarms(updatedFarms)
    setNewFarm({ cropType: '', soilType: '', area: '', sowingDate: '' })
    setShowAddForm(false)
    alert('Farm added successfully!')
  }

  const handleDeleteFarm = (farmId) => {
    if (window.confirm('Are you sure you want to delete this farm?')) {
      const updatedFarms = farms.filter(farm => farm.id !== farmId)
      saveFarms(updatedFarms)
      alert('Farm deleted successfully!')
    }
  }

  const getCropHarvestDays = (cropType) => {
    const harvestDays = {
      'Rice': 120, 'Wheat': 110, 'Maize': 90, 'Cotton': 180,
      'Sugarcane': 365, 'Tomato': 75, 'Potato': 90, 'Onion': 120
    }
    return harvestDays[cropType] || 100
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'Harvest Ready': return 'status-ready'
      case 'Growing': return 'status-growing'
      case 'Water Needed': return 'status-water'
      default: return 'status-growing'
    }
  }

  const getProgressClass = (progress) => {
    if (progress > 80) return 'progress-green'
    if (progress > 50) return 'progress-blue'
    return 'progress-red'
  }

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
          🌱 My Farm
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
        >
          + Add Farm
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌱</div>
          <h3 style={{ marginBottom: '1rem' }}>No farms added yet</h3>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Start by adding your first farm to track your crops
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            Add Your First Farm
          </button>
        </div>
      ) : (
        <div className="grid grid-3">
          {farms.map((farm) => (
            <div key={farm.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{farm.cropType}</h3>
                  <span className={`status-badge ${getStatusClass(farm.status)}`}>
                    {farm.status}
                  </span>
                </div>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{farm.area} hectares</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Soil Type:</span>
                  <span style={{ fontWeight: '500' }}>{farm.soilType}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Sowing Date:</span>
                  <span style={{ fontWeight: '500' }}>{farm.sowingDate}</span>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#6b7280' }}>Growth Progress:</span>
                    <span style={{ fontWeight: '500' }}>{farm.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${getProgressClass(farm.progress)}`}
                      style={{ width: `${farm.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#3b82f6' }}>
                    <span style={{ fontSize: '0.875rem' }}>📅 {farm.daysToHarvest} days to harvest</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteFarm(farm.id)}
                    className="btn btn-danger"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <GrowthChart 
                farmId={farm.id} 
                cropType={farm.cropType}
                soilType={farm.soilType}
                sowingDate={farm.sowingDate}
                farmData={farm}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Farm Modal */}
      {showAddForm && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Farm</h2>
            <form onSubmit={handleAddFarm}>
              <div className="form-group">
                <label>Crop Type</label>
                <select
                  value={newFarm.cropType}
                  onChange={(e) => setNewFarm({...newFarm, cropType: e.target.value})}
                  required
                >
                  <option value="">Select Crop</option>
                  <option value="Rice">Rice</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Maize">Maize</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Potato">Potato</option>
                  <option value="Onion">Onion</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Soil Type</label>
                <select
                  value={newFarm.soilType}
                  onChange={(e) => setNewFarm({...newFarm, soilType: e.target.value})}
                  required
                >
                  <option value="">Select Soil</option>
                  <option value="Clay">Clay</option>
                  <option value="Sandy">Sandy</option>
                  <option value="Loamy">Loamy</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Area (hectares)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newFarm.area}
                  onChange={(e) => setNewFarm({...newFarm, area: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Sowing Date</label>
                <input
                  type="date"
                  value={newFarm.sowingDate}
                  onChange={(e) => setNewFarm({...newFarm, sowingDate: e.target.value})}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Add Farm
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
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