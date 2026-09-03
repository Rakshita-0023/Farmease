const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { OAuth2Client } = require('google-auth-library')

// Create router factory function
const createAuthRoutes = (findUser, createUser) => {
  const router = express.Router()

  // Test route
  router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes are working!' })
  })

  // Register endpoint
  router.post('/register', async (req, res) => {
    try {
      const { name, email, password } = req.body

      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' })
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' })
      }

      // Check if user exists
      const existing = await findUser(email)
      if (existing) {
        return res.status(400).json({ error: 'User already exists' })
      }

      console.log('🔐 Hashing password...')
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)
      console.log('🔐 Password hashed successfully')

      // Create user
      const result = await createUser(name, email, passwordHash)

      // Generate token
      const token = jwt.sign(
        { userId: result.insertId, email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      res.json({
        success: true,
        token,
        user: {
          id: result.insertId,
          name,
          email,
          city: null,
          state: null,
          country: 'India',
          latitude: null,
          longitude: null
        }
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({ error: 'Registration failed' })
    }
  })

  // Login endpoint
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
      }

      // Find user
      const user = await findUser(email)
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      console.log('🔐 Verifying password...')
      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash)
      console.log('🔐 Password verification result:', validPassword)
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          city: user.city,
          state: user.state,
          country: user.country,
          latitude: user.latitude,
          longitude: user.longitude
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Login failed' })
    }
  })

  // Google OAuth endpoint
  router.post('/google', async (req, res) => {
    try {
      const { token } = req.body;

      // Detailed validation
      if (!token) {
        console.error('❌ Google Auth: No token provided');
        return res.status(400).json({
          success: false,
          error: 'Token is required',
          details: 'No Google ID token found in request body'
        });
      }

      // Get Google Client ID from environment (check multiple possible names)
      const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

      console.log('🔍 Debug: Checking Google Config...');
      console.log('   - GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Found (Starts with ' + process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...)' : 'Not Found');
      console.log('   - VITE_GOOGLE_CLIENT_ID:', process.env.VITE_GOOGLE_CLIENT_ID ? 'Found (Starts with ' + process.env.VITE_GOOGLE_CLIENT_ID.substring(0, 10) + '...)' : 'Not Found');

      if (!googleClientId) {
        console.error('❌ Google Auth: Google Client ID not found in environment variables');
        return res.status(500).json({
          success: false,
          error: 'Server configuration error',
          details: 'Google Client ID not configured on server. Ensure GOOGLE_CLIENT_ID is set in your environment variables or .env file.'
        });
      }

      console.log('🔐 Verifying Google token...');
      console.log('📋 Using Client ID:', googleClientId.substring(0, 20) + '...');

      // Initialize OAuth2Client with the correct client ID
      const client = new OAuth2Client(googleClientId);

      // Verify the ID token
      let ticket;
      try {
        ticket = await client.verifyIdToken({
          idToken: token,
          audience: googleClientId,
        });
      } catch (verifyError) {
        console.error('❌ Token verification failed:', verifyError.message);
        return res.status(401).json({
          success: false,
          error: 'Invalid Google token',
          details: verifyError.message
        });
      }

      const payload = ticket.getPayload();
      const { email, name, sub: googleId, picture: photoUrl } = payload;

      if (!email) {
        console.error('❌ No email in Google token payload');
        return res.status(400).json({
          success: false,
          error: 'Email not found',
          details: 'Google account does not have an email address'
        });
      }

      console.log('✅ Token verified for:', email);

      // Check if user exists
      let user = await findUser(email);

      if (!user) {
        console.log('📝 Creating new user for:', email);
        // Create new user (password is random/dummy for google users)
        const dummyPassword = crypto.randomBytes(32).toString('base64url');
        const passwordHash = await bcrypt.hash(dummyPassword, 10);

        const result = await createUser(name || email.split('@')[0], email, passwordHash);
        user = { id: result.insertId, name: name || email.split('@')[0], email };
        console.log('✅ New user created with ID:', user.id);
      } else {
        console.log('✅ Existing user found:', user.id);
      }

      // Generate JWT token
      const authToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('✅ Google authentication successful for:', email);

      res.json({
        success: true,
        token: authToken,
        user: {
          id: user.id,
          name: user.name || name,
          email: user.email,
          city: user.city,
          state: user.state,
          country: user.country,
          latitude: user.latitude,
          longitude: user.longitude,
          photoUrl
        }
      });
    } catch (error) {
      console.error('❌ Google auth error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Google authentication failed',
        details: error.message,
        type: error.name
      });
    }
  });

  return router
}

module.exports = createAuthRoutes
