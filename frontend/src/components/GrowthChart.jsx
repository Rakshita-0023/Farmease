import { useEffect, useRef, memo } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const GrowthChart = memo(({ farmId, farm }) => {
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

  const data = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    datasets: [
      {
        label: 'Growth Progress (%)',
        data: cropData.progress,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Height (cm)',
        data: cropData.height,
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
          text: 'Time Period'
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