import InteractiveMarketMap from './InteractiveMarketMap'

const AdvancedFeatures = ({ userLocation }) => {
  return (
    <div className="advanced-features">
      <div className="features-header">
        <h1>🚀 Advanced Features</h1>
        <p>AI-powered tools for modern farming</p>
      </div>

      <div className="features-content mt-6">
        <div className="feature-section">
          <InteractiveMarketMap userLocation={userLocation} />
        </div>
      </div>
    </div>
  )
}

export default AdvancedFeatures