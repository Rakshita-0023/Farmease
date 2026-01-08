import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Persistent full-screen video background
 * - Stays mounted across route transitions (no flicker)
 * - Autoplay, loop, muted, playsInline (required for mobile/production)
 * - Dark gradient overlay (heavier on dashboard)
 * - Pauses when tab inactive
 * - Slows down after initial load on dashboard
 * - Falls back to solid background if video fails
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
    if (!video) return

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
      setIsVideoLoaded(true)
      setVideoError(false)
    }

    const handleLoadedData = () => {
      setIsVideoLoaded(true)
      setVideoError(false)
    }

    // Handle video load errors
    const handleError = (e) => {
      console.error('Video load error:', e)
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
  }, [show])

  // Control playback based on show prop
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (show) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [show])

  // Slow down video on dashboard after 4 seconds
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isDashboard) return

    video.playbackRate = 1.0

    const slowDownTimer = setTimeout(() => {
      video.playbackRate = 0.5
    }, 4000)

    return () => clearTimeout(slowDownTimer)
  }, [isDashboard, location.pathname])

  // Reset to normal speed on public routes
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isPublicRoute) return
    video.playbackRate = 1.0
  }, [isPublicRoute])

  return (
    <div 
      className={`fixed inset-0 z-0 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Solid dark background - prevents any flash and serves as fallback */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950" />
      
      {/* Video - fades in when loaded, hidden if error */}
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
          poster=""
        >
          {/* Use absolute path from public folder */}
          <source src="/background.mp4" type="video/mp4" />
          {/* Fallback message for browsers that don't support video */}
          Your browser does not support the video tag.
        </video>
      )}

      {/* Dark gradient overlay - heavier on dashboard */}
      <div className={`absolute inset-0 transition-all duration-500 ${
        isDashboard 
          ? 'bg-gradient-to-br from-black/80 via-black/70 to-emerald-950/80' 
          : 'bg-gradient-to-br from-black/60 via-black/40 to-emerald-900/50'
      }`} />
      
      {/* Additional gradient for text readability */}
      <div className={`absolute inset-0 transition-all duration-500 ${
        isDashboard
          ? 'bg-gradient-to-b from-black/50 via-transparent to-black/70'
          : 'bg-gradient-to-b from-black/30 via-transparent to-black/50'
      }`} />
    </div>
  )
}

export default PersistentVideoBackground
