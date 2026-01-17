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
    Leaf,
    Stethoscope,
    Users,
    FileText,
    Info,
    PhoneCall,
    ShieldCheck
} from 'lucide-react'

export default function Layout({ user, onLogout }) {
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
        { id: '/crop-recommendation', icon: <Leaf size={20} />, label: 'Crop Recommendation' },
        { id: '/tips', icon: <Lightbulb size={20} />, label: t('tips') },
        { id: '/doctor', icon: <Stethoscope size={20} />, label: t('plantDoctor') },
        { id: '/community', icon: <Users size={20} />, label: t('community') },
        { id: '/schemes', icon: <FileText size={20} />, label: t('schemes') },
        { id: '/about', icon: <Info size={20} />, label: t('aboutUs') },
        { id: '/contact', icon: <PhoneCall size={20} />, label: t('contact') },
        { id: '/terms', icon: <ShieldCheck size={20} />, label: t('terms') }
    ]

    return (
        <div className="flex h-screen overflow-hidden font-inter">
            {/* Mobile Header - Glassmorphism */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-black/30 backdrop-blur-xl text-white p-4 flex items-center justify-between z-50 border-b border-white/10">
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

            {/* Sidebar - Glassmorphism */}
            <aside className={`
                fixed md:relative top-0 left-0 h-full transition-all duration-300 z-40
                ${sidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-72'}
                flex flex-col
                bg-emerald-950/40 backdrop-blur-xl border-r border-white/10
                shadow-[inset_0_0_60px_rgba(0,0,0,0.3)]
            `}>
                {/* Logo Section */}
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

                {/* Mobile Close Button */}
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

                {/* Navigation */}
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
                                title={item.label}
                            >
                                <span className={`transition-colors ${isActive ? 'text-emerald-400' : 'text-white/50 group-hover:text-white'}`}>
                                    {item.icon}
                                </span>
                                {(!sidebarCollapsed || window.innerWidth < 768) && (
                                    <span className="whitespace-nowrap font-semibold text-sm">{item.label}</span>
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
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-white/10 space-y-4">
                    {/* Location Detector */}
                    <div className={`${sidebarCollapsed && window.innerWidth >= 768 ? 'hidden' : 'block'}`}>
                        <LocationDetector />
                    </div>

                    {/* Language Switcher */}
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

            {/* Overlay for mobile */}
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

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0">
                {/* Header - Glassmorphism */}
                <header className="hidden md:flex bg-black/20 backdrop-blur-xl h-20 items-center justify-between px-8 z-10 border-b border-white/10">
                    {/* Search */}
                    <div className="flex items-center gap-4 flex-1 max-w-xl">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-emerald-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={t('searchPlaceholder')}
                                className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-white/15 text-white placeholder-white/40 text-sm font-medium transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-emerald-400 transition-colors">
                                <Mic size={18} />
                            </button>
                        </div>
                    </div>

                    {/* User Section */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white leading-tight">{user?.name || 'Farmer'}</p>
                                <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-widest">Premium Member</p>
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

                {/* Main Content - Scrollable */}
                <main className="flex-1 overflow-y-auto scroll-smooth">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="h-full"
                        >
                            <Outlet context={{ user }} />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}
