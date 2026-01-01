# 🔧 Vercel CORS Fix - Production Deployment

## Problem
CORS errors in production even though code looks correct. The issue is that **environment variables might not be set correctly in Vercel**.

## ✅ Code Fix Applied
- Improved CORS handling in `backend/api/index.js`
- Better logging for debugging
- Production URLs always included in defaults

## 🔧 REQUIRED: Set Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **backend project** (`mockx-backend`)

### Step 2: Set Environment Variables
Go to **Settings** → **Environment Variables** and add/update:

#### Required Variables:
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://mock-x.vercel.app
```

#### Complete List (All Variables):
```env
NODE_ENV=production
MONGODB_URL=your_production_mongodb_url
JWT_SECRET=your_production_jwt_secret
ALLOWED_ORIGINS=https://mock-x.vercel.app
EMAIL_USER=your_email@gmail.com
EMAIL_PSAS=your_gmail_app_password
PORT=5000
```

### Step 3: Important Settings
- **Environment**: Select "Production" (and optionally "Preview" and "Development")
- **No spaces** after commas in `ALLOWED_ORIGINS`
- **Exact URL match** - `https://mock-x.vercel.app` (no trailing slash)

### Step 4: Redeploy
After setting environment variables:
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger redeploy

## 🧪 Verify It's Working

### Check Vercel Logs
1. Go to **Deployments** → Latest deployment → **Logs**
2. Look for CORS warnings (if any)
3. Should see: `✅ MongoDB connected`

### Test in Browser
1. Open `https://mock-x.vercel.app`
2. Open Browser DevTools (F12) → **Console**
3. Try to send OTP or login
4. Should **NOT** see CORS errors

### Check Network Tab
1. DevTools → **Network** tab
2. Try an API call (e.g., send OTP)
3. Check the request:
   - **Status**: Should be 200 (not CORS error)
   - **Response Headers**: Should include `Access-Control-Allow-Origin: https://mock-x.vercel.app`

## 🔍 Troubleshooting

### Still Getting CORS Errors?

1. **Check Environment Variables**:
   - Verify `ALLOWED_ORIGINS` is set correctly
   - Verify `NODE_ENV=production` is set
   - Check for typos (no spaces after commas)

2. **Check Vercel Logs**:
   - Look for CORS warning messages
   - Should show what origin was blocked and what's allowed

3. **Verify URLs Match Exactly**:
   - Frontend: `https://mock-x.vercel.app`
   - Backend: `https://mockx-backend.vercel.app`
   - `ALLOWED_ORIGINS` must match frontend URL exactly

4. **Clear Browser Cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear cache and reload

5. **Check Multiple Environments**:
   - Make sure env vars are set for "Production" environment
   - Vercel has separate env vars for Production, Preview, and Development

## ✅ Success Checklist

- [ ] `NODE_ENV=production` set in Vercel
- [ ] `ALLOWED_ORIGINS=https://mock-x.vercel.app` set in Vercel
- [ ] Backend redeployed after setting env vars
- [ ] No CORS errors in browser console
- [ ] API calls working (login, OTP, etc.)

## 📝 Quick Reference

**Backend Vercel Project**: `mockx-backend`
**Frontend Vercel Project**: `mock-x`

**Required Env Var**:
```
ALLOWED_ORIGINS=https://mock-x.vercel.app
```

**After setting env vars, ALWAYS redeploy!**

