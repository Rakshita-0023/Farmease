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
    const [loading, setLoading] = useState(false);
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

    // Fetch saved user location (ONLY when user is authenticated)
    useEffect(() => {
        if (!user?.id) {
            setLocation(null);
            return;
        }

        const fetchUserLocation = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/user/profile');
                if (response.city) {
                    setLocation({
                        city: response.city,
                        state: response.state,
                        country: response.country || 'India',
                        latitude: response.latitude,
                        longitude: response.longitude
                    });
                }
            } catch (err) {
                console.error('Failed to fetch user location:', err);
                setError('Failed to load location');
            } finally {
                setLoading(false);
            }
        };

        fetchUserLocation();
    }, [user?.id]);

    // Manual location update (for city selector)
    const updateLocation = async (newLocation) => {
        try {
            setLoading(true);
            const locationData = {
                city: newLocation.city,
                state: newLocation.state,
                country: newLocation.country || 'India',
                latitude: newLocation.latitude,
                longitude: newLocation.longitude
            };

            // Save to backend if user is authenticated
            if (user?.id) {
                await apiClient.put('/user/location', locationData);
            }

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
            // Reset to default cities
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

    // Refresh location from backend
    const refreshLocation = async () => {
        if (!user?.id) return;
        
        try {
            setLoading(true);
            const response = await apiClient.get('/user/profile');
            if (response.city) {
                setLocation({
                    city: response.city,
                    state: response.state,
                    country: response.country || 'India',
                    latitude: response.latitude,
                    longitude: response.longitude
                });
            }
        } catch (err) {
            console.error('Failed to refresh location:', err);
            setError('Failed to refresh location');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LocationContext.Provider value={{
            location,
            allCities,
            loading,
            error,
            updateLocation,
            refreshLocation,
            searchCities
        }}>
            {children}
        </LocationContext.Provider>
    );
};