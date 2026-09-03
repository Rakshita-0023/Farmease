import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../config'
import OnboardingWizard from './OnboardingWizard'
import { useTranslation } from 'react-i18next'
import {
  Cloud, Sun, CloudRain, Wind, Droplets, MapPin, TrendingUp,
  Leaf, Activity,
  AlertTriangle, Navigation, Shovel, Calendar, TrendingDown
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useFarmLocation } from '../hooks/useFarmLocation'
import { useMandiData } from '../hooks/useMandiData'
import './EnhancedDashboard.css'

const EnhancedDashboard = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { location: globalLocation, loading: locationLoading, locationStatus } = useFarmLocation()
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {})
  const alertsSectionRef = useRef(null)

  const scrollToAlerts = () => {
    alertsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const { data: dashboardOverview } = useQuery({
    queryKey: ['dashboard-overview', globalLocation?.latitude, globalLocation?.longitude, i18n.language],
    queryFn: () => apiClient.get('/dashboard/overview', {
      lat: globalLocation?.latitude,
      lng: globalLocation?.longitude,
      lang: i18n.language
    }),
    staleTime: 5 * 60 * 1000
  })

  // Fetch Farms
  const { data: farms = [], refetch: refetchFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => apiClient.get('/farms')
  })

  // Fetch Current Weather
  const { data: weather } = useQuery({
    queryKey: ['weather', globalLocation?.latitude, globalLocation?.longitude],
    queryFn: async () => {
      if (!globalLocation?.latitude || !globalLocation?.longitude) return null
      const data = await apiClient.get('/weather/current', {
        lat: globalLocation.latitude,
        lon: globalLocation.longitude
      })
      if (!data?.main?.temp) return null
      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather?.[0]?.main || 'Clear',
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert to km/h if it's m/s
        location: data.name || globalLocation.city,
        icon: data.weather?.[0]?.main,
        rainProb: data.clouds?.all || 0 // Using cloud cover as proxy if pop is missing
      }
    },
    enabled: !!globalLocation?.latitude && !!globalLocation?.longitude,
    staleTime: 5 * 60 * 1000
  })

  // Market Data (Sonipat Mandi context)
  const { data: marketPrices = [] } = useMandiData(
    globalLocation?.state || 'Haryana',
    globalLocation?.city || 'Sonipat',
    ''
  )

  const trendingCrops = useMemo(() => {
    if (Array.isArray(dashboardOverview?.trendingCrops) && dashboardOverview.trendingCrops.length) {
      return dashboardOverview.trendingCrops
    }
    return Array.isArray(marketPrices)
      ? marketPrices.slice(0, 4)
      : []
  }, [dashboardOverview?.trendingCrops, marketPrices])

  const getWeatherIcon = (condition, size = 28) => {
    const icons = {
      'Clear': <Sun className="text-amber-400" size={size} />,
      'Clouds': <Cloud className="text-slate-300" size={size} />,
      'Rain': <CloudRain className="text-blue-400" size={size} />,
      'Drizzle': <CloudRain className="text-blue-300" size={size} />,
      'Thunderstorm': <Wind className="text-purple-400" size={size} />
    }
    return icons[condition] || <Sun className="text-amber-400" size={size} />
  }

  const farmMetrics = useMemo(() => {
    if (!farms.length) return { totalFarms: 0, activeCrops: 0, harvestReady: 0, healthScore: 0 }
    return {
      totalFarms: farms.length,
      activeCrops: farms.filter(f => (f.progress || 0) < 100).length,
      harvestReady: farms.filter(f => (f.progress || 0) >= 90).length,
      healthScore: farms.length > 0 ? Math.round(farms.reduce((s, f) => s + (f.health_score || 0), 0) / farms.length) : 0
    }
  }, [farms])

  // Derived Actionable Insights
  const weatherInsights = useMemo(() => {
    if (dashboardOverview?.insights) {
      return {
        crop: dashboardOverview.insights.cropAdvice,
        irrigation: dashboardOverview.insights.irrigationAdvice,
        alertText: dashboardOverview.insights.weatherStatus,
        alertType: dashboardOverview.insights.weatherStatusType || 'favorable'
      }
    }
    if (!weather) return {
      crop: t('detectingConditions'),
      irrigation: t('awaitingData'),
      alertText: t('analyzing'),
      alertType: 'favorable'
    }

    let crop = t('cropAdviceColdHardy')
    if (weather.temperature > 28) crop = t('cropAdviceHeatTolerant')

    let irrigation = t('irrigationLight')
    if (weather.humidity > 75) irrigation = t('irrigationLowHumidityHigh')
    if (weather.temperature > 32 && weather.humidity < 40) irrigation = t('irrigationDeep')

    let alertText = t('favorableFarmingConditions')
    let alertType = 'favorable'
    if (weather.temperature > 38) { alertText = t('extremeHeatAlert'); alertType = 'danger'; }
    else if (weather.rainProb > 70) { alertText = t('heavyRainForecast'); alertType = 'warning'; }
    else if (weather.windSpeed > 25) { alertText = t('highWindsAlert'); alertType = 'warning'; }

    return { crop, irrigation, alertText, alertType }
  }, [dashboardOverview?.insights, weather, t])

  const alertsList = useMemo(() => {
    const list = []
    const cropNames = farms
      .map(f => String(f.crop || '').trim())
      .filter(Boolean)
    const uniqueCropNames = [...new Set(cropNames)]
    const cropPreview = uniqueCropNames.slice(0, 3).join(', ')

    if (uniqueCropNames.length && weather) {
      if (weather.temperature >= 32) {
        list.push({
          id: 'crop-heat-advisory',
          type: 'warning',
          severity: weather.temperature >= 36 ? 'high' : 'medium',
          message: t('alertHeatAdvisory', { crops: cropPreview, temp: weather.temperature })
        })
      }

      if (weather.rainProb >= 60) {
        list.push({
          id: 'crop-rain-advisory',
          type: 'warning',
          severity: 'medium',
          message: t('alertRainRisk', { rain: weather.rainProb, crops: cropPreview })
        })
      }

      if (weather.humidity <= 35) {
        list.push({
          id: 'crop-moisture-advisory',
          type: 'warning',
          severity: 'medium',
          message: t('alertLowHumidity', { humidity: weather.humidity, crops: cropPreview })
        })
      }

      if (weather.windSpeed >= 20) {
        list.push({
          id: 'crop-wind-advisory',
          type: 'warning',
          severity: 'medium',
          message: t('alertWindAdvisory', { wind: weather.windSpeed, crops: cropPreview })
        })
      }

      if (!list.length) {
        list.push({
          id: 'crop-stable',
          type: 'success',
          severity: 'low',
          message: t('alertWeatherStable', { crops: cropPreview })
        })
      }
    }

    farms.forEach(farm => {
      if ((farm.progress || 0) > 90) {
        list.push({
          id: `harvest-${farm.id}`,
          type: 'success',
          severity: 'medium',
          message: t('alertHarvestNear', { farm: farm.name, crop: farm.crop })
        })
      }
    })

    if (Array.isArray(dashboardOverview?.alerts) && dashboardOverview.alerts.length) {
      dashboardOverview.alerts.forEach((message, index) => {
        list.push({
          id: `backend-alert-${index}`,
          message,
          type: 'info',
          severity: 'medium'
        })
      })
    }

    return list
  }, [dashboardOverview?.alerts, farms, weather, t])

  const [hasDismissedOnboarding, setHasDismissedOnboarding] = useState(
    sessionStorage.getItem('onboarding_dismissed') === 'true'
  )
  const [delta, setDelta] = useState({ farms: 0, activeCrops: 0, alerts: 0 })

  const dismissOnboarding = () => {
    setHasDismissedOnboarding(true)
    sessionStorage.setItem('onboarding_dismissed', 'true')
  }

  useEffect(() => {
    const prevRaw = localStorage.getItem('dashboard_previous_snapshot')
    const current = {
      farms: farmMetrics.totalFarms,
      activeCrops: farmMetrics.activeCrops,
      alerts: alertsList.length
    }

    if (prevRaw) {
      try {
        const prev = JSON.parse(prevRaw)
        setDelta({
          farms: current.farms - (prev.farms || 0),
          activeCrops: current.activeCrops - (prev.activeCrops || 0),
          alerts: current.alerts - (prev.alerts || 0)
        })
      } catch {
        setDelta({ farms: 0, activeCrops: 0, alerts: 0 })
      }
    }

    localStorage.setItem('dashboard_previous_snapshot', JSON.stringify(current))
  }, [farmMetrics.totalFarms, farmMetrics.activeCrops, alertsList.length])

  const todayActions = useMemo(() => {
    if (Array.isArray(dashboardOverview?.todayActions) && dashboardOverview.todayActions.length) {
      return dashboardOverview.todayActions.map(action => ({
        ...action,
        onClick: () => navigate(action.route || '/')
      }))
    }
    const actions = []

    if (weather?.temperature > 35 || weatherInsights.alertType === 'danger') {
      actions.push({
        id: 'heat-action',
        title: t('actionHeatRiskTitle'),
        detail: t('actionHeatRiskDetail'),
        cta: t('actionViewFarmPlan'),
        onClick: () => navigate('/farms'),
        priority: 'high'
      })
    }

    if (trendingCrops.length > 0) {
      actions.push({
        id: 'market-opportunity',
        title: t('actionCheckMarketTitle', { crop: trendingCrops[0].commodity }),
        detail: t('actionCheckMarketDetail'),
        cta: t('actionOpenMarket'),
        onClick: () => navigate('/market'),
        priority: 'medium'
      })
    }

    actions.push({
      id: 'plant-health',
      title: t('actionPlantHealthTitle'),
      detail: t('actionPlantHealthDetail'),
      cta: t('actionStartScan'),
      onClick: () => navigate('/doctor'),
      priority: 'medium'
    })

    return actions.slice(0, 3)
  }, [dashboardOverview?.todayActions, weather?.temperature, weatherInsights.alertType, trendingCrops, navigate, t])

  const changeInsights = useMemo(() => {
    return [
      {
        id: 'fields',
        text: delta.farms === 0
          ? t('changeNoNewFields')
          : t('changeFieldDelta', { delta: `${delta.farms > 0 ? '+' : ''}${delta.farms}` }),
        cta: t('ctaManageFields'),
        onClick: () => navigate('/farms')
      },
      {
        id: 'risk',
        text: alertsList.length
          ? t('changeAlertsNeedAttention', { count: alertsList.length })
          : t('changeNoAlerts'),
        cta: t('ctaViewAlerts'),
        onClick: scrollToAlerts
      },
      {
        id: 'market',
        text: trendingCrops[0]
          ? t('changePriceTrend', {
            crop: trendingCrops[0].commodity,
            trend: String(trendingCrops[0].trend || t('trendStable'))
          })
          : t('marketDataLoading'),
        cta: t('ctaOpenMarket'),
        onClick: () => navigate('/market')
      }
    ]
  }, [delta.farms, alertsList.length, trendingCrops, navigate, t])

  // Loading Screen
  if (locationStatus === 'detecting' || locationLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 bg-emerald-500/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-emerald-500/30"
        >
          <Navigation className="text-emerald-400 animate-pulse" size={40} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">{t('detectingFarmLocation')}</h2>
          <p className="text-white/50 mt-2">{t('personalizingDashboard')}</p>
        </div>
      </div>
    )
  }

  const showOnboarding = farms.length === 0 && !hasDismissedOnboarding
  const dashboardWeather = dashboardOverview?.weather || weather

  return (
    <div className="dashboard-container custom-scrollbar">
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => { refetchFarms(); dismissOnboarding() }}
          onSkip={dismissOnboarding}
        />
      )}

      <header className="dashboard-hero farm-glass mb-8">
        <div>
          <h1 className="text-4xl font-black text-white">{t('welcome')}, {user.name || 'Farmer'}</h1>
          <p className="text-white/70 mt-2">{t('farmOverviewToday')}</p>
        </div>
        <div className="farm-glass weather-summary">
          <div className="weather-icon">{getWeatherIcon(dashboardWeather?.condition || 'Clear', 20)}</div>
          <div>
          <p className="text-xs uppercase tracking-wide text-white/60">{dashboardWeather?.location || globalLocation?.city || t('location')}</p>
          <p className="text-3xl font-black">{dashboardWeather?.temperature ?? '--'}°C</p>
        </div>
        <div className="weather-metrics">
          <div><span>{dashboardWeather?.humidity ?? '--'}%</span><small>{t('humidity')}</small></div>
          <div><span>{dashboardWeather?.windSpeed ?? '--'}km/h</span><small>{t('windLabel')}</small></div>
          <div><span>{dashboardWeather?.rainProb ?? '--'}%</span><small>{t('rainLabel')}</small></div>
        </div>
      </div>
      </header>

      <section className="action-grid mb-8">
        <div className="farm-glass actions-primary">
          <h3 className="section-title"><Shovel size={18} /> {t('todaysActions')}</h3>
          <div className="space-y-3">
            {todayActions.map((action) => (
              <div key={action.id} className={`action-row ${action.priority === 'high' ? 'action-row-high' : ''}`}>
                <div>
                  <p className="font-bold text-white">{action.title}</p>
                  <p className="text-white/65 text-sm mt-1">{action.detail}</p>
                </div>
                <button onClick={action.onClick} className="action-cta">
                  {action.cta}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="farm-glass actions-secondary">
          <h3 className="section-title"><Calendar size={18} /> {t('sinceYesterday')}</h3>
          <div className="space-y-2 mt-3">
            {changeInsights.map((item) => (
              <div key={item.id} className="change-insight-row">
                <p className="text-sm text-white/80">{item.text}</p>
                <button onClick={item.onClick} className="change-link">{item.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="info-grid mb-8">
        <div className="farm-glass info-card">
          <h3 className="info-title"><Leaf size={16} /> {t('cropAdvice')}</h3>
          <p>{weatherInsights.crop}</p>
        </div>
        <div className="farm-glass info-card">
          <h3 className="info-title"><Droplets size={16} /> {t('irrigationAdvice')}</h3>
          <p>{weatherInsights.irrigation}</p>
        </div>
        <div className="farm-glass info-card">
          <h3 className="info-title"><Activity size={16} /> {t('weatherStatus')}</h3>
          <p className={weatherInsights.alertType === 'danger' ? 'text-red-300' : weatherInsights.alertType === 'warning' ? 'text-amber-300' : 'text-emerald-300'}>
            {weatherInsights.alertText}
          </p>
        </div>
      </section>

      <section className="bottom-grid pb-8" ref={alertsSectionRef}>
        <div className="farm-glass">
          <h3 className="section-title"><AlertTriangle size={18} /> {t('recentAlerts')}</h3>
          {alertsList.length ? (
            <div className="space-y-3">
              {alertsList.map((alert) => (
                <div key={alert.id} className="alert-row">
                  <p>{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-alerts">
              <span>✨</span>
              <p>{t('allClearNow')}</p>
            </div>
          )}
        </div>

        <div className="farm-glass">
          <h3 className="section-title"><TrendingUp size={18} /> {t('marketTrends')}</h3>
          <div className="space-y-3">
            {(trendingCrops.length ? trendingCrops : []).slice(0, 4).map((crop, i) => (
              <div key={`${crop.commodity}-${i}`} className="trend-row">
                <div className="flex items-center gap-3">
                  <div className="trend-icon">
                    <TrendingUp size={14} />
                  </div>
                  <p className="text-sm font-semibold">{crop.commodity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">₹{Number(crop.modal_price || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase">{t('rising')}</p>
                </div>
              </div>
            ))}
            {!trendingCrops.length && <p className="text-white/60 text-sm">{t('marketDataLoading')}</p>}
          </div>
        </div>
      </section>
    </div>
  )
}

export default EnhancedDashboard
