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
  const [videoError, setVideoError] = useState(false)
  const location = useLocation()

  // Video only on public routes (landing, login)
  const isPublicRoute = ['/landing', '/login', '/'].includes(location.pathname) && !localStorage.getItem('token')
  const showVideo = isPublicRoute && show && !videoError
  const showStaticBg = !showVideo && show

  useEffect(() => {
    const video = videoRef.current
    if (!video || !showVideo) return

    const handleCanPlay = () => {
      console.log('Video can play')
      setIsVideoLoaded(true)
    }

    const handleError = (e) => {
      console.error('Video error:', e)
      setVideoError(true)
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadeddata', handleCanPlay)
    video.addEventListener('error', handleError)

    video.play().catch((err) => {
      console.log('Video autoplay failed:', err)
      setIsVideoLoaded(true)
    })

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadeddata', handleCanPlay)
      video.removeEventListener('error', handleError)
    }
  }, [showVideo])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (showVideo) {
      video.play().catch(() => { })
    } else {
      video.pause()
    }
  }, [showVideo])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-0">
      {/* Video only on public routes before login */}
      {showVideo && (
        <>
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/backimg.png"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            onError={() => setVideoError(true)}
          >
            <source src="/background.min.mp4" type="video/mp4" />
          </video>
          {/* Video overlay to keep text readable */}
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}

      {/* Authenticated routes: static image only */}
      {showStaticBg && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/backimg.png')" }}
          />
          <div className="absolute inset-0 bg-black/42" />
        </>
      )}
    </div>
  )
}

export default PersistentVideoBackground
