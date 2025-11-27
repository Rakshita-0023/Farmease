import { useState, useRef } from 'react'
import './WeatherEnhancements.css' // Reusing some styles

const PlantDoctor = () => {
    const [image, setImage] = useState(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [result, setResult] = useState(null)
    const fileInputRef = useRef(null)

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImage(reader.result)
                setResult(null)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCameraClick = () => {
        // In a real app, this would access the camera
        // For demo, we'll trigger file input
        fileInputRef.current.click()
    }

    const analyzeImage = () => {
        setAnalyzing(true)

        // Simulate AI processing delay
        setTimeout(() => {
            const diagnoses = [
                {
                    disease: 'Wheat Rust',
                    confidence: 92,
                    symptoms: ['Orange/yellow pustules on leaves', 'Stunted growth'],
                    remedy: 'Apply Propiconazole (Tilt) @ 1ml/liter water. Use resistant varieties like HD-2967.',
                    type: 'Fungal'
                },
                {
                    disease: 'Healthy Crop',
                    confidence: 98,
                    symptoms: ['No visible signs of disease', 'Vibrant green color'],
                    remedy: 'Continue regular monitoring and irrigation.',
                    type: 'Healthy'
                },
                {
                    disease: 'Leaf Spot',
                    confidence: 85,
                    symptoms: ['Brown spots with yellow halos', 'Leaf drying'],
                    remedy: 'Spray Mancozeb @ 2.5g/liter water. Improve air circulation.',
                    type: 'Fungal'
                },
                {
                    disease: 'Aphid Infestation',
                    confidence: 89,
                    symptoms: ['Curled leaves', 'Sticky honeydew residue'],
                    remedy: 'Spray Neem Oil (10000 ppm) @ 3ml/liter. Introduce ladybugs.',
                    type: 'Pest'
                }
            ]

            const randomDiagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)]
            setResult(randomDiagnosis)
            setAnalyzing(false)
        }, 2000)
    }

    return (
        <div className="plant-doctor-page">
            <div className="page-header">
                <div>
                    <h1>🌿 AI Plant Doctor</h1>
                    <p>Instant disease diagnosis and remedies</p>
                </div>
            </div>

            <div className="doctor-container">
                <div className="upload-section">
                    <div className="image-preview-area">
                        {image ? (
                            <img src={image} alt="Crop preview" className="preview-image" />
                        ) : (
                            <div className="placeholder-content">
                                <span className="placeholder-icon">📸</span>
                                <p>Upload a photo of your affected crop</p>
                            </div>
                        )}

                        {analyzing && (
                            <div className="scanning-overlay">
                                <div className="scanner-line"></div>
                                <p>Analyzing leaf patterns...</p>
                            </div>
                        )}
                    </div>

                    <div className="action-buttons">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            hidden
                        />
                        <button className="camera-btn" onClick={handleCameraClick}>
                            📷 Take Photo / Upload
                        </button>
                        {image && !analyzing && !result && (
                            <button className="analyze-btn" onClick={analyzeImage}>
                                🔍 Diagnose Now
                            </button>
                        )}
                        {result && (
                            <button className="reset-btn" onClick={() => { setImage(null); setResult(null); }}>
                                🔄 New Scan
                            </button>
                        )}
                    </div>
                </div>

                {result && (
                    <div className="diagnosis-result">
                        <div className={`result-header ${result.type.toLowerCase()}`}>
                            <h2>{result.disease}</h2>
                            <span className="confidence-tag">{result.confidence}% Confidence</span>
                        </div>

                        <div className="result-body">
                            <div className="symptoms-section">
                                <h3>⚠️ Detected Symptoms</h3>
                                <ul>
                                    {result.symptoms.map((symptom, i) => (
                                        <li key={i}>{symptom}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="remedy-section">
                                <h3>💊 Recommended Remedy</h3>
                                <p>{result.remedy}</p>
                            </div>

                            <div className="expert-connect">
                                <p>Need a second opinion?</p>
                                <button className="connect-btn">📞 Call Agri-Expert</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PlantDoctor
