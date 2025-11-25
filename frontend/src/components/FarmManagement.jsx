import { useState } from 'react'
import GrowthChart from './GrowthChart'
import DetailedAnalytics from './DetailedAnalytics'

const FarmManagement = () => {
  const [farms, setFarms] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userFarms = localStorage.getItem(`farms_${user.id}`) 
    return userFarms ? JSON.parse(userFarms) : []
  })

  const getCropClass = (cropType) => {
    const cropMapping = {
      // Cereals
      'Wheat': 'wheat',
      'Rice': 'rice', 
      'Corn': 'corn',
      'Maize': 'corn',
      'Bajra': 'bajra',
      'Jowar': 'jowar',
      'Ragi': 'ragi',
      
      // Pulses
      'Arhar Dal': 'arhar',
      'Moong Dal': 'moong',
      'Chana Dal': 'chana',
      
      // Cash Crops
      'Sugarcane': 'sugarcane',
      'Cotton': 'cotton',
      'Jute': 'jute',
      'Mustard': 'mustard',
      'Groundnut': 'groundnut',
      'Sunflower': 'sunflower',
      
      // Plantation Crops
      'Tea': 'tea',
      'Coffee': 'coffee',
      'Rubber': 'rubber',
      
      // Vegetables
      'Potato': 'potato',
      'Potatoes': 'potato',
      'Tomato': 'tomato',
      'Tomatoes': 'tomato',
      'Onion': 'onion',
      'Onions': 'onion',
      'Cabbage': 'cabbage',
      'Cauliflower': 'cauliflower',
      
      // Fruits
      'Apples': 'apples',
      'Bananas': 'bananas',
      'Mangoes': 'mangoes',
      'Oranges': 'oranges'
    }
    return cropMapping[cropType] || 'default'
  }
  
  const [selectedFarm, setSelectedFarm] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFarm, setNewFarm] = useState({
    name: '',
    cropType: '',
    area: '',
    soilType: 'Loamy',
    plantingDate: ''
  })
  const [cropAnalysis, setCropAnalysis] = useState(null)

  const analyzeCrop = (cropType, plantingDate, soilType) => {
    const currentDate = new Date()
    const plantDate = new Date(plantingDate)
    const currentMonth = currentDate.getMonth() + 1
    const currentSeason = currentMonth >= 3 && currentMonth <= 5 ? 'Spring' :
                         currentMonth >= 6 && currentMonth <= 8 ? 'Summer' :
                         currentMonth >= 9 && currentMonth <= 11 ? 'Fall' : 'Winter'
    
    const cropDatabase = {
      // Cereals
      'Wheat': { growthDays: 120, idealSeasons: ['Fall', 'Winter'], idealTemp: '15-25°C', soilPreference: ['Loamy', 'Clay'], stages: [8, 18, 32, 48, 65, 78, 88, 95] },
      'Rice': { growthDays: 130, idealSeasons: ['Summer'], idealTemp: '25-35°C', soilPreference: ['Clay'], stages: [5, 15, 28, 45, 65, 80, 92, 98] },
      'Corn': { growthDays: 100, idealSeasons: ['Spring', 'Summer'], idealTemp: '20-30°C', soilPreference: ['Loamy', 'Sandy'], stages: [12, 28, 45, 62, 78, 88, 95, 100] },
      'Bajra': { growthDays: 75, idealSeasons: ['Summer'], idealTemp: '25-35°C', soilPreference: ['Sandy', 'Loamy'], stages: [10, 22, 35, 50, 65, 78, 90, 98] },
      'Jowar': { growthDays: 110, idealSeasons: ['Summer'], idealTemp: '26-30°C', soilPreference: ['Loamy', 'Clay'], stages: [8, 20, 35, 52, 68, 80, 92, 100] },
      'Ragi': { growthDays: 120, idealSeasons: ['Summer'], idealTemp: '20-27°C', soilPreference: ['Sandy', 'Loamy'], stages: [12, 25, 40, 55, 70, 82, 94, 100] },
      
      // Pulses
      'Arhar Dal': { growthDays: 180, idealSeasons: ['Summer'], idealTemp: '20-30°C', soilPreference: ['Loamy', 'Clay'], stages: [5, 12, 25, 40, 60, 75, 88, 95] },
      'Moong Dal': { growthDays: 60, idealSeasons: ['Summer'], idealTemp: '25-35°C', soilPreference: ['Sandy', 'Loamy'], stages: [15, 30, 45, 60, 75, 85, 95, 100] },
      'Chana Dal': { growthDays: 120, idealSeasons: ['Winter'], idealTemp: '15-25°C', soilPreference: ['Loamy', 'Clay'], stages: [10, 20, 35, 50, 65, 78, 90, 98] },
      
      // Cash Crops
      'Sugarcane': { growthDays: 365, idealSeasons: ['Spring', 'Summer'], idealTemp: '20-30°C', soilPreference: ['Loamy', 'Clay'], stages: [2, 8, 15, 25, 40, 60, 80, 95] },
      'Cotton': { growthDays: 180, idealSeasons: ['Summer'], idealTemp: '21-30°C', soilPreference: ['Loamy', 'Clay'], stages: [8, 18, 30, 45, 65, 78, 90, 98] },
      'Jute': { growthDays: 120, idealSeasons: ['Summer'], idealTemp: '24-35°C', soilPreference: ['Clay', 'Loamy'], stages: [12, 25, 40, 55, 70, 82, 92, 100] },
      'Mustard': { growthDays: 90, idealSeasons: ['Winter'], idealTemp: '10-25°C', soilPreference: ['Loamy', 'Sandy'], stages: [15, 28, 42, 58, 72, 85, 95, 100] },
      'Groundnut': { growthDays: 120, idealSeasons: ['Summer'], idealTemp: '20-30°C', soilPreference: ['Sandy', 'Loamy'], stages: [10, 22, 38, 55, 70, 82, 92, 98] },
      'Sunflower': { growthDays: 90, idealSeasons: ['Summer'], idealTemp: '20-25°C', soilPreference: ['Loamy', 'Sandy'], stages: [12, 25, 40, 58, 72, 85, 95, 100] },
      
      // Plantation Crops
      'Tea': { growthDays: 1095, idealSeasons: ['Spring', 'Summer'], idealTemp: '20-30°C', soilPreference: ['Loamy', 'Clay'], stages: [1, 5, 12, 25, 45, 65, 80, 95] },
      'Coffee': { growthDays: 1460, idealSeasons: ['Spring', 'Summer'], idealTemp: '15-25°C', soilPreference: ['Loamy'], stages: [1, 3, 8, 18, 35, 55, 75, 90] },
      'Rubber': { growthDays: 2555, idealSeasons: ['Spring', 'Summer'], idealTemp: '25-35°C', soilPreference: ['Loamy', 'Clay'], stages: [1, 2, 5, 12, 25, 45, 70, 85] },
      
      // Vegetables
      'Tomatoes': { growthDays: 80, idealSeasons: ['Spring', 'Summer'], idealTemp: '18-28°C', soilPreference: ['Loamy', 'Sandy'], stages: [15, 32, 48, 65, 78, 88, 95, 100] },
      'Onions': { growthDays: 120, idealSeasons: ['Winter'], idealTemp: '13-24°C', soilPreference: ['Loamy', 'Sandy'], stages: [8, 18, 32, 48, 65, 78, 90, 98] },
      'Potatoes': { growthDays: 90, idealSeasons: ['Spring', 'Fall'], idealTemp: '15-25°C', soilPreference: ['Loamy', 'Sandy'], stages: [10, 25, 42, 58, 72, 85, 92, 98] },
      'Cabbage': { growthDays: 75, idealSeasons: ['Winter'], idealTemp: '15-20°C', soilPreference: ['Loamy', 'Clay'], stages: [12, 25, 40, 55, 70, 82, 92, 100] },
      'Cauliflower': { growthDays: 70, idealSeasons: ['Winter'], idealTemp: '15-20°C', soilPreference: ['Loamy', 'Clay'], stages: [15, 28, 42, 58, 72, 85, 95, 100] },
      
      // Fruits
      'Apples': { growthDays: 1460, idealSeasons: ['Spring'], idealTemp: '15-25°C', soilPreference: ['Loamy'], stages: [1, 3, 8, 18, 35, 55, 75, 90] },
      'Bananas': { growthDays: 365, idealSeasons: ['Spring', 'Summer'], idealTemp: '26-30°C', soilPreference: ['Loamy', 'Clay'], stages: [2, 8, 18, 32, 50, 68, 82, 95] },
      'Mangoes': { growthDays: 1095, idealSeasons: ['Spring', 'Summer'], idealTemp: '24-30°C', soilPreference: ['Loamy'], stages: [1, 4, 10, 22, 40, 60, 78, 92] },
      'Oranges': { growthDays: 1095, idealSeasons: ['Spring'], idealTemp: '15-30°C', soilPreference: ['Loamy', 'Sandy'], stages: [1, 4, 10, 22, 40, 60, 78, 92] }
    }
    
    const crop = cropDatabase[cropType]
    if (!crop) return { suitable: false, warning: 'Unknown crop type' }
    
    const isSuitableSeason = crop.idealSeasons.includes(currentSeason)
    const isSuitableSoil = crop.soilPreference.includes(soilType)
    
    let analysis = {
      ...crop,
      suitable: isSuitableSeason && isSuitableSoil,
      currentSeason,
      warnings: []
    }
    
    if (!isSuitableSeason) {
      analysis.warnings.push(`${cropType} is not ideal for ${currentSeason}. Best seasons: ${crop.idealSeasons.join(', ')}`)
    }
    if (!isSuitableSoil) {
      analysis.warnings.push(`${soilType} soil may not be optimal. Preferred: ${crop.soilPreference.join(', ')}`)
    }
    
    return analysis
  }

  const generateAIGrowthData = (cropType, daysSincePlanted, soilType, area, plantingDate) => {
    // Crop-specific growth patterns
    const cropPatterns = {
      'Wheat': [8, 18, 32, 48, 65, 78, 88, 95], 'Rice': [5, 15, 28, 45, 65, 80, 92, 98], 'Corn': [12, 28, 45, 62, 78, 88, 95, 100],
      'Bajra': [10, 22, 35, 50, 65, 78, 90, 98], 'Jowar': [8, 20, 35, 52, 68, 80, 92, 100], 'Ragi': [12, 25, 40, 55, 70, 82, 94, 100],
      'Arhar Dal': [5, 12, 25, 40, 60, 75, 88, 95], 'Moong Dal': [15, 30, 45, 60, 75, 85, 95, 100], 'Chana Dal': [10, 20, 35, 50, 65, 78, 90, 98],
      'Sugarcane': [2, 8, 15, 25, 40, 60, 80, 95], 'Cotton': [8, 18, 30, 45, 65, 78, 90, 98], 'Jute': [12, 25, 40, 55, 70, 82, 92, 100],
      'Mustard': [15, 28, 42, 58, 72, 85, 95, 100], 'Groundnut': [10, 22, 38, 55, 70, 82, 92, 98], 'Sunflower': [12, 25, 40, 58, 72, 85, 95, 100],
      'Tea': [1, 5, 12, 25, 45, 65, 80, 95], 'Coffee': [1, 3, 8, 18, 35, 55, 75, 90], 'Rubber': [1, 2, 5, 12, 25, 45, 70, 85],
      'Tomatoes': [15, 32, 48, 65, 78, 88, 95, 100], 'Onions': [8, 18, 32, 48, 65, 78, 90, 98], 'Potatoes': [10, 25, 42, 58, 72, 85, 92, 98],
      'Cabbage': [12, 25, 40, 55, 70, 82, 92, 100], 'Cauliflower': [15, 28, 42, 58, 72, 85, 95, 100],
      'Apples': [1, 3, 8, 18, 35, 55, 75, 90], 'Bananas': [2, 8, 18, 32, 50, 68, 82, 95], 'Mangoes': [1, 4, 10, 22, 40, 60, 78, 92], 'Oranges': [1, 4, 10, 22, 40, 60, 78, 92]
    }
    
    const basePattern = cropPatterns[cropType] || [12, 25, 38, 52, 67, 78, 85, 92]
    
    // Soil type effects
    const soilMultiplier = {
      'Loamy': 1.15,
      'Clay': 0.9,
      'Sandy': 1.05
    }[soilType] || 1.0
    
    // Area effects (larger farms may have slight advantages)
    const areaFactor = Math.min(1.2, 1 + (area * 0.01))
    
    // Season/weather effects based on planting date
    const plantDate = new Date(plantingDate)
    const month = plantDate.getMonth() + 1
    const seasonFactor = (month >= 3 && month <= 5) ? 1.1 : // Spring
                        (month >= 6 && month <= 8) ? 1.0 : // Summer  
                        (month >= 9 && month <= 11) ? 0.95 : // Fall
                        0.85 // Winter
    
    // Days since planted effect
    const currentWeek = Math.min(8, Math.floor(daysSincePlanted / 7) + 1)
    
    const stages = basePattern.map((baseValue, index) => {
      let adjustedValue = baseValue * soilMultiplier * areaFactor * seasonFactor
      
      // Add some realistic variation
      const variation = (Math.sin(index * 0.5) * 5) + (Math.random() * 8 - 4)
      adjustedValue += variation
      
      // If we haven't reached this week yet, show lower progress
      if (index >= currentWeek) {
        adjustedValue *= 0.3 + (Math.random() * 0.2)
      }
      
      return Math.min(100, Math.max(0, Math.floor(adjustedValue)))
    })
    
    return stages
  }

  const deleteFarm = (farmId) => {
    const updatedFarms = farms.filter(farm => farm.id !== farmId)
    setFarms(updatedFarms)
    
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    localStorage.setItem(`farms_${user.id}`, JSON.stringify(updatedFarms))
  }

  const addFarm = () => {
    if (newFarm.name && newFarm.cropType && newFarm.area && newFarm.plantingDate) {
      const analysis = analyzeCrop(newFarm.cropType, newFarm.plantingDate, newFarm.soilType)
      const plantedDate = new Date(newFarm.plantingDate)
      const currentDate = new Date()
      const daysSincePlanted = Math.floor((currentDate - plantedDate) / (1000 * 60 * 60 * 24))
      
      const aiGrowthStages = generateAIGrowthData(newFarm.cropType, daysSincePlanted, newFarm.soilType, parseFloat(newFarm.area), newFarm.plantingDate)
      const currentStageIndex = Math.floor((daysSincePlanted / analysis.growthDays) * 8)
      const currentProgress = aiGrowthStages[Math.min(currentStageIndex, 7)] || 0
      
      const healthScore = analysis.suitable ? 
        Math.floor(85 + (parseFloat(newFarm.area) * 2) + (newFarm.soilType === 'Loamy' ? 5 : 0)) :
        Math.floor(60 + (parseFloat(newFarm.area) * 1))
      
      const farm = {
        id: Date.now(),
        ...newFarm,
        area: parseFloat(newFarm.area),
        plantedDate: newFarm.plantingDate,
        progress: Math.floor(currentProgress),
        daysToHarvest: Math.max(0, analysis.growthDays - daysSincePlanted),
        growthStages: aiGrowthStages,
        healthScore: Math.min(100, healthScore),
        analysis,
        daysSincePlanted
      }
      
      const updatedFarms = [...farms, farm]
      setFarms(updatedFarms)
      
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem(`farms_${user.id}`, JSON.stringify(updatedFarms))
      
      setNewFarm({ name: '', cropType: '', area: '', soilType: 'Loamy', plantingDate: '' })
      setCropAnalysis(null)
      setShowAddForm(false)
    }
  }
  
  const handleCropChange = (cropType) => {
    setNewFarm({...newFarm, cropType})
    if (cropType && newFarm.plantingDate) {
      setCropAnalysis(analyzeCrop(cropType, newFarm.plantingDate, newFarm.soilType))
    }
  }

  return (
    <div className="farm-management">
      <div className="page-header">
        <div>
          <h1>🚜 My Farms</h1>
          <p>Manage and monitor your farm fields</p>
        </div>
        <button 
          className="add-farm-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add New Farm
        </button>
      </div>

      <div className="farms-grid">
        {farms.map(farm => (
          <div key={farm.id} className={`farm-card ${getCropClass(farm.cropType)}`}>
            <div className="farm-header">
              <h3>{farm.name}</h3>
              <span className="crop-type">{farm.cropType}</span>
            </div>
            
            <div className="farm-stats">
              <div className="stat">
                <span className="label">Area</span>
                <span className="value">{farm.area} ha</span>
              </div>
              <div className="stat">
                <span className="label">Progress</span>
                <span className="value">{farm.progress}%</span>
              </div>
              <div className="stat">
                <span className="label">Days to Harvest</span>
                <span className="value">{farm.daysToHarvest}</span>
              </div>
              <div className="stat">
                <span className="label">Days Planted</span>
                <span className="value">{farm.daysSincePlanted || 0}</span>
              </div>
            </div>

            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${farm.progress}%` }}
              ></div>
            </div>

            <div className="farm-chart">
              <GrowthChart farmId={farm.id} farm={farm} />
            </div>

            <div className="farm-actions">
              <button 
                className="view-details-btn"
                onClick={() => setSelectedFarm(farm)}
              >
                View Details
              </button>
              <button 
                className="delete-farm-btn"
                onClick={() => deleteFarm(farm.id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="add-farm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Farm</h3>
            <input
              type="text"
              placeholder="Farm Name"
              value={newFarm.name}
              onChange={(e) => setNewFarm({...newFarm, name: e.target.value})}
            />
            <select
              value={newFarm.cropType}
              onChange={(e) => handleCropChange(e.target.value)}
              className="glassmorphic-select"
            >
              <option value="">Select Crop Type</option>
              <optgroup label="Cereals">
                <option value="Wheat">Wheat</option>
                <option value="Rice">Rice</option>
                <option value="Corn">Corn</option>
                <option value="Bajra">Bajra</option>
                <option value="Jowar">Jowar</option>
                <option value="Ragi">Ragi</option>
              </optgroup>
              <optgroup label="Pulses">
                <option value="Arhar Dal">Arhar Dal</option>
                <option value="Moong Dal">Moong Dal</option>
                <option value="Chana Dal">Chana Dal</option>
              </optgroup>
              <optgroup label="Cash Crops">
                <option value="Sugarcane">Sugarcane</option>
                <option value="Cotton">Cotton</option>
                <option value="Jute">Jute</option>
                <option value="Mustard">Mustard</option>
                <option value="Groundnut">Groundnut</option>
                <option value="Sunflower">Sunflower</option>
              </optgroup>
              <optgroup label="Plantation Crops">
                <option value="Tea">Tea</option>
                <option value="Coffee">Coffee</option>
                <option value="Rubber">Rubber</option>
              </optgroup>
              <optgroup label="Vegetables">
                <option value="Tomatoes">Tomatoes</option>
                <option value="Onions">Onions</option>
                <option value="Potatoes">Potatoes</option>
                <option value="Cabbage">Cabbage</option>
                <option value="Cauliflower">Cauliflower</option>
              </optgroup>
              <optgroup label="Fruits">
                <option value="Apples">Apples</option>
                <option value="Bananas">Bananas</option>
                <option value="Mangoes">Mangoes</option>
                <option value="Oranges">Oranges</option>
              </optgroup>
            </select>
            <input
              type="number"
              placeholder="Area (hectares)"
              value={newFarm.area}
              onChange={(e) => setNewFarm({...newFarm, area: e.target.value})}
            />
            <input
              type="date"
              value={newFarm.plantingDate}
              onChange={(e) => {
                setNewFarm({...newFarm, plantingDate: e.target.value})
                if (newFarm.cropType && e.target.value) {
                  setCropAnalysis(analyzeCrop(newFarm.cropType, e.target.value, newFarm.soilType))
                }
              }}
              required
            />
            <select
              value={newFarm.soilType}
              onChange={(e) => setNewFarm({...newFarm, soilType: e.target.value})}
            >
              <option value="Loamy">Loamy</option>
              <option value="Clay">Clay</option>
              <option value="Sandy">Sandy</option>
            </select>
            {cropAnalysis && (
              <div className={`crop-analysis ${cropAnalysis.suitable ? 'suitable' : 'warning'}`}>
                <h4>{cropAnalysis.suitable ? '✅ Good Choice!' : '⚠️ Warning'}</h4>
                <p>Growth period: {cropAnalysis.growthDays} days</p>
                <p>Ideal temperature: {cropAnalysis.idealTemp}</p>
                {cropAnalysis.warnings.map((warning, i) => (
                  <p key={i} className="warning-text">{warning}</p>
                ))}
              </div>
            )}
            <div className="modal-buttons">
              <button onClick={addFarm}>Add Farm</button>
              <button onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedFarm && (
        <DetailedAnalytics 
          farm={selectedFarm} 
          onClose={() => setSelectedFarm(null)} 
        />
      )}
    </div>
  )
}

export default FarmManagement