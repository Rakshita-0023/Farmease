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

export const LocationProvider = ({ children, user }) => {
    const [location, setLocation] = useState(null);
    const [allCities, setAllCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search for cities based on user input (worldwide)
    const searchCities = async (query) => {
        if (!query || query.length < 2) {
            setAllCities([]);
            return;
        }

        try {
            const response = await apiClient.get(`/locations/search?q=${encodeURIComponent(query)}`);
            setAllCities(response.cities || []);
        } catch (err) {
            console.error('Failed to search cities:', err);
            setError('Failed to search cities');
        }
    };

    // Update location and persist to backend
    const updateLocation = async (newLocation, persist = true) => {
        setLoading(true);
        setError(null);

        try {
            const locationData = {
                city: newLocation.city || newLocation.name,
                state: newLocation.state,
                country: newLocation.country || 'India',
                latitude: parseFloat(newLocation.latitude || newLocation.lat),
                longitude: parseFloat(newLocation.longitude || newLocation.lng)
            };

            setLocation(locationData);

            // Persist to backend if user is logged in
            if (persist && user) {
                try {
                    await apiClient.put('/user/location', locationData);
                    console.log('✅ Location saved to backend');
                } catch (err) {
                    console.error('Failed to persist location to backend:', err);
                    setError('Failed to save location');
                }
            }
        } catch (err) {
            console.error('Error updating location:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Detect location using browser geolocation
    const detectLocation = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('📍 Starting location detection...');

            if (!navigator.geolocation) {
                throw new Error('Geolocation not supported by this browser');
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
            const response = await apiClient.get(`/location/resolve?lat=${latitude}&lng=${longitude}`);

            if (response.locationRequired) {
                setError('Could not determine your city. Please search and select manually.');
                setLoading(false);
            } else {
                await updateLocation({ ...response, source: 'gps' });
            }
        } catch (err) {
            console.error('❌ Location detection failed:', err);
            setError('Location access denied. Please search and select your city manually.');
            setLoading(false);
        }
    };

    // Initialize location on mount
    useEffect(() => {
        const initializeLocation = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // 1. Try to get saved location from backend
                const savedLocation = await apiClient.get('/user/location');

                if (savedLocation) {
                    console.log('✅ Loaded location from backend:', savedLocation);
                    setLocation(savedLocation);
                    setLoading(false);
                } else {
                    // 2. No saved location - try to detect
                    console.log('📍 No saved location, attempting detection...');
                    await detectLocation();
                }
            } catch (err) {
                console.error('Failed to initialize location:', err);
                // Fallback: try to detect location
                await detectLocation();
            }
        };

        initializeLocation();
    }, [user?.id]); // Re-run when user changes

    return (
        <LocationContext.Provider value={{
            location,
            allCities,
            loading,
            error,
            updateLocation,
            detectLocation,
            searchCities
        }}>
            {children}
        </LocationContext.Provider>
    );
};
