import { motion } from 'framer-motion'
import { FileText, ShieldCheck, Scale, Database, Gavel, Calendar, Users, Info, ShieldAlert } from 'lucide-react'

const TermsOfService = () => {
  const sections = [
    {
      icon: <FileText className="text-emerald-400" size={20} />,
      title: '1. Acceptance of Terms',
      content: 'By accessing and using FarmEase, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'
    },
    {
      icon: <ShieldCheck className="text-emerald-400" size={20} />,
      title: '2. Service Description',
      content: 'FarmEase provides agricultural technology services including weather forecasting, plant disease detection, market trends, farm management tools, and community forums. These tools are provided "as-is" for informational purposes.'
    },
    {
      icon: <Users className="text-emerald-400" size={20} />,
      title: '3. User Responsibilities',
      content: 'Users agree to provide accurate information, use the service for lawful agricultural purposes only, respect other users in community interactions, and keep login credentials secure.'
    },
    {
      icon: <Database className="text-emerald-400" size={20} />,
      title: '4. Data and Privacy',
      content: 'We process farm location and crop data to provide personalized insights. We do not sell personal data. Uploaded images for disease diagnosis are processed securely for service improvement.'
    },
    {
      icon: <ShieldAlert className="text-emerald-400" size={20} />,
      title: '5. Disclaimer of Warranties',
      content: 'FarmEase provides information and tools "as is" without warranty of any kind. Agricultural decisions should consider multiple factors and local expertise. We are not liable for crop losses.'
    },
    {
      icon: <Scale className="text-emerald-400" size={20} />,
      title: '6. Limitation of Liability',
      content: 'FarmEase shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from the use of our recommendations or automated insights.'
    },
    {
      icon: <Gavel className="text-emerald-400" size={20} />,
      title: '7. Intellectual Property',
      content: 'All algorithms, content, and the FarmEase identity are the exclusive property of FarmEase and its licensors. Unauthorized reproduction is strictly prohibited.'
    }
  ]

  return (
    <div className="page-container custom-scrollbar max-w-5xl mx-auto">
      {/* Header Section */}
      <header className="page-header">
        <div className="flex items-center gap-2 mb-2">
          <Info className="text-emerald-400" size={18} />
          <span className="text-[10px] text-white/40 font-black uppercase tracking-[3px]">Legal Framework</span>
        </div>
        <h1>Terms of Service</h1>
        <div className="flex items-center gap-2 text-white/40 text-sm mt-2">
          <Calendar size={14} />
          <span>Last Updated: December 26, 2024</span>
        </div>
      </header>

      {/* Content List */}
      <div className="space-y-6 mb-12">
        {sections.map((section, i) => (
          <motion.section
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 group hover:bg-white/[0.07] transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {section.icon}
              </div>
              <h2 className="text-xl font-bold text-white/90">{section.title}</h2>
            </div>
            <p className="text-white/60 leading-relaxed pl-14">
              {section.content}
            </p>
          </motion.section>
        ))}
      </div>

      {/* Acceptance Banner */}
      <div className="glass-card p-8 border-l-4 border-l-emerald-500 bg-emerald-500/5 mb-12">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="text-emerald-400" size={24} />
          </div>
          <p className="text-white/80 leading-relaxed text-lg font-medium">
            By continuing to use FarmEase, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service designed to protect both the farmer and the platform.
          </p>
        </div>
      </div>

      {/* Contact Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Legal Support', val: 'legal@farmease.com' },
          { label: 'Helpline', val: '+91 1800-FARM-EASE' },
          { label: 'Jurisdiction', val: 'New Delhi, India' },
        ].map((item, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">{item.label}</div>
            <div className="text-sm font-semibold text-emerald-400">{item.val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TermsOfService