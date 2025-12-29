import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://farmease-tqgy.onrender.com'

// Create axios instance with default config
const apiInstance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor to add auth token
apiInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor for error handling
apiInstance.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error.response?.data || error.message)
    }
)

// API Service Methods
export const apiService = {
    // Auth
    login: (credentials) => apiInstance.post('/auth/login', credentials),
    register: (userData) => apiInstance.post('/auth/register', userData),
    googleAuth: (googleData) => apiInstance.post('/auth/google', googleData),

    // Farms
    getFarms: () => apiInstance.get('/farms'),
    createFarm: (farmData) => apiInstance.post('/farms', farmData),
    updateFarm: (farmId, farmData) => apiInstance.put(`/farms/${farmId}`, farmData),
    deleteFarm: (farmId) => apiInstance.delete(`/farms/${farmId}`),

    // Activities
    getActivities: () => apiInstance.get('/activities'),
    createActivity: (activityData) => apiInstance.post('/activities', activityData),

    // Plant Diagnosis
    createDiagnosis: (diagnosisData) => apiInstance.post('/plant-diagnosis', diagnosisData),
    getDiagnosisHistory: () => apiInstance.get('/plant-diagnosis/history'),

    // Forum
    getForumPosts: () => apiInstance.get('/forum/posts'),
    createForumPost: (postData) => apiInstance.post('/forum/posts', postData),
    likePost: (postId) => apiInstance.post(`/forum/posts/${postId}/like`),

    // Weather (External API)
    getWeather: async (lat, lon) => {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        )
        return response.data
    },

    // Market Data (Custom Hook - see useMandiData.js)
    // This is handled by React Query in the component level
}

// Optimistic Update Helpers
export const optimisticHelpers = {
    /**
     * Creates an optimistic farm object for immediate UI update
     */
    createOptimisticFarm: (farmData, tempId) => ({
        id: tempId || `temp-${Date.now()}`,
        ...farmData,
        created_at: new Date().toISOString(),
        _optimistic: true
    }),

    /**
     * Creates an optimistic activity object
     */
    createOptimisticActivity: (activityData, tempId) => ({
        id: tempId || `temp-${Date.now()}`,
        ...activityData,
        created_at: new Date().toISOString(),
        _optimistic: true
    }),

    /**
     * Creates an optimistic forum post
     */
    createOptimisticPost: (postData, user, tempId) => ({
        id: tempId || `temp-${Date.now()}`,
        user_id: user.id,
        author_name: user.name,
        content: postData.content,
        tags: postData.tags || [],
        likes: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        _optimistic: true
    })
}

// Local Storage Helpers
export const storageService = {
    /**
     * Save market location preference
     */
    saveMarketLocation: (state, district, mandi) => {
        localStorage.setItem('market_location', JSON.stringify({ state, district, mandi }))
    },

    /**
     * Get saved market location
     */
    getMarketLocation: () => {
        const saved = localStorage.getItem('market_location')
        return saved ? JSON.parse(saved) : { state: '', district: '', mandi: '' }
    },

    /**
     * Save user preferences
     */
    savePreferences: (preferences) => {
        localStorage.setItem('user_preferences', JSON.stringify(preferences))
    },

    /**
     * Get user preferences
     */
    getPreferences: () => {
        const saved = localStorage.getItem('user_preferences')
        return saved ? JSON.parse(saved) : {}
    }
}

export default apiService
