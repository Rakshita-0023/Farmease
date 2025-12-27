# FarmEase Setup Guide

This guide will help you set up FarmEase locally and deploy it to production with all the critical fixes applied.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd farmease

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

#### Backend Environment
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your database credentials:
```env
# Database Configuration (TiDB Cloud)
MYSQL_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
MYSQL_PORT=4000
MYSQL_USER=your_tidb_user
MYSQL_PASSWORD=your_tidb_password
MYSQL_DATABASE=farmease

# Security
SECRET_KEY=your-super-secret-jwt-key-here

# Server Configuration
PORT=3001
NODE_ENV=development
```

#### Frontend Environment
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
# API Configuration
VITE_API_URL=http://localhost:3001/api

# Weather API Key (Get from OpenWeatherMap)
VITE_WEATHER_API_KEY=your_openweather_api_key

# Environment
VITE_NODE_ENV=development
```

### 3. Get API Keys

#### OpenWeatherMap API Key
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to `frontend/.env` as `VITE_WEATHER_API_KEY`

#### TiDB Cloud Database (Free Tier)
1. Go to [TiDB Cloud](https://tidbcloud.com/)
2. Sign up for free account
3. Create a new cluster
4. Get connection details and add to `backend/.env`

### 4. Run the Application

#### Development Mode
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

## 🔧 What's Been Fixed

### 1. ✅ Authentication & Security
- **Real JWT Authentication**: No more demo tokens
- **Password Hashing**: bcrypt for secure password storage
- **Database Integration**: Connected to TiDB Cloud
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive form validation
- **CORS Security**: Restricted origins in production

### 2. ✅ Database & Data Persistence
- **Real Database**: TiDB Cloud MySQL connection
- **Data Models**: Users, farms, activities, forum posts
- **Data Sync**: Frontend-backend communication
- **No More localStorage**: Persistent server-side storage

### 3. ✅ API Integration Fixes
- **Weather API**: Secure environment variable configuration
- **Error Handling**: Robust fallback mechanisms
- **Caching**: Reduced API calls with smart caching
- **Rate Limiting**: Prevents API quota exhaustion

### 4. ✅ Navigation & Routing
- **Working Links**: About Us, Contact, Terms of Service pages
- **Proper Navigation**: No more placeholder links
- **Error Boundaries**: Graceful error handling
- **Empty States**: User guidance when no data exists

### 5. ✅ Mobile Responsiveness
- **Mobile-First CSS**: Optimized for mobile devices
- **Touch-Friendly**: Large buttons and tap targets
- **Responsive Grids**: Adapts to all screen sizes
- **Performance**: Optimized images and loading

### 6. ✅ Form Validation & UX
- **Client-Side Validation**: Real-time form validation
- **Server-Side Validation**: Backend data validation
- **Error Messages**: Clear, helpful error feedback
- **Loading States**: Visual feedback during operations

### 7. ✅ Security Enhancements
- **Environment Variables**: API keys secured
- **HTTPS Headers**: Security headers in production
- **XSS Protection**: Input sanitization
- **SQL Injection**: Prepared statements

## 🚀 Deployment

### Vercel Deployment (Frontend)

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Fixed critical issues"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard:
     ```
     VITE_API_URL=https://your-backend-url.com/api
     VITE_WEATHER_API_KEY=your_weather_api_key
     VITE_NODE_ENV=production
     ```

3. **Configure Custom Domain** (Optional)
   - Add your domain in Vercel settings
   - Update DNS records as instructed

### Backend Deployment Options

#### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Option 2: Render
1. Connect GitHub repository
2. Add environment variables
3. Deploy as web service

#### Option 3: Heroku
```bash
# Install Heroku CLI
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set SECRET_KEY=your-secret-key
# Add other environment variables
git push heroku main
```

## 🔍 Testing the Fixes

### 1. Authentication Test
```bash
# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Database Test
- Register a user through the UI
- Add a farm
- Check if data persists after refresh
- Verify data in TiDB Cloud dashboard

### 3. API Test
- Check weather data loads correctly
- Verify market prices display
- Test plant disease detection upload

### 4. Mobile Test
- Open on mobile device
- Test all navigation
- Verify responsive layout
- Check touch interactions

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check TiDB Cloud credentials
# Verify network connectivity
# Check firewall settings
```

#### Weather API Not Working
```bash
# Verify API key in .env file
# Check API quota limits
# Test API key directly: https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_KEY
```

#### Frontend Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build
```

#### CORS Errors
```bash
# Update backend CORS configuration
# Check frontend API URL configuration
# Verify environment variables
```

### Performance Issues

#### Slow Loading
- Enable image compression
- Implement lazy loading
- Use CDN for static assets
- Optimize bundle size

#### API Rate Limits
- Implement request caching
- Add request queuing
- Use API key rotation
- Optimize API calls

## 📊 Monitoring & Analytics

### Production Monitoring
- Set up error tracking (Sentry)
- Monitor API usage
- Track user engagement
- Performance monitoring

### Database Monitoring
- Monitor TiDB Cloud metrics
- Set up alerts for high usage
- Regular backup verification
- Query performance optimization

## 🔄 Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor API key usage
- Review error logs
- Performance optimization
- Security updates

### Scaling Considerations
- Database connection pooling
- API rate limit increases
- CDN implementation
- Load balancing
- Caching strategies

## 📞 Support

If you encounter issues:

1. Check this guide first
2. Review error logs
3. Test API endpoints directly
4. Verify environment variables
5. Check database connectivity

For additional help:
- Create GitHub issues
- Check documentation
- Review API provider status pages

---

**Note**: This setup guide addresses all the critical issues identified in the original analysis. The application now has proper authentication, database persistence, API security, and mobile responsiveness.