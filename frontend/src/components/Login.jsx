import { useState, useEffect } from 'react'
import { apiClient } from '../config'
import { Eye, EyeOff, Loader2, AlertCircle, X, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password }

      const response = await apiClient.post(endpoint, payload)

      if (response.success) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        onLogin(response.user)
      }
    } catch (error) {
      setError(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const [toast, setToast] = useState(null)

  useEffect(() => {
    /* global google */
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
        callback: handleCredentialResponse,
        auto_select: false, // Fix 2: Disable auto-select
        cancel_on_tap_outside: true,
        prompt_parent_id: 'google-login-btn'
      })
    }
  }, [])

  const handleCredentialResponse = async (response) => {
    if (!response.credential) {
      setToast({ message: 'Login cancelled', type: 'error' })
      return
    }

    setLoading(true)
    try {
      // Decode JWT or send to backend
      const res = await apiClient.post('/auth/google', { token: response.credential })
      if (res.success) {
        localStorage.setItem('token', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))
        onLogin(res.user)
      }
    } catch (err) {
      setError('Google sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    setError('')
    setToast(null)

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") {
      setError('Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.')
      setToast({ message: 'Configuration Missing', type: 'error' })
      return
    }

    if (typeof google !== 'undefined') {
      // Fix 1: Force account selection
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google prompt skipped or not displayed')
        }

        if (notification.getDismissedReason() === 'user_cancel') {
          setToast({ message: 'Login cancelled', type: 'info' })
        }
      })

      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setToast({ message: 'Login cancelled', type: 'error' })
            return
          }

          setLoading(true)
          try {
            const res = await apiClient.post('/auth/google', { access_token: tokenResponse.access_token })
            if (res.success) {
              localStorage.setItem('token', res.token)
              localStorage.setItem('user', JSON.stringify(res.user))
              onLogin(res.user)
            }
          } catch (err) {
            setError('Google sign in failed')
          } finally {
            setLoading(false)
          }
        },
      })
      client.requestAccessToken()
    } else {
      setError('Google Login is currently unavailable')
    }
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

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
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