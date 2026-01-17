import { useState, useEffect } from 'react'
import { Sprout, Loader2, CheckCircle, AlertCircle, Droplets, Thermometer, Wind, CloudRain } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '../config'
import { useLocation } from '../LocationContext'

const CropRecommendation = () => {
  const { location } = useLocation()
  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: ''
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Auto-fill weather data if available
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (location?.latitude && location?.longitude) {
        try {
          const weather = await apiClient.get('/weather/current', {
            lat: location.latitude,
            lon: location.longitude
          })
          
          if (weather?.main) {
            setFormData(prev => ({
              ...prev,
              temperature: weather.main.temp?.toString() || '',
              humidity: weather.main.humidity?.toString() || ''
            }))
          }
        } catch (err) {
          console.warn('Could not auto-fill weather data:', err)
        }
      }
    }
    
    fetchWeatherData()
  }, [location])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate inputs
      const requiredFields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
      const missingFields = requiredFields.filter(field => !formData[field])
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in: ${missingFields.join(', ')}`)
      }

      // Convert to numbers
      const payload = {
        N: Number(formData.N),
        P: Number(formData.P),
        K: Number(formData.K),
        temperature: Number(formData.temperature),
        humidity: Number(formData.humidity),
        ph: Number(formData.ph),
        rainfall: Number(formData.rainfall)
      }

      console.log('🌱 Requesting crop recommendation:', payload)

      const response = await apiClient.post('/crop-recommendation', payload)
      
      console.log('✅ Recommendation received:', response)
      setResult(response.recommendation || response.crop || 'Unknown')
    } catch (err) {
      console.error('❌ Crop recommendation error:', err)
      setError(err.message || 'Failed to get recommendation')
    } finally {
      setLoading(false)
    }
  }

  const inputFields = [
    { name: 'N', label: 'Nitrogen (N)', icon: Droplets, unit: 'kg/ha', placeholder: '0-140' },
    { name: 'P', label: 'Phosphorus (P)', icon: Droplets, unit: 'kg/ha', placeholder: '5-145' },
    { name: 'K', label: 'Potassium (K)', icon: Droplets, unit: 'kg/ha', placeholder: '5-205' },
    { name: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°C', placeholder: '8-43' },
    { name: 'humidity', label: 'Humidity', icon: Wind, unit: '%', placeholder: '14-100' },
    { name: 'ph', label: 'Soil pH', icon: Droplets, unit: '', placeholder: '3.5-9.9' },
    { name: 'rainfall', label: 'Rainfall', icon: CloudRain, unit: 'mm', placeholder: '20-300' }
  ]

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
              <Sprout className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Crop Recommendation</h1>
              <p className="text-white/60">AI-powered crop selection based on soil and climate</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 mb-6">
          <form onSubmit={handleSubmit}>
            {/* Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {inputFields.map((field) => {
                const Icon = field.icon
                return (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-emerald-400" />
                        {field.label}
                        {field.unit && <span className="text-white/40">({field.unit})</span>}
                      </div>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                      required
                    />
                  </div>
                )
              })}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3"
                >
                  <AlertCircle className="text-red-400" size={20} />
                  <span className="text-red-200 text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sprout size={20} />
                  Get Recommendation
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result Card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/30"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="text-emerald-400" size={32} />
                </div>
                <div>
                  <p className="text-emerald-400 text-sm font-medium uppercase tracking-wider">Recommended Crop</p>
                  <h2 className="text-4xl font-black text-white capitalize">{result}</h2>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4 mt-4">
                <p className="text-white/70 text-sm">
                  Based on your soil nutrients (N: {formData.N}, P: {formData.P}, K: {formData.K}), 
                  climate conditions (Temp: {formData.temperature}°C, Humidity: {formData.humidity}%), 
                  soil pH ({formData.ph}), and rainfall ({formData.rainfall}mm), 
                  <span className="text-emerald-400 font-semibold"> {result}</span> is the optimal crop for your farm.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Card */}
        <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-blue-400" />
            How to use
          </h3>
          <ul className="text-white/60 text-sm space-y-2">
            <li>• Enter your soil test results for N, P, K values</li>
            <li>• Temperature and humidity are auto-filled from your location</li>
            <li>• Get your soil pH tested at a local agricultural lab</li>
            <li>• Enter average annual rainfall for your region</li>
            <li>• Click "Get Recommendation" to see the best crop for your conditions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CropRecommendation
