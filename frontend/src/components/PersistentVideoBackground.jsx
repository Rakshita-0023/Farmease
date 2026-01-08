import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Persistent full-screen video background
 * - Stays mounted across route transitions (no flicker)
 * - Autoplay, loop, muted, playsInline
 * - Dark gradient overlay (heavier on dashboard)
 * - Pauses when tab inactive
 * - Slows down after initial load on dashboard
 */
const PersistentVideoBackground = ({ show = true }) => {
  const videoRef = useRef(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
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
    }

    const handleLoadedData = () => {
      setIsVideoLoaded(true)
    }

    video.addEventListener('canplaythrough', handleCanPlayThrough)
    video.addEventListener('loadeddata', handleLoadedData)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Start playing if visible
    if (show && !document.hidden) {
      video.play().catch(() => {})
    }

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      video.removeEventListener('loadeddata', handleLoadedData)
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
      {/* Solid dark background - prevents any flash */}
      <div className="absolute inset-0 bg-slate-950" />
      
      {/* Video - fades in when loaded */}
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

      {/* Dark gradient overlay - heavier on dashboard */}
      <div className={`absolute inset-0 transition-all duration-500 ${
        isDashboard 
          ? 'bg-gradient-to-br from-black/80 via-black/70 to-emerald-950/80' 
          : 'bg-gradient-to-br from-black/70 via-black/50 to-emerald-900/60'
      }`} />
      
      {/* Additional gradient for text readability */}
      <div className={`absolute inset-0 transition-all duration-500 ${
        isDashboard
          ? 'bg-gradient-to-b from-black/50 via-transparent to-black/70'
          : 'bg-gradient-to-b from-black/40 via-transparent to-black/60'
      }`} />
    </div>
  )
}

export default PersistentVideoBackground
