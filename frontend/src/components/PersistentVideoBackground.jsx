import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Persistent full-screen video background
 * - Stays mounted across route transitions (no flicker)
 * - Autoplay, loop, muted, playsInline (required for mobile/production)
 * - Dark gradient overlay (heavier on dashboard)
 * - Falls back to static image if video fails
 */
const PersistentVideoBackground = ({ show = true }) => {
  const videoRef = useRef(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const location = useLocation()
  
  // Determine if we're on dashboard (authenticated) vs public pages
  const isPublicRoute = ['/landing', '/login'].includes(location.pathname)
  const isDashboard = !isPublicRoute && show

  useEffect(() => {
    const video = videoRef.current
    if (!video || videoError) return

    // Handle visibility change - pause when tab is inactive
    const handleVisibilityChange = () => {
      if (!show) return
      if (document.hidden) {
        video.pause()
      } else {
        video.play().catch(() => {})
      }
    }

    // Mark as loaded when video can play through
    const handleCanPlayThrough = () => {
      console.log('✅ Video loaded successfully')
      setIsVideoLoaded(true)
      setVideoError(false)
    }

    const handleLoadedData = () => {
      console.log('✅ Video data loaded')
      setIsVideoLoaded(true)
      setVideoError(false)
    }

    // Handle video load errors
    const handleError = (e) => {
      console.error('❌ Video load error:', e)
      setVideoError(true)
      setIsVideoLoaded(false)
    }

    video.addEventListener('canplaythrough', handleCanPlayThrough)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Start playing if visible
    if (show && !document.hidden) {
      video.play().catch((err) => {
        console.warn('Video autoplay blocked:', err.message)
        // Still show video even if autoplay blocked
        setIsVideoLoaded(true)
      })
    }

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [show, videoError])

  // Control playback based on show prop
  useEffect(() => {
    const video = videoRef.current
    if (!video || videoError) return

    if (show) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [show, videoError])

  // Slow down video on dashboard after 4 seconds
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isDashboard || videoError) return

    video.playbackRate = 1.0

    const slowDownTimer = setTimeout(() => {
      video.playbackRate = 0.5
    }, 4000)

    return () => clearTimeout(slowDownTimer)
  }, [isDashboard, location.pathname, videoError])

  // Reset to normal speed on public routes
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isPublicRoute || videoError) return
    video.playbackRate = 1.0
  }, [isPublicRoute, videoError])

  return (
    <div 
      className={`fixed inset-0 z-0 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Base gradient background - always visible */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950" />
      
      {/* Static farm image fallback - shows if video fails or while loading */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
          (videoError || !isVideoLoaded) ? 'opacity-40' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80')`
        }}
      />
      
      {/* Video - fades in when loaded */}
      {!videoError && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          } ${isDashboard ? 'saturate-50 blur-[1px]' : ''}`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
      )}

      {/* Dark gradient overlay */}
      <div className={`absolute inset-0 transition-all duration-500 ${
        isDashboard 
          ? 'bg-gradient-to-br from-black/80 via-black/70 to-emerald-950/80' 
          : 'bg-gradient-to-br from-black/50 via-black/30 to-emerald-900/40'
      }`} />
      
      {/* Additional gradient for text readability */}
      <div className={`absolute inset-0 transition-all duration-500 ${
        isDashboard
          ? 'bg-gradient-to-b from-black/50 via-transparent to-black/70'
          : 'bg-gradient-to-b from-black/20 via-transparent to-black/40'
      }`} />
    </div>
  )
}

export default PersistentVideoBackground
