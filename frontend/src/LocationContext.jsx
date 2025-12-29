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
    const [markets, setMarkets] = useState([]);
    const [allCities, setAllCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all available cities for manual selection
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const cities = await apiClient.get('/market/all-cities');
                setAllCities(cities || []);
            } catch (err) {
                console.error('Failed to fetch cities list:', err);
            }
        };
        fetchCities();
    }, []);

    const updateLocation = async (newLocation, persist = true) => {
        setLoading(true);
        try {
            const locationData = {
                city: newLocation.city || newLocation.name || 'Unknown',
                state: newLocation.state || 'Unknown',
                country: newLocation.country || 'India',
                latitude: parseFloat(newLocation.latitude || newLocation.lat),
                longitude: parseFloat(newLocation.longitude || newLocation.lng),
                lat: parseFloat(newLocation.latitude || newLocation.lat),
                lng: parseFloat(newLocation.longitude || newLocation.lng),
                source: newLocation.source || 'manual'
            };

            setLocation(locationData);
            localStorage.setItem('userLocation', JSON.stringify(locationData));

            // Fetch markets for this specific location
            const marketResponse = await apiClient.get(`/market/nearby?lat=${locationData.latitude}&lng=${locationData.longitude}`);
            if (marketResponse.markets) {
                setMarkets(marketResponse.markets);
            }

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
            console.log('📍 Starting location detection...');

            if (!navigator.geolocation) {
                throw new Error('Geolocation not supported by this browser');
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            const response = await apiClient.get(`/location/resolve?lat=${latitude}&lng=${longitude}`);

            if (response.locationRequired) {
                setLocation(null);
                setError('Please select your city to view market data');
            } else {
                await updateLocation({ ...response, source: 'gps' });
            }
        } catch (err) {
            console.error('❌ Location detection failed:', err);
            setLocation(null);
            setError('Location access denied or unavailable. Please select your city manually.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initializeLocation = async () => {
            // 1. Check if user has a saved location in profile
            if (user?.city) {
                await updateLocation({
                    city: user.city,
                    state: user.state,
                    latitude: user.latitude,
                    longitude: user.longitude,
                    source: 'profile'
                }, false);
                return;
            }

            // 2. Check localStorage
            const stored = localStorage.getItem('userLocation');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    await updateLocation(parsed, false);
                    return;
                } catch (e) {
                    localStorage.removeItem('userLocation');
                }
            }

            // 3. Detect automatically
            await detectLocation();
        };

        initializeLocation();
    }, [user?.id]); // Only re-run if user ID changes

    return (
        <LocationContext.Provider value={{
            location,
            markets,
            allCities,
            loading,
            error,
            updateLocation,
            detectLocation
        }}>
            {children}
        </LocationContext.Provider>
    );
};
