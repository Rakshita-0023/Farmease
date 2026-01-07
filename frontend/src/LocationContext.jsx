import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './config';
import locationService from './services/locationService';

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [locationStatus, setLocationStatus] = useState('unset'); // 'unset', 'detecting', 'set', 'failed'

    // Fetch all available cities for manual selection (once on mount)
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await apiClient.get('/locations/cities');
                setAllCities(response.cities || []);
            } catch (err) {
                console.error('Failed to fetch cities list:', err);
            }
        };
        fetchCities();
    }, []);

    // Location initialization flow for authenticated users
    useEffect(() => {
        if (!user?.id) {
            setLocation(null);
            setLocationStatus('unset');
            setLoading(false);
            setError(null);
            return;
        }

        const initializeLocation = async () => {
            try {
                setLoading(true);
                setError(null);

                // Check authentication before proceeding
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Please log in to enable location features');
                    setLocationStatus('failed');
                    setLoading(false);
                    return;
                }

                // First, try to get saved location
                const savedLocation = await locationService.getSavedLocation();

                if (savedLocation) {
                    setLocation(savedLocation);
                    setLocationStatus('set');
                    setLoading(false);
                    return;
                }

                // No saved location, attempt auto-detection
                setLocationStatus('detecting');

                try {
                    const detectedLocation = await locationService.detectAndSaveLocation();

                    if (detectedLocation) {
                        setLocation(detectedLocation);
                        setLocationStatus('set');
                    }
                } catch (detectionError) {
                    console.log('📍 Auto-detection failed:', detectionError.message);

                    let userFriendlyError = detectionError.message;
                    if (detectionError.message.includes('not authenticated')) {
                        userFriendlyError = 'Authentication expired. Please log in again.';
                    } else if (detectionError.message.includes('permission denied')) {
                        userFriendlyError = 'Location permission denied. Please enable location access or select your city manually.';
                    } else if (detectionError.message.includes('Invalid token') || detectionError.message.includes('jwt expired')) {
                        userFriendlyError = 'Session expired. Please log in again.';
                        localStorage.removeItem('token');
                        window.location.reload();
                    } else if (detectionError.message.includes('Failed to save location')) {
                        userFriendlyError = 'Unable to save location. Please check your internet connection and try again.';
                    }

                    setError(userFriendlyError);
                    setLocationStatus('failed');
                }

            } catch (err) {
                console.error('❌ Location initialization failed:', err);
                setError('Failed to initialize location services');
                setLocationStatus('failed');
            } finally {
                setLoading(false);
            }
        };

        initializeLocation();
    }, [user?.id]);

    // Manual location update (for city selector)
    const updateLocation = async (newLocation) => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            const locationData = await locationService.selectAndSaveCity(newLocation);

            setLocation(locationData);
            setLocationStatus('set');

        } catch (err) {
            console.error('Failed to update location:', err);
            setError('Failed to save location');
        } finally {
            setLoading(false);
        }
    };

    // Retry location detection
    const retryLocationDetection = async () => {
        if (!user?.id || loading) return;

        try {
            setLoading(true);
            setError(null);
            setLocationStatus('detecting');

            const detectedLocation = await locationService.detectAndSaveLocation();

            if (detectedLocation) {
                setLocation(detectedLocation);
                setLocationStatus('set');
            }
        } catch (err) {
            console.log('📍 Retry detection failed:', err.message);
            setError(err.message);
            setLocationStatus('failed');
        } finally {
            setLoading(false);
        }
    };

    // Search cities function
    const searchCities = async (query) => {
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
            const response = await apiClient.get(`/locations/search?q=${encodeURIComponent(query)}`);
            setAllCities(response.cities || []);
        } catch (err) {
            console.error('Failed to search cities:', err);
            setAllCities([]);
        }
    };

    return (
        <LocationContext.Provider value={{
            location,
            allCities,
            loading,
            error,
            locationStatus,
            updateLocation,
            searchCities,
            retryLocationDetection
        }}>
            {children}
        </LocationContext.Provider>
    );
};