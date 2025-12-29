# FarmEase Architecture Overhaul - Implementation Plan

## Critical Rules
1. **DO NOT TOUCH AUTHENTICATION** - Login, Register, Google OAuth, CORS are working. Leave them alone.
2. **NO HARDCODED DATA** - Every piece of data must come from backend API
3. **Frontend = Dumb Renderer** - Backend is the single source of truth
4. **Proper Error States** - Loading, Error, Empty, Success for every API call

## Phase 1: Backend Location System (PRIORITY 1)

### New Endpoints Required:
```javascript
GET  /api/locations/cities
POST /api/user/location
GET  /api/user/location
```

### Database Schema Update:
```sql
-- Users table already has: city, state, country, latitude, longitude
-- Just need to ensure they're being used properly
```

### Implementation:
1. Create `/api/locations/cities` - Returns list of supported cities
2. Update `/api/user/location` (GET) - Return user's saved location
3. Update `/api/user/location` (POST/PUT) - Save user's location choice
4. Link location to user on login

## Phase 2: Dashboard Backend (PRIORITY 2)

### New Endpoint:
```javascript
GET /api/dashboard/summary
```

### Response Schema:
```json
{
  "totalFarms": 0,
  "activeCrops": 0,
  "readyToHarvest": 0,
  "avgHealth": null,
  "recentActivity": []
}
```

### Implementation:
1. Calculate real metrics from user's farms
2. Return null for empty states
3. Frontend shows onboarding CTA when null

## Phase 3: Market Page Cleanup (PRIORITY 3)

### Current Issues:
- Hardcoded city lists
- Static market data
- Fake refresh functionality

### Fix:
1. Use existing `/api/market/cities` endpoint
2. Use existing `/api/market/nearby` endpoint
3. Remove all hardcoded city arrays
4. Remove static market data

## Phase 4: Advanced/Analytics Honesty (PRIORITY 4)

### Options:
**Option A (Recommended):** Add "Preview Mode" banner
**Option B:** Implement real analytics endpoints

### If Option B:
```javascript
GET /api/analytics/regions
POST /api/analytics/analyze
```

## Phase 5: Plant Doctor Honesty (PRIORITY 5)

### Current State:
- Fake AI results
- Static confidence scores

### Fix Options:
**Option A:** Show "Coming Soon" message
**Option B:** Implement real diagnosis API

### If Option B:
```javascript
POST /api/plant/diagnose
```

## Phase 6: Global State Management

### Create Unified Context:
```javascript
AppContext {
  user,
  location,
  permissions,
  featureFlags
}
```

### Remove:
- Page-level location state
- Duplicate city selections
- Props drilling

## Implementation Order

### Week 1: Critical Backend
1. ✅ Auth (DONE - DO NOT TOUCH)
2. [ ] Location endpoints
3. [ ] Dashboard summary endpoint
4. [ ] Link location to user on login

### Week 2: Frontend Cleanup
1. [ ] Remove all hardcoded cities
2. [ ] Remove all hardcoded market data
3. [ ] Implement proper loading states
4. [ ] Implement proper error states

### Week 3: Honesty Pass
1. [ ] Add "Preview Mode" to Analytics
2. [ ] Add "Coming Soon" to Plant Doctor (or implement real API)
3. [ ] Remove all fake metrics
4. [ ] Add onboarding CTAs

## Files to Modify

### Backend:
- `backend/server.js` - Add location endpoints, dashboard summary
- `backend/routes/locationRoutes.js` - NEW
- `backend/routes/dashboardRoutes.js` - NEW

### Frontend:
- `frontend/src/LocationContext.jsx` - Simplify, use backend
- `frontend/src/components/Dashboard.jsx` - Use real API
- `frontend/src/components/Market.jsx` - Remove hardcoded data
- `frontend/src/components/AdvancedFeatures.jsx` - Add preview mode
- `frontend/src/components/PlantDoctor.jsx` - Add coming soon or real API

## Success Criteria

### Before:
- Location fails silently
- Dashboard shows 0s
- Markets show hardcoded data
- Analytics shows fake numbers
- Plant Doctor shows fake AI

### After:
- Location persists across sessions
- Dashboard shows real data or onboarding
- Markets show only backend data
- Analytics shows preview mode or real data
- Plant Doctor shows coming soon or real AI

## Next Steps
1. Start with Phase 1 (Location System)
2. Do NOT touch authentication
3. Remove hardcoded data systematically
4. Add proper error handling everywhere
