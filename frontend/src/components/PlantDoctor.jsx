import { useState, useRef } from 'react'
import {
    Upload,
    Camera,
    AlertTriangle,
    Phone,
    Loader2,
    X,
    Search,
    Zap,
    ShieldCheck,
    Activity
} from 'lucide-react'
import { apiClient } from '../config'
import { motion, AnimatePresence } from 'framer-motion'

const PlantDoctor = () => {
    const [image, setImage] = useState(null)
    const [status, setStatus] = useState('idle')
    const [uploadProgress, setUploadProgress] = useState(0)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const SIZE = 224
                    canvas.width = SIZE
                    canvas.height = SIZE
                    const ctx = canvas.getContext('2d')
                    const aspectRatio = img.width / img.height
                    let drawWidth, drawHeight, offsetX = 0, offsetY = 0

                    if (aspectRatio > 1) {
                        drawHeight = SIZE
                        drawWidth = SIZE * aspectRatio
                        offsetX = -(drawWidth - SIZE) / 2
                    } else {
                        drawWidth = SIZE
                        drawHeight = SIZE / aspectRatio
                        offsetY = -(drawHeight - SIZE) / 2
                    }

                    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
                    resolve(canvas.toDataURL('image/jpeg', 0.85))
                }
                img.src = e.target.result
            }
            reader.readAsDataURL(file)
        })
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (file) {
            setStatus('uploading')
            setUploadProgress(0)

            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval)
                        return 100
                    }
                    return prev + 10
                })
            }, 100)

            try {
                const resizedImage = await resizeImage(file)
                setTimeout(() => {
                    setImage(resizedImage)
                    setStatus('idle')
                    setResult(null)
                    setError(null)
                }, 1000)
            } catch (err) {
                setError("Failed to process image. Please try another one.")
                setStatus('idle')
            }
        }
    }

    const analyzeImage = async () => {
        if (!image) {
            setError("Please upload an image first")
            return
        }

        setStatus('analyzing')
        setError(null)
        setResult(null)

        try {
            // Convert base64 image to blob
            const response = await fetch(image)
            const blob = await response.blob()
            
            // Create FormData
            const formData = new FormData()
            formData.append('file', blob, 'plant-image.jpg')

            console.log('🌿 Sending image to Plant Doctor API...')

            // Call backend API
            const result = await apiClient.post('/plant-disease', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            console.log('✅ Plant Doctor response:', result)

            // Parse disease name and create result object
            const diseaseName = result.disease || 'Unknown Disease'
            const confidence = result.confidence || 0

            // Determine if healthy or diseased
            const isHealthy = diseaseName.toLowerCase().includes('healthy')
            
            // Create structured result
            const diseaseResult = {
                name: diseaseName,
                type: isHealthy ? 'Healthy' : 'Disease Detected',
                confidence: Math.round(confidence),
                symptoms: isHealthy 
                    ? ['Vibrant green leaves', 'No visible spots or discoloration', 'Strong stem structure']
                    : ['Visible disease symptoms detected', 'Requires immediate attention', 'Check leaves and stems carefully'],
                remedy: isHealthy
                    ? 'Continue current care routine. Maintain regular watering schedule.'
                    : 'Consult with an agricultural expert for specific treatment. Remove affected leaves if necessary.',
                prevention: isHealthy
                    ? ['Regular monitoring', 'Balanced fertilization', 'Proper watering']
                    : ['Isolate affected plants', 'Improve air circulation', 'Use disease-resistant varieties']
            }

            setResult(diseaseResult)
            setStatus('result')

            // Save diagnosis to backend (optional)
            apiClient.post('/plant-diagnosis', {
                disease: diseaseName,
                confidence: confidence,
                symptoms: diseaseResult.symptoms,
                remedy: diseaseResult.remedy,
                type: diseaseResult.type,
                diagnosed_at: new Date().toISOString()
            }).catch(() => {})

        } catch (err) {
            console.error('❌ Plant disease detection error:', err)
            setError(err.message || "Analysis failed. Please try again.")
            setStatus('idle')
        }
    }

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-teal-600/80 via-emerald-600/80 to-green-600/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="text-amber-400" size={20} />
                        <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">AI Powered</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Plant Doctor</h1>
                    <p className="text-white/60">Upload a photo for instant disease detection and treatment</p>
                </motion.div>

                <div className="grid lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Upload & Preview */}
                    <div className="lg:col-span-5 space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-5"
                        >
                            <div className="aspect-square rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                                {image ? (
                                    <>
                                        <img src={image} alt="Plant" className="w-full h-full object-cover rounded-xl" />

                                        {status === 'analyzing' && (
                                            <div className="absolute inset-0 z-20 overflow-hidden rounded-xl">
                                                <motion.div
                                                    initial={{ top: '-10%' }}
                                                    animate={{ top: '110%' }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                    className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_15px_rgba(74,222,128,0.8)]"
                                                />
                                                <div className="absolute inset-0 bg-emerald-900/30 backdrop-blur-[1px]" />
                                            </div>
                                        )}

                                        {status === 'idle' && (
                                            <button
                                                onClick={() => { setImage(null); setResult(null) }}
                                                className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors z-30"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-center p-8 cursor-pointer w-full h-full flex flex-col items-center justify-center hover:bg-white/5 transition-colors rounded-xl"
                                    >
                                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
                                            <Upload size={28} />
                                        </div>
                                        <p className="font-semibold text-white">Upload Plant Photo</p>
                                        <p className="text-xs text-white/40 mt-2">JPG, PNG (Max 10MB)</p>
                                    </div>
                                )}

                                {status === 'uploading' && (
                                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-40 rounded-xl">
                                        <Loader2 className="animate-spin text-emerald-400 mb-4" size={36} />
                                        <p className="font-semibold text-white">Uploading...</p>
                                        <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                                            <motion.div
                                                className="bg-emerald-500 h-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {status === 'analyzing' && (
                                    <div className="absolute inset-0 flex items-center justify-center z-40">
                                        <div className="bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full flex items-center gap-2 border border-white/20">
                                            <Activity className="animate-pulse text-emerald-400" size={18} />
                                            <span className="font-semibold text-white text-sm">AI SCANNING...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/*"
                            />

                            <div className="mt-4">
                                {!image && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Camera size={18} />
                                        Take or Upload Photo
                                    </button>
                                )}
                                {image && status === 'idle' && (
                                    <button
                                        onClick={analyzeImage}
                                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Zap size={18} className="text-amber-300" />
                                        Start AI Analysis
                                    </button>
                                )}
                            </div>
                        </motion.div>

                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300 text-sm">
                                <AlertTriangle size={18} />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Right: Results */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {status === 'result' && result ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
                                >
                                    <div className={`p-6 ${result.type === 'Healthy' ? 'bg-emerald-600/50' : 'bg-red-600/50'} relative`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                                                        Diagnosis
                                                    </span>
                                                    <span className="px-3 py-1 bg-amber-500 text-black rounded-full text-[10px] font-bold uppercase">
                                                        {result.confidence}% Match
                                                    </span>
                                                </div>
                                                <h2 className="text-2xl font-bold text-white">{result.name}</h2>
                                                <p className="text-white/70 text-sm">{result.type} Condition</p>
                                            </div>
                                            {result.type === 'Healthy' ? (
                                                <ShieldCheck size={48} className="text-emerald-300/50" />
                                            ) : (
                                                <AlertTriangle size={48} className="text-red-300/50" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div>
                                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Search size={14} className="text-emerald-400" />
                                                Observations
                                            </h3>
                                            <ul className="space-y-2">
                                                {result.symptoms.map((s, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                                                        <div className="mt-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-emerald-500/20 p-5 rounded-xl border border-emerald-500/20">
                                            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Treatment</h3>
                                            <p className="text-white/80 text-sm">{result.remedy}</p>
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <ShieldCheck size={14} className="text-emerald-400" />
                                                Prevention
                                            </h3>
                                            <ul className="space-y-2">
                                                {result.prevention.map((p, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                                                        <div className="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                                                        {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <button className="w-full py-3 bg-white/10 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                            <Phone size={16} />
                                            Contact Agri-Expert
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="h-full min-h-[400px] bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center p-10"
                                >
                                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                        <Activity className="text-white/20" size={40} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white/40">Awaiting Analysis</h3>
                                    <p className="text-white/30 max-w-xs mt-2 text-sm">
                                        Upload a photo and start the analysis to see detailed health insights.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PlantDoctor
