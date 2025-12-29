import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import LocationDetector from './LocationDetector'
import {
    Menu,
    X,
    Search,
    Mic,
    LogOut,
    LayoutDashboard,
    Sprout,
    CloudSun,
    Store,
    Lightbulb,
    Zap,
    Stethoscope,
    Users,
    FileText,
    Info,
    PhoneCall,
    ShieldCheck
} from 'lucide-react'

export default function Layout({ user, onLogout, userLocation, setUserLocation }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()

    const navItems = [
        { id: '/', icon: <LayoutDashboard size={20} />, label: t('dashboard') },
        { id: '/farms', icon: <Sprout size={20} />, label: t('myFarms') },
        { id: '/weather', icon: <CloudSun size={20} />, label: t('weather') },
        { id: '/market', icon: <Store size={20} />, label: t('market') },
        { id: '/tips', icon: <Lightbulb size={20} />, label: t('tips') },
        { id: '/advanced', icon: <Zap size={20} />, label: t('advanced') },
        { id: '/doctor', icon: <Stethoscope size={20} />, label: t('plantDoctor') },
        { id: '/community', icon: <Users size={20} />, label: t('community') },
        { id: '/schemes', icon: <FileText size={20} />, label: t('schemes') },
        { id: '/about', icon: <Info size={20} />, label: t('aboutUs') },
        { id: '/contact', icon: <PhoneCall size={20} />, label: t('contact') },
        { id: '/terms', icon: <ShieldCheck size={20} />, label: t('terms') }
    ]

    return (
        <div className="flex h-screen bg-[#F9FAFB] overflow-hidden font-inter">
            {/* Mobile Header */}
            <div className="md:hidden bg-[#064E3B] text-white p-4 flex items-center justify-between shadow-md z-30">
                <div className="flex items-center gap-2">
                    <Zap className="text-[#FBBF24] fill-[#FBBF24]" size={24} />
                    <span className="font-black text-xl tracking-tight">FarmEase</span>
                </div>
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-[#053F30] rounded-xl transition-colors">
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed md:relative top-0 left-0 h-full bg-[#064E3B] text-white transition-all duration-300 z-40
                ${sidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'}
                flex flex-col shadow-2xl
            `}>
                <div className="p-6 flex items-center justify-between border-b border-white/10 hidden md:flex">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-[#FBBF24] p-1.5 rounded-lg shadow-sm">
                            <Zap className="text-[#064E3B] fill-[#064E3B]" size={20} />
                        </div>
                        {!sidebarCollapsed && <span className="font-black text-xl tracking-tight">FarmEase</span>}
                    </div>
                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors">
                        {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
                    </button>
                </div>

                {/* Mobile Close Button */}
                <div className="md:hidden p-6 flex justify-end border-b border-white/10">
                    <button onClick={() => setSidebarCollapsed(true)} className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                navigate(item.id)
                                if (window.innerWidth < 768) setSidebarCollapsed(true)
                            }}
                            className={`
                                w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative text-left group
                                ${location.pathname === item.id
                                    ? 'bg-white/10 text-[#FBBF24] shadow-inner'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'}
                            `}
                            title={item.label}
                        >
                            <span className={`${location.pathname === item.id ? 'text-[#FBBF24]' : 'text-white/50 group-hover:text-white'} transition-colors`}>
                                {item.icon}
                            </span>
                            {(!sidebarCollapsed || window.innerWidth < 768) && (
                                <span className="whitespace-nowrap font-bold text-sm tracking-wide">{item.label}</span>
                            )}
                            {location.pathname === item.id && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute left-0 w-1 h-6 bg-[#FBBF24] rounded-r-full"
                                />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/10">
                    <div className={`${sidebarCollapsed && window.innerWidth >= 768 ? 'hidden' : 'block'}`}>
                        <LocationDetector onLocationDetected={setUserLocation} user={user} />
                    </div>

                    {(!sidebarCollapsed || window.innerWidth < 768) && (
                        <div className="mt-6 flex gap-2 justify-center bg-black/20 p-1 rounded-xl">
                            {['en', 'hi', 'te'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => i18n.changeLanguage(lang)}
                                    className={`
                                        flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest
                                        ${i18n.language === lang
                                            ? 'bg-[#FBBF24] text-[#064E3B] shadow-sm'
                                            : 'text-white/40 hover:text-white'}
                                    `}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Overlay for mobile */}
            {!sidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setSidebarCollapsed(true)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white/80 backdrop-blur-md shadow-sm h-20 flex items-center justify-between px-8 z-10 border-b border-gray-100">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#064E3B] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={t('searchPlaceholder')}
                                className="w-full pl-12 pr-12 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] bg-gray-50/50 text-sm font-medium transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#064E3B] transition-colors">
                                <Mic size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-gray-900 leading-tight">{user?.name || 'Farmer'}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Premium Member</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-[#064E3B] flex items-center justify-center text-[#FBBF24] font-black shadow-lg shadow-green-100">
                                {user?.name?.charAt(0) || 'F'}
                            </div>
                            <button
                                onClick={onLogout}
                                className="p-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-all border border-transparent hover:border-red-100"
                                title={t('logout')}
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-[#F9FAFB] scroll-smooth">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
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
