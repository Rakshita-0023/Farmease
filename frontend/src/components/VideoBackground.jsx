import { useEffect, useRef, useState } from 'react'

/**
 * Full-screen video background component
 * - Autoplay, loop, muted
 * - Dark gradient overlay for text readability
 * - Pauses when tab is inactive
 * - Falls back to poster on mobile/low-power mode
 */
const VideoBackground = ({ children, overlayOpacity = 0.5 }) => {
  const videoRef = useRef(null)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Handle visibility change - pause when tab is inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause()
      } else {
        video.play().catch(() => {
          // Autoplay might be blocked, that's okay
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Try to play the video
    video.play().catch(() => {
      // Autoplay blocked - video will show poster instead
      console.log('Video autoplay blocked, showing poster')
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Video Background */}
      {!videoError && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster="/wheat.jpeg"
          onError={() => setVideoError(true)}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
      )}

      {/* Fallback static background if video fails */}
      {videoError && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('/wheat.jpeg')" }}
        />
      )}

      {/* Dark gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-emerald-900/60"
        style={{ opacity: overlayOpacity }}
      />

      {/* Additional gradient for better text readability at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  )
}

export default VideoBackground
