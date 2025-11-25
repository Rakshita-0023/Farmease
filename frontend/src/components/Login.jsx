import { useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simple validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    // Simulate loading
    setTimeout(() => {
      const user = {
        id: 1,
        name: formData.name || formData.email.split('@')[0],
        email: formData.email
      }
      localStorage.setItem('token', 'demo-token-' + Date.now())
      localStorage.setItem('user', JSON.stringify(user))
      onLogin(user)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="floating-element farm-1">🌾</div>
        <div className="floating-element farm-2">🚜</div>
        <div className="floating-element farm-3">🌱</div>
        <div className="floating-element farm-4">🌽</div>
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <h1>🌱 FarmEase</h1>
          <p>Your farming companion</p>
        </div>

        <div className="login-tabs">
          <button 
            className={isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={!isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}


          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login