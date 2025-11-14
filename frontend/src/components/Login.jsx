import { useState } from 'react'

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: ''
  })

  const validateForm = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (!isLogin && !formData.name) newErrors.name = 'Name is required'
    if (!isLogin && !formData.location) newErrors.location = 'Location is required'
    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true)
      setTimeout(() => {
        if (isLogin) {
          const userData = {
            name: formData.email.split('@')[0],
            email: formData.email,
            location: 'Delhi'
          }
          onLogin(userData)
        } else {
          const userData = {
            name: formData.name,
            email: formData.email,
            location: formData.location
          }
          onLogin(userData)
        }
        setIsLoading(false)
      }, 1500)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #dcfce7 75%, #f0fdf4 100%)',
      backgroundImage: `
        radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.05) 0%, transparent 50%)
      `,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Floating farm elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        fontSize: '3rem',
        opacity: 0.1,
        animation: 'float 6s ease-in-out infinite'
      }}>🌾</div>
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '15%',
        fontSize: '2.5rem',
        opacity: 0.1,
        animation: 'float 8s ease-in-out infinite reverse'
      }}>🌱</div>
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '20%',
        fontSize: '2rem',
        opacity: 0.1,
        animation: 'float 7s ease-in-out infinite'
      }}>🌤️</div>
      
      <div style={{ 
        width: '100%', 
        maxWidth: '450px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '3rem 2.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        margin: '1rem'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            fontSize: '3.5rem', 
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>
            🌾 FarmEase
          </div>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Welcome {isLogin ? 'Back' : 'to FarmEase'}
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            Empowering farmers with smart insights 🌱
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.9rem'
              }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '1.1rem'
                }}>👤</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '1rem 1rem 1rem 3rem',
                    border: `2px solid ${errors.name ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                  onBlur={(e) => e.target.style.borderColor = errors.name ? '#ef4444' : '#e5e7eb'}
                />
              </div>
              {errors.name && (
                <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  ⚠️ {errors.name}
                </p>
              )}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.9rem'
            }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                fontSize: '1.1rem'
              }}>📧</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '1rem 1rem 1rem 3rem',
                  border: `2px solid ${errors.email ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? '#ef4444' : '#e5e7eb'}
              />
            </div>
            {errors.email && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                ⚠️ {errors.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: isLogin ? '1.5rem' : '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.9rem'
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                fontSize: '1.1rem'
              }}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '1rem 3rem 1rem 3rem',
                  border: `2px solid ${errors.password ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                onBlur={(e) => e.target.style.borderColor = errors.password ? '#ef4444' : '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1rem'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                ⚠️ {errors.password}
              </p>
            )}
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.9rem'
              }}>Location</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '1.1rem'
                }}>📍</span>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '1rem 1rem 1rem 3rem',
                    border: `2px solid ${errors.location ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    fontSize: '1rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select your location</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Pune">Pune</option>
                </select>
              </div>
              {errors.location && (
                <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  ⚠️ {errors.location}
                </p>
              )}
            </div>
          )}

          {isLogin && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              <label htmlFor="remember" style={{ color: '#6b7280', cursor: 'pointer' }}>
                Remember me for 30 days
              </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1rem',
              background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 8px 15px -3px rgba(34, 197, 94, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 6px -1px rgba(34, 197, 94, 0.3)'
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '2px solid #ffffff40',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '0.5rem'
                }}></span>
                Processing...
              </span>
            ) : (
              `${isLogin ? 'Sign In' : 'Create Account'}`
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            {isLogin ? "New to FarmEase?" : "Already growing with us?"}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setErrors({})
              setFormData({ name: '', email: '', password: '', location: '' })
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#22c55e', 
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              textDecoration: 'underline',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#16a34a'
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#22c55e'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            {isLogin ? "Sign up now!" : "Sign in instead"}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Login