import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        debug: true,
        interpolation: {
            escapeValue: false,
        },
        resources: {
            en: {
                translation: {
                    dashboard: 'Dashboard',
                    myFarms: 'My Farms',
                    weather: 'Weather',
                    market: 'Market',
                    tips: 'Tips',
                    welcome: 'Welcome back',
                    logout: 'Logout',
                    weatherToday: 'Weather Today',
                    cropSuggestions: 'AI Crop Suggestions',
                    marketPrices: 'Market Prices',
                    recentActivity: 'Recent Activity',
                    searchPlaceholder: 'Search farms, crops, markets...',
                    voiceSearch: 'Voice Search',
                    location: 'Location',
                    advanced: 'Advanced',
                    plantDoctor: 'Plant Doctor',
                    community: 'Community',
                    schemes: 'Schemes',
                    aboutUs: 'About Us',
                    contact: 'Contact',
                    terms: 'Terms',
                    getStarted: 'Get Started',
                    login: 'Login',
                    register: 'Register'
                }
            },
            hi: {
                translation: {
                    dashboard: 'डैशबोर्ड',
                    myFarms: 'मेरे खेत',
                    weather: 'मौसम',
                    market: 'बाज़ार',
                    tips: 'सुझाव',
                    welcome: 'वापसी पर स्वागत',
                    logout: 'लॉग आउट',
                    weatherToday: 'आज का मौसम',
                    cropSuggestions: 'AI फसल सुझाव',
                    marketPrices: 'बाज़ार दर',
                    recentActivity: 'हाल की गतिविधि',
                    searchPlaceholder: 'खेत, फसल, बाज़ार खोजें...',
                    voiceSearch: 'वॉयस सर्च',
                    location: 'स्थान',
                    advanced: 'उन्नत',
                    plantDoctor: 'पौधे डॉक्टर',
                    community: 'समुदाय',
                    schemes: 'योजनाएं',
                    aboutUs: 'हमारे बारे में',
                    contact: 'संपर्क',
                    terms: 'नियम',
                    getStarted: 'शुरू करें',
                    login: 'लॉग इन',
                    register: 'पंजीकरण'
                }
            },
            te: {
                translation: {
                    dashboard: 'డాష్‌బోర్డ్',
                    myFarms: 'నా పొలాలు',
                    weather: 'వాతావరణం',
                    market: 'మార్కెట్',
                    tips: 'చిట్కాలు',
                    welcome: 'తిరిగి స్వాగతం',
                    logout: 'లాగ్ అవుట్',
                    weatherToday: 'నేటి వాతావరణం',
                    cropSuggestions: 'AI పంట సూచనలు',
                    marketPrices: 'మార్కెట్ ధరలు',
                    recentActivity: 'ఇటీవలి కార్యకలాపాలు',
                    searchPlaceholder: 'పొలాలు, పంటలు, మార్కెట్లను శోధించండి...',
                    voiceSearch: 'వాయిస్ శోధన',
                    location: 'స్థానం',
                    advanced: 'అధునాతన',
                    plantDoctor: 'మొక్కల డాక్టర్',
                    community: 'సంఘం',
                    schemes: 'పథకాలు',
                    aboutUs: 'మా గురించి',
                    contact: 'సంప్రదించండి',
                    terms: 'నిబంధనలు',
                    getStarted: 'ప్రారంభించండి',
                    login: 'లాగిన్',
                    register: 'నమోదు'
                }
            }
        }
    });

export default i18n;
