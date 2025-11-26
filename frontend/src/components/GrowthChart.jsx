import { useEffect, useRef, memo } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const GrowthChart = memo(({ farmId, farm, daysSincePlanted }) => {
  const chartRef = useRef()

  const generateCropSpecificData = () => {
    if (!farm) return { progress: [12, 25, 38, 52, 67, 78, 85, 92], height: [5, 12, 22, 35, 48, 62, 75, 85] }
    
    const progress = farm.growthStages || [12, 25, 38, 52, 67, 78, 85, 92]
    
    const cropHeightPatterns = {
      'Wheat': { maxHeight: 105, pattern: [0.03, 0.08, 0.17, 0.33, 0.52, 0.71, 0.86, 1.0] },
      'Corn': { maxHeight: 250, pattern: [0.03, 0.08, 0.18, 0.32, 0.48, 0.64, 0.80, 1.0] },
      'Rice': { maxHeight: 95, pattern: [0.02, 0.05, 0.13, 0.26, 0.42, 0.63, 0.84, 1.0] },
      'Tomatoes': { maxHeight: 180, pattern: [0.03, 0.08, 0.17, 0.28, 0.44, 0.67, 0.83, 1.0] },
      'Potatoes': { maxHeight: 55, pattern: [0.04, 0.11, 0.27, 0.45, 0.64, 0.82, 0.91, 1.0] }
    }
    
    const cropData = cropHeightPatterns[farm.cropType] || cropHeightPatterns['Wheat']
    const height = cropData.pattern.map((ratio, index) => {
      const baseHeight = cropData.maxHeight * ratio
      const progressFactor = progress[index] / 100
      return Math.floor(baseHeight * progressFactor)
    })
    
    return { progress, height }
  }

  const cropData = generateCropSpecificData()

  // Generate dynamic labels based on actual time planted
  const generateTimeLabels = () => {
    const days = daysSincePlanted || 56 // Default to 8 weeks if not provided
    
    if (days <= 56) { // Less than 8 weeks - show weeks
      const weeks = Math.ceil(days / 7)
      return Array.from({ length: Math.min(8, weeks) }, (_, i) => `Week ${i + 1}`)
    } else if (days <= 365) { // Less than a year - show months
      const months = Math.ceil(days / 30)
      return Array.from({ length: Math.min(12, months) }, (_, i) => `Month ${i + 1}`)
    } else { // More than a year - show years
      const years = Math.ceil(days / 365)
      return Array.from({ length: Math.min(5, years) }, (_, i) => `Year ${i + 1}`)
    }
  }
  
  const timeLabels = generateTimeLabels()
  
  // Adjust data points to match the time scale
  const adjustDataForTimeScale = (originalData) => {
    const targetLength = timeLabels.length
    if (originalData.length === targetLength) return originalData
    
    // Interpolate or extrapolate data to match time scale
    const result = []
    for (let i = 0; i < targetLength; i++) {
      const ratio = (i / (targetLength - 1)) * (originalData.length - 1)
      const index = Math.floor(ratio)
      const remainder = ratio - index
      
      if (index >= originalData.length - 1) {
        result.push(originalData[originalData.length - 1])
      } else {
        const interpolated = originalData[index] + (originalData[index + 1] - originalData[index]) * remainder
        result.push(Math.round(interpolated))
      }
    }
    return result
  }
  
  const adjustedProgress = adjustDataForTimeScale(cropData.progress)
  const adjustedHeight = adjustDataForTimeScale(cropData.height)

  const data = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Growth Progress (%)',
        data: adjustedProgress,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Height (cm)',
        data: adjustedHeight,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: daysSincePlanted > 56 ? (daysSincePlanted > 365 ? 'Years' : 'Months') : 'Weeks'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Progress (%)'
        },
        max: 100
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Height (cm)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }

  return (
    <div style={{ height: '200px', width: '100%' }}>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  )
})

GrowthChart.displayName = 'GrowthChart'

export default GrowthChart