import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Sprout, Check, ArrowRight } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../config'

export default function OnboardingWizard({ onComplete }) {
    const [step, setStep] = useState(1)
    const [location, setLocation] = useState(null)
    const [farmData, setFarmData] = useState({
        name: '',
        crop: '',
        area: '',
        soilType: 'Loamy'
    })
    const queryClient = useQueryClient()

    const detectLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                },
                (error) => alert('Location access denied')
            )
        }
    }

    const addFarmMutation = useMutation({
        mutationFn: async (newFarm) => {
            return apiClient.post('/farms', newFarm)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['farms'])
            onComplete()
        },
        onError: (error) => {
            console.error("Failed to create farm:", error)
            alert(`Failed to create farm: ${error.message || 'Unknown error'}`)
        }
    })

    const handleSubmit = () => {
        addFarmMutation.mutate({
            ...farmData,
            location,
            plantingDate: new Date().toISOString().split('T')[0], // Default to today
            healthScore: 100,
            progress: 0,
            daysToHarvest: 120 // Default estimate
        })
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Progress Bar */}
                <div className="h-2 bg-gray-100">
                    <div
                        className="h-full bg-green-600 transition-all duration-500"
                        style={{ width: `${(step / 2) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MapPin className="text-green-600" size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Where is your farm?</h2>
                                    <p className="text-gray-500 mt-2">We need your location to provide accurate weather and market data.</p>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => { detectLocation(); setStep(2); }}
                                        className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MapPin size={20} />
                                        Use Current Location
                                    </button>
                                    <button
                                        onClick={() => setStep(2)}
                                        className="w-full py-3 px-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        Enter Manually Later
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sprout className="text-yellow-600" size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Add your first farm</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                                        <input
                                            type="text"
                                            value={farmData.name}
                                            onChange={e => setFarmData({ ...farmData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="e.g. Riverside Field"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
                                            <select
                                                value={farmData.crop}
                                                onChange={e => setFarmData({ ...farmData, crop: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            >
                                                <option value="">Select...</option>
                                                <option value="Wheat">Wheat</option>
                                                <option value="Rice">Rice</option>
                                                <option value="Corn">Corn</option>
                                                <option value="Cotton">Cotton</option>
                                                <option value="Sugarcane">Sugarcane</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Area (Acres)</label>
                                            <input
                                                type="number"
                                                value={farmData.area}
                                                onChange={e => setFarmData({ ...farmData, area: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                placeholder="0.0"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!farmData.name || !farmData.crop || !farmData.area || addFarmMutation.isPending}
                                        className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 mt-4"
                                    >
                                        {addFarmMutation.isPending ? 'Creating...' : 'Create Farm'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
