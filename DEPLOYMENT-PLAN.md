# ITeachU Deployment Plan - Netlify

## Current Architecture Analysis

### Frontend (React + Vite)
- Port: 3001 (dev)
- Framework: React 18 with Vite
- Components: App.jsx, StandardBadge, TaskCollectionBrowser, LumoMascot
- API Calls: Makes fetch requests to backend API

### Backend (Express)
- Port: 3002 (dev)
- Framework: Express with ES modules
- API Endpoints:
  - `POST /api/chat` - Proxies requests to Anthropic API (uses API key)
  - `GET /api/collections` - Returns task collections
  - `GET /api/standards` - Returns all CT Math standards
  - `GET /api/standards/:id` - Returns specific standard by ID
  - `GET /api/standards/:id/prerequisites` - Returns prerequisite standards
  - Session management endpoints
- Environment Variables: `VITE_ANTHROPIC_API_KEY`

---

## Deployment Strategy: Two-Service Architecture

### ⚠️ CRITICAL SECURITY REQUIREMENT
**The Anthropic API key MUST NEVER be exposed to the frontend.** All API calls to Anthropic must go through your backend proxy.

---

## Option 1: Netlify (Frontend) + Render (Backend) [RECOMMENDED]

### Architecture
```
User Browser (Frontend - Netlify)
    ↓
Backend API (Render/Railway/Fly.io)
    ↓
Anthropic API
```

### Why This Approach?
- ✅ Backend runs 24/7 as a proper server
- ✅ API key stays secure on backend
- ✅ Better for real-time/long-running requests
- ✅ Easier to manage sessions and state
- ✅ No cold start delays for API calls

### Steps:

#### A. Deploy Backend to Render (or Railway/Fly.io)

1. **Create account** on Render.com (or Railway.app / Fly.io)

2. **Create New Web Service:**
   - Connect your GitHub repo
   - Root directory: `/`
   - Build command: `npm install`
   - Start command: `npm run server`
   - Environment: `Node`

3. **Configure Environment Variables** (in Render dashboard):
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx
   PORT=3002
   NODE_ENV=production
   ```

4. **Deploy** - Render will give you a URL like: `https://iteachu-api.onrender.com`

#### B. Deploy Frontend to Netlify

1. **Create `netlify.toml`** in project root:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Create environment config file**: `src/config/api.js`
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

   export const API_ENDPOINTS = {
     chat: `${API_BASE_URL}/api/chat`,
     collections: `${API_BASE_URL}/api/collections`,
     standards: `${API_BASE_URL}/api/standards`,
     sessions: `${API_BASE_URL}/api/sessions`,
   };
   ```

3. **Update all fetch calls** to use `API_ENDPOINTS`:
   - In StandardBadge.jsx: `fetch(API_ENDPOINTS.standards + '/' + standardId)`
   - In TaskCollectionBrowser.jsx: `fetch(API_ENDPOINTS.collections)`
   - In App.jsx: `fetch(API_ENDPOINTS.chat, ...)`

4. **Configure Netlify Environment Variables:**
   ```
   VITE_API_URL=https://iteachu-api.onrender.com
   ```

5. **Deploy to Netlify:**
   - Connect GitHub repo
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Deploy!

---

## Option 2: Netlify Functions (All-in-One) [Alternative]

### Architecture
```
User Browser → Netlify CDN (Frontend + Serverless Functions)
                    ↓
            Anthropic API
```

### Why This Approach?
- ✅ Single platform deployment
- ✅ Automatic scaling
- ⚠️ Cold starts (first request takes longer)
- ⚠️ More complex setup for Express app

### Steps:

1. **Create `netlify.toml`:**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
     functions = "netlify/functions"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Install Netlify CLI dependencies:**
   ```bash
   npm install @netlify/functions
   ```

3. **Convert backend to Netlify Functions:**

   Create `netlify/functions/chat.js`:
   ```javascript
   import fetch from 'node-fetch';

   export async function handler(event, context) {
     if (event.httpMethod !== 'POST') {
       return { statusCode: 405, body: 'Method Not Allowed' };
     }

     try {
       const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
       const body = JSON.parse(event.body);

       const response = await fetch('https://api.anthropic.com/v1/messages', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'x-api-key': apiKey,
           'anthropic-version': '2023-06-01'
         },
         body: JSON.stringify(body)
       });

       const data = await response.json();

       return {
         statusCode: response.status,
         headers: {
           'Content-Type': 'application/json',
           'Access-Control-Allow-Origin': '*'
         },
         body: JSON.stringify(data)
       };
     } catch (error) {
       return {
         statusCode: 500,
         body: JSON.stringify({ error: error.message })
       };
     }
   }
   ```

   Similarly create:
   - `netlify/functions/collections.js`
   - `netlify/functions/standards.js`
   - `netlify/functions/standards-by-id.js`
   - etc.

4. **Configure Environment Variables in Netlify:**
   - Go to Site settings → Environment variables
   - Add: `VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx`

5. **Update frontend fetch calls:**
   ```javascript
   fetch('/api/chat', { ... })  // No full URL needed, uses redirect
   ```

---

## Security Checklist ✅

### Environment Variables
- [ ] NEVER commit `.env` files to git (already in `.gitignore` ✓)
- [ ] Store `VITE_ANTHROPIC_API_KEY` only on backend server
- [ ] Use different API keys for dev vs production
- [ ] Rotate API keys if accidentally exposed

### API Key Protection
- [ ] API key only accessed in server-side code (server.js or Netlify functions)
- [ ] Frontend NEVER receives or stores API key
- [ ] All Anthropic API calls go through backend proxy
- [ ] Backend validates requests before proxying

### CORS Configuration
- [ ] Configure CORS to only allow your frontend domain
- [ ] In production, update server.js:
   ```javascript
   app.use(cors({
     origin: 'https://your-app.netlify.app',
     credentials: true
   }));
   ```

### Rate Limiting (Future Enhancement)
- [ ] Add rate limiting to prevent API abuse
- [ ] Consider using Anthropic's usage limits

---

## Deployment Checklist

### Pre-Deployment
- [ ] Test build locally: `npm run build`
- [ ] Test production build: `npm run preview`
- [ ] Verify all environment variables are documented
- [ ] Check `.gitignore` includes `.env` files
- [ ] Update API endpoints to use environment variables

### Backend Deployment (Render/Railway)
- [ ] Create account
- [ ] Connect GitHub repo
- [ ] Configure build/start commands
- [ ] Add environment variables (VITE_ANTHROPIC_API_KEY, PORT, NODE_ENV)
- [ ] Deploy and test API endpoints
- [ ] Note the deployed URL

### Frontend Deployment (Netlify)
- [ ] Create `netlify.toml` configuration
- [ ] Create API config file (`src/config/api.js`)
- [ ] Update all fetch calls to use config
- [ ] Connect GitHub repo to Netlify
- [ ] Add environment variables (VITE_API_URL)
- [ ] Deploy and test

### Post-Deployment Testing
- [ ] Test all user flows (login, task assignment, teaching session)
- [ ] Verify StandardBadge tooltips work
- [ ] Test TaskCollectionBrowser page
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Monitor API usage in Anthropic dashboard

---

## Recommended Deployment Timeline

1. **Day 1: Backend Setup**
   - Create Render/Railway account
   - Deploy backend
   - Test API endpoints with Postman/curl

2. **Day 2: Frontend Config**
   - Create API config files
   - Update all fetch calls
   - Test locally with production backend

3. **Day 3: Frontend Deployment**
   - Deploy to Netlify
   - Configure environment variables
   - Test full application

4. **Day 4: Polish & Monitor**
   - Fix any bugs
   - Monitor error logs
   - Set up alerts

---

## Cost Estimates (Free Tiers)

### Netlify
- ✅ Free tier: 100GB bandwidth/month, 300 build minutes
- ✅ Automatic HTTPS
- ✅ Continuous deployment from Git

### Render (Backend)
- ✅ Free tier: 750 hours/month (one instance 24/7)
- ⚠️ Spins down after 15min inactivity (cold starts ~30s)
- Paid tier ($7/mo): Always-on, no cold starts

### Railway (Alternative Backend)
- ✅ Free tier: $5 credit/month
- Similar features to Render

---

## Next Steps

1. **Choose your deployment strategy** (Option 1 recommended for MVP)
2. **Create accounts** on chosen platforms
3. **Follow the deployment steps** in order
4. **Test thoroughly** before sharing with users
5. **Monitor usage** and costs

---

## Need Help?

### Common Issues:

**"API key not found" error:**
- Check environment variable name matches exactly
- Verify environment variable is set in deployment dashboard
- Restart backend service after adding variables

**CORS errors:**
- Update CORS configuration in server.js to allow your Netlify domain
- Check that backend URL is correct in frontend config

**Build failures:**
- Check Node version compatibility
- Verify all dependencies are in package.json
- Check build logs for specific errors

**Cold starts on Render free tier:**
- First request after inactivity takes ~30 seconds
- Consider upgrading to paid tier for always-on service
- Or use Railway/Fly.io which may have different cold start behavior

---

## Questions to Answer Before Deploying:

1. **Do you want separate frontend/backend or all-in-one?**
   - Recommendation: Separate (Option 1) for simplicity and performance

2. **What's your budget?**
   - Free tier: Use Netlify + Render free tier (cold starts)
   - $7/month: Use Netlify + Render paid (no cold starts)

3. **Expected traffic?**
   - Low (< 100 users/day): Free tiers fine
   - Medium (100-1000 users/day): Consider paid backend
   - High: Need proper infrastructure planning

Let me know which option you prefer and I'll help you implement it!
