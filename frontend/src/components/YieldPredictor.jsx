import { useState, useEffect } from 'react'

const YieldPredictor = ({ farmData, weatherData }) => {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [historicalData, setHistoricalData] = useState([])

  const generateYieldPrediction = (farm, weather) => {
    // AI-like yield prediction algorithm
    const baseYields = {
      'Wheat': 45, 'Rice': 55, 'Corn': 65, 'Tomatoes': 400,
      'Onions': 350, 'Potatoes': 250, 'Cotton': 25, 'Sugarcane': 700
    }

    const baseYield = baseYields[farm.cropType] || 50
    
    // Weather impact factors
    let weatherFactor = 1.0
    if (weather?.temperature) {
      const optimalTemp = farm.cropType === 'Wheat' ? 20 : farm.cropType === 'Rice' ? 30 : 25
      const tempDiff = Math.abs(weather.temperature - optimalTemp)
      weatherFactor = Math.max(0.7, 1 - (tempDiff * 0.02))
    }

    // Soil quality factor
    const soilFactor = farm.soilType === 'Loamy' ? 1.1 : farm.soilType === 'Clay' ? 0.95 : 1.0

    // Farm management factor (based on progress)
    const managementFactor = 0.8 + (farm.progress * 0.004)

    // Area efficiency factor
    const areaFactor = farm.area > 5 ? 1.05 : farm.area > 2 ? 1.0 : 0.95

    const predictedYield = Math.round(baseYield * weatherFactor * soilFactor * managementFactor * areaFactor)
    const confidence = Math.round(85 + Math.random() * 10)

    return {
      expectedYield: predictedYield,
      unit: farm.cropType === 'Tomatoes' || farm.cropType === 'Onions' || farm.cropType === 'Potatoes' ? 'quintals/hectare' : 'quintals/hectare',
      confidence,
      factors: {
        weather: Math.round(weatherFactor * 100),
        soil: Math.round(soilFactor * 100),
        management: Math.round(managementFactor * 100),
        area: Math.round(areaFactor * 100)
      },
      recommendations: generateRecommendations(farm, weather, weatherFactor)
    }
  }

  const generateRecommendations = (farm, weather, weatherFactor) => {
    const recommendations = []

    if (weatherFactor < 0.9) {
      recommendations.push({
        type: 'weather',
        message: 'Weather conditions are not optimal. Consider protective measures.',
        action: 'Install shade nets or greenhouse protection'
      })
    }

    if (farm.soilType !== 'Loamy') {
      recommendations.push({
        type: 'soil',
        message: 'Soil improvement can boost yield by 10-15%',
        action: 'Add organic compost and improve drainage'
      })
    }

    if (farm.progress < 70) {
      recommendations.push({
        type: 'management',
        message: 'Improve farm management practices',
        action: 'Regular monitoring and timely interventions needed'
      })
    }

    recommendations.push({
      type: 'irrigation',
      message: 'Optimal irrigation schedule for maximum yield',
      action: `Water every ${farm.cropType === 'Rice' ? '2-3' : '4-5'} days during growing season`
    })

    return recommendations
  }

  const generateHistoricalData = (cropType) => {
    const currentYear = new Date().getFullYear()
    const data = []
    
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i
      const baseYield = generateYieldPrediction({ cropType, soilType: 'Loamy', progress: 80, area: 3 }, { temperature: 25 }).expectedYield
      const variation = (Math.random() - 0.5) * 0.3
      const yieldValue = Math.round(baseYield * (1 + variation))
      
      data.push({
        year,
        yield: yieldValue,
        weather: Math.random() > 0.5 ? 'Good' : 'Average',
        trend: i === 0 ? 'current' : yieldValue > (data[data.length - 1]?.yield || 0) ? 'up' : 'down'
      })
    }
    
    return data
  }

  useEffect(() => {
    if (farmData) {
      setLoading(true)
      
      // Simulate AI processing time
      setTimeout(() => {
        const yieldPrediction = generateYieldPrediction(farmData, weatherData)
        const historical = generateHistoricalData(farmData.cropType)
        
        setPrediction(yieldPrediction)
        setHistoricalData(historical)
        setLoading(false)
      }, 1500)
    }
  }, [farmData, weatherData])

  if (loading) {
    return (
      <div className="yield-predictor loading">
        <div className="ai-processing">
          <div className="processing-animation">🧠</div>
          <p>AI analyzing your farm data...</p>
          <div className="processing-steps">
            <div className="step">Analyzing weather patterns</div>
            <div className="step">Evaluating soil conditions</div>
            <div className="step">Processing historical data</div>
            <div className="step">Generating predictions</div>
          </div>
        </div>
      </div>
    )
  }

  if (!prediction) return null

  return (
    <div className="yield-predictor">
      <div className="predictor-header">
        <h3>🧠 AI Yield Prediction</h3>
        <div className="confidence-badge">
          {prediction.confidence}% Confidence
        </div>
      </div>

      {/* Main Prediction */}
      <div className="prediction-main">
        <div className="yield-estimate">
          <div className="yield-value">{prediction.expectedYield}</div>
          <div className="yield-unit">{prediction.unit}</div>
          <div className="yield-label">Expected Yield</div>
        </div>

        <div className="factors-breakdown">
          <h4>Contributing Factors:</h4>
          <div className="factors-grid">
            <div className="factor">
              <span className="factor-label">Weather</span>
              <div className="factor-bar">
                <div 
                  className="factor-fill weather" 
                  style={{ width: `${prediction.factors.weather}%` }}
                ></div>
              </div>
              <span className="factor-value">{prediction.factors.weather}%</span>
            </div>
            <div className="factor">
              <span className="factor-label">Soil Quality</span>
              <div className="factor-bar">
                <div 
                  className="factor-fill soil" 
                  style={{ width: `${prediction.factors.soil}%` }}
                ></div>
              </div>
              <span className="factor-value">{prediction.factors.soil}%</span>
            </div>
            <div className="factor">
              <span className="factor-label">Management</span>
              <div className="factor-bar">
                <div 
                  className="factor-fill management" 
                  style={{ width: `${prediction.factors.management}%` }}
                ></div>
              </div>
              <span className="factor-value">{prediction.factors.management}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Trends */}
      <div className="historical-section">
        <h4>📊 Historical Yield Trends</h4>
        <div className="historical-chart">
          {historicalData.map((data, index) => (
            <div key={data.year} className="year-data">
              <div className="year-label">{data.year}</div>
              <div 
                className="yield-bar" 
                style={{ 
                  height: `${(data.yield / Math.max(...historicalData.map(d => d.yield))) * 100}%` 
                }}
              >
                <div className="yield-tooltip">
                  {data.yield} quintals/hectare
                  <br />
                  Weather: {data.weather}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="recommendations-section">
        <h4>💡 AI Recommendations</h4>
        <div className="recommendations-list">
          {prediction.recommendations.map((rec, index) => (
            <div key={index} className={`recommendation ${rec.type}`}>
              <div className="rec-message">{rec.message}</div>
              <div className="rec-action">{rec.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default YieldPredictor