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
            console.log('📍 Initiating location detection...');

            // 1. Try to get GPS coordinates from browser
            let coords = null;
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 5000,
                        maximumAge: 0
                    });
                });
                coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('📍 Browser GPS obtained:', coords);
            } catch (geoError) {
                console.log('⚠️ Browser GPS unavailable, falling back to IP detection:', geoError.message);
            }

            // 2. Call backend with or without coords
            const queryParams = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
            console.log(`📍 Fetching from backend: /market/nearby${queryParams}`);

            const response = await apiClient.get(`/market/nearby${queryParams}`);

            // 3. Update state with backend response
            // Backend contract: { resolvedLocation: {...}, markets: [...] }
            setLocation(response.resolvedLocation);
            setMarkets(response.markets);

            console.log('✅ Location synced:', response.resolvedLocation);
            console.log('✅ Nearby markets:', response.markets.length);

        } catch (err) {
            console.error('Location detection failed:', err);
            // Handle specific backend error codes if needed
            if (err.code === 'CURRENT_LOCATION_UNAVAILABLE') {
                setError('Unable to determine your current location. Market data cannot be displayed.');
            } else {
                setError(err.message || 'Failed to detect location');
            }
            // Clear data on error
            setLocation(null);
            setMarkets([]);
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
