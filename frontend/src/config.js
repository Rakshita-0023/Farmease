// API Configuration
export const API_BASE_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_BASE_URL || 'https://farmease-tqgy.onrender.com/api')
  : '/api'

console.log('🔗 API_BASE_URL:', API_BASE_URL)
console.log('🔗 PROD:', import.meta.env.PROD)
console.log('🔗 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)

export default API_BASE_URL;

// Debug logs for production verification (MANDATORY)
console.log("IS_PROD:", import.meta.env.PROD);
console.log("API_ENV_VAR:", import.meta.env.VITE_API_BASE_URL);
console.log("RESOLVED_BASE:", API_BASE_URL);

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

// Post-Authentication Location Handler
export const handlePostAuthLocation = async () => {
  console.log('📍 Starting post-auth location detection...')
  
  // 1. Ask permission
  if (!navigator.geolocation) {
    console.log('📍 Geolocation not supported')
    return false
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          console.log('📍 GPS coordinates obtained:', { latitude, longitude })

          // 2. Resolve city from backend using apiClient
          const resolved = await apiClient.get(`/locations/resolve?lat=${latitude}&lng=${longitude}`)
          console.log('📍 Location resolved:', resolved)

          // 3. Save location to user using apiClient
          await apiClient.put('/user/location', resolved)
          console.log('📍 Location saved successfully')
          resolve(true)
        } catch (error) {
          console.error('📍 Location detection error:', error)
          resolve(false)
        }
      },
      (error) => {
        // Permission denied → do nothing
        console.log('📍 Location permission denied or failed:', error.message)
        resolve(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  })
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
      credentials: 'include', // Include credentials for CORS
      ...options
    }

    try {
      const fullUrl = `${API_BASE_URL}${url}`
      console.log('🔗 API Request URL:', fullUrl)
      console.log('🔗 API Request Headers:', config.headers)
      console.log('🔗 API Request Credentials:', config.credentials)

      const response = await fetch(fullUrl, config)
      console.log('📊 Response Status:', response.status)
      console.log('📋 Content-Type:', response.headers.get('content-type'))

      if (response.status === 401) {
        console.log('❌ 401 Unauthorized - Removing token and reloading')
        removeAuthToken()
        window.location.reload()
        return
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('❌ Non-JSON response:', textResponse.substring(0, 200))
        throw new Error(`Server returned HTML/text instead of JSON. Response: ${textResponse.substring(0, 100)}...`)
      }

      const data = await response.json()

      if (!response.ok) {
        const error = new Error(data.error || data.message || 'Request failed')
        error.status = response.status
        error.data = data
        throw error
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