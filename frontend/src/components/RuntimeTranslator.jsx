import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const PHRASE_MAP = {
  hi: {
    'Dashboard': 'डैशबोर्ड',
    'My Farms': 'मेरे खेत',
    'Market': 'बाज़ार',
    'Plant Doctor': 'पौधे डॉक्टर',
    'Crop Recommendation': 'फसल सिफारिश',
    'Tips': 'सुझाव',
    'Community': 'समुदाय',
    'Schemes': 'योजनाएं',
    'About Us': 'हमारे बारे में',
    'Contact': 'संपर्क',
    'Terms': 'नियम',
    'Resources': 'संसाधन',
    'Login': 'लॉग इन',
    'Register': 'पंजीकरण',
    'Sign In': 'साइन इन',
    'Create Account': 'खाता बनाएं',
    'Email Address': 'ईमेल पता',
    'Password': 'पासवर्ड',
    'Full Name': 'पूरा नाम',
    'Mandi Prices': 'मंडी कीमतें',
    'Sync Live Rates': 'लाइव रेट सिंक करें',
    'View Rates': 'रेट देखें',
    'Directions': 'दिशा-निर्देश',
    'Location Required': 'स्थान आवश्यक',
    'Enable Location': 'लोकेशन चालू करें',
    'Recent Alerts': 'हाल के अलर्ट',
    'Market Trends': 'बाज़ार रुझान',
    'Weather Status': 'मौसम स्थिति',
    'Crop Advice': 'फसल सलाह',
    'Irrigation Advice': 'सिंचाई सलाह',
    'Get Recommendation': 'सिफारिश प्राप्त करें',
    'Start AI Analysis': 'AI विश्लेषण शुरू करें',
    'Upload Plant Photo': 'पौधे की फोटो अपलोड करें'
  },
  te: {
    'Dashboard': 'డాష్‌బోర్డ్',
    'My Farms': 'నా పొలాలు',
    'Market': 'మార్కెట్',
    'Plant Doctor': 'మొక్కల డాక్టర్',
    'Crop Recommendation': 'పంట సిఫార్సు',
    'Tips': 'చిట్కాలు',
    'Community': 'సంఘం',
    'Schemes': 'పథకాలు',
    'About Us': 'మా గురించి',
    'Contact': 'సంప్రదించండి',
    'Terms': 'నిబంధనలు',
    'Resources': 'వనరులు',
    'Login': 'లాగిన్',
    'Register': 'నమోదు',
    'Sign In': 'సైన్ ఇన్',
    'Create Account': 'ఖాతా సృష్టించండి',
    'Email Address': 'ఇమెయిల్ చిరునామా',
    'Password': 'పాస్‌వర్డ్',
    'Full Name': 'పూర్తి పేరు',
    'Mandi Prices': 'మండి ధరలు',
    'Sync Live Rates': 'లైవ్ రేట్లు సింక్ చేయండి',
    'View Rates': 'రేట్లు చూడండి',
    'Directions': 'దిశలు',
    'Location Required': 'స్థానం అవసరం',
    'Enable Location': 'లోకేషన్ ప్రారంభించండి',
    'Recent Alerts': 'ఇటీవలి అలర్ట్స్',
    'Market Trends': 'మార్కెట్ ధోరణులు',
    'Weather Status': 'వాతావరణ స్థితి',
    'Crop Advice': 'పంట సలహా',
    'Irrigation Advice': 'పారుదల సలహా',
    'Get Recommendation': 'సిఫార్సు పొందండి',
    'Start AI Analysis': 'AI విశ్లేషణ ప్రారంభించండి',
    'Upload Plant Photo': 'మొక్క ఫోటో అప్లోడ్ చేయండి'
  }
}

const translateTree = (root, map) => {
  if (!root || !map) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)

  nodes.forEach((node) => {
    const original = node.nodeValue
    if (!original) return
    const trimmed = original.trim()
    if (!trimmed) return
    const translated = map[trimmed]
    if (!translated) return

    const leading = original.match(/^\s*/)?.[0] || ''
    const trailing = original.match(/\s*$/)?.[0] || ''
    node.nodeValue = `${leading}${translated}${trailing}`
  })
}

export default function RuntimeTranslator() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const lang = (i18n.language || 'en').split('-')[0]
    document.documentElement.lang = lang

    const map = PHRASE_MAP[lang]
    if (!map) return

    const apply = () => translateTree(document.body, map)
    apply()

    const observer = new MutationObserver(() => {
      requestAnimationFrame(apply)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    })

    return () => observer.disconnect()
  }, [i18n.language])

  return null
}
