import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import EnhancedDashboard from './components/EnhancedDashboard'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import FarmManagement from './components/FarmManagement'
import Weather from './components/Weather'
import Market from './components/Market'
import MarketIntelligenceHub from './components/MarketIntelligenceHub'
import Tips from './components/Tips'
import PlantDoctor from './components/PlantDoctor'
import CommunityForum from './components/CommunityForum'
import Schemes from './components/Schemes'
import AboutUs from './components/AboutUs'
import Contact from './components/Contact'
import TermsOfService from './components/TermsOfService'
import AdvancedFeatures from './components/AdvancedFeatures'
import { getAuthToken, removeAuthToken } from './config'

function App() {
  const [user, setUser] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true // Cleanup flag to prevent memory leaks

    const initializeApp = async () => {
      try {
        const token = getAuthToken()
        const savedUser = localStorage.getItem('user')

        if (token && savedUser) {
          try {
            const userData = JSON.parse(savedUser)
            if (isMounted) {
              setUser(userData)
            }
          } catch (e) {
            console.error("Failed to parse user data", e)
            removeAuthToken()
          }
        }

        // Auto-detect location with timeout
        if (navigator.geolocation && isMounted) {
          const locationPromise = new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: false,
              maximumAge: 300000 // 5 minutes
            })
          })

          try {
            const position = await locationPromise
            if (isMounted) {
              setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              })
            }
          } catch (error) {
            console.log('Location access denied or failed:', error.message)
            // Set default location (Delhi) if geolocation fails
            if (isMounted) {
              setUserLocation({
                latitude: 28.6139,
                longitude: 77.2090
              })
            }
          }
        }
      } catch (error) {
        console.error('App initialization error:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initializeApp()

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    navigate('/')
  }

  const handleLogout = () => {
    removeAuthToken()
    setUser(null)
    navigate('/landing')
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading FarmEase...</h2>
          <p className="text-gray-500 mt-2">Preparing your agricultural dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/landing"
        element={!user ? <LandingPage onGetStarted={() => navigate('/login')} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/login"
        element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />}
      />

      {/* Protected Routes */}
      <Route
        element={user ? (
          <Layout
            user={user}
            onLogout={handleLogout}
            userLocation={userLocation}
            setUserLocation={setUserLocation}
          />
        ) : (
          <Navigate to="/landing" replace />
        )}
      >
        <Route path="/" element={<EnhancedDashboard />} />
        <Route path="/farms" element={<FarmManagement />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/market" element={<MarketIntelligenceHub />} />
        <Route path="/tips" element={<Tips />} />
        <Route path="/advanced" element={<AdvancedFeatures userLocation={userLocation} />} />
        <Route path="/doctor" element={<PlantDoctor />} />
        <Route path="/community" element={<CommunityForum />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to={user ? "/" : "/landing"} replace />} />
    </Routes>
  )
}

export default App