import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Background component:
 * - Video on Landing/Login pages
 * - Static image on Dashboard (all authenticated pages)
 */
const PersistentVideoBackground = ({ show = true }) => {
  const videoRef = useRef(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const location = useLocation()
  
  // Video only on public routes (landing, login)
  const isPublicRoute = ['/landing', '/login'].includes(location.pathname)
  const showVideo = isPublicRoute && show
  const showStaticBg = !isPublicRoute && show

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

      {/* Static image - on dashboard/authenticated pages */}
      {showStaticBg && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/background_img.png)' }}
        />
      )}

      {/* Overlay */}
      <div className={`absolute inset-0 ${
        isPublicRoute 
          ? 'bg-gradient-to-br from-black/40 via-black/20 to-emerald-900/30' 
          : 'bg-gradient-to-br from-black/70 via-black/60 to-emerald-950/70'
      }`} />
    </div>
  )
}

export default PersistentVideoBackground
