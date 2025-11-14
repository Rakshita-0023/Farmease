import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import FarmManagement from './components/FarmManagement'
import Weather from './components/Weather'
import Market from './components/Market'
import Tips from './components/Tips'
import Login from './components/Login'
import VoiceAssistant from './components/VoiceAssistant'
import LoadingAnimation from './components/LoadingAnimation'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('farmease_user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    // Voice assistant navigation
    const handleVoiceNavigation = (event) => {
      handlePageChange(event.detail)
    }
    
    window.addEventListener('navigate', handleVoiceNavigation)
    return () => window.removeEventListener('navigate', handleVoiceNavigation)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('farmease_user', JSON.stringify(userData))
    setCurrentPage('dashboard')
  }

  const handlePageChange = (page) => {
    setIsLoading(true)
    setTimeout(() => {
      setCurrentPage(page)
      setIsLoading(false)
    }, 1500) // 1.5 second loading
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('farmease_user')
    localStorage.removeItem('farmease_farms')
    setCurrentPage('login')
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />
      case 'farm':
        return <FarmManagement />
      case 'weather':
        return <Weather />
      case 'market':
        return <Market />
      case 'tips':
        return <Tips />
      default:
        return <Dashboard user={user} />
    }
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>🌾 FarmEase</h1>
        </div>
        <div className="nav-links">
          <button 
            className={currentPage === 'dashboard' ? 'active' : ''}
            onClick={() => handlePageChange('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={currentPage === 'farm' ? 'active' : ''}
            onClick={() => handlePageChange('farm')}
          >
            My Farm
          </button>
          <button 
            className={currentPage === 'weather' ? 'active' : ''}
            onClick={() => handlePageChange('weather')}
          >
            Weather
          </button>
          <button 
            className={currentPage === 'market' ? 'active' : ''}
            onClick={() => handlePageChange('market')}
          >
            Market
          </button>
          <button 
            className={currentPage === 'tips' ? 'active' : ''}
            onClick={() => handlePageChange('tips')}
          >
            Tips
          </button>
        </div>
        <div className="nav-right">
          <button className="profile-btn">
            👤 Profile
          </button>
          <button onClick={handleLogout} className="logout-btn">
            🔓 Logout
          </button>
        </div>
      </nav>
      <main className="main-content">
        {renderPage()}
      </main>
      <VoiceAssistant />
      {isLoading && <LoadingAnimation />}
    </div>
  )
}

export default App