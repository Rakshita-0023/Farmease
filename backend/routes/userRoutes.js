const express = require('express');
const router = express.Router();

// Middleware to authenticate token (passed from server.js)
module.exports = (db, storageState, localData, authenticateToken) => {

    // GET user's profile
    router.get('/profile', authenticateToken, async (req, res) => {
        try {
            if (storageState.useLocalStorage) {
                const user = localData.users.find(u => u.id === req.user.userId);
                if (!user) return res.status(404).json({ error: 'User not found' });
                return res.json(user);
            }
            const [users] = await db.query(
                'SELECT id, name, email, city, state, country, latitude, longitude FROM users WHERE id = ?',
                [req.user.userId]
            );

            if (!users || users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(users[0]);
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to get user profile' });
        }
    });

    // GET user's saved location
    router.get('/location', authenticateToken, async (req, res) => {
        try {
            console.log(`📍 GET location request for user: ${req.user.userId} (Mode: ${storageState.useLocalStorage ? 'Local' : 'DB'})`);
            
            if (!req.user || !req.user.userId) {
                console.log('❌ No authenticated user found');
                return res.status(401).json({ error: 'User not authenticated' });
            }

            if (storageState.useLocalStorage) {
                console.log(`🔍 Looking for user ${req.user.userId} in local storage`);
                console.log(`📊 Local users count: ${localData.users.length}`);
                
                const user = localData.users.find(u => u.id === req.user.userId);
                if (!user) {
                    console.log(`❌ User ${req.user.userId} not found in local storage`);
                    return res.status(404).json({ error: 'User not found' });
                }

                console.log(`✅ Found user: ${user.name}, location: ${user.city}`);

                if (user.city && user.latitude && user.longitude) {
                    const locationData = {
                        city: user.city,
                        state: user.state,
                        country: user.country || 'India',
                        latitude: user.latitude,
                        longitude: user.longitude
                    };
                    console.log(`✅ Returning saved location:`, locationData);
                    return res.json(locationData);
                } else {
                    console.log(`📍 No saved location for user ${req.user.userId}`);
                    return res.json(null);
                }
            }

            const [users] = await db.query(
                'SELECT city, state, country, latitude, longitude FROM users WHERE id = ?',
                [req.user.userId]
            );

            if (!users || users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = users[0];
            if (user.city && user.latitude && user.longitude) {
                res.json({
                    city: user.city,
                    state: user.state,
                    country: user.country || 'India',
                    latitude: user.latitude,
                    longitude: user.longitude
                });
            } else {
                res.json(null);
            }
        } catch (error) {
            console.error('❌ Get location error:', error);
            res.status(500).json({ error: 'Failed to get user location', details: error.message });
        }
    });

    // UPDATE user's location
    router.put('/location', authenticateToken, async (req, res) => {
        try {
            const { city, state, country, latitude, longitude } = req.body;

            if (!req.user || !req.user.userId) {
                console.log('❌ PUT location: User not authenticated');
                return res.status(401).json({ error: 'User not authenticated' });
            }

            console.log(`📍 PUT location request for user ${req.user.userId}:`, { city, state, country, latitude, longitude });
            console.log(`📊 Mode: ${storageState.useLocalStorage ? 'Local Storage' : 'Database'}`);

            if (!city) {
                console.log('❌ PUT location: City name is required');
                return res.status(400).json({ error: 'City name is required' });
            }

            // Ensure lat/lng are valid numbers or null
            const lat = (latitude !== undefined && latitude !== null) ? parseFloat(latitude) : null;
            const lng = (longitude !== undefined && longitude !== null) ? parseFloat(longitude) : null;

            if (storageState.useLocalStorage) {
                console.log(`🔍 Looking for user ${req.user.userId} in local storage to update`);
                console.log(`📊 Local users count: ${localData.users.length}`);
                
                const user = localData.users.find(u => u.id === req.user.userId);
                if (!user) {
                    console.log(`❌ User ${req.user.userId} not found in local storage for update`);
                    return res.status(404).json({ error: 'User not found' });
                }

                console.log(`✅ Found user for update: ${user.name}`);
                
                user.city = city;
                user.state = state;
                user.country = country || 'India';
                user.latitude = lat;
                user.longitude = lng;
                
                console.log(`✅ Updated user location in local storage:`, {
                    city: user.city,
                    state: user.state,
                    latitude: user.latitude,
                    longitude: user.longitude
                });
                
                return res.json({ success: true, message: 'Location updated successfully' });
            }

            await db.execute(
                'UPDATE users SET city = ?, state = ?, country = ?, latitude = ?, longitude = ? WHERE id = ?',
                [city, state, country || 'India', lat, lng, req.user.userId]
            );

            console.log(`✅ Updated user location in database`);
            res.json({ success: true, message: 'Location updated successfully' });
        } catch (error) {
            console.error('❌ Update location error:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                sqlMessage: error.sqlMessage
            });
            res.status(500).json({ error: 'Failed to update location', details: error.message });
        }
    });

    return router;
};
