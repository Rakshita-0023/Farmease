import './WeatherEnhancements.css'

const AboutUs = () => {
  return (
    <div className="about-page">
      <div className="page-header">
        <h1>🌱 About FarmEase</h1>
        <p>Empowering farmers with technology and knowledge</p>
      </div>

      <div className="about-content">
        <div className="about-section">
          <h2>Our Mission</h2>
          <p>
            FarmEase is dedicated to revolutionizing agriculture through technology. 
            We provide farmers with intelligent tools, real-time data, and expert 
            guidance to maximize crop yields and ensure sustainable farming practices.
          </p>
        </div>

        <div className="about-section">
          <h2>What We Offer</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌤️</div>
              <h3>Weather Intelligence</h3>
              <p>Real-time weather data and forecasts tailored for agricultural needs</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔬</div>
              <h3>Plant Disease Detection</h3>
              <p>AI-powered disease diagnosis with treatment recommendations</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Market Insights</h3>
              <p>Live market prices and trends to optimize selling decisions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Community Support</h3>
              <p>Connect with fellow farmers and agricultural experts</p>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>Our Impact</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Farmers Served</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">25%</div>
              <div className="stat-label">Average Yield Increase</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">50+</div>
              <div className="stat-label">Crop Varieties Supported</div>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>Technology Stack</h2>
          <p>
            Built with modern web technologies including React, Node.js, and machine learning 
            models to provide reliable, fast, and accurate agricultural insights.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutUs