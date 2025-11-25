import { useState } from 'react'

const LandingPage = ({ onGetStarted }) => {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    { icon: '🌤️', title: 'Weather Insights', desc: 'Real-time weather data and forecasts' },
    { icon: '🌾', title: 'AI Crop Prediction', desc: 'Smart crop recommendations based on conditions' },
    { icon: '📈', title: 'Market Prices', desc: 'Live market rates and price trends' },
    { icon: '💡', title: 'Farming Tips', desc: 'Expert advice and best practices' },
    { icon: '🎤', title: 'Voice Assistant', desc: 'Hands-free farming guidance' }
  ]

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>🌱 FarmEase</h1>
          <p className="tagline">Smart AI-Based Agriculture Assistant for Indian Farmers</p>
          <p className="subtitle">Empowering farmers with technology for better yields and informed decisions</p>
          
          <div className="hero-buttons">
            <button className="btn-primary" onClick={onGetStarted}>
              🚀 Start Now
            </button>
            <button className="btn-secondary">
              📹 View Demo
            </button>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="floating-cards">
            <div className="card weather">🌤️ 28°C</div>
            <div className="card crop">🌾 Wheat</div>
            <div className="card price">📈 ₹2,400</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Everything You Need for Smart Farming</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`feature-card ${activeFeature === index ? 'active' : ''}`}
              onMouseEnter={() => setActiveFeature(index)}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>📍 Enter Location</h3>
            <p>Tell us where your farm is located</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>🌤️ Get Weather Data</h3>
            <p>Receive real-time weather insights</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>🤖 AI Recommendations</h3>
            <p>Get smart crop and farming suggestions</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>📈 Track & Optimize</h3>
            <p>Monitor progress and optimize yields</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to Transform Your Farming?</h2>
        <p>Join thousands of farmers already using FarmEase</p>
        <button className="btn-primary large" onClick={onGetStarted}>
          Get Started Free
        </button>
      </section>
    </div>
  )
}

export default LandingPage