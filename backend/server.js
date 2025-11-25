const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5177', 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5177'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

let users = {};
let farms = {};
let userCounter = 1;
let farmCounter = 1;

// Root route
app.get('/', (req, res) => {
  console.log('Root endpoint accessed');
  res.json({ message: '🌾 FarmEase API Server is running!', status: 'OK' });
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint accessed');
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, location } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  if (users[email]) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }
  
  const userId = userCounter++;
  users[email] = { id: userId, name, email, password, location: location || '' };
  console.log('New user registered:', { email, name, userId });
  console.log('Total users now:', Object.keys(users).length);
  
  const token = jwt.sign({ user_id: userId }, process.env.SECRET_KEY || 'fallback-secret', { expiresIn: '30d' });
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: { id: userId, name, email, location: location || '' }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Missing email or password' });
  }
  
  const user = users[email];
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ user_id: user.id }, process.env.SECRET_KEY || 'fallback-secret', { expiresIn: '30d' });
  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, location: user.location }
  });
});

// Farm routes
app.get('/api/farms', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    const userFarms = Object.values(farms).filter(farm => farm.user_id === payload.user_id);
    res.json(userFarms);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/weather', (req, res) => {
  const location = req.query.location || 'Delhi';
  res.json({
    temperature: 28,
    humidity: 65,
    windSpeed: 12,
    condition: 'Partly Cloudy',
    location,
    forecast: [
      { day: 'Today', high: 32, low: 24, condition: 'Sunny' },
      { day: 'Tomorrow', high: 30, low: 22, condition: 'Cloudy' }
    ]
  });
});

// Debug routes
app.get('/debug/users', (req, res) => {
  console.log('Debug: Current users:', users);
  res.json({ users, count: Object.keys(users).length });
});

app.get('/debug/farms', (req, res) => {
  console.log('Debug: Current farms:', farms);
  res.json({ farms, count: Object.keys(farms).length });
});

// Test route to add a dummy user
app.get('/test/add-user', (req, res) => {
  const testUser = {
    id: userCounter++,
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    location: 'Test Location'
  };
  users['test@example.com'] = testUser;
  console.log('Test user added:', testUser);
  res.json({ message: 'Test user added', user: testUser, totalUsers: Object.keys(users).length });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🌾 FarmEase API Server running on port ${PORT}`);
});