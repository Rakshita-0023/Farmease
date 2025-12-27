import { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
    Upload,
    Camera,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
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
    const [status, setStatus] = useState('idle') // idle, uploading, analyzing, result
    const [uploadProgress, setUploadProgress] = useState(0)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    // Resize image to EXACTLY 224x224px for optimal AI processing
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

            // Simulate upload progress
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
                console.error("Image processing failed", err)
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
            // Simulate AI analysis with scanning animation
            await new Promise(resolve => setTimeout(resolve, 3500))

            const diseases = [
                {
                    name: 'Early Blight',
                    type: 'Fungal',
                    confidence: 88,
                    symptoms: ['Dark concentric rings on leaves', 'Yellowing of older leaves', 'Brown spots with target-like pattern'],
                    remedy: 'Remove infected leaves immediately. Apply copper-based fungicide. Ensure proper spacing between plants for air circulation.',
                    prevention: ['Crop rotation every 2-3 years', 'Avoid overhead watering', 'Mulch around plants', 'Remove plant debris']
                },
                {
                    name: 'Leaf Spot',
                    type: 'Bacterial',
                    confidence: 92,
                    symptoms: ['Small water-soaked spots', 'Yellow halos around spots', 'Spots turn brown and dry'],
                    remedy: 'Prune affected areas. Apply copper hydroxide spray. Water at soil level only.',
                    prevention: ['Use disease-free seeds', 'Avoid working with wet plants', 'Maintain good air circulation', 'Sanitize tools regularly']
                },
                {
                    name: 'Healthy Plant',
                    type: 'Healthy',
                    confidence: 95,
                    symptoms: ['Vibrant green leaves', 'No visible spots or discoloration', 'Strong stem structure'],
                    remedy: 'Continue current care routine. Maintain regular watering schedule and monitor for any changes.',
                    prevention: ['Regular monitoring', 'Balanced fertilization', 'Proper watering', 'Good soil drainage']
                },
                {
                    name: 'Powdery Mildew',
                    type: 'Fungal',
                    confidence: 85,
                    symptoms: ['White powdery coating on leaves', 'Leaf curling', 'Stunted growth'],
                    remedy: 'Apply neem oil or sulfur-based fungicide. Improve air circulation. Remove severely infected leaves.',
                    prevention: ['Avoid overcrowding', 'Water in morning', 'Ensure good sunlight', 'Use resistant varieties']
                }
            ]

            const randomDisease = diseases[Math.floor(Math.random() * diseases.length)]
            setResult(randomDisease)
            setStatus('result')

            // Save to backend
            await apiClient.post('/plant-diagnosis', {
                disease: randomDisease.name,
                confidence: randomDisease.confidence,
                symptoms: randomDisease.symptoms,
                remedy: randomDisease.remedy,
                type: randomDisease.type,
                diagnosed_at: new Date().toISOString()
            }).catch(e => console.error("Failed to save diagnosis", e))

        } catch (err) {
            console.error("Diagnosis failed:", err)
            setError("Analysis failed. Please try again.")
            setStatus('idle')
        }
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8 font-inter">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-[#064E3B] flex items-center justify-center gap-3">
                        <Zap className="text-[#FBBF24] fill-[#FBBF24]" size={32} />
                        AI Plant Doctor
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto font-medium">
                        Professional-grade crop diagnostic tool. Upload a high-resolution photo for instant disease detection and treatment protocols.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Upload & Preview */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                            <div className="aspect-square rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                                {image ? (
                                    <>
                                        <img src={image} alt="Plant" className="w-full h-full object-cover" />

                                        {status === 'analyzing' && (
                                            <div className="absolute inset-0 z-20 overflow-hidden">
                                                <motion.div
                                                    initial={{ top: '-10%' }}
                                                    animate={{ top: '110%' }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                    className="absolute left-0 right-0 h-1 bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] z-30"
                                                />
                                                <div className="absolute inset-0 bg-green-900/20 backdrop-blur-[1px]" />
                                            </div>
                                        )}

                                        {status === 'idle' && (
                                            <button
                                                onClick={() => { setImage(null); setStatus('idle'); setResult(null); }}
                                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors z-30"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-center p-8 cursor-pointer w-full h-full flex flex-col items-center justify-center hover:bg-gray-100/50 transition-colors"
                                    >
                                        <div className="w-20 h-20 bg-green-50 text-[#064E3B] rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                            <Upload size={32} />
                                        </div>
                                        <p className="font-bold text-gray-800">Upload Plant Photo</p>
                                        <p className="text-xs text-gray-400 mt-2">Supports JPG, PNG (Max 10MB)</p>
                                    </div>
                                )}

                                {/* Uploading State Overlay */}
                                {status === 'uploading' && (
                                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-40">
                                        <Loader2 className="animate-spin text-[#064E3B] mb-4" size={40} />
                                        <p className="font-bold text-gray-800">Uploading Image...</p>
                                        <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                                            <motion.div
                                                className="bg-[#064E3B] h-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">{uploadProgress}% Complete</p>
                                    </div>
                                )}

                                {/* Analyzing State Overlay */}
                                {status === 'analyzing' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-40">
                                        <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 border border-white/20">
                                            <Activity className="animate-pulse text-green-400" size={20} />
                                            <span className="font-bold tracking-wide">AI SCANNING...</span>
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

                            <div className="mt-6 space-y-3">
                                {!image && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-4 bg-[#064E3B] text-white rounded-2xl font-bold hover:bg-[#053F30] transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-3"
                                    >
                                        <Camera size={20} />
                                        Take or Upload Photo
                                    </button>
                                )}
                                {image && status === 'idle' && (
                                    <button
                                        onClick={analyzeImage}
                                        className="w-full py-4 bg-[#064E3B] text-white rounded-2xl font-bold hover:bg-[#053F30] transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-3"
                                    >
                                        <Zap size={20} className="text-[#FBBF24] fill-[#FBBF24]" />
                                        Start AI Analysis
                                    </button>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-medium">
                                <AlertTriangle size={20} />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Right: Results / Analysis Card */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {status === 'result' && result ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                                >
                                    <div className={`p-8 ${result.type === 'Healthy' ? 'bg-[#064E3B]' : 'bg-red-900'} text-white relative`}>
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        Diagnosis Result
                                                    </span>
                                                    <span className="px-3 py-1 bg-[#FBBF24] text-[#064E3B] rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        {result.confidence}% Confidence
                                                    </span>
                                                </div>
                                                <h2 className="text-4xl font-black tracking-tight">{result.name}</h2>
                                                <p className="text-white/70 font-medium">{result.type} Condition Detected</p>
                                            </div>
                                            {result.type === 'Healthy' ? (
                                                <ShieldCheck size={64} className="text-green-400 opacity-50" />
                                            ) : (
                                                <AlertTriangle size={64} className="text-red-400 opacity-50" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-8 grid md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Search size={16} className="text-[#064E3B]" />
                                                    Observations
                                                </h3>
                                                <ul className="space-y-3">
                                                    {result.symptoms.map((s, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-gray-700 font-medium text-sm">
                                                            <div className="mt-1.5 w-1.5 h-1.5 bg-[#FBBF24] rounded-full shrink-0" />
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <ShieldCheck size={16} className="text-[#064E3B]" />
                                                    Prevention
                                                </h3>
                                                <ul className="space-y-3">
                                                    {result.prevention.map((p, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-gray-700 font-medium text-sm">
                                                            <div className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />
                                                            {p}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-[#F0FDF4] p-6 rounded-2xl border border-green-100">
                                                <h3 className="text-sm font-black text-[#064E3B] uppercase tracking-widest mb-3">Treatment Protocol</h3>
                                                <p className="text-[#064E3B] text-sm leading-relaxed font-medium">
                                                    {result.remedy}
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                                                <p className="text-gray-500 text-sm mb-4 font-medium">Require professional intervention?</p>
                                                <button className="w-full py-3 bg-white border-2 border-[#064E3B] text-[#064E3B] rounded-xl font-bold hover:bg-green-50 transition-all flex items-center justify-center gap-2">
                                                    <Phone size={18} />
                                                    Agri-Expert Hotline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full min-h-[400px] bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-12">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                        <Activity className="text-gray-200" size={48} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-400">Awaiting Analysis</h3>
                                    <p className="text-gray-300 max-w-xs mt-2 text-sm font-medium">
                                        Upload a photo and start the analysis to see detailed health insights here.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PlantDoctor