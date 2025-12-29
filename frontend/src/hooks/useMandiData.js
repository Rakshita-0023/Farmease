import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../config'

/**
 * Custom hook to fetch market data from backend API
 * NO HARDCODED DATA - Everything comes from the database
 * 
 * @param {string} state - Filter by state (e.g., 'Telangana', 'Andhra Pradesh')
 * @param {string} district - Filter by district (e.g., 'Hyderabad', 'Guntur')
 * @param {string} mandi - Filter by specific mandi/market
 * @returns {object} React Query result with market data
 */
export const useMandiData = (state = '', district = '', mandi = '') => {
    return useQuery({
        queryKey: ['market-prices', state, district, mandi],
        queryFn: async () => {
            try {
                console.log('🔄 Fetching market data...', { state, district, mandi })

                let url = '/market/compare' // Default to top crops/comparison

                if (mandi) {
                    url = `/market/city/${encodeURIComponent(mandi)}`
                } else if (district) {
                    url = `/market/compare?location=${encodeURIComponent(district)}`
                } else if (state) {
                    url = `/market/compare?location=${encodeURIComponent(state)}`
                }

                const data = await apiClient.get(url)

                // Handle different response structures
                // /market/city/:city returns { markets: [...] }
                if (data.markets) {
                    return data.markets
                }

                // /market/compare returns [...]
                return Array.isArray(data) ? data : []
            } catch (error) {
                console.error('❌ Failed to fetch market data:', error)
                return [] // Return empty array on error to prevent UI crash
            }
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        enabled: true
    })
}

/**
 * Custom hook for market comparison logic
 * Supports Crop-First and Location-First views
 */
export const useMarketComparison = (crop = '', location = '') => {
    return useQuery({
        queryKey: ['market-comparison', crop, location],
        queryFn: async () => {
            try {
                const params = new URLSearchParams()
                if (crop) params.append('crop', crop)
                if (location) params.append('location', location)

                const url = `/market/compare?${params.toString()}`
                const data = await apiClient.get(url)
                return data || []
            } catch (error) {
                console.error('❌ Comparison fetch failed:', error)
                throw new Error(error.message)
            }
        },
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false
    })
}

export default useMandiData
