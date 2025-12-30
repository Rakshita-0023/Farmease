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
    const [loading, setLoading] = useState(true); // Start as loading
    const [error, setError] = useState(null);

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

    // SINGLE SOURCE OF TRUTH: Fetch saved user location from backend ONLY
    useEffect(() => {
        if (!user?.id) {
            setLocation(null);
            setLoading(false);
            return;
        }

        const loadLocation = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/user/location');
                
                if (response && response.city) {
                    setLocation({
                        city: response.city,
                        state: response.state,
                        country: response.country || 'India',
                        latitude: response.latitude,
                        longitude: response.longitude
                    });
                } else {
                    setLocation(null);
                }
            } catch (err) {
                console.error('Failed to fetch user location:', err);
                setLocation(null);
                setError('Failed to load location');
            } finally {
                setLoading(false);
            }
        };

        loadLocation();
    }, [user?.id]);

    // Manual location update (for city selector ONLY)
    const updateLocation = async (newLocation) => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const locationData = {
                city: newLocation.city,
                state: newLocation.state,
                country: newLocation.country || 'India',
                latitude: newLocation.latitude,
                longitude: newLocation.longitude
            };

            await apiClient.put('/user/location', locationData);
            setLocation(locationData);
        } catch (err) {
            console.error('Failed to update location:', err);
            setError('Failed to update location');
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
            updateLocation,
            searchCities
        }}>
            {children}
        </LocationContext.Provider>
    );
};