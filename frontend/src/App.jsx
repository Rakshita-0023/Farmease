import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import EnhancedDashboard from './components/EnhancedDashboard'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import FarmManagement from './components/FarmManagement'
import Weather from './components/Weather'
import Market from './components/Market'
import Tips from './components/Tips'
import PlantDoctor from './components/PlantDoctor'
import CommunityForum from './components/CommunityForum'
import Schemes from './components/Schemes'
import AboutUs from './components/AboutUs'
import Contact from './components/Contact'
import TermsOfService from './components/TermsOfService'
import AdvancedFeatures from './components/AdvancedFeatures'
import { getAuthToken, removeAuthToken } from './config'

import { LocationProvider } from './LocationContext'

function App() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

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
    <LocationProvider user={user}>
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
            />
          ) : (
            <Navigate to="/landing" replace />
          )}
        >
          <Route path="/" element={<EnhancedDashboard />} />
          <Route path="/farms" element={<FarmManagement />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/market" element={<Market />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/advanced" element={<AdvancedFeatures />} />
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
    </LocationProvider>
  )
}

export default App