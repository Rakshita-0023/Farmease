import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, MessageSquare } from 'lucide-react'

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
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-110 flex items-center justify-center z-50 group"
        onClick={() => setIsOpen(!isOpen)}
        title="AI Farming Assistant"
      >
        <Bot size={28} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-green-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={24} />
              <h3 className="font-bold">AI Farming Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-green-700 p-1 rounded transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${message.type === 'user'
                      ? 'bg-green-600 text-white rounded-tr-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                    }`}
                >
                  {message.text.split('\n').map((line, i) => (
                    <div key={i} className={i > 0 ? 'mt-1' : ''}>{line}</div>
                  ))}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about crops, irrigation..."
              disabled={isTyping}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isTyping}
              className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} className={inputText.trim() ? 'ml-0.5' : ''} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default AIChatbot