import { useState } from 'react'

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const toggleListening = () => {
    setIsListening(!isListening)
    // Mock voice functionality
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false)
        alert('Voice command processed: "Show weather forecast"')
      }, 3000)
    }
  }

  return (
    <>
      <button 
        className="voice-assistant-btn"
        onClick={() => setIsVisible(!isVisible)}
      >
        🎤
      </button>

      {isVisible && (
        <div className="voice-assistant-panel">
          <div className="voice-header">
            <h4>🎤 Voice Assistant</h4>
            <button onClick={() => setIsVisible(false)}>×</button>
          </div>
          
          <div className="voice-content">
            <p>Try saying:</p>
            <ul>
              <li>"Show weather forecast"</li>
              <li>"Check my farms"</li>
              <li>"Market prices"</li>
              <li>"Farming tips"</li>
            </ul>
            
            <button 
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
            >
              {isListening ? 'Listening...' : 'Start Listening'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default VoiceAssistant