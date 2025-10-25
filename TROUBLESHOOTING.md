# Deployment Troubleshooting

## Common Build Failures & Fixes

### ❌ "Module not found" errors

**Problem:** Import paths are wrong or files missing

**Fix:**
```bash
# Check all files exist
ls -la src/config/api.js
ls -la src/components/StandardBadge.jsx
ls -la src/components/TaskCollectionBrowser.jsx

# Verify build works locally
npm run build
```

### ❌ "Cannot find module 'X'"

**Problem:** Missing dependency

**Fix:**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ❌ Environment variable errors

**Problem:** `VITE_API_URL` not set or wrong

**Render (Backend):**
- Must have: `VITE_ANTHROPIC_API_KEY`
- Must have: `NODE_ENV=production`
- Must have: `PORT=3002`

**Netlify (Frontend):**
- Must have: `VITE_API_URL=https://your-backend.onrender.com`

### ❌ "process.env.VITE_ANTHROPIC_API_KEY is undefined"

**Problem:** Trying to use API key in frontend (SECURITY ISSUE!)

**Fix:** API key should ONLY be on backend. Frontend should call backend proxy.

### ❌ Build succeeds but app doesn't work

**Check:**
1. Open browser console (F12)
2. Check for CORS errors
3. Verify API_URL is correct
4. Test backend is running: `curl https://your-backend.onrender.com/api/standards`

### ❌ "Failed to fetch" errors

**Problem:** Backend URL is wrong or backend is down

**Fix:**
1. Verify backend deployed successfully on Render
2. Check Netlify env var: `VITE_API_URL` points to backend
3. Check backend logs on Render for errors

### ❌ CORS errors in browser

**Problem:** Backend not allowing frontend domain

**Fix in server.js:**
```javascript
app.use(cors({
  origin: 'https://your-site.netlify.app', // Add your Netlify URL
  credentials: true
}));
```

### ❌ Node version mismatch

**Check Node version:**
```bash
node --version  # Should be v18+ or v20+
```

**Fix on Render:**
Add `.node-version` file:
```
20
```

**Fix on Netlify:**
Add to netlify.toml:
```toml
[build.environment]
  NODE_VERSION = "20"
```

## Platform-Specific Issues

### Render (Backend)

**Build Command:** `npm install`
**Start Command:** `npm run server`

Common issues:
- Forgot to set environment variables
- Using wrong branch
- Port must be 3002 or from PORT env var

### Netlify (Frontend)

**Build Command:** `npm run build`
**Publish Directory:** `dist`

Common issues:
- VITE_API_URL not set
- Wrong publish directory (should be `dist` not `build`)
- Redirects not working (check netlify.toml)

## Debug Steps

1. **Check local build:**
```bash
npm run build
npm run preview  # Test production build locally
```

2. **Check git status:**
```bash
git status
git log --oneline -5
```

3. **Verify files committed:**
```bash
git ls-files src/config/
git ls-files src/components/
```

4. **Check deployment logs:**
- Render: Dashboard → Your service → Logs
- Netlify: Site → Deploys → Click failed deploy → Show logs

5. **Test API manually:**
```bash
# Test backend
curl https://your-backend.onrender.com/api/standards

# Test frontend can reach backend
# Open browser console and run:
fetch('https://your-backend.onrender.com/api/standards')
  .then(r => r.json())
  .then(console.log)
```

## Quick Verification Checklist

**Before deploying:**
- [ ] `npm run build` works locally
- [ ] All files committed to git
- [ ] Environment variables documented in .env.example
- [ ] No hardcoded localhost URLs in code
- [ ] CORS configured for production domain

**After deploying backend:**
- [ ] Backend URL works: `curl https://backend.com/api/standards`
- [ ] Environment variables set in Render dashboard
- [ ] Logs show "Server running on port 3002"

**After deploying frontend:**
- [ ] VITE_API_URL set in Netlify
- [ ] Site loads without errors
- [ ] Browser console shows no CORS errors
- [ ] Can see network requests to backend in DevTools

## Still Having Issues?

1. **Share the error message** - Exact text from build logs
2. **Share the platform** - Render? Netlify? Both?
3. **Share the URL** - Your deployment URL
4. **Check commit** - `git log -1` to see what was deployed

Most deployment issues are:
- Missing environment variables (90%)
- Wrong backend URL (5%)
- CORS misconfiguration (4%)
- Actual code errors (1%)
