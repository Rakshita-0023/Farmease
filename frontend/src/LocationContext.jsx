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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const updateLocation = async (newLocation, persist = true) => {
        setLoading(true);
        try {
            // Ensure we have all required fields
            const locationData = {
                city: newLocation.city || 'Unknown',
                state: newLocation.state || 'Unknown',
                country: newLocation.country || 'India',
                latitude: parseFloat(newLocation.latitude),
                longitude: parseFloat(newLocation.longitude)
            };

            setLocation(locationData);
            localStorage.setItem('userLocation', JSON.stringify(locationData));

            if (persist && user) {
                try {
                    await apiClient.put('/user/location', locationData);
                } catch (err) {
                    console.error('Failed to persist location to backend:', err);
                }
            }
        } catch (err) {
            console.error('Error updating location:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const detectLocation = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocation not supported');
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;

            // Get location details from backend (which uses reverse geocoding)
            const locationInfo = await apiClient.get(`/location/detect?lat=${latitude}&lng=${longitude}`);

            await updateLocation(locationInfo);
        } catch (err) {
            console.error('Location detection failed:', err);
            setError(err.message);

            // Fallback to Hyderabad if detection fails and no saved location
            if (!location) {
                const defaultLocation = {
                    city: 'Hyderabad',
                    state: 'Telangana',
                    country: 'India',
                    latitude: 17.3850,
                    longitude: 78.4867
                };
                await updateLocation(defaultLocation, false);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initializeLocation = async () => {
            // 1. Check if user has a saved location in profile
            if (user?.city) {
                const userLoc = {
                    city: user.city,
                    state: user.state,
                    country: user.country || 'India',
                    latitude: user.latitude || 17.3850,
                    longitude: user.longitude || 78.4867
                };
                setLocation(userLoc);
                setLoading(false);
                return;
            }

            // 2. Check localStorage
            const stored = localStorage.getItem('userLocation');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setLocation(parsed);
                    setLoading(false);
                    return;
                } catch (e) {
                    localStorage.removeItem('userLocation');
                }
            }

            // 3. Detect automatically
            await detectLocation();
        };

        initializeLocation();
    }, [user]);

    return (
        <LocationContext.Provider value={{ location, loading, error, updateLocation, detectLocation }}>
            {children}
        </LocationContext.Provider>
    );
};
