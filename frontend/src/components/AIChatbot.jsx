import { useState, useRef, useEffect } from 'react'

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I\'m your AI farming assistant. Ask me about crops, weather, or farming techniques!' }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const farmingResponses = {
    'wheat': 'Wheat grows best in temperatures between 15-25°C. Plant in October-November for winter wheat. Ensure proper drainage and fertilize with NPK.',
    'rice': 'Rice requires flooded fields and temperatures of 25-35°C. Plant during monsoon season. Maintain 2-5cm water level throughout growing period.',
    'tomato': 'Tomatoes need warm weather (18-28°C) and well-drained soil. Plant after last frost. Water regularly but avoid wetting leaves to prevent disease.',
    'irrigation': 'Water crops early morning or evening to reduce evaporation. Use drip irrigation for water efficiency. Check soil moisture 2-3 inches deep.',
    'fertilizer': 'Use NPK fertilizer based on soil test results. Organic compost improves soil health. Apply fertilizer before planting and during growing season.',
    'pest': 'Use integrated pest management (IPM). Neem oil is effective against many pests. Encourage beneficial insects. Rotate crops to break pest cycles.',
    'weather': 'Monitor weather forecasts daily. Protect crops from extreme weather. Use mulching to regulate soil temperature and moisture.',
    'soil': 'Test soil pH regularly (6.0-7.0 is ideal for most crops). Add organic matter to improve soil structure. Ensure proper drainage.',
    'harvest': 'Harvest at optimal ripeness for best quality. Early morning harvesting reduces heat stress. Handle produce carefully to avoid damage.'
  }

  const getAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase()
    
    // Find matching keywords
    for (const [keyword, response] of Object.entries(farmingResponses)) {
      if (message.includes(keyword)) {
        return response
      }
    }
    
    // Default responses for common questions
    if (message.includes('hello') || message.includes('hi')) {
      return 'Hello! I\'m here to help with your farming questions. Ask me about crops, irrigation, pests, or weather!'
    }
    
    if (message.includes('help')) {
      return 'I can help you with:\n• Crop growing tips\n• Irrigation advice\n• Pest management\n• Weather guidance\n• Soil care\n• Harvest timing\n\nWhat would you like to know?'
    }
    
    if (message.includes('thank')) {
      return 'You\'re welcome! Happy farming! 🌱'
    }
    
    // Default response
    return 'I\'d be happy to help! Try asking about specific crops (wheat, rice, tomato), irrigation, fertilizers, pests, or soil management.'
  }

  const sendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage = inputText.trim()
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])
    setInputText('')
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(() => {
      const response = getAIResponse(userMessage)
      setMessages(prev => [...prev, { type: 'bot', text: response }])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <>
      {/* Chat Button */}
      <button 
        className="ai-chat-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="AI Farming Assistant"
      >
        🤖
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="ai-chat-panel">
          <div className="chat-header">
            <h3>🤖 AI Farming Assistant</h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.text.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about crops, irrigation, pests..."
              disabled={isTyping}
            />
            <button 
              onClick={sendMessage}
              disabled={!inputText.trim() || isTyping}
            >
              📤
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default AIChatbot