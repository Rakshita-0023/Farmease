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
                console.log('🔄 Fetching market data from backend...', { state, district, mandi })

                // Build query parameters
                const params = new URLSearchParams()
                if (state) params.append('state', state)
                if (district) params.append('district', district)
                if (mandi) params.append('market', mandi)

                const queryString = params.toString()
                const url = `/market-prices${queryString ? `?${queryString}` : ''}`

                // Fetch from backend API
                const data = await apiClient.get(url)

                console.log(`✅ Received ${data?.length || 0} market price records from backend`)

                return data || []
            } catch (error) {
                console.error('❌ Failed to fetch market data:', error)

                // If backend fails, throw error (React Query will handle retry)
                throw new Error(`Failed to fetch market data: ${error.message}`)
            }
        },
        staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Cache for 10 minutes (updated from cacheTime)
        retry: 1, // Retry failed requests once (reduced from 2)
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnMount: true, // Refetch when component mounts
        enabled: true // Always enabled
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
