import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './config';

const LocationContext = createContext();

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null);
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const detectLocation = async () => {
        setLoading(true);
        setError(null);

        try {
            // Call backend to detect location (via IP) and get nearby markets
            console.log('📍 Fetching location & markets from backend...');
            const response = await apiClient.get('/market/nearby');

            setLocation(response.userLocation);
            setMarkets(response.markets);

            console.log('✅ Location synced:', response.userLocation);
            console.log('✅ Nearby markets:', response.markets.length);
        } catch (err) {
            console.error('Location detection failed:', err);
            setError(err.message || 'Failed to detect location');
            // No fallback - UI should handle the error state
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        detectLocation();
    }, []);

    return (
        <LocationContext.Provider value={{ location, markets, loading, error, detectLocation }}>
            {children}
        </LocationContext.Provider>
    );
};
