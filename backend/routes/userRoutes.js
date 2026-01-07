const express = require('express');
const router = express.Router();

// Middleware to authenticate token (passed from server.js)
module.exports = (db, useLocalStorage, localData, authenticateToken) => {

    // GET user's profile
    router.get('/profile', authenticateToken, async (req, res) => {
        try {
            if (useLocalStorage) {
                const user = localData.users.find(u => u.id === req.user.userId);
                if (!user) return res.status(404).json({ error: 'User not found' });
                return res.json(user);
            }
            const [users] = await db.execute(
                'SELECT id, name, email, city, state, country, latitude, longitude FROM users WHERE id = ?',
                [req.user.userId]
            );

            if (users.length === 0) {
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
            if (useLocalStorage) {
                const user = localData.users.find(u => u.id === req.user.userId);
                if (!user) return res.status(404).json({ error: 'User not found' });

                if (user.city && user.latitude && user.longitude) {
                    return res.json({
                        city: user.city,
                        state: user.state,
                        country: user.country || 'India',
                        latitude: user.latitude,
                        longitude: user.longitude
                    });
                } else {
                    return res.json(null);
                }
            }

            const [users] = await db.execute(
                'SELECT city, state, country, latitude, longitude FROM users WHERE id = ?',
                [req.user.userId]
            );

            if (users.length === 0) {
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
            console.error('Get location error:', error);
            res.status(500).json({ error: 'Failed to get user location' });
        }
    });

    // UPDATE user's location
    router.put('/location', authenticateToken, async (req, res) => {
        try {
            const { city, state, country, latitude, longitude } = req.body;

            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            console.log(`📍 Updating location for user ${req.user.userId}:`, { city, state, country });

            if (!city) {
                return res.status(400).json({ error: 'City name is required' });
            }

            // Ensure lat/lng are valid numbers or null
            const lat = (latitude !== undefined && latitude !== null) ? parseFloat(latitude) : null;
            const lng = (longitude !== undefined && longitude !== null) ? parseFloat(longitude) : null;

            if (useLocalStorage) {
                const user = localData.users.find(u => u.id === req.user.userId);
                if (user) {
                    user.city = city;
                    user.state = state;
                    user.country = country || 'India';
                    user.latitude = lat;
                    user.longitude = lng;
                }
                return res.json({ success: true, message: 'Location updated successfully' });
            }

            await db.execute(
                'UPDATE users SET city = ?, state = ?, country = ?, latitude = ?, longitude = ? WHERE id = ?',
                [city, state, country || 'India', lat, lng, req.user.userId]
            );

            res.json({ success: true, message: 'Location updated successfully' });
        } catch (error) {
            console.error('❌ Update location error:', error);
            console.error('❌ SQL Message:', error.sqlMessage);
            res.status(500).json({ error: 'Failed to update location', details: error.message });
        }
    });

    return router;
};
