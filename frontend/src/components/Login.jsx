import { useState } from 'react'
import { apiClient, API_BASE_URL, handlePostAuthLocation } from '../config'
import { Eye, EyeOff, Loader2, AlertCircle, X, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'

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
  const [toast, setToast] = useState(null)

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return false
    }

    if (!isLogin && !formData.name) {
      setError('Name is required for registration')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const API_BASE = import.meta.env.PROD
        ? import.meta.env.VITE_API_BASE_URL
        : '/api'

      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password }

      console.log('🔗 API Base:', API_BASE)
      console.log('🔗 Full URL:', `${API_BASE}${endpoint}`)

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('📊 Response Status:', res.status)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Authentication failed')
      }

      const response = await res.json()

      if (response.success) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        // Call post-auth location detection
        console.log('🎯 Authentication successful, starting location detection...')
        const locationDetected = await handlePostAuthLocation()
        
        if (locationDetected) {
          console.log('✅ Location detected and saved successfully')
        } else {
          console.log('⚠️ Location detection failed or was skipped')
        }
        
        onLogin(response.user)
      }
    } catch (error) {
      console.error('❌ Auth Error:', error)
      setError(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('✅ Google Login Success - Credential received')
    console.log('📋 Credential preview:', credentialResponse.credential.substring(0, 50) + '...')

    setLoading(true)
    setError('') // Clear any previous errors

    try {
      const API_BASE = import.meta.env.PROD
        ? import.meta.env.VITE_API_BASE_URL
        : '/api'

      console.log('🚀 Sending token to backend...')
      console.log('🌐 API_BASE:', API_BASE)
      console.log('🔗 Full URL:', `${API_BASE}/auth/google`)

      // Send the credential (JWT) to the backend
      const response = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: credentialResponse.credential
        })
      })

      console.log('📊 Response Status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Google authentication failed')
      }

      const res = await response.json()
      console.log('📥 Backend response:', res)

      if (res.success) {
        console.log('✅ Authentication successful!')
        localStorage.setItem('token', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))
        
        // Call post-auth location detection
        console.log('🎯 Google authentication successful, starting location detection...')
        const locationDetected = await handlePostAuthLocation()
        
        if (locationDetected) {
          console.log('✅ Location detected and saved successfully')
        } else {
          console.log('⚠️ Location detection failed or was skipped')
        }
        
        onLogin(res.user)
      } else {
        // Backend returned success: false
        console.error('❌ Backend returned failure:', res)
        const errorMsg = res.details || res.error || 'Authentication failed'
        setError(`Google sign in failed: ${errorMsg}`)
        setToast({ message: errorMsg, type: 'error' })
      }
    } catch (err) {
      console.error('❌ Backend Google Auth Error:', err)

      // Extract detailed error information from our enhanced apiClient error object
      let errorMessage = 'Google sign in failed. Please try again.'

      if (err.data) {
        // Server responded with error data
        console.error('📛 Server error response:', err.data)
        const errorDetails = err.data.details || err.data.error || ''
        errorMessage = errorDetails ? `Server error: ${errorDetails}` : `Server error (${err.status})`
      } else if (err.message) {
        // Other error (network, etc)
        console.error('📛 Request error:', err.message)
        errorMessage = err.message.includes('Failed to fetch')
          ? 'Cannot connect to server. Please check your internet connection or API URL.'
          : `Request failed: ${err.message}`
      }

      setError(errorMessage)
      setToast({ message: errorMessage, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    console.error('❌ Google Login Failed or Cancelled')
    setToast({ message: 'Google Login Failed', type: 'error' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4 relative overflow-hidden font-sans">
      {/* Background elements */}
      <div className="absolute top-20 left-20 text-4xl animate-bounce duration-[3000ms]">🌾</div>
      <div className="absolute bottom-20 right-20 text-4xl animate-bounce duration-[4000ms]">🚜</div>
      <div className="absolute top-40 right-40 text-4xl animate-bounce duration-[3500ms]">🌱</div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden z-10">
        <div className="p-8 text-center bg-green-600 text-white">
          <h1 className="text-3xl font-bold mb-2">🌱 FarmEase</h1>
          <p className="text-green-100">Your farming companion</p>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-4 font-medium transition-colors ${isLogin ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`flex-1 py-4 font-medium transition-colors ${!isLogin ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              placeholder="farmer@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (isLogin ? 'Login' : 'Create Account')}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              shape="pill"
              text="continue_with"
            />
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#064E3B] text-white'
              }`}
          >
            {toast.type === 'error' ? <AlertCircle size={20} /> : <Zap size={20} className="text-[#FBBF24] fill-[#FBBF24]" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Login