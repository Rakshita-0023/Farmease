import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Video background for Landing/Login pages only
 * Dashboard uses static gradient for performance
 */
const PersistentVideoBackground = ({ show = true }) => {
  const videoRef = useRef(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const location = useLocation()
  
  // Video only on public routes (landing, login)
  const isPublicRoute = ['/landing', '/login'].includes(location.pathname)
  const showVideo = isPublicRoute && show

  useEffect(() => {
    const video = videoRef.current
    if (!video || !showVideo) return

    const handleCanPlay = () => setIsVideoLoaded(true)
    
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadeddata', handleCanPlay)
    
    video.play().catch(() => setIsVideoLoaded(true))

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadeddata', handleCanPlay)
    }
  }, [showVideo])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (showVideo) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [showVideo])

  // Don't render if not showing
  if (!show) return null

  return (
    <div className="fixed inset-0 z-0">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-slate-950" />
      
      {/* Video - only on landing/login */}
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src="/background.min.mp4" type="video/mp4" />
        </video>
      )}

      {/* Overlay - lighter on public pages, heavier on dashboard */}
      <div className={`absolute inset-0 ${
        isPublicRoute 
          ? 'bg-gradient-to-br from-black/40 via-black/20 to-emerald-900/30' 
          : 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-emerald-950/95'
      }`} />
    </div>
  )
}

export default PersistentVideoBackground
