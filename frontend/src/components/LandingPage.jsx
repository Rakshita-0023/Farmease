import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Cloud, Sprout, TrendingUp, Lightbulb, 
  ArrowRight, CheckCircle, Leaf, BarChart3, Shield, Menu, X
} from 'lucide-react'

const LandingPage = ({ onGetStarted }) => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const features = [
    { 
      icon: <Cloud size={28} />, 
      title: 'Weather Intelligence', 
      desc: 'Real-time forecasts and farming alerts',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: <Sprout size={28} />, 
      title: 'Crop Management', 
      desc: 'AI-powered crop health monitoring',
      color: 'from-emerald-500 to-teal-500'
    },
    { 
      icon: <TrendingUp size={28} />, 
      title: 'Market Prices', 
      desc: 'Live mandi rates from AGMARKNET',
      color: 'from-orange-500 to-amber-500'
    },
    { 
      icon: <Lightbulb size={28} />, 
      title: 'Smart Tips', 
      desc: 'Expert farming recommendations',
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      icon: <BarChart3 size={28} />, 
      title: 'Analytics', 
      desc: 'Track yields and profits',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      icon: <Shield size={28} />, 
      title: 'Plant Doctor', 
      desc: 'AI disease detection',
      color: 'from-red-500 to-rose-500'
    }
  ]

  const stats = [
    { value: '50K+', label: 'Active Farmers' },
    { value: '100+', label: 'Mandis Covered' },
    { value: '95%', label: 'Accuracy Rate' },
    { value: '24/7', label: 'Support' }
  ]

  return (
    <div className="min-h-screen">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                <Leaf className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black text-white">FarmEase</span>
            </div>

            {/* Desktop: Login & Sign Up */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 bg-transparent border-2 border-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-500/10 transition-all"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile: hamburger */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white rounded-lg hover:bg-white/10 transition-all"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden px-6 pb-4 pt-2 border-t border-white/10">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  className="w-full px-5 py-2.5 bg-transparent border-2 border-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-500/10 transition-all text-center"
                >
                  Login
                </button>
                <button
                  onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  className="w-full px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all text-center"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-full mb-6">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-300 text-sm font-medium">Smart Agriculture Platform</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl font-black text-white leading-tight mb-6"
              >
                Farming Made
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Intelligent
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-white/70 mb-10 max-w-xl"
              >
                Empowering Indian farmers with AI-driven insights, real-time market data, 
                and smart crop management tools.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={onGetStarted}
                  className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3"
                >
                  Start Free
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                  Watch Demo
                </button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex items-center gap-6 mt-10"
              >
                {['No credit card', 'Free forever', 'Instant setup'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/60 text-sm">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all"
                >
                  <div className="text-4xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-white/50 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-black text-white mb-4">Everything You Need</h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Comprehensive tools to manage your farm from sowing to harvest
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/50">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-12 text-center"
            >
              <h2 className="text-4xl font-black text-white mb-4">
                Ready to Transform Your Farm?
              </h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                Join thousands of farmers who are using FarmEase to increase yields and maximize profits.
              </p>
              <button
                onClick={onGetStarted}
                className="px-10 py-4 bg-white text-emerald-600 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-xl"
              >
                Get Started Free
              </button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="text-emerald-400" size={20} />
              <span className="text-white/60 text-sm">© 2025 FarmEase. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-white/40 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
  )
}

export default LandingPage
