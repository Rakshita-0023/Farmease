import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

const LoadingAnimation = () => {
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    fetch('/Money (1).json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Error loading animation:', error))
  }, [])

  return (
    <div className="loading-container">
      {animationData ? (
        <Lottie 
          animationData={animationData} 
          style={{ width: 200, height: 200 }}
          loop={true}
        />
      ) : (
        <div className="loading-spinner"></div>
      )}
      <p>Loading FarmEase...</p>
    </div>
  )
}

export default LoadingAnimation