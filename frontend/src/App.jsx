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

function App() {
  const [user, setUser] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = getAuthToken()
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error("Failed to parse user data", e)
        removeAuthToken()
      }
    }

    // Auto-detect location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => console.log('Location access denied')
      )
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

  return (
    <Routes>
      <Route path="/landing" element={!user ? <LandingPage onGetStarted={() => navigate('/login')} /> : <Navigate to="/" />} />
      <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />

      <Route element={user ? <Layout user={user} onLogout={handleLogout} userLocation={userLocation} setUserLocation={setUserLocation} /> : <Navigate to="/landing" />}>
        <Route path="/" element={<EnhancedDashboard />} />
        <Route path="/farms" element={<FarmManagement />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/market" element={<Market />} />
        <Route path="/tips" element={<Tips />} />
        <Route path="/advanced" element={<AdvancedFeatures userLocation={userLocation} />} />
        <Route path="/doctor" element={<PlantDoctor />} />
        <Route path="/community" element={<CommunityForum />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? "/" : "/landing"} />} />
    </Routes>
  )
}

export default App