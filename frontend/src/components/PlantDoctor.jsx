import { useState, useRef } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Upload, Camera, RefreshCw, AlertTriangle, CheckCircle, Phone, Loader2, X } from 'lucide-react'
import { apiClient } from '../config'

const PlantDoctor = () => {
    const [image, setImage] = useState(null)
    const [analyzing, setAnalyzing] = useState(false)
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
                    const MAX_WIDTH = 800
                    const MAX_HEIGHT = 800
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx.drawImage(img, 0, 0, width, height)
                    resolve(canvas.toDataURL('image/jpeg', 0.7)) // Compress to 70% quality
                }
                img.src = e.target.result
            }
            reader.readAsDataURL(file)
        })
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (file) {
            try {
                const resizedImage = await resizeImage(file)
                setImage(resizedImage)
                setResult(null)
                setError(null)
            } catch (err) {
                console.error("Image processing failed", err)
                setError("Failed to process image. Please try another one.")
            }
        }
    }

    const analyzeImage = async () => {
        if (!image) return

        setAnalyzing(true)
        setError(null)
        setResult(null)

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY

            if (!apiKey || apiKey === 'your_api_key_here') {
                // Fallback to local simulation if no key
                console.warn("No Gemini API Key found, using simulation")
                await new Promise(resolve => setTimeout(resolve, 2000))

                // Better simulation with random variety
                const diseases = [
                    { name: 'Early Blight', type: 'Fungal', confidence: 88, symptoms: ['Dark concentric rings', 'Yellowing leaves'] },
                    { name: 'Leaf Spot', type: 'Bacterial', confidence: 92, symptoms: ['Small water-soaked spots', 'Yellow halos'] },
                    { name: 'Healthy Plant', type: 'Healthy', confidence: 95, symptoms: ['Vibrant green leaves', 'No visible spots'] }
                ]
                const randomDisease = diseases[Math.floor(Math.random() * diseases.length)]

                const simulatedResult = {
                    disease: `${randomDisease.name} (Simulated)`,
                    confidence: randomDisease.confidence,
                    symptoms: randomDisease.symptoms,
                    remedy: randomDisease.type === 'Healthy' ? 'Keep up the good work! Maintain regular watering.' : 'This is a simulated diagnosis because the AI API key is missing. Please configure VITE_GEMINI_API_KEY in .env to get real AI analysis.',
                    type: randomDisease.type,
                    prevention: ['Ensure proper drainage', 'Monitor regularly']
                }
                setResult(simulatedResult)
                // Save to history (mock)
                saveDiagnosis(simulatedResult)
                setAnalyzing(false)
                return
            }

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

            // Remove data:image/jpeg;base64, prefix
            const base64Data = image.split(',')[1]

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            }

            const prompt = `Analyze this plant image for diseases. 
      Return ONLY a valid JSON object with this structure:
      {
        "disease": "Name of disease or 'Healthy'",
        "confidence": number (0-100),
        "symptoms": ["symptom1", "symptom2"],
        "remedy": "Detailed remedy instructions",
        "type": "Fungal/Bacterial/Viral/Pest/Nutritional/Healthy",
        "prevention": ["prevention tip 1", "prevention tip 2"]
      }
      Do not include markdown formatting like \`\`\`json.`

            const result = await model.generateContent([prompt, imagePart])
            const response = await result.response
            const text = response.text()

            // Clean up text if it has markdown
            const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim()
            const diagnosis = JSON.parse(jsonText)

            setResult(diagnosis)
            saveDiagnosis(diagnosis)

        } catch (err) {
            console.error("Diagnosis failed", err)
            setError("Failed to analyze image. Please try again.")
        } finally {
            setAnalyzing(false)
        }
    }

    const saveDiagnosis = async (diagnosis) => {
        try {
            await apiClient.post('/plant-diagnosis', {
                ...diagnosis,
                image_url: 'image_data_truncated', // Don't send full base64 to DB
                diagnosed_at: new Date().toISOString()
            })
        } catch (e) {
            console.error("Failed to save diagnosis", e)
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
                    🌿 AI Plant Doctor
                </h1>
                <p className="text-gray-500">Upload a photo of your plant for instant diagnosis and treatment advice</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex flex-col items-center justify-center space-y-6">
                    {/* Image Preview Area */}
                    <div className="relative w-full max-w-md aspect-video bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group hover:border-green-500 transition-colors">
                        {image ? (
                            <>
                                <img src={image} alt="Plant" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => { setImage(null); setResult(null); }}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </>
                        ) : (
                            <div className="text-center p-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Upload size={32} />
                                </div>
                                <p className="font-medium text-gray-700">Click to upload or drag & drop</p>
                                <p className="text-sm text-gray-400 mt-1">Supports JPG, PNG</p>
                            </div>
                        )}

                        {analyzing && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm z-10">
                                <div className="relative w-20 h-20 mb-4">
                                    <div className="absolute inset-0 border-4 border-green-500/30 rounded-full animate-ping"></div>
                                    <div className="absolute inset-0 border-4 border-t-green-500 rounded-full animate-spin"></div>
                                    <Scan className="absolute inset-0 m-auto text-green-400 animate-pulse" size={32} />
                                </div>
                                <p className="font-bold text-lg animate-pulse">Analyzing Plant Health...</p>
                                <p className="text-sm text-gray-300 mt-2">Identifying diseases & pests</p>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 w-full max-w-md">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        {!image && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
                            >
                                <Upload size={20} />
                                Upload Photo
                            </button>
                        )}
                        {image && !analyzing && !result && (
                            <button
                                onClick={analyzeImage}
                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                            >
                                <RefreshCw size={20} />
                                Diagnose Now
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="w-full max-w-md p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
                            <AlertTriangle size={20} />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Results Section */}
            {result && (
                <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-6 ${result.type === 'Healthy' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">{result.disease}</h2>
                                <div className="flex items-center gap-2 opacity-90">
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">{result.type}</span>
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">{result.confidence}% Confidence</span>
                                </div>
                            </div>
                            {result.type === 'Healthy' ? <CheckCircle size={48} className="opacity-80" /> : <AlertTriangle size={48} className="opacity-80" />}
                        </div>
                    </div>

                    <div className="p-8 grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-orange-500" />
                                    Symptoms
                                </h3>
                                <ul className="space-y-2">
                                    {result.symptoms.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-gray-600">
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0" />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <CheckCircle size={20} className="text-green-500" />
                                    Prevention
                                </h3>
                                <ul className="space-y-2">
                                    {result.prevention.map((p, i) => (
                                        <li key={i} className="flex items-start gap-2 text-gray-600">
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-green-400 rounded-full shrink-0" />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h3 className="text-lg font-bold text-blue-900 mb-3">Recommended Treatment</h3>
                                <p className="text-blue-800 leading-relaxed">{result.remedy}</p>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                                <p className="text-gray-600 mb-4">Need expert advice?</p>
                                <button className="w-full py-3 bg-white border-2 border-green-600 text-green-700 rounded-xl font-bold hover:bg-green-50 flex items-center justify-center gap-2">
                                    <Phone size={20} />
                                    Connect with Agri-Expert
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PlantDoctor