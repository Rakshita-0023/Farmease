# Production Login Fix - Summary

## Problem Diagnosis
The user reports that in production (Vercel), the login request is going to `/login` instead of `https://farmease-tqgy.onrender.com/api/auth/login`, resulting in a 404 error from Vercel.

## Root Cause
The `VITE_API_BASE_URL` environment variable is not properly set in Vercel's production environment, causing `API_BASE_URL` to be `undefined`, which makes the URL construction fail.

## Current Code Status
1. ✅ `frontend/src/config.js` - Correctly configured with strict production check
2. ✅ `frontend/src/components/Login.jsx` - Uses `apiClient.post('/auth/login', payload)`
3. ✅ `backend/routes/authRoutes.js` - Routes are correctly defined
4. ✅ `backend/server.js` - Routes mounted at `/api/auth`

## Required Actions

### 1. Verify Vercel Environment Variable
Go to Vercel Dashboard → Project → Settings → Environment Variables

**Add/Update:**
- Key: `VITE_API_BASE_URL`
- Value: `https://farmease-tqgy.onrender.com/api`
- Scope: Production
- **Important:** No quotes, no trailing slash

### 2. Manual Redeploy
After setting the environment variable:
1. Go to Deployments tab
2. Click the three dots on the latest deployment
3. Select "Redeploy"
4. **Do NOT** rely on auto-deploy

### 3. Verification Steps
After deployment completes:

**A. Check Console Logs:**
```javascript
// Should see:
IS_PROD: true
API_ENV_VAR: https://farmease-tqgy.onrender.com/api
RESOLVED_BASE: https://farmease-tqgy.onrender.com/api
```

**B. Check Network Tab:**
When clicking login, you should see:
```
POST https://farmease-tqgy.onrender.com/api/auth/login
Status: 200 (or 401 if credentials wrong)
Type: fetch
```

**C. If Still Broken:**
If you see `undefined` in console logs or `/login` in network tab:
- The environment variable was not picked up during build
- Clear Vercel's build cache
- Redeploy again

## Why This Happens
Vite bakes environment variables at **build time**, not runtime. If the variable is missing during the build, the entire deployed bundle will have the wrong value. Redeploying the backend does nothing for frontend bugs.

## Emergency Fallback
If Vercel continues to not pick up the environment variable, we can add a hardcoded fallback (not recommended but works):

```javascript
export const API_BASE_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_BASE_URL || 'https://farmease-tqgy.onrender.com/api')
  : "/api";
```

However, this defeats the purpose of environment variables and should only be used as a last resort.
