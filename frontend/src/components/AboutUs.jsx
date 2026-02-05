

import { motion } from 'framer-motion'
import { Leaf, CloudSun, Microscope, TrendingUp, Users, Award, Target, Zap } from 'lucide-react'

const AboutUs = () => {
  return (
    <div className="page-container custom-scrollbar max-w-6xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="text-emerald-400" size={18} />
          <span className="text-[10px] text-white/40 font-black uppercase tracking-[3px]">Our Story</span>
        </div>
        <h1>About FarmEase</h1>
        <p className="text-white/70 text-lg mt-3">Empowering farmers with technology and knowledge</p>
      </div>

      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          <h2 className="text-2xl font-bold text-white/90 mb-4 flex items-center gap-3">
            <Target className="text-emerald-400" size={24} />
            Our Mission
          </h2>
          <p className="text-white/70 leading-relaxed text-lg">
            FarmEase is dedicated to revolutionizing agriculture through technology.
            We provide farmers with intelligent tools, real-time data, and expert
            guidance to maximize crop yields and ensure sustainable farming practices.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8"
        >
          <h2 className="text-2xl font-bold text-white/90 mb-6 flex items-center gap-3">
            <Zap className="text-emerald-400" size={24} />
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CloudSun className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white/90 mb-2">Weather Intelligence</h3>
              <p className="text-white/60 text-sm leading-relaxed">Real-time weather data and forecasts tailored for agricultural needs</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Microscope className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white/90 mb-2">Plant Disease Detection</h3>
              <p className="text-white/60 text-sm leading-relaxed">AI-powered disease diagnosis with treatment recommendations</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white/90 mb-2">Market Insights</h3>
              <p className="text-white/60 text-sm leading-relaxed">Live market prices and trends to optimize selling decisions</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white/90 mb-2">Community Support</h3>
              <p className="text-white/60 text-sm leading-relaxed">Connect with fellow farmers and agricultural experts</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8"
        >
          <h2 className="text-2xl font-bold text-white/90 mb-6 flex items-center gap-3">
            <Award className="text-emerald-400" size={24} />
            Our Impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="text-4xl font-black text-emerald-400 mb-2">10,000+</div>
              <div className="text-white/60 text-sm font-semibold uppercase tracking-wider">Farmers Served</div>
            </div>
            <div className="text-center p-6 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="text-4xl font-black text-emerald-400 mb-2">25%</div>
              <div className="text-white/60 text-sm font-semibold uppercase tracking-wider">Average Yield Increase</div>
            </div>
            <div className="text-center p-6 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="text-4xl font-black text-emerald-400 mb-2">50+</div>
              <div className="text-white/60 text-sm font-semibold uppercase tracking-wider">Crop Varieties Supported</div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8"
        >
          <h2 className="text-2xl font-bold text-white/90 mb-4">Technology Stack</h2>
          <p className="text-white/70 leading-relaxed text-lg">
            Built with modern web technologies including React, Node.js, and machine learning
            models to provide reliable, fast, and accurate agricultural insights.
          </p>
        </motion.section>
      </div>
    </div>
  )
}

export default AboutUs