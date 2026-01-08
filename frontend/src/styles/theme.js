/**
 * FarmEase Design System
 * Consistent color palette and styling tokens
 */

export const theme = {
  // Primary brand colors - Emerald/Teal
  colors: {
    primary: {
      50: 'rgba(16, 185, 129, 0.05)',
      100: 'rgba(16, 185, 129, 0.1)',
      200: 'rgba(16, 185, 129, 0.2)',
      500: '#10b981', // emerald-500
      600: '#059669', // emerald-600
      gradient: 'from-emerald-500 to-teal-500'
    },
    // Accent - Amber (for alerts, highlights)
    accent: {
      100: 'rgba(245, 158, 11, 0.1)',
      200: 'rgba(245, 158, 11, 0.2)',
      500: '#f59e0b', // amber-500
    },
    // Neutral glass backgrounds
    glass: {
      light: 'bg-white/10',
      medium: 'bg-white/15',
      dark: 'bg-black/20',
      border: 'border-white/10'
    }
  },
  
  // Consistent card styling
  card: {
    base: 'bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10',
    hover: 'hover:bg-white/15 hover:border-white/20 transition-all',
    elevated: 'bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl'
  },
  
  // Header/Hero styling - ALWAYS emerald gradient
  hero: {
    gradient: 'bg-gradient-to-r from-emerald-600/80 via-teal-600/80 to-emerald-700/80',
    text: 'text-emerald-200',
    accent: 'text-emerald-400'
  },
  
  // Button styles
  button: {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all',
    secondary: 'bg-white/10 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all',
    ghost: 'text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all'
  }
}

export default theme
