import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import LocationDetector from './LocationDetector'
import { apiClient } from '../config'
import {
  Menu,
  X,
  Search,
  Mic,
  Bot,
  Loader2,
  Volume2,
  LogOut,
  LayoutDashboard,
  Sprout,
  Store,
  Leaf,
  Stethoscope,
  Users,
  Info,
  PhoneCall,
  ShieldCheck,
  Navigation,
  Lightbulb
} from 'lucide-react'

export default function Layout({ user, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [assistantMessages, setAssistantMessages] = useState([])

  const recognitionRef = useRef(null)
  const synthRef = useRef(null)
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { id: '/', icon: <LayoutDashboard size={20} />, labelKey: 'dashboard' },
    { id: '/farms', icon: <Sprout size={20} />, labelKey: 'myFarms' },
    { id: '/market', icon: <Store size={20} />, labelKey: 'market' },
    { id: '/doctor', icon: <Stethoscope size={20} />, labelKey: 'plantDoctor' },
    { id: '/crop-recommendation', icon: <Navigation size={20} />, labelKey: 'cropRecommendation' }
  ]

  const resourceItems = [
    { id: '/tips', icon: <Lightbulb size={18} />, labelKey: 'tips' },
    { id: '/charchas', icon: <Users size={18} />, labelKey: 'community' },
    { id: '/schemes', icon: <ShieldCheck size={18} />, labelKey: 'schemes' },
    { id: '/about', icon: <Info size={18} />, labelKey: 'aboutUs' },
    { id: '/contact', icon: <PhoneCall size={18} />, labelKey: 'contact' },
    { id: '/terms', icon: <ShieldCheck size={18} />, labelKey: 'terms' }
  ]

  useEffect(() => {
    setAssistantOpen(false)
    setSearchQuery('')
  }, [location.pathname])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const resolveSpeechLang = (langHint) => {
    if (langHint?.startsWith('hi')) return 'hi-IN'
    if (langHint?.startsWith('te')) return 'te-IN'
    if (i18n.language?.startsWith('hi')) return 'hi-IN'
    if (i18n.language?.startsWith('te')) return 'te-IN'
    return 'en-IN'
  }

  const detectPromptLanguage = (prompt = '') => {
    const text = String(prompt || '').trim().toLowerCase()
    if (!text) return i18n.language || 'en'

    // Native scripts
    if (/[\u0900-\u097f]/.test(text)) return 'hi'
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te'

    // Roman Hindi signals
    if (/(hindi|हिंदी|hindime|hindi me|mujhe|mera|kya|kaise|kripya|krishi|mandi|fasal|barish|mausam|dhanyavaad)/i.test(text)) {
      return 'hi'
    }

    // Roman Telugu signals
    if (/(telugu|తెలుగు|naku|naaku|meeru|ela|emiti|dhanyavadalu|pant|vyavasayam)/i.test(text)) {
      return 'te'
    }

    return i18n.language || 'en'
  }

  const speak = (text, langHint) => {
    if (!('speechSynthesis' in window) || !text) return

    if (synthRef.current) {
      window.speechSynthesis.cancel()
      synthRef.current = null
    }

    const langCode = resolveSpeechLang(langHint)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = langCode
    utterance.rate = 1
    synthRef.current = utterance

    setTimeout(() => window.speechSynthesis.speak(utterance), 250)
  }

  const assistantText = {
    en: {
      sorryNow: 'Sorry, I could not process that right now. Please try again.',
      authExpired: 'Your session expired. Please login again to continue.',
      noVoiceSupport: 'Voice input is not supported in this browser.',
      greet: 'I am your FarmEase assistant. Ask me about weather, crops, irrigation, disease risk, or mandi prices.',
      weatherLead: 'Current weather near your farm:',
      farmsLead: 'You currently have',
      noFarms: 'no registered fields.',
      oneFarm: '1 registered field.',
      manyFarms: 'registered fields.',
      marketBest: 'Top nearby mandi by latest signal is',
      marketMissing: 'Live mandi pricing is still syncing. You can open Market and press Sync Live Rates.',
      doctor: 'For disease checks, open Plant Doctor and upload a leaf image for diagnosis and next steps.',
      smartSummaryEmpty: 'To get personalized guidance, add your first field. Then I can suggest crop, irrigation, disease risk, and best market timing.',
      smartSummaryReady: 'Here is your smart plan: check weather risk first, monitor crop health, and compare nearby mandi prices before selling.',
      clarify: 'I can help with weather, crop choice, irrigation, mandi prices, plant disease, and farm planning. Ask in your own language.'
    },
    hi: {
      sorryNow: 'माफ़ कीजिए, अभी उत्तर नहीं दे पा रहा हूँ। कृपया दोबारा पूछें।',
      authExpired: 'आपका सेशन समाप्त हो गया है। कृपया फिर से लॉगिन करें।',
      noVoiceSupport: 'इस ब्राउज़र में वॉयस इनपुट उपलब्ध नहीं है।',
      greet: 'मैं आपका FarmEase सहायक हूँ। मौसम, फसल, सिंचाई, रोग जोखिम और मंडी भाव के बारे में पूछें।',
      weatherLead: 'आपके क्षेत्र में वर्तमान मौसम:',
      farmsLead: 'आपके पास अभी',
      noFarms: 'कोई पंजीकृत खेत नहीं है।',
      oneFarm: '1 पंजीकृत खेत है।',
      manyFarms: 'पंजीकृत खेत हैं।',
      marketBest: 'ताज़ा संकेत के आधार पर पास की टॉप मंडी है',
      marketMissing: 'लाइव मंडी कीमतें अभी सिंक हो रही हैं। मार्केट खोलकर Sync Live Rates दबाएं।',
      doctor: 'रोग जांच के लिए Plant Doctor खोलें और पत्ते की फोटो अपलोड करें।',
      smartSummaryEmpty: 'व्यक्तिगत सलाह के लिए पहले अपना पहला खेत जोड़ें। उसके बाद मैं फसल, सिंचाई, रोग जोखिम और सही मंडी समय बता सकता हूँ।',
      smartSummaryReady: 'आपके लिए स्मार्ट प्लान: पहले मौसम जोखिम देखें, फसल स्वास्थ्य मॉनिटर करें, और बेचने से पहले पास की मंडियों के भाव तुलना करें।',
      clarify: 'मैं मौसम, फसल चयन, सिंचाई, मंडी भाव, पौधा रोग और खेत योजना में मदद कर सकता हूँ। आप अपनी भाषा में पूछें।'
    },
    te: {
      sorryNow: 'క్షమించండి, ప్రస్తుతం సమాధానం ఇవ్వలేకపోతున్నాను. దయచేసి మళ్లీ అడగండి.',
      authExpired: 'మీ సెషన్ ముగిసింది. దయచేసి మళ్లీ లాగిన్ అవ్వండి.',
      noVoiceSupport: 'ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ అందుబాటులో లేదు.',
      greet: 'నేను మీ FarmEase సహాయకుడిని. వాతావరణం, పంటలు, నీటిపారుదల, వ్యాధి ప్రమాదం, మార్కెట్ ధరలు గురించి అడగండి.',
      weatherLead: 'మీ ప్రాంతంలో ప్రస్తుత వాతావరణం:',
      farmsLead: 'మీ వద్ద ప్రస్తుతం',
      noFarms: 'నమోదైన పొలాలు లేవు.',
      oneFarm: '1 నమోదైన పొలం ఉంది.',
      manyFarms: 'నమోదైన పొలాలు ఉన్నాయి.',
      marketBest: 'తాజా సంకేతం ప్రకారం దగ్గరలోని టాప్ మార్కెట్',
      marketMissing: 'లైవ్ మార్కెట్ ధరలు ఇంకా సింక్ అవుతున్నాయి. మార్కెట్ ఓపెన్ చేసి Sync Live Rates నొక్కండి.',
      doctor: 'వ్యాధి పరీక్ష కోసం Plant Doctor ఓపెన్ చేసి ఆకుల ఫోటో అప్లోడ్ చేయండి.',
      smartSummaryEmpty: 'వ్యక్తిగత సూచనల కోసం ముందుగా మీ మొదటి పొలం జోడించండి. ఆ తర్వాత పంట, నీటిపారుదల, వ్యాధి ప్రమాదం, అమ్మకాల సమయం చెప్పగలను.',
      smartSummaryReady: 'మీ కోసం స్మార్ట్ ప్లాన్: ముందుగా వాతావరణ ప్రమాదం చూడండి, పంట ఆరోగ్యం పరిశీలించండి, అమ్మే ముందు సమీప మార్కెట్ ధరలు పోల్చండి.',
      clarify: 'వాతావరణం, పంట ఎంపిక, నీటిపారుదల, మార్కెట్ ధరలు, మొక్కల వ్యాధి, ఫారం ప్లానింగ్‌లో నేను సహాయం చేస్తాను.'
    }
  }

  const getAssistantCopy = () => {
    const lang = i18n.language?.startsWith('hi') ? 'hi' : i18n.language?.startsWith('te') ? 'te' : 'en'
    return assistantText[lang]
  }

  const buildLocalAssistantReply = async (prompt, langHint) => {
    const forcedLang = langHint?.startsWith('hi') ? 'hi' : langHint?.startsWith('te') ? 'te' : 'en'
    const previous = i18n.language || 'en'
    if (previous !== forcedLang) {
      await i18n.changeLanguage(forcedLang)
    }
    const copy = getAssistantCopy()
    const text = String(prompt || '').toLowerCase()
    const overview = await apiClient.get('/dashboard/overview', { lang: forcedLang }).catch(() => null)

    if (/(hello|hi|namaste|hey|నమస్కారం|नमस्ते)/i.test(prompt)) {
      return { text: copy.greet, action: null }
    }

    if (/(weather|बारिश|मौसम|వాతావరణం|rain|temperature|temp)/i.test(text)) {
      const weather = overview?.weather
      if (weather) {
        return {
          text: `${copy.weatherLead} ${weather.temperature}°C, humidity ${weather.humidity}%, wind ${weather.windSpeed} km/h.`,
          action: null
        }
      }
      return { text: copy.sorryNow, action: null }
    }

    if (/(farm|field|खेत|పొలం|my crop|my field)/i.test(text)) {
      const total = Number(overview?.metrics?.totalFarms || 0)
      const farmsText = total === 0 ? copy.noFarms : total === 1 ? copy.oneFarm : `${total} ${copy.manyFarms}`
      return {
        text: `${copy.farmsLead} ${farmsText}`,
        action: { label: i18n.language?.startsWith('hi') ? 'मेरे खेत खोलें' : i18n.language?.startsWith('te') ? 'నా పొలాలు తెరవండి' : 'Open My Fields', route: '/farms' }
      }
    }

    if (/(market|mandi|price|sell|बाज़ार|मंडी|మార్కెట్|ధర)/i.test(text)) {
      const top = overview?.trendingCrops?.[0]
      if (top?.commodity && Number(top.modal_price || 0) > 0) {
        return {
          text: `${copy.marketBest} ${top.commodity} (₹${Number(top.modal_price).toLocaleString('en-IN')}).`,
          action: { label: i18n.language?.startsWith('hi') ? 'मार्केट खोलें' : i18n.language?.startsWith('te') ? 'మార్కెట్ తెరవండి' : 'Open Market', route: '/market' }
        }
      }
      return {
        text: copy.marketMissing,
        action: { label: i18n.language?.startsWith('hi') ? 'मार्केट खोलें' : i18n.language?.startsWith('te') ? 'మార్కెట్ తెరవండి' : 'Open Market', route: '/market' }
      }
    }

    if (/(disease|doctor|plant|रोग|डॉक्टर|వ్యాధి|డాక్టర్)/i.test(text)) {
      return {
        text: copy.doctor,
        action: { label: i18n.language?.startsWith('hi') ? 'प्लांट डॉक्टर खोलें' : i18n.language?.startsWith('te') ? 'ప్లాంట్ డాక్టర్ తెరవండి' : 'Open Plant Doctor', route: '/doctor' }
      }
    }

    const totalFarms = Number(overview?.metrics?.totalFarms || 0)
    const alerts = Array.isArray(overview?.alerts) ? overview.alerts.length : 0
    const topAction = overview?.todayActions?.[0]

    if (totalFarms === 0) {
      return {
        text: `${copy.smartSummaryEmpty}${topAction?.title ? ` ${topAction.title}` : ''}`,
        action: { label: i18n.language?.startsWith('hi') ? 'मेरे खेत खोलें' : i18n.language?.startsWith('te') ? 'నా పొలాలు తెరవండి' : 'Open My Fields', route: '/farms' }
      }
    }

    if (alerts > 0 || topAction) {
      const detail = topAction?.detail ? ` ${topAction.detail}` : ''
      return {
        text: `${copy.smartSummaryReady}${detail}`,
        action: topAction?.route
          ? { label: topAction.cta || (i18n.language?.startsWith('hi') ? 'खोलें' : i18n.language?.startsWith('te') ? 'తెరవండి' : 'Open'), route: topAction.route }
          : null
      }
    }

    return { text: copy.clarify, action: null }
  }

  const sendToAssistant = async (prompt) => {
    if (!prompt || assistantLoading) return

    const promptLang = detectPromptLanguage(prompt)
    const text = String(prompt || '').toLowerCase()

    if (/(speak in hindi|reply in hindi|hindi me bolo|hindi mein bolo|hindi me baat|hindi mein baat)/i.test(text)) {
      await i18n.changeLanguage('hi')
      const confirmHi = 'ठीक है, अब मैं हिंदी में जवाब दूँगा। आप पूछें।'
      setAssistantMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text: confirmHi, action: null }])
      speak(confirmHi, 'hi')
      return
    }

    if (/(speak in telugu|reply in telugu|telugu lo matlaadu|telugu lo cheppu|telugu lo)/i.test(text)) {
      await i18n.changeLanguage('te')
      const confirmTe = 'సరే, ఇకపై నేను తెలుగులో సమాధానం ఇస్తాను. అడగండి.'
      setAssistantMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text: confirmTe, action: null }])
      speak(confirmTe, 'te')
      return
    }

    if (/(speak in english|reply in english)/i.test(text)) {
      await i18n.changeLanguage('en')
      const confirmEn = 'Sure, I will reply in English now.'
      setAssistantMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text: confirmEn, action: null }])
      speak(confirmEn, 'en')
      return
    }

    if ((i18n.language || 'en') !== promptLang) {
      await i18n.changeLanguage(promptLang)
    }

    const userMessage = { id: Date.now(), role: 'user', text: prompt }
    setAssistantMessages(prev => [...prev, userMessage])
    setAssistantLoading(true)
    setAssistantOpen(true)

    try {
      const response = await apiClient.post('/assistant/chat', {
        message: prompt,
        lang: promptLang
      })

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: response.reply,
        action: response.action || null
      }

      setAssistantMessages(prev => [...prev, assistantMessage])
      speak(response.reply, response.lang || promptLang)
    } catch (error) {
      const copy = getAssistantCopy()
      if (error?.status === 401 || error?.status === 403) {
        setAssistantMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: copy.authExpired, action: null }])
        speak(copy.authExpired, promptLang)
      } else {
        const local = await buildLocalAssistantReply(prompt, promptLang).catch(() => ({ text: copy.sorryNow, action: null }))
        setAssistantMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: local.text, action: local.action }])
        speak(local.text, promptLang)
      }
    } finally {
      setAssistantLoading(false)
    }
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    const prompt = searchQuery.trim()
    if (!prompt) return
    setSearchQuery('')
    await sendToAssistant(prompt)
  }

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      const copy = getAssistantCopy()
      setAssistantOpen(true)
      setAssistantMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text: copy.noVoiceSupport, action: null }])
      return
    }
    if (assistantLoading) return

    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.interimResults = false
    recognition.continuous = false
    recognition.lang = i18n.language?.startsWith('hi')
      ? 'hi-IN'
      : i18n.language?.startsWith('te')
        ? 'te-IN'
        : 'en-IN'

    setIsListening(true)
    setAssistantOpen(true)

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || ''
      setIsListening(false)
      if (!transcript) return
      setSearchQuery(transcript)
      sendToAssistant(transcript)
      setSearchQuery('')
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    setIsListening(false)
  }

  return (
    <div className="flex h-screen overflow-hidden font-inter">
      <div className="md:hidden fixed top-0 left-0 right-0 bg-black/35 backdrop-blur-[6px] text-white p-4 flex items-center justify-between z-50 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Leaf className="text-white" size={18} />
          </div>
          <span className="font-black text-xl tracking-tight">FarmEase</span>
        </div>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <Menu size={24} />
        </button>
      </div>

      <aside className={`
        fixed md:relative top-0 left-0 h-full transition-all duration-300 z-40
        ${sidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-72'}
        flex flex-col
        bg-gradient-to-b from-[#0f3d2ed4] to-[#09251cd4] backdrop-blur-[6px] border-r border-white/10
        shadow-[inset_0_0_60px_rgba(0,0,0,0.25)]
      `}>
        <div className="p-6 flex items-center justify-between border-b border-white/10 hidden md:flex">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Leaf className="text-white" size={22} />
            </div>
            {!sidebarCollapsed && (
              <span className="font-black text-xl tracking-tight text-white">FarmEase</span>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all"
          >
            {sidebarCollapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        <div className="md:hidden p-6 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
              <Leaf className="text-white" size={18} />
            </div>
            <span className="font-black text-lg text-white">FarmEase</span>
          </div>
          <button onClick={() => setSidebarCollapsed(true)} className="p-2 hover:bg-white/10 rounded-xl text-white/70 transition-colors">
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.id)
                  if (window.innerWidth < 768) setSidebarCollapsed(true)
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative text-left group
                  ${isActive
                    ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'}
                `}
                title={t(item.labelKey)}
              >
                <span className={`transition-colors ${isActive ? 'text-emerald-400' : 'text-white/50 group-hover:text-white'}`}>
                  {item.icon}
                </span>
                {(!sidebarCollapsed || window.innerWidth < 768) && (
                  <span className="whitespace-nowrap font-semibold text-sm">{t(item.labelKey)}</span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-r-full"
                  />
                )}
              </button>
            )
          })}

          {(!sidebarCollapsed || window.innerWidth < 768) && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">{t('resources')}</p>
              <div className="space-y-1">
                {resourceItems.map((item) => {
                  const isActive = location.pathname === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.id)
                        if (window.innerWidth < 768) setSidebarCollapsed(true)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left ${isActive ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white hover:bg-white/8'}`}
                    >
                      {item.icon}
                      <span className="text-xs font-semibold">{t(item.labelKey)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <div className={`${sidebarCollapsed && window.innerWidth >= 768 ? 'hidden' : 'block'}`}>
            <LocationDetector />
          </div>

          {(!sidebarCollapsed || window.innerWidth < 768) && (
            <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
              {['en', 'hi', 'te'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={`
                    flex-1 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest
                    ${i18n.language === lang
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                      : 'text-white/40 hover:text-white hover:bg-white/10'}
                  `}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0 bg-black/35">
        <header className="hidden md:flex bg-black/35 backdrop-blur-[6px] h-20 items-center justify-between px-8 z-10 border-b border-white/10">
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <form
              className="flex items-center gap-3 w-full"
              onSubmit={handleSearchSubmit}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 rounded-xl bg-black/30 border border-white/10 px-3 py-2 focus-within:border-emerald-400/35 focus-within:bg-black/40 transition-all">
                <Search className="text-white/45 shrink-0" size={18} />
                <input
                  type="text"
                  placeholder={t('askAssistantPlaceholder') || t('searchPlaceholder')}
                  className="flex-1 min-w-0 bg-transparent text-white placeholder-white/45 text-base font-medium outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all shrink-0 ${
                  isListening
                    ? 'text-emerald-100 border-emerald-400/45 bg-emerald-500/18'
                    : 'text-white/85 border-white/16 bg-white/5 hover:border-white/28 hover:bg-white/10'
                }`}
                title={t('voiceSearch')}
              >
                <Mic size={14} className={isListening ? 'animate-pulse' : ''} />
                {isListening ? t('listening') : (t('voiceSearch') || 'Voice')}
              </button>
            </form>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-tight">{user?.name || 'Farmer'}</p>
                <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-widest">{t('premiumMember')}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/30 ring-2 ring-white/20">
                {user?.name?.charAt(0) || 'F'}
              </div>
              <button
                onClick={onLogout}
                className="p-2.5 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                title={t('logout')}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet context={{ user }} />
            </motion.div>
          </AnimatePresence>
        </main>

        {assistantOpen && (
          <div className="fixed right-8 top-24 w-[430px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[rgba(6,18,12,0.92)] backdrop-blur-[12px] shadow-2xl z-40 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Bot size={16} className="text-emerald-400" />
                <p className="text-sm font-bold">{t('aiAssistantTitle') || 'AI Assistant'}</p>
                {isListening && <span className="text-[11px] text-emerald-300">{t('listening') || 'Listening...'}</span>}
              </div>
              <button className="text-white/50 hover:text-white" onClick={() => setAssistantOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-3 space-y-2">
              {assistantMessages.length === 0 && (
                <div className="text-xs text-white/60 px-2 py-1">
                  {t('assistantHint') || 'Ask anything about crop, weather, mandi, disease, irrigation.'}
                </div>
              )}
              {assistantMessages.map((msg) => (
                <div key={msg.id} className={`rounded-xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-emerald-500/15 text-emerald-100 ml-10' : 'bg-white/8 text-white mr-10'}`}>
                  <p>{msg.text}</p>
                  {msg.role === 'assistant' && msg.action ? (
                    <button
                      type="button"
                      onClick={() => navigate(msg.action.route)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200"
                    >
                      <Navigation size={12} />
                      {msg.action.label}
                    </button>
                  ) : null}
                </div>
              ))}
              {assistantLoading && (
                <div className="rounded-xl px-3 py-2 text-sm bg-white/8 text-white mr-10 inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  {t('thinking') || 'Thinking...'}
                </div>
              )}
            </div>
            <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-white/45">{t('assistantVoiceNote') || 'Voice reply enabled'}</span>
              <Volume2 size={14} className="text-white/40" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
