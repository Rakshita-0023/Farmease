import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import LocationDetector from './LocationDetector'
import { Menu, X, Search, Mic, LogOut, User } from 'lucide-react'

export default function Layout({ user, onLogout, userLocation, setUserLocation }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isListening, setIsListening] = useState(false)
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()

    const navItems = [
        { id: '/', icon: '', label: t('dashboard') },
        { id: '/farms', icon: '', label: t('myFarms') },
        { id: '/weather', icon: '', label: t('weather') },
        { id: '/market', icon: '', label: t('market') },
        { id: '/tips', icon: '', label: t('tips') },
        { id: '/advanced', icon: '', label: t('advanced') },
        { id: '/doctor', icon: '', label: t('plantDoctor') },
        { id: '/community', icon: '', label: t('community') },
        { id: '/schemes', icon: '', label: t('schemes') },
        { id: '/about', icon: '', label: t('aboutUs') },
        { id: '/contact', icon: '', label: t('contact') },
        { id: '/terms', icon: '', label: t('terms') }
    ]

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Mobile Header */}
            <div className="md:hidden bg-green-900 text-white p-4 flex items-center justify-between shadow-md z-30">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    <span className="font-bold text-xl tracking-tight">FarmEase</span>
                </div>
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-green-800 rounded">
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed md:relative top-0 left-0 h-full bg-green-900 text-white transition-all duration-300 z-40
                ${sidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'}
                flex flex-col shadow-xl
            `}>
                <div className="p-4 flex items-center justify-between border-b border-green-800 hidden md:flex">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-2xl">🌱</span>
                        {!sidebarCollapsed && <span className="font-bold text-xl tracking-tight">FarmEase</span>}
                    </div>
                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1 hover:bg-green-800 rounded text-white">
                        {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
                    </button>
                </div>

                {/* Mobile Close Button */}
                <div className="md:hidden p-4 flex justify-end border-b border-green-800">
                    <button onClick={() => setSidebarCollapsed(true)} className="p-2 hover:bg-green-800 rounded text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                navigate(item.id)
                                if (window.innerWidth < 768) setSidebarCollapsed(true)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-green-800 transition-colors relative text-left ${location.pathname === item.id ? 'bg-green-800 border-r-4 border-yellow-400' : ''}`}
                            title={item.label}
                        >
                            <span className="text-xl">{item.icon}</span>
                            {(!sidebarCollapsed || window.innerWidth < 768) && <span className="whitespace-nowrap font-medium text-sm">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-green-800">
                    {/* Location Detector Wrapper */}
                    <div className={`${sidebarCollapsed && window.innerWidth >= 768 ? 'hidden' : 'block'}`}>
                        <LocationDetector onLocationDetected={setUserLocation} />
                    </div>

                    {(!sidebarCollapsed || window.innerWidth < 768) && <div className="mt-4 flex gap-2 justify-center">
                        <button onClick={() => i18n.changeLanguage('en')} className={`px-2 py-1 text-xs rounded transition-colors ${i18n.language === 'en' ? 'bg-yellow-400 text-green-900 font-bold' : 'bg-green-800 text-white hover:bg-green-700'}`}>EN</button>
                        <button onClick={() => i18n.changeLanguage('hi')} className={`px-2 py-1 text-xs rounded transition-colors ${i18n.language === 'hi' ? 'bg-yellow-400 text-green-900 font-bold' : 'bg-green-800 text-white hover:bg-green-700'}`}>HI</button>
                        <button onClick={() => i18n.changeLanguage('te')} className={`px-2 py-1 text-xs rounded transition-colors ${i18n.language === 'te' ? 'bg-yellow-400 text-green-900 font-bold' : 'bg-green-800 text-white hover:bg-green-700'}`}>TE</button>
                    </div>}
                </div>
            </aside>

            {/* Overlay for mobile */}
            {!sidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarCollapsed(true)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4 flex-1 max-w-xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('searchPlaceholder')}
                                className="w-full pl-10 pr-10 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-600">
                                <Mic size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                                {user?.name?.charAt(0) || 'F'}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-medium text-gray-700">{user?.name || 'Farmer'}</p>
                            </div>
                            <button onClick={onLogout} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors" title={t('logout')}>
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-gray-50 scroll-smooth">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <Outlet context={{ user, userLocation }} />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}
