# Quick Deployment Guide

## Files Created for Deployment

✅ **netlify.toml** - Netlify configuration
✅ **src/config/api.js** - Centralized API endpoint configuration
✅ **.env.example** - Environment variable template
✅ **DEPLOYMENT-PLAN.md** - Comprehensive deployment documentation

---

## Quick Start: Deploy to Production

### Step 1: Deploy Backend (Render - Free Tier)

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `iteachu-api`
   - **Root Directory**: leave blank (root)
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Instance Type**: Free

5. Add Environment Variables:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   PORT=3002
   NODE_ENV=production
   ```

6. Click "Create Web Service"
7. **Copy the deployment URL** (e.g., `https://iteachu-api.onrender.com`)

### Step 2: Update Frontend Code

**BEFORE deploying frontend, you need to update your components to use the new API config.**

See the section below: "Code Changes Needed Before Deployment"

### Step 3: Deploy Frontend (Netlify - Free Tier)

1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: leave blank

5. Add Environment Variables (before deploying):
   - Go to "Site configuration" → "Environment variables"
   - Add: `VITE_API_URL` = `https://iteachu-api.onrender.com` (use YOUR Render URL from Step 1)

6. Click "Deploy site"
7. Your site will be live at `https://your-site-name.netlify.app`

---

## Code Changes Needed Before Deployment

**You must update your components to use the centralized API configuration.**

The `src/config/api.js` file has been created, but you need to update these files:

### Files that need updating:

1. **src/components/StandardBadge.jsx** (line ~17)
   - Change: `fetch(\`http://localhost:3002/api/standards/${standardId}\`)`
   - To: `fetch(API_ENDPOINTS.standardById(standardId))`
   - Add import: `import { API_ENDPOINTS } from '../config/api';`

2. **src/components/TaskCollectionBrowser.jsx** (line ~16)
   - Change: `fetch('http://localhost:3002/api/collections')`
   - To: `fetch(API_ENDPOINTS.collections)`
   - Add import: `import { API_ENDPOINTS } from '../config/api';`

3. **src/App.jsx** - Find all `fetch('http://localhost:3002/api/...)` calls
   - Update `/api/chat` endpoint
   - Update `/api/sessions` endpoints
   - Add import: `import { API_ENDPOINTS } from './config/api';`

### Example of how to update:

**Before:**
```javascript
fetch('http://localhost:3002/api/standards/' + standardId)
```

**After:**
```javascript
import { API_ENDPOINTS } from '../config/api';

fetch(API_ENDPOINTS.standardById(standardId))
```

---

## Testing Locally

Before deploying, test that everything works:

```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run dev
```

Visit http://localhost:3001 and verify:
- [ ] Login works
- [ ] StandardBadge tooltips appear
- [ ] TaskCollectionBrowser loads
- [ ] Teaching session works
- [ ] No console errors

---

## Deployment Checklist

### Pre-Deployment
- [ ] Updated all components to use `src/config/api.js`
- [ ] Tested locally with `npm run build` and `npm run preview`
- [ ] Committed all changes to Git
- [ ] Pushed to GitHub

### Backend Deployment (Render)
- [ ] Created Render account
- [ ] Created new Web Service
- [ ] Connected GitHub repo
- [ ] Set environment variables (VITE_ANTHROPIC_API_KEY, PORT, NODE_ENV)
- [ ] Deployed successfully
- [ ] Copied backend URL

### Frontend Deployment (Netlify)
- [ ] Created Netlify account
- [ ] Imported project from GitHub
- [ ] Set VITE_API_URL environment variable to backend URL
- [ ] Deployed successfully
- [ ] Tested production site

### Post-Deployment
- [ ] Verified all features work in production
- [ ] Tested on mobile devices
- [ ] Checked browser console for errors
- [ ] Monitored Anthropic API usage

---

## Common Issues & Solutions

### "API key not found" error
- Check that `VITE_ANTHROPIC_API_KEY` is set in Render environment variables
- Restart the Render service after adding variables

### CORS errors
- Update `server.js` to allow your Netlify domain:
  ```javascript
  app.use(cors({
    origin: 'https://your-site.netlify.app',
    credentials: true
  }));
  ```

### "Failed to fetch" errors
- Verify `VITE_API_URL` is set correctly in Netlify
- Check that backend is running on Render
- Check backend URL is correct

### Render free tier sleep (cold starts)
- Free tier "sleeps" after 15min of inactivity
- First request after sleep takes ~30 seconds
- Solution: Upgrade to paid tier ($7/mo) or use Railway/Fly.io

---

## Environment Variables Summary

### Backend (Render):
```
VITE_ANTHROPIC_API_KEY=sk-ant-your-actual-key
PORT=3002
NODE_ENV=production
```

### Frontend (Netlify):
```
VITE_API_URL=https://iteachu-api.onrender.com
```

---

## Next Steps After Deployment

1. **Set up custom domain** (optional)
   - In Netlify: Site settings → Domain management
   - In Render: Settings → Custom domains

2. **Monitor usage**
   - Anthropic Console: Check API usage and costs
   - Render Dashboard: Check backend performance
   - Netlify Analytics: Check frontend traffic

3. **Set up alerts** (optional)
   - Render: Email notifications for downtime
   - Anthropic: Usage limit alerts

---

## Getting Help

If you run into issues:
1. Check the detailed `DEPLOYMENT-PLAN.md` for more information
2. Review Render/Netlify deployment logs for errors
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

## Cost Estimate (Free Tier)

- **Netlify**: Free (100GB bandwidth/month)
- **Render**: Free with cold starts, or $7/mo for always-on
- **Anthropic API**: Pay per use (varies by usage)

**Total**: $0-7/month + API usage costs
