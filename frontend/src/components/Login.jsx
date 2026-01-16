import { useState } from 'react'
import { Eye, EyeOff, Loader2, AlertCircle, X, Zap, Leaf } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
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

    if (!validateForm()) return

    setLoading(true)

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password }

      const fullUrl = `${API_BASE_URL}${endpoint}`
      console.log('Auth request to:', fullUrl)

      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const responseText = await res.text()
      console.log('Auth response:', responseText.substring(0, 100))
      
      let response
      try {
        response = JSON.parse(responseText)
      } catch {
        throw new Error('Server error. Please try again.')
      }

      if (!res.ok) {
        throw new Error(response.error || 'Authentication failed')
      }

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

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError('')

    try {
      // Use hardcoded URL to ensure it works
      const apiUrl = 'https://farmease-tqgy.onrender.com/api/auth/google'
      console.log('Google Auth - Calling URL:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      })

      console.log('Google Auth - Response status:', response.status)

      const responseText = await response.text()
      console.log('Google Auth - Response:', responseText.substring(0, 200))

      let res
      try {
        res = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error('Server error. Please try again.')
      }

      if (!response.ok) {
        throw new Error(res.details || res.error || 'Google authentication failed')
      }

      if (res.success) {
        localStorage.setItem('token', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))
        onLogin(res.user)
      } else {
        setError(`Google sign in failed: ${res.details || res.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Google auth error:', err)
      setError(err.message || 'Google sign in failed')
      setToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setToast({ message: 'Google Login Failed', type: 'error' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30"
            >
              <Leaf className="text-white" size={32} />
            </motion.div>
            <h1 className="text-3xl font-black text-white mb-1">FarmEase</h1>
            <p className="text-white/60">Smart farming starts here</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex mx-6 bg-white/5 rounded-xl p-1">
            <button
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                isLogin 
                  ? 'bg-white text-emerald-600 shadow-lg' 
                  : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                !isLogin 
                  ? 'bg-white text-emerald-600 shadow-lg' 
                  : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="text-sm font-medium text-white/80">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">Email Address</label>
              <input
                type="email"
                placeholder="farmer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/30 text-red-200 text-sm rounded-xl flex items-center gap-2"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-transparent text-white/50">or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_black"
                shape="pill"
                text="continue_with"
              />
            </div>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-center text-white/40 text-sm mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 backdrop-blur-xl ${
              toast.type === 'error' 
                ? 'bg-red-500/90 text-white' 
                : 'bg-emerald-500/90 text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={20} /> : <Zap size={20} />}
            <span className="font-semibold text-sm">{toast.message}</span>
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
