# Vercel Deployment Guide for FarmEase

## ✅ VERCEL-READY CONFIGURATION COMPLETE

Your FarmEase project is now configured for Vercel deployment with both frontend and backend.

### 📁 Project Structure
```
Farmease/
├── api/
│   └── index.js          # Vercel serverless function entry point
├── backend/
│   ├── server.js         # Express app (now exports for Vercel)
│   ├── dbConnect.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── dist/             # Build output
│   └── package.json
└── vercel.json           # Vercel configuration
```

### 🚀 Deployment Steps

#### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

#### 2. Login to Vercel
```bash
vercel login
```

#### 3. Deploy from Project Root
```bash
cd /Users/polana.rakshita2024nstrishihood.edu.in/Desktop/Farmease
vercel
```

#### 4. Set Environment Variables in Vercel Dashboard
After first deployment, go to your Vercel project settings and add:

**Required Environment Variables:**
- `MYSQL_HOST` - Your TiDB Cloud host
- `MYSQL_PORT` - 4000
- `MYSQL_USER` - Your database user
- `MYSQL_PASSWORD` - Your database password
- `MYSQL_DATABASE` - test
- `SECRET_KEY` - farmease-secret-key-2024
- `VITE_GOOGLE_CLIENT_ID` - 103709757998-sbm0e7k1h5e9a8d6mn3jaccivpkut6h9.apps.googleusercontent.com

#### 5. Update Google OAuth Authorized Origins
In Google Cloud Console, add your Vercel domain:
- `https://your-project.vercel.app`
- `https://your-custom-domain.com` (if applicable)

### 🔧 How It Works

1. **Frontend**: Built as static files and served from `/frontend/dist`
2. **Backend**: Runs as serverless functions under `/api/*`
3. **API Routes**: All `/api/*` requests are routed to the Express app
4. **Database**: Connects to your TiDB Cloud MySQL database

### 📝 Local Development (Unchanged)
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### ⚠️ Important Notes

1. **Serverless Functions**: Each API request runs in a new serverless function instance
2. **Cold Starts**: First request may be slower (1-2 seconds)
3. **Connection Pooling**: Database connections are managed per function invocation
4. **File Uploads**: Store in cloud storage (Cloudinary, AWS S3) not local filesystem
5. **Sessions**: Use JWT tokens (already implemented) instead of express-session

### 🎯 Production Checklist

- [ ] Build frontend locally to test: `cd frontend && npm run build`
- [ ] Test API locally: `cd backend && npm run dev`
- [ ] Set all environment variables in Vercel dashboard
- [ ] Update Google OAuth origins with Vercel URL
- [ ] Deploy: `vercel --prod`
- [ ] Test all features on production URL

### 🐛 Troubleshooting

**Build Fails:**
- Check `frontend/package.json` has `"build": "vite build"`
- Ensure all dependencies are in `dependencies` not `devDependencies`

**API 500 Errors:**
- Check Vercel function logs in dashboard
- Verify environment variables are set correctly
- Ensure database is accessible from Vercel's IP ranges

**CORS Issues:**
- Vercel automatically handles CORS for same-origin requests
- For custom domains, update CORS settings in `backend/server.js`

### 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
