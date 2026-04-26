import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Sprout, Calendar, Ruler, Leaf, Activity, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '../config'

const FarmManagement = () => {
  const { t } = useTranslation()
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
  const [selectedFarm, setSelectedFarm] = useState(null)

  const cropCycles = { Wheat: 120, Rice: 110, Corn: 100, Cotton: 160, Tomatoes: 70, Potatoes: 90, Onions: 100 }

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
        setError(t('pleaseFillRequired'))
        setSubmitting(false)
        return
      }

      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        setError(t('pleaseLoginCreateFarm'))
        setSubmitting(false)
        return
      }

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
        setError(t('sessionExpired'))
        // Don't auto-logout, let user decide
      } else if (error.status === 403) {
        setError(t('accessDenied'))
      } else if (error.status === 400) {
        setError(error.data?.error || error.message || t('invalidFarmData'))
      } else if (error.message?.includes('JSON')) {
        setError(t('serverErrorRetry'))
      } else {
        setError(error.message || t('createFarmFailed'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const calculateProgress = (farm) => {
    if (typeof farm.progress === 'number' && farm.progress >= 0) {
      return Math.min(100, Math.max(0, farm.progress))
    }
    const cycleDays = cropCycles[farm.crop] || 120
    const plantedOn = farm.planting_date || farm.plantingDate || farm.created_at
    if (!plantedOn) return 0
    const start = new Date(plantedOn)
    const daysSincePlanting = Math.max(0, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)))
    return Math.min(100, Math.floor((daysSincePlanting / cycleDays) * 100))
  }

  const getHealthScore = (farm) => {
    if (typeof farm.health_score === 'number') return Math.min(100, Math.max(0, farm.health_score))
    return Math.min(85 + (farm.area > 5 ? 5 : 0), 100)
  }
  const getDaysToHarvest = (farm) => {
    if (typeof farm.days_to_harvest === 'number') return Math.max(0, farm.days_to_harvest)
    const cycleDays = cropCycles[farm.crop] || 120
    return Math.max(0, cycleDays - Math.floor((calculateProgress(farm) / 100) * cycleDays))
  }
  const getGrowthStatus = (progress) => {
    if (progress >= 90) return 'Harvest Ready'
    if (progress >= 70) return 'Maturing'
    if (progress >= 40) return 'Vegetative'
    if (progress >= 15) return 'Early Growth'
    return 'Recently Planted'
  }

  const buttonStyles = {
    primary: 'group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-emerald-400 border border-emerald-300/60 shadow-[0_4px_12px_rgba(16,185,129,0.24)] hover:bg-emerald-300 hover:shadow-[0_6px_14px_rgba(16,185,129,0.28)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed',
    secondary: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/8 border border-white/15 hover:bg-white/12 hover:border-white/25 transition-all duration-200',
    cardCta: 'group w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-white/6 border border-white/12 hover:bg-emerald-400/12 hover:border-emerald-300/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">{t('loadingFarms')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container custom-scrollbar pb-12">
      {/* Header */}
      <header className="page-header flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">{t('agriculturalAssets')}</span>
          </div>
          <h1>{t('myFields')}</h1>
          <p>{t('myFieldsSubtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className={buttonStyles.primary}
        >
          <Plus size={20} />
          {t('registerNewField')}
        </button>
      </header>

      {farms.length === 0 ? (
        <div className="glass-card p-10 md:p-12 border-dashed border-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 text-emerald-400">
                <Sprout size={40} />
              </div>
              <h2 className="text-3xl font-black mb-3">{t('noFieldsRegistered')}</h2>
              <p className="text-white/60 mb-6 max-w-xl">
                {t('noFieldsDescription')}
              </p>

              <div className="space-y-3 mb-8">
                {[
                  t('fieldsBenefit1'),
                  t('fieldsBenefit2'),
                  t('fieldsBenefit3')
                ].map((line) => (
                  <div key={line} className="flex items-center gap-3 text-white/75">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAddForm(true)}
                className={buttonStyles.primary}
              >
                {t('addFirstField')}
              </button>
            </div>

            <div className="bg-black/25 border border-white/10 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-3">{t('quickStart')}</h3>
              <ol className="space-y-2 text-sm text-white/70">
                <li>1. {t('quickStartStep1')}</li>
                <li>2. {t('quickStartStep2')}</li>
                <li>3. {t('quickStartStep3')}</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {farms.map((farm, index) => {
            const progress = calculateProgress(farm)
            const healthScore = getHealthScore(farm)
            const daysToHarvest = getDaysToHarvest(farm)

            return (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card overflow-hidden group border-b-4 border-b-emerald-500/30"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black group-hover:text-emerald-400 transition-colors tracking-tight">{farm.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <span className="px-3 py-1 bg-white/5 text-white/60 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/5">
                          {farm.crop}
                        </span>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/10">
                          {farm.area} Acres
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-white/30 font-bold uppercase mb-2">{t('health')}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-emerald-400">{healthScore}%</span>
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-white/30 font-bold uppercase mb-2">{t('harvestIn')}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-amber-400">{daysToHarvest}</span>
                        <span className="text-[10px] text-white/30 font-bold uppercase mt-1">{t('days')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-3">
                      <span className="text-white/30">{t('growthCycle')}</span>
                      <span className="text-emerald-400">{progress}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                <button
                  onClick={() => setSelectedFarm({ ...farm, _progress: progress, _health: healthScore, _days: daysToHarvest })}
                  className={buttonStyles.cardCta}
                >
                  {t('openFieldAnalysis')}
                  <ChevronRight size={18} className="text-white/45 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
                </button>
                </div>
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="glass-card w-full max-w-xl overflow-hidden bg-[#0f1412] border-emerald-500/20 shadow-2xl shadow-emerald-900/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">Register New Field</h2>
                <button onClick={() => setShowAddForm(false)} className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddFarm} className="p-8 space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-3">
                    ⚠️ {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Field Name</label>
                    <input
                      type="text"
                      value={newFarm.name}
                      onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })}
                      placeholder="e.g. North Ridge"
                      className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/30 transition-all font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Area (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={newFarm.area}
                      onChange={(e) => setNewFarm({ ...newFarm, area: e.target.value })}
                      placeholder="2.5"
                      className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/30 transition-all font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Crop Type</label>
                    <select
                      value={newFarm.crop}
                      onChange={(e) => setNewFarm({ ...newFarm, crop: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-emerald-500/30 transition-all font-bold appearance-none"
                      required
                    >
                      <option value="">Select Crop</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Rice">Rice</option>
                      <option value="Corn">Corn</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Tomatoes">Tomatoes</option>
                      <option value="Potatoes">Potatoes</option>
                      <option value="Onions">Onions</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Planting Date</label>
                    <input
                      type="date"
                      value={newFarm.planting_date}
                      onChange={(e) => setNewFarm({ ...newFarm, planting_date: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-emerald-500/30 transition-all font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Soil Profile</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Loamy', 'Clay', 'Sandy', 'Silty'].map(soil => (
                      <button
                        key={soil}
                        type="button"
                        onClick={() => setNewFarm({ ...newFarm, soil_type: soil })}
                        className={`py-3 rounded-xl text-xs font-bold transition-all border ${newFarm.soil_type === soil
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        {soil}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className={`flex-1 ${buttonStyles.secondary}`}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 ${buttonStyles.primary}`}
                    disabled={submitting}
                  >
                    {submitting ? 'Registering...' : 'Register Field'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedFarm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedFarm(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="glass-card w-full max-w-2xl overflow-hidden bg-[#0f1412] border-emerald-500/20 shadow-2xl shadow-emerald-900/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white">{selectedFarm.name}</h3>
                  <p className="text-white/60 text-sm">{selectedFarm.crop} · {selectedFarm.area} Acres</p>
                </div>
                <button onClick={() => setSelectedFarm(null)} className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white/70">
                  <X size={18} className="mx-auto" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                    <p className="text-xs text-white/50 uppercase">Health</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">{selectedFarm._health}%</p>
                  </div>
                  <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                    <p className="text-xs text-white/50 uppercase">Growth</p>
                    <p className="text-2xl font-black text-teal-300 mt-1">{selectedFarm._progress}%</p>
                  </div>
                  <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                    <p className="text-xs text-white/50 uppercase">Harvest In</p>
                    <p className="text-2xl font-black text-amber-300 mt-1">{selectedFarm._days} days</p>
                  </div>
                </div>

                <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/70">Growth Status</span>
                    <span className="font-bold text-white">{getGrowthStatus(selectedFarm._progress)}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${selectedFarm._progress}%` }} />
                  </div>
                </div>

                <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                  <p className="text-sm font-bold text-white mb-2">Recommended Next Step</p>
                  <p className="text-sm text-white/75">
                    {selectedFarm._progress < 30 && 'Focus on early nutrient support and weed control.'}
                    {selectedFarm._progress >= 30 && selectedFarm._progress < 75 && 'Maintain irrigation cycle and inspect leaves every 3 days.'}
                    {selectedFarm._progress >= 75 && selectedFarm._progress < 95 && 'Prepare harvest logistics and monitor weather closely.'}
                    {selectedFarm._progress >= 95 && 'Crop is near-ready. Plan harvest and best market timing.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FarmManagement
