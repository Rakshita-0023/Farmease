import { useState } from 'react'
import { Cloud, Sprout, TrendingUp, Lightbulb, Mic, MapPin, ArrowRight } from 'lucide-react'

const LandingPage = ({ onGetStarted }) => {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    { icon: <Cloud size={32} className="text-blue-500" />, title: 'Weather Insights', desc: 'Real-time weather data and forecasts' },
    { icon: <Sprout size={32} className="text-green-500" />, title: 'AI Crop Prediction', desc: 'Smart crop recommendations based on conditions' },
    { icon: <TrendingUp size={32} className="text-orange-500" />, title: 'Market Prices', desc: 'Live market rates and price trends' },
    { icon: <Lightbulb size={32} className="text-yellow-500" />, title: 'Farming Tips', desc: 'Expert advice and best practices' },
    { icon: <Mic size={32} className="text-purple-500" />, title: 'Voice Assistant', desc: 'Hands-free farming guidance' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white font-sans">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium text-sm">
                🌱 Smart Agriculture for India
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Farm<span className="text-green-600">Ease</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Empowering farmers with AI-driven insights, real-time market data, and smart crop management tools.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                >
                  🚀 Start Now
                </button>
                <button className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                  📹 View Demo
                </button>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <Cloud className="text-blue-500 mb-2" />
                    <div className="text-2xl font-bold text-gray-800">28°C</div>
                    <div className="text-sm text-gray-500">Sunny</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <Sprout className="text-green-500 mb-2" />
                    <div className="text-2xl font-bold text-gray-800">Wheat</div>
                    <div className="text-sm text-gray-500">Healthy</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <TrendingUp className="text-orange-500" />
                      <span className="text-green-600 text-sm font-bold">+12%</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">₹2,400/q</div>
                    <div className="text-sm text-gray-500">Market Price</div>
                  </div>
                </div>
              </div>
              {/* Decorative blobs */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-gray-500">Comprehensive tools to manage your farm from sowing to harvest.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 group"
              >
                <div className="mb-6 bg-white w-16 h-16 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-900 text-white overflow-hidden relative">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Farming?</h2>
          <p className="text-green-100 mb-10 max-w-2xl mx-auto text-lg">
            Join thousands of farmers who are using FarmEase to increase yields and profits.
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-4 bg-yellow-400 text-green-900 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg shadow-green-900/50"
          >
            Get Started Free
          </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
      </section>
    </div>
  )
}

export default LandingPage