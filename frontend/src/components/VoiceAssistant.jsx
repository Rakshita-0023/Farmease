import { useState, useEffect } from 'react'

function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript.toLowerCase()
        setTranscript(speechResult)
        handleVoiceCommand(speechResult)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      window.recognition = recognition
    }
  }, [])

  const handleVoiceCommand = (command) => {
    let responseText = ''
    
    if (command.includes('weather')) {
      responseText = 'Opening weather dashboard for you'
      setTimeout(() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'weather' })), 1000)
    } else if (command.includes('farm') || command.includes('crop')) {
      responseText = 'Opening farm management page'
      setTimeout(() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'farm' })), 1000)
    } else if (command.includes('market') || command.includes('price')) {
      responseText = 'Opening market prices page'
      setTimeout(() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'market' })), 1000)
    } else if (command.includes('dashboard') || command.includes('home')) {
      responseText = 'Going to dashboard'
      setTimeout(() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' })), 1000)
    } else if (command.includes('add farm')) {
      responseText = 'I can help you add a new farm. Please go to the farm management page.'
    } else if (command.includes('temperature') || command.includes('hot') || command.includes('cold')) {
      responseText = 'Check the weather page for current temperature and conditions'
    } else {
      responseText = 'I can help you with weather, farms, market prices, or navigation. Try saying "show weather" or "open farms"'
    }
    
    setResponse(responseText)
    speak(responseText)
  }

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    if (window.recognition) {
      window.recognition.start()
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '70px',
          right: '0',
          width: '300px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#22c55e' }}>🎤 Voice Assistant</h4>
          
          <button
            onClick={startListening}
            disabled={isListening}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: isListening ? '#f59e0b' : '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isListening ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {isListening ? '🎤 Listening...' : '🎤 Start Listening'}
          </button>

          {transcript && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>You said:</strong>
              <div style={{ padding: '0.5rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.9rem' }}>
                "{transcript}"
              </div>
            </div>
          )}

          {response && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Assistant:</strong>
              <div style={{ padding: '0.5rem', background: '#dcfce7', borderRadius: '6px', fontSize: '0.9rem' }}>
                {response}
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Try: "Show weather", "Open farms", "Market prices", "Add farm"
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#22c55e',
          color: 'white',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
          transition: 'all 0.3s ease'
        }}
      >
        🎤
      </button>
    </div>
  )
}

export default VoiceAssistant