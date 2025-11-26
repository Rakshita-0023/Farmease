import { useState, useEffect, createContext, useContext } from 'react'
import Dashboard from './components/Dashboard'
import EnhancedDashboard from './components/EnhancedDashboard'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import FarmManagement from './components/FarmManagement'
import Weather from './components/Weather'
import Market from './components/Market'
import Tips from './components/Tips'

import AIChatbot from './components/AIChatbot'
import LocationDetector from './components/LocationDetector'
import MarketMap from './components/MarketMap'
import YieldPredictor from './components/YieldPredictor'
import NotificationSystem from './components/NotificationSystem'
import AdvancedFeatures from './components/AdvancedFeatures'
import LoadingAnimation from './components/LoadingAnimation'

const LanguageContext = createContext()

const translations = {
  en: {
    dashboard: 'Dashboard',
    myFarms: 'My Farms',
    weather: 'Weather',
    market: 'Market',
    tips: 'Tips',
    welcome: 'Welcome back',
    logout: 'Logout',
    weatherToday: 'Weather Today',
    cropSuggestions: 'AI Crop Suggestions',
    marketPrices: 'Market Prices',
    recentActivity: 'Recent Activity'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    myFarms: 'मेरे खेत',
    weather: 'मौसम',
    market: 'बाज़ार',
    tips: 'सुझाव',
    welcome: 'वापसी पर स्वागत',
    logout: 'लॉग आउट',
    weatherToday: 'आज का मौसम',
    cropSuggestions: 'AI फसल सुझाव',
    marketPrices: 'बाज़ार दर',
    recentActivity: 'हाल की गतिविधि'
  },
  te: {
    dashboard: 'డాష్‌బోర్డ్',
    myFarms: 'నా పొలాలు',
    weather: 'వాతావరణం',
    market: 'మార్కెట్',
    tips: 'చిట్కాలు',
    welcome: 'తిరిగి స్వాగతం',
    logout: 'లాగ్ అవుట్',
    weatherToday: 'నేటి వాతావరణం',
    cropSuggestions: 'AI పంట సూచనలు',
    marketPrices: 'మార్కెట్ ధరలు',
    recentActivity: 'ఇటీవలి కార్యకలాపాలు'
  }
}

export const useLanguage = () => useContext(LanguageContext)

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [language, setLanguage] = useState('en')
  const [userLocation, setUserLocation] = useState(null)
  const [farms, setFarms] = useState([])
  
  const t = (key) => translations[language][key] || key

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
      setCurrentPage('dashboard')
    }
    
    // Load farms from localStorage
    const userFarms = localStorage.getItem('farms')
    if (userFarms) {
      setFarms(JSON.parse(userFarms))
    }
  }, [])

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    handlePageChange('dashboard')
    
    // Show welcome notification
    setTimeout(() => {
      if (window.showWelcomeNotification) {
        window.showWelcomeNotification(userData.name)
      }
    }, 1000)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCurrentPage('login')
  }



  if (currentPage === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentPage('login')} />
  }

  if (currentPage === 'login') {
    return <Login onLogin={handleLogin} />
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <h2>🌱 FarmEase</h2>
            <LocationDetector onLocationDetected={setUserLocation} />
          </div>
          <div className="nav-links">
            <button 
              className={currentPage === 'dashboard' ? 'active' : ''} 
              onClick={() => handlePageChange('dashboard')}
            >
              {t('dashboard')}
            </button>
            <button 
              className={currentPage === 'farms' ? 'active' : ''} 
              onClick={() => handlePageChange('farms')}
            >
              {t('myFarms')}
            </button>
            <button 
              className={currentPage === 'weather' ? 'active' : ''} 
              onClick={() => handlePageChange('weather')}
            >
              {t('weather')}
            </button>
            <button 
              className={currentPage === 'market' ? 'active' : ''} 
              onClick={() => handlePageChange('market')}
            >
              {t('market')}
            </button>
            <button 
              className={currentPage === 'tips' ? 'active' : ''} 
              onClick={() => handlePageChange('tips')}
            >
              {t('tips')}
            </button>
            <button 
              className={currentPage === 'advanced' ? 'active' : ''} 
              onClick={() => handlePageChange('advanced')}
            >
              Advanced
            </button>
          </div>
          <div className="nav-profile">
            <NotificationSystem userLocation={userLocation} farms={farms} />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="language-selector"
            >
              <option value="en">EN</option>
              <option value="hi">हि</option>
              <option value="te">తె</option>
            </select>
            <span className="user-greeting">{user?.name || 'Farmer'}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </nav>

      <main className="main-content">
        {currentPage === 'dashboard' && <EnhancedDashboard />}
        {currentPage === 'farms' && <FarmManagement />}
        {currentPage === 'weather' && <Weather />}
        {currentPage === 'market' && <Market />}
        {currentPage === 'tips' && <Tips />}
        {currentPage === 'advanced' && <AdvancedFeatures userLocation={userLocation} />}
      </main>


        <AIChatbot />
      </div>
    </LanguageContext.Provider>
  )
}

export default App