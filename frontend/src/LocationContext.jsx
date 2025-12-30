import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from './config';

const LocationContext = createContext();

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};

export const LocationProvider = ({ children, user }) => {
    const [location, setLocation] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading' | 'unset' | 'set' | 'error' | 'detecting'
    const [error, setError] = useState(null);
    const [allCities, setAllCities] = useState([]);

    // Search for cities based on user input (worldwide)
    const searchCities = useCallback(async (query) => {
        if (!query || query.length < 2) {
            try {
                const response = await apiClient.get('/locations/cities');
                setAllCities(response.cities || []);
            } catch (err) {
                console.error('Failed to fetch default cities:', err);
            }
            return;
        }

        try {
            const response = await apiClient.get(`/locations/search?q=${encodeURIComponent(query)}&_t=${Date.now()}`);
            setAllCities(response.cities || []);
        } catch (err) {
            console.error('Failed to search cities:', err);
        }
    }, []);

    // Update location and persist to backend
    const updateLocation = useCallback(async (newLocation, persist = true) => {
        setStatus('loading');
        setError(null);

        try {
            const locationData = {
                city: newLocation.city || newLocation.name,
                state: newLocation.state || '',
                country: newLocation.country || 'India',
                latitude: parseFloat(newLocation.latitude || newLocation.lat),
                longitude: parseFloat(newLocation.longitude || newLocation.lng)
            };

            // Persist to backend if user is logged in
            if (persist && user) {
                try {
                    await apiClient.put('/user/location', locationData);
                    console.log('✅ Location saved to backend');
                } catch (err) {
                    console.error('Failed to persist location to backend:', err);
                }
            }

            setLocation(locationData);
            setStatus('set');
        } catch (err) {
            console.error('Error updating location:', err);
            setError('Failed to update location');
            setStatus('error');
        }
    }, [user]);

    // Detect location using browser geolocation
    const detectLocation = useCallback(async () => {
        setStatus('detecting');
        setError(null);

        try {
            console.log('📍 Starting location detection...');

            if (!navigator.geolocation) {
                throw new Error('Geolocation not supported by your browser');
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            console.log('📍 Got coordinates:', latitude, longitude);

            // Resolve coordinates to city using backend
            const response = await apiClient.get(`/locations/resolve?lat=${latitude}&lng=${longitude}`);

            if (response.locationRequired) {
                console.log('📍 Location required, setting to unset');
                setStatus('unset');
            } else {
                await updateLocation({ ...response, source: 'gps' }, true);
            }
        } catch (err) {
            console.error('❌ Location detection failed:', err);
            let msg = 'Location access denied. Please select your city manually.';
            if (err.code === 1) msg = 'Location permission denied. Please enable it in your browser settings.';
            if (err.code === 3) msg = 'Location detection timed out. Please try again or select manually.';

            setError(msg);
            setStatus('unset'); // Fallback to unset so they can pick
        }
    }, [updateLocation]);

    // Initialize location on mount
    useEffect(() => {
        let isMounted = true;

        const initializeLocation = async () => {
            if (!user) {
                if (isMounted) setStatus('unset');
                return;
            }

            try {
                if (isMounted) setStatus('loading');

                // 1. Try to get saved location from backend
                const savedLocation = await apiClient.get('/user/location');

                if (!isMounted) return;

                if (savedLocation && savedLocation.city) {
                    console.log('✅ Loaded location from backend:', savedLocation);
                    setLocation(savedLocation);
                    setStatus('set');
                } else {
                    // 2. No saved location - try to detect automatically
                    console.log('📍 No saved location, attempting auto-detection...');
                    await detectLocation();
                }
            } catch (err) {
                console.error('Failed to initialize location:', err);
                if (isMounted) {
                    setStatus('unset');
                }
            }
        };

        initializeLocation();

        // Also fetch initial cities list
        const fetchInitialCities = async () => {
            try {
                const response = await apiClient.get('/locations/cities');
                if (isMounted) setAllCities(response.cities || []);
            } catch (err) {
                console.error('Failed to fetch initial cities:', err);
            }
        };
        fetchInitialCities();

        return () => {
            isMounted = false;
        };
    }, [user?.id, detectLocation]);

    return (
        <LocationContext.Provider value={{
            location,
            status,
            error,
            allCities,
            updateLocation,
            detectLocation,
            searchCities
        }}>
            {children}
        </LocationContext.Provider>
    );
};