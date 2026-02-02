import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import EnhancedDashboard from './components/EnhancedDashboard'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import FarmManagement from './components/FarmManagement'

import Market from './components/Market'
import MarketDetails from './components/MarketDetails'
import Tips from './components/Tips'
import PlantDoctor from './components/PlantDoctor'
import CommunityForum from './components/CommunityForum'
import Schemes from './components/Schemes'
import AboutUs from './components/AboutUs'
import Contact from './components/Contact'
import TermsOfService from './components/TermsOfService'
import MarketComparison from './components/MarketComparison'
import CropRecommendation from './components/CropRecommendation'
import PersistentVideoBackground from './components/PersistentVideoBackground'
import { getAuthToken, removeAuthToken } from './config'
import { LocationProvider } from './LocationContext'

// Kisan Charcha Components
import CharchaDashboard from './components/KisanCharcha/CharchaDashboard'
import CreateCharcha from './components/KisanCharcha/CreateCharcha'
import CharchaView from './components/KisanCharcha/CharchaView'
import CharchaBrowser from './components/KisanCharcha/CharchaBrowser'
import NotificationCenter from './components/KisanCharcha/NotificationCenter'

function App() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Video background shows on public routes AND authenticated dashboard
  const isPublicRoute = ['/landing', '/login'].includes(location.pathname)
  const showVideoBackground = isPublicRoute || !!user

  useEffect(() => {
    let isMounted = true

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
      } catch (error) {
        console.error('App initialization error:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initializeApp()

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

  // Loading screen with video background
  if (isLoading) {
    return (
      <>
        <PersistentVideoBackground show={true} />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white">Loading FarmEase...</h2>
            <p className="text-white/60 mt-2">Preparing your agricultural dashboard</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <LocationProvider user={user}>
      {/* Persistent Video Background - always mounted, visibility controlled */}
      <PersistentVideoBackground show={showVideoBackground} />

      {/* Main Content */}
      <div className="relative z-10">
        <Routes>
          {/* Public Routes - content floats above video */}
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
              />
            ) : (
              <Navigate to="/landing" replace />
            )}
          >
            <Route path="/" element={<EnhancedDashboard />} />
            <Route path="/farms" element={<FarmManagement />} />

            <Route path="/market" element={<Market />} />
            <Route path="/market/:marketId" element={<MarketDetails />} />
            <Route path="/market/comparison" element={<MarketComparison />} />
            <Route path="/crop-recommendation" element={<CropRecommendation />} />
            <Route path="/tips" element={<Tips />} />
            <Route path="/doctor" element={<PlantDoctor />} />
            <Route path="/community" element={<CommunityForum />} />
            <Route path="/schemes" element={<Schemes />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* Kisan Charcha Routes */}
            <Route path="/charchas" element={<CharchaDashboard />} />
            <Route path="/charchas/create" element={<CreateCharcha />} />
            <Route path="/charchas/browse" element={<CharchaBrowser />} />
            <Route path="/charchas/:id" element={<CharchaView />} />
            <Route path="/notifications" element={<NotificationCenter />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to={user ? "/" : "/landing"} replace />} />
        </Routes>
      </div>
    </LocationProvider>
  )
}

export default App
