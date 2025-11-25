import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import bellAnimation from '../../public/Icons  Bell (Notification).json'

const NotificationSystem = ({ userLocation, farms }) => {
  const [notifications, setNotifications] = useState([])
  const [permission, setPermission] = useState('default')

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    }
    return false
  }

  const showNotification = (title, body, icon = '🌱') => {
    if (permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/farmease_logo.png',
        badge: '/farmease_logo.png',
        tag: 'farmease-notification'
      })
    }
    
    // Add to in-app notifications
    const notification = {
      id: Date.now(),
      title,
      body,
      icon,
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep last 10
  }

  const checkWeatherAlerts = async () => {
    if (!userLocation) return
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.latitude}&lon=${userLocation.longitude}&appid=895284fb2d2c50a520ea537456963d9c&units=metric`
      )
      const data = await response.json()
      
      if (response.ok) {
        const weather = data.weather[0].main.toLowerCase()
        const temp = data.main.temp
        
        // Alert for extreme weather
        if (weather.includes('rain') || weather.includes('storm')) {
          showNotification(
            '🌧️ Weather Alert',
            `${data.weather[0].description} expected. Protect your crops!`,
            '🌧️'
          )
        } else if (temp > 40) {
          showNotification(
            '🌡️ Heat Alert',
            `Extreme heat (${Math.round(temp)}°C) detected. Increase irrigation.`,
            '🌡️'
          )
        } else if (temp < 5) {
          showNotification(
            '❄️ Cold Alert',
            `Very cold weather (${Math.round(temp)}°C). Protect sensitive crops.`,
            '❄️'
          )
        }
      }
    } catch (error) {
      console.error('Weather check failed:', error)
    }
  }

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  // Auto-dismiss notifications after 10 seconds
  useEffect(() => {
    notifications.forEach(notification => {
      if (!notification.read) {
        setTimeout(() => {
          markAsRead(notification.id)
        }, 10000)
      }
    })
  }, [notifications])

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  useEffect(() => {
    // Request permission on mount
    requestNotificationPermission()

    // Check weather alerts every 30 minutes
    const weatherInterval = setInterval(checkWeatherAlerts, 1800000)
    
    // Initial weather check after 5 seconds
    setTimeout(checkWeatherAlerts, 5000)

    // Expose welcome notification function globally
    window.showWelcomeNotification = (userName) => {
      showNotification(
        '🌱 Welcome to FarmEase',
        `Hello ${userName}! Your smart farming assistant is ready.`,
        '🌱'
      )
    }

    return () => {
      clearInterval(weatherInterval)
      delete window.showWelcomeNotification
    }
  }, [userLocation, permission])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      {/* Notification Bell */}
      <div className="notification-bell">
        <button className="bell-btn" title="Notifications">
          <Lottie 
            animationData={bellAnimation} 
            style={{ width: 24, height: 24 }} 
            loop={true}
          />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>
        
        {/* Notification Dropdown */}
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h4>
              <Lottie 
                animationData={bellAnimation} 
                style={{ width: 20, height: 20, display: 'inline-block', marginRight: '8px' }} 
                loop={true}
              />
              Notifications
            </h4>
            {permission !== 'granted' && (
              <button 
                className="enable-notifications"
                onClick={requestNotificationPermission}
              >
                Enable Push Notifications
              </button>
            )}
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-content">
                    <div className="notification-header">
                      <span className="notification-icon">{notification.icon}</span>
                      <span className="notification-title">{notification.title}</span>
                      <button 
                        className="close-notification"
                        onClick={(e) => {
                          e.stopPropagation()
                          clearNotification(notification.id)
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="notification-body">{notification.body}</div>
                    <div className="notification-time">
                      {notification.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {notifications.slice(0, 3).map(notification => (
          !notification.read && (
            <div key={notification.id} className="toast-notification">
              <span className="toast-icon">{notification.icon}</span>
              <div className="toast-content">
                <div className="toast-title">{notification.title}</div>
                <div className="toast-body">{notification.body}</div>
              </div>
              <button 
                className="toast-close"
                onClick={() => markAsRead(notification.id)}
              >
                ×
              </button>
            </div>
          )
        ))}
      </div>
    </>
  )
}

export default NotificationSystem