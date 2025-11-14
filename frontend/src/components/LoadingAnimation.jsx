import Lottie from 'lottie-react'
import { useState, useEffect } from 'react'

function LoadingAnimation() {
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    fetch('/Money.json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(() => {
        // Fallback if animation fails to load
        setAnimationData(null)
      })
  }, [])

  if (!animationData) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #22c55e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <Lottie 
        animationData={animationData}
        style={{ width: 200, height: 200 }}
        loop={true}
      />
      <p style={{ 
        marginTop: '1rem', 
        color: '#22c55e', 
        fontSize: '1.2rem', 
        fontWeight: '600' 
      }}>
        Loading...
      </p>
    </div>
  )
}

export default LoadingAnimation