// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Weather API Configuration (move to backend in production)
export const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c'

// Authentication helpers
export const getAuthToken = () => localStorage.getItem('token')

export const setAuthToken = (token) => {
  localStorage.setItem('token', token)
}

export const removeAuthToken = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getAuthHeaders = () => {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// API client with authentication
export const apiClient = {
  async request(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config)

      if (response.status === 401) {
        // Token expired or invalid
        removeAuthToken()
        window.location.reload()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  },

  get(url, options = {}) {
    return this.request(url, { method: 'GET', ...options })
  },

  post(url, data, options = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    })
  },

  put(url, data, options = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    })
  },

  delete(url, options = {}) {
    return this.request(url, { method: 'DELETE', ...options })
  }
}