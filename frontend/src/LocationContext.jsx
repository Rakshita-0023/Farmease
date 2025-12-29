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
            console.log('📍 Starting location detection...');

            if (!navigator.geolocation) {
                throw new Error('Geolocation not supported by this browser');
            }

            console.log('📍 Requesting GPS coordinates...');
            // Get GPS coordinates from browser
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            console.log('📍 GPS coordinates obtained:', { latitude, longitude });

            // Get location details from backend
            console.log('📍 Calling backend API...');
            const locationInfo = await apiClient.get(`/location/detect?lat=${latitude}&lng=${longitude}`);
            console.log('📍 Backend response:', locationInfo);

            await updateLocation(locationInfo);

            // Fetch nearby markets after location is detected
            console.log('📍 Fetching nearby markets...');
            const marketResponse = await apiClient.get(`/market/nearby?lat=${latitude}&lng=${longitude}`);
            console.log('📊 Market response:', marketResponse);
            
            if (marketResponse.markets) {
                setMarkets(marketResponse.markets);
            }

            console.log('✅ Location detection completed successfully');
        } catch (err) {
            console.error('❌ Location detection failed:', err);
            setError(err.message);

            // Fallback to Hyderabad if detection fails and no saved location
            if (!location) {
                console.log('📍 Using fallback location: Hyderabad');
                const defaultLocation = {
                    city: 'Hyderabad',
                    state: 'Telangana',
                    country: 'India',
                    latitude: 17.3850,
                    longitude: 78.4867
                };
                await updateLocation(defaultLocation, false);
                
                // Fetch markets for fallback location
                try {
                    const fallbackMarkets = await apiClient.get(`/market/nearby?lat=17.3850&lng=78.4867`);
                    if (fallbackMarkets.markets) {
                        setMarkets(fallbackMarkets.markets);
                    }
                } catch (marketErr) {
                    console.error('❌ Failed to fetch fallback markets:', marketErr);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initializeLocation = async () => {
            console.log('🚀 LocationContext initializing...');
            
            // 1. Check if user has a saved location in profile
            if (user?.city) {
                console.log('📍 Using user profile location:', user.city);
                const userLoc = {
                    city: user.city,
                    state: user.state,
                    country: user.country || 'India',
                    latitude: user.latitude || 17.3850,
                    longitude: user.longitude || 78.4867
                };
                setLocation(userLoc);
                
                // Fetch markets for user location
                try {
                    const marketResponse = await apiClient.get(`/market/nearby?lat=${userLoc.latitude}&lng=${userLoc.longitude}`);
                    if (marketResponse.markets) {
                        setMarkets(marketResponse.markets);
                    }
                } catch (marketErr) {
                    console.error('❌ Failed to fetch user location markets:', marketErr);
                }
                
                setLoading(false);
                return;
            }

            // 2. Check localStorage
            const stored = localStorage.getItem('userLocation');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    console.log('📍 Using stored location:', parsed);
                    setLocation(parsed);
                    
                    // Fetch markets for stored location
                    try {
                        const marketResponse = await apiClient.get(`/market/nearby?lat=${parsed.latitude}&lng=${parsed.longitude}`);
                        if (marketResponse.markets) {
                            setMarkets(marketResponse.markets);
                        }
                    } catch (marketErr) {
                        console.error('❌ Failed to fetch stored location markets:', marketErr);
                    }
                    
                    setLoading(false);
                    return;
                } catch (e) {
                    console.log('📍 Invalid stored location, removing...');
                    localStorage.removeItem('userLocation');
                }
            }

            // 3. Detect automatically
            console.log('📍 No saved location found, detecting...');
            await detectLocation();
        };

        initializeLocation();
    }, [user]);

    return (
        <LocationContext.Provider value={{ location, markets, loading, error, updateLocation, detectLocation }}>
            {children}
        </LocationContext.Provider>
    );
};
