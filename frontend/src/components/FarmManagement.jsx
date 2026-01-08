import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Sprout, Calendar, Ruler, Leaf, Activity, ChevronRight } from 'lucide-react'
import { apiClient } from '../config'

const FarmManagement = () => {
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFarm, setNewFarm] = useState({
    name: '',
    crop: '',
    area: '',
    soil_type: 'Loamy',
    planting_date: new Date().toISOString().split('T')[0]
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFarms()
  }, [])

  const loadFarms = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setFarms([])
        return
      }
      const response = await apiClient.get('/farms')
      setFarms(response || [])
    } catch (error) {
      console.error('Error loading farms:', error)
      setFarms([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddFarm = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Validate required fields
      if (!newFarm.name || !newFarm.crop || !newFarm.area || !newFarm.planting_date) {
        setError('Please fill in all required fields')
        setSubmitting(false)
        return
      }

      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please log in to create a farm')
        setSubmitting(false)
        return
      }

      const cropCycles = { 'Wheat': 120, 'Rice': 110, 'Corn': 100, 'Cotton': 160, 'Tomatoes': 70, 'Potatoes': 90, 'Onions': 100 }
      const cycleDays = cropCycles[newFarm.crop] || 100
      const planting = new Date(newFarm.planting_date)
      const today = new Date()
      const daysSincePlanting = Math.max(0, Math.floor((today - planting) / (1000 * 60 * 60 * 24)))
      const progress = Math.min(100, Math.floor((daysSincePlanting / cycleDays) * 100))

      const farmData = {
        name: newFarm.name,
        crop: newFarm.crop,
        area: parseFloat(newFarm.area),
        soilType: newFarm.soil_type,
        plantingDate: newFarm.planting_date,
        healthScore: 100,
        progress: progress,
        daysToHarvest: Math.max(0, cycleDays - daysSincePlanting)
      }

      console.log('📝 Creating farm with data:', farmData)
      console.log('🔐 Token present:', !!token)
      
      const response = await apiClient.post('/farms', farmData)
      console.log('📝 Farm creation response:', response)
      
      // Check for success - response might have success:true or just farmId
      if (response && (response.success || response.farmId || response.id)) {
        console.log('✅ Farm created successfully!')
        setNewFarm({ name: '', crop: '', area: '', soil_type: 'Loamy', planting_date: new Date().toISOString().split('T')[0] })
        setShowAddForm(false)
        setError('')
        await loadFarms()
      } else {
        console.log('❌ Farm creation failed - unexpected response:', response)
        setError(response?.error || response?.message || 'Failed to create farm - unexpected response')
      }
    } catch (error) {
      console.error('❌ Farm creation error:', error)
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      })
      
      // More specific error messages
      if (error.status === 401) {
        setError('Session expired. Please log in again.')
        // Don't auto-logout, let user decide
      } else if (error.status === 403) {
        setError('Access denied. Please log in again.')
      } else if (error.status === 400) {
        setError(error.data?.error || error.message || 'Invalid farm data. Please check your inputs.')
      } else if (error.message?.includes('JSON')) {
        setError('Server error. Please try again later.')
      } else {
        setError(error.message || 'Failed to create farm. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const calculateProgress = (farm) => {
    const createdDate = new Date(farm.created_at)
    const daysSinceCreated = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24))
    return Math.min(Math.floor((daysSinceCreated / 120) * 100), 100)
  }

  const getHealthScore = (farm) => Math.min(85 + (farm.area > 5 ? 5 : 0), 100)
  const getDaysToHarvest = (farm) => Math.max(0, 120 - Math.floor((calculateProgress(farm) / 100) * 120))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading your farms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600/80 via-green-600/80 to-teal-600/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sprout className="text-emerald-300" size={20} />
              <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">Farm Management</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">My Farms</h1>
            <p className="text-white/60 mt-1">Manage and monitor your agricultural land</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-semibold"
          >
            <Plus size={18} />
            Add Farm
          </button>
        </div>
      </motion.div>

      {farms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/10"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sprout className="text-emerald-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No farms added yet</h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">Start your farming journey by adding your first farm</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:opacity-90 transition-all"
          >
            🌱 Add Your First Farm
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((farm, index) => {
            const progress = calculateProgress(farm)
            const healthScore = getHealthScore(farm)
            const daysToHarvest = getDaysToHarvest(farm)

            return (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{farm.name}</h3>
                    <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold mt-1">
                      {farm.crop}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{farm.area}</div>
                    <div className="text-xs text-white/40">Acres</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-xs text-white/40 mb-1">Health</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-emerald-400">{healthScore}%</span>
                      <Activity size={14} className="text-emerald-400" />
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-xs text-white/40 mb-1">Harvest In</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-amber-400">{daysToHarvest}</span>
                      <span className="text-xs text-white/40">days</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/50">Growth Progress</span>
                    <span className="text-white font-semibold">{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/30 mt-2">
                    <span className={progress >= 0 ? 'text-emerald-400' : ''}>🌱</span>
                    <span className={progress >= 25 ? 'text-emerald-400' : ''}>🌿</span>
                    <span className={progress >= 50 ? 'text-emerald-400' : ''}>🌸</span>
                    <span className={progress >= 75 ? 'text-emerald-400' : ''}>🌾</span>
                    <span className={progress >= 90 ? 'text-emerald-400' : ''}>✅</span>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-sm">
                  View Details
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Farm Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">🏡 Add New Farm</h2>
                <button onClick={() => setShowAddForm(false)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddFarm} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                    ⚠️ {error}
                  </div>
                )}

                <div>
                  <label className="text-sm text-white/60 mb-1 block">Farm Name</label>
                  <input
                    type="text"
                    value={newFarm.name}
                    onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })}
                    placeholder="e.g. North Field"
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Crop</label>
                    <select
                      value={newFarm.crop}
                      onChange={(e) => setNewFarm({ ...newFarm, crop: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Rice">Rice</option>
                      <option value="Corn">Corn</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Tomatoes">Tomatoes</option>
                      <option value="Potatoes">Potatoes</option>
                      <option value="Onions">Onions</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Area (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={newFarm.area}
                      onChange={(e) => setNewFarm({ ...newFarm, area: e.target.value })}
                      placeholder="2.5"
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1 block">Planting Date</label>
                  <input
                    type="date"
                    value={newFarm.planting_date}
                    onChange={(e) => setNewFarm({ ...newFarm, planting_date: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1 block">Soil Type</label>
                  <select
                    value={newFarm.soil_type}
                    onChange={(e) => setNewFarm({ ...newFarm, soil_type: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Loamy">🌱 Loamy</option>
                    <option value="Clay">🧱 Clay</option>
                    <option value="Sandy">🏖️ Sandy</option>
                    <option value="Silty">💧 Silty</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Farm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FarmManagement
