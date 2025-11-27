import { useState, useEffect, createContext, useContext } from 'react'
import Dashboard from './components/Dashboard'
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

import AIChatbot from './components/AIChatbot'
import LocationDetector from './components/LocationDetector'
import MarketMap from './components/MarketMap'
import YieldPredictor from './components/YieldPredictor'
import NotificationSystem from './components/NotificationSystem'
import AdvancedFeatures from './components/AdvancedFeatures'
import LoadingAnimation from './components/LoadingAnimation'
import './components/Sidebar.css'

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
  const [isListening, setIsListening] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsListening(true)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setSearchQuery(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      alert('Voice recognition failed. Please try again.')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

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

  const navItems = [
    { id: 'dashboard', icon: '', label: t('dashboard'), labelHi: 'डैशबोर्ड' },
    { id: 'farms', icon: '', label: t('myFarms'), labelHi: 'मेरे खेत' },
    { id: 'weather', icon: '', label: t('weather'), labelHi: 'मौसम' },
    { id: 'market', icon: '', label: t('market'), labelHi: 'बाज़ार' },
    { id: 'tips', icon: '', label: t('tips'), labelHi: 'सुझाव' },
    { id: 'advanced', icon: '', label: language === 'hi' ? 'उन्नत सुविधाएँ' : 'Advanced', labelHi: 'उन्नत सुविधाएँ' },
    { id: 'plant-doctor', icon: '🩺', label: language === 'hi' ? 'डॉक्टर' : 'Doctor', labelHi: 'डॉक्टर' },
    { id: 'forum', icon: '', label: language === 'hi' ? 'चर्चा' : 'Forum', labelHi: 'चर्चा' },
    { id: 'schemes', icon: '', label: language === 'hi' ? 'योजनाएं' : 'Schemes', labelHi: 'योजनाएं' }
  ]

  if (currentPage === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentPage('login')} />
  }

  if (currentPage === 'login') {
    return <Login onLogin={handleLogin} />
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="app-container">
        {/* Vertical Sidebar */}
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <div className="brand-logo">
              <span className="logo-icon">🌱</span>
              {!sidebarCollapsed && <span className="logo-text">FarmEase</span>}
            </div>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => handlePageChange(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                {currentPage === item.id && <span className="active-indicator"></span>}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <LocationDetector onLocationDetected={setUserLocation} />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="main-wrapper">
          {/* Top Header */}
          <header className="top-header">
            <div className="header-search">
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder={language === 'hi' ? 'खोजें...' : 'Search farms, crops, markets...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button
                  className={`voice-search-btn ${isListening ? 'listening' : ''}`}
                  onClick={startVoiceSearch}
                  title="Voice Search"
                >
                  {isListening ? (
                    <span className="listening-indicator">
                      <span className="pulse"></span>
                      🎙️
                    </span>
                  ) : (
                    '🎤'
                  )}
                </button>
              </div>
            </div>

            <div className="header-actions">
              <NotificationSystem userLocation={userLocation} farms={farms} />

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="language-selector-header"
              >
                <option value="en">🇬🇧 EN</option>
                <option value="hi">🇮🇳 हि</option>
                <option value="te">🇮🇳 తె</option>
              </select>

              <div className="user-profile">
                <div className="user-avatar">{user?.name?.charAt(0) || 'F'}</div>
                <div className="user-info">
                  <span className="user-name">{user?.name || 'Farmer'}</span>
                  <button onClick={handleLogout} className="logout-link">Logout</button>
                </div>
              </div>
            </div>
          </header>

          <main className="main-content">
            {currentPage === 'dashboard' && <EnhancedDashboard />}
            {currentPage === 'farms' && <FarmManagement />}
            {currentPage === 'weather' && <Weather />}
            {currentPage === 'market' && <Market />}
            {currentPage === 'tips' && <Tips />}
            {currentPage === 'advanced' && <AdvancedFeatures userLocation={userLocation} />}
            {currentPage === 'plant-doctor' && <PlantDoctor />}
            {currentPage === 'forum' && <CommunityForum />}
            {currentPage === 'schemes' && <Schemes />}
          </main>


          <AIChatbot />
        </div>
      </div>
    </LanguageContext.Provider>
  )
}

export default App