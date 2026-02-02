import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Users, Send, CheckCircle, MessageSquare, HelpCircle } from 'lucide-react'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true)
      setLoading(false)
      setFormData({ name: '', email: '', subject: '', message: '' })
    }, 1500)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const contactMethods = [
    { icon: <Mail className="text-emerald-400" size={24} />, title: 'Email Support', detail: 'support@farmease.com', sub: '24/7 technical help' },
    { icon: <Phone className="text-emerald-400" size={24} />, title: 'Phone Support', detail: '+91 1800-FARM-EASE', sub: 'Mon-Fri: 9AM - 6PM' },
    { icon: <MapPin className="text-emerald-400" size={24} />, title: 'Office Address', detail: 'Agri-Tech Center', sub: 'New Delhi, 110001' },
    { icon: <Users className="text-emerald-400" size={24} />, title: 'Community', detail: 'Kisan Charcha', sub: 'Peer support forum' },
  ]

  const faqs = [
    { q: 'How accurate is the weather data?', a: 'Sourced from Open-Meteo with 90%+ local accuracy.' },
    { q: 'Is the Plant Doctor free?', a: 'Yes, basic disease detection is free for all members.' },
    { q: 'How to update market prices?', a: 'Prices sync automatically every 6 hours from Govt mandis.' },
    { q: 'Can I add multiple farms?', a: 'Yes, premium members can manage up to 10 farm locations.' },
  ]

  if (submitted) {
    return (
      <div className="page-container flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center max-w-lg"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-400" size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gradient">Message Sent!</h2>
          <p className="text-white/60 mb-8">Thank you for reaching out. Our agricultural experts will review your query and respond within 24 hours.</p>
          <button
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
            onClick={() => setSubmitted(false)}
          >
            Send Another Message
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page-container custom-scrollbar">
      <header className="page-header">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="text-emerald-400" size={18} />
          <span className="text-[10px] text-white/40 font-black uppercase tracking-[3px]">Support Center</span>
        </div>
        <h1 className="text-gradient">Contact Us</h1>
        <p>Get in touch with our agricultural experts for support and guidance</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Contact Info Cards */}
        <div className="lg:col-span-1 space-y-4">
          {contactMethods.map((method, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex items-center gap-4 group hover:border-emerald-500/50"
            >
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {method.icon}
              </div>
              <div>
                <h3 className="font-bold text-white/90">{method.title}</h3>
                <p className="text-emerald-400 font-medium">{method.detail}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{method.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Message Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="text-emerald-400" size={24} />
            <h2 className="text-xl font-bold">Send us a Message</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white placeholder:text-white/20"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white placeholder:text-white/20"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Subject</label>
              <input
                type="text"
                name="subject"
                placeholder="What can we help you with?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white placeholder:text-white/20"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Message</label>
              <textarea
                name="message"
                placeholder="Describe your issue or question in detail..."
                rows="5"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white placeholder:text-white/20 resize-none"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:text-white/40 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-8">
          <HelpCircle className="text-emerald-400" size={24} />
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass-card p-6 border-l-4 border-l-emerald-500/50 hover:border-l-emerald-500 transition-all"
            >
              <h4 className="font-bold text-emerald-400 mb-2">{faq.q}</h4>
              <p className="text-sm text-white/60 leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Contact