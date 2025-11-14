import { useState, useEffect, useCallback, memo } from 'react'
import { Line } from 'react-chartjs-2'
import DetailedAnalytics from './DetailedAnalytics'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const GrowthChart = memo(function GrowthChart({ farmId, cropType, soilType, sowingDate, farmData }) {
  const [growthData, setGrowthData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAnalytics, setShowAnalytics] = useState(false)

  useEffect(() => {
    generateGrowthData()
  }, [farmId, cropType, soilType, sowingDate])

  const handleExpandClick = useCallback(() => {
    setShowAnalytics(true)
  }, [])

  const handleCloseAnalytics = useCallback(() => {
    setShowAnalytics(false)
  }, [])

  const generateGrowthData = useCallback(() => {
    const cropFactors = {
      'Rice': { baseGrowth: 12, moistureRange: [75, 85], rainfallRange: [15, 30] },
      'Wheat': { baseGrowth: 14, moistureRange: [65, 75], rainfallRange: [8, 18] },
      'Maize': { baseGrowth: 16, moistureRange: [70, 80], rainfallRange: [12, 25] },
      'Cotton': { baseGrowth: 10, moistureRange: [55, 70], rainfallRange: [5, 15] }
    }
    
    const soilFactors = {
      'Clay': { moistureBonus: 8, growthBonus: -1 },
      'Sandy': { moistureBonus: -12, growthBonus: 2 },
      'Loamy': { moistureBonus: 0, growthBonus: 0 }
    }
    
    const crop = cropFactors[cropType] || cropFactors['Rice']
    const soil = soilFactors[soilType] || soilFactors['Loamy']
    
    const daysSinceSowing = sowingDate ? 
      Math.floor((new Date() - new Date(sowingDate)) / (1000 * 60 * 60 * 24)) : 30
    const weeksSinceSowing = Math.max(1, Math.floor(daysSinceSowing / 7))
    
    const mockData = []
    let cumulativeGrowth = 0
    
    for (let week = 1; week <= 6; week++) {
      // Realistic growth progression
      if (week <= weeksSinceSowing) {
        const weeklyGrowth = crop.baseGrowth + soil.growthBonus + (Math.random() * 4 - 2)
        cumulativeGrowth = Math.min(cumulativeGrowth + weeklyGrowth, 100)
      } else {
        // Future weeks show projected growth
        const projectedGrowth = crop.baseGrowth * 0.8
        cumulativeGrowth = Math.min(cumulativeGrowth + projectedGrowth, 100)
      }
      
      // Soil moisture with seasonal variation
      const baseMoisture = crop.moistureRange[0] + 
        (crop.moistureRange[1] - crop.moistureRange[0]) * (0.5 + Math.sin(week * 0.5) * 0.3)
      const soilMoisture = Math.max(20, Math.min(100, baseMoisture + soil.moistureBonus))
      
      // Rainfall with realistic patterns
      const baseRainfall = crop.rainfallRange[0] + 
        Math.random() * (crop.rainfallRange[1] - crop.rainfallRange[0])
      const rainfall = Math.max(0, Math.min(50, baseRainfall + (Math.random() * 10 - 5)))
      
      mockData.push({
        week,
        progress: Math.round(cumulativeGrowth * 10) / 10,
        soilMoisture: Math.round(soilMoisture * 10) / 10,
        rainfall: Math.round(rainfall * 10) / 10
      })
    }
    
    setTimeout(() => {
      setGrowthData(mockData)
      setLoading(false)
    }, 300)
  }, [cropType, soilType, sowingDate])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  const data = {
    labels: growthData.map(d => `Week ${d.week}`),
    datasets: [
      {
        label: '🌿 Growth Progress (%)',
        data: growthData.map(d => d.progress),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: '💧 Soil Moisture (%)',
        data: growthData.map(d => d.soilMoisture),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: '🌦️ Rainfall (mm)',
        data: growthData.map(d => d.rainfall),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12 }
        }
      },
      title: {
        display: true,
        text: 'Crop Growth Progress Tracker',
        font: { size: 14, weight: 'bold' },
        color: '#374151'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#6b7280',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          afterBody: function(context) {
            const rainfall = context[2]?.parsed?.y || 0
            if (rainfall < 10) {
              return ['⚠️ Low rainfall - consider irrigation']
            }
            return []
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Weeks since sowing',
          font: { size: 12, weight: 'bold' }
        },
        grid: { color: '#f3f4f6' }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Progress & Moisture (%)',
          font: { size: 12, weight: 'bold' },
          color: '#22c55e'
        },
        min: 0,
        max: 100,
        grid: { color: '#f3f4f6' },
        ticks: {
          callback: function(value) {
            return value + '%'
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Rainfall (mm)',
          font: { size: 12, weight: 'bold' },
          color: '#8b5cf6'
        },
        min: 0,
        max: 50,
        grid: { drawOnChartArea: false },
        ticks: {
          callback: function(value) {
            return value + 'mm'
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }

  const lastUpdated = new Date().toLocaleString()
  
  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ height: '300px', marginBottom: '1rem' }}>
        <Line data={data} options={options} />
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontSize: '0.8rem',
        color: '#6b7280',
        borderTop: '1px solid #f3f4f6',
        paddingTop: '0.75rem'
      }}>
        <span>Last updated: {lastUpdated}</span>
        <button 
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
          }}
          onClick={handleExpandClick}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)'
            e.target.style.boxShadow = '0 4px 8px rgba(34, 197, 94, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 2px 4px rgba(34, 197, 94, 0.2)'
          }}
        >
          🔍 Expand Analytics
        </button>
      </div>
      {showAnalytics && (
        <DetailedAnalytics 
          farm={farmData} 
          onClose={handleCloseAnalytics} 
        />
      )}
    </div>
  )
})

export default GrowthChart