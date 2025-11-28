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
                            <div className="placeholder-content" style={{ border: '2px dashed #9ca3af', borderRadius: '12px', padding: '40px', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '300px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                <p style={{ marginTop: '16px', fontSize: '1.1em', fontWeight: '500', color: '#374151' }}>Drag and drop image here</p>
                                <p style={{ fontSize: '0.9em', color: '#6b7280' }}>or click below to upload</p>
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
