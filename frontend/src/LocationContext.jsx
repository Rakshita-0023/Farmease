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
    const [status, setStatus] = useState('loading'); // 'loading', 'unset', 'set', 'error', 'detecting'
    const [error, setError] = useState(null);
    const [allCities, setAllCities] = useState([]);

    const fetchUserLocation = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setStatus('unset');
            return;
        }

        setStatus('loading');
        try {
            const data = await apiClient.get('/user/location');
            if (data && data.city) {
                setLocation(data);
                setStatus('set');
            } else {
                setStatus('unset');
            }
        } catch (err) {
            console.error('❌ Failed to fetch user location:', err);
            setStatus('unset');
        }
    }, []);

    const detectLocation = useCallback(async () => {
        if (status === 'detecting') return;

        setStatus('detecting');
        setError(null);

        try {
            console.log('📍 Starting location detection...');

            if (!navigator.geolocation) {
                throw new Error('Geolocation not supported by your browser');
            }

            const position = await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Location detection timed out. Please select your city manually.'));
                }, 12000);

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        clearTimeout(timeoutId);
                        resolve(pos);
                    },
                    (err) => {
                        clearTimeout(timeoutId);
                        reject(err);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            });

            const { latitude, longitude } = position.coords;
            console.log('📍 GPS Coordinates:', { latitude, longitude });

            // Resolve via backend
            const resolved = await apiClient.get(`/locations/resolve?lat=${latitude}&lng=${longitude}`);

            if (resolved && resolved.city) {
                setLocation(resolved);
                setStatus('set');
                // Save to profile
                await apiClient.put('/user/location', resolved);
            } else {
                throw new Error('Could not resolve your city. Please select manually.');
            }

        } catch (err) {
            console.error('❌ Location detection failed:', err);
            let msg = 'Failed to detect location';
            if (err.code === 1) msg = 'Location permission denied. Please enable it or select city manually.';
            else if (err.code === 3 || err.message.includes('timeout')) msg = 'Location detection timed out. Please try again or select manually.';
            else if (err.message) msg = err.message;

            setError(msg);
            setStatus('unset');
        }
    }, [status]);

    const updateLocation = useCallback(async (newLoc) => {
        setStatus('loading');
        try {
            // Ensure we have lat/lng if it's a city object from search
            let locToSave = { ...newLoc };
            if (!locToSave.latitude && locToSave.lat) locToSave.latitude = locToSave.lat;
            if (!locToSave.longitude && locToSave.lng) locToSave.longitude = locToSave.lng;

            await apiClient.put('/user/location', locToSave);
            setLocation(locToSave);
            setStatus('set');
            setError(null);
        } catch (err) {
            console.error('❌ Failed to update location:', err);
            setError('Failed to save location choice');
            setStatus('unset');
        }
    }, []);

    const searchCities = useCallback(async (query) => {
        if (!query || query.length < 2) {
            // Fetch default cities if query is empty
            try {
                const res = await apiClient.get('/locations/cities');
                setAllCities(res.cities || []);
            } catch (e) {
                setAllCities([]);
            }
            return;
        }
        try {
            const res = await apiClient.get(`/locations/search?q=${encodeURIComponent(query)}`);
            setAllCities(res.cities || []);
        } catch (err) {
            console.error('❌ City search failed:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchUserLocation();
    }, [fetchUserLocation, user]); // Re-fetch when user changes (login/logout)

    // Fetch default cities once
    useEffect(() => {
        searchCities('');
    }, [searchCities]);

    const value = {
        location,
        status,
        error,
        allCities,
        detectLocation,
        updateLocation,
        searchCities,
        refreshLocation: fetchUserLocation
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};