# 🔧 CORS Fix for Production

## Problem
CORS errors in production:
- `Access-Control-Allow-Origin` header missing
- Preflight OPTIONS requests failing

## ✅ Fix Applied

1. **Added CORS handling in Vercel handler** (`backend/api/index.js`)
   - CORS headers now set BEFORE Express app handles request
   - OPTIONS preflight requests handled early
   - Added debugging logs

2. **Default allowed origins include production URL**
   - `https://mock-x.vercel.app` is in the default list

## 🔧 Required Action in Vercel

### Backend Environment Variables
Go to your Vercel backend project settings and set:

```env
ALLOWED_ORIGINS=https://mock-x.vercel.app,http://localhost:5173
```

**OR** if you want to allow multiple production domains:
```env
ALLOWED_ORIGINS=https://mock-x.vercel.app,https://www.mock-x.vercel.app,http://localhost:5173
```

### Steps:
1. Go to Vercel Dashboard
2. Select your backend project (`mockx-backend`)
3. Go to **Settings** → **Environment Variables**
4. Add/Update `ALLOWED_ORIGINS` with your frontend URL
5. **Redeploy** the backend

## 🧪 Testing

After redeploying:
1. Check browser console - CORS errors should be gone
2. Test login/signup - should work
3. Test OTP sending - should work
4. Check Network tab - OPTIONS requests should return 200

## 📝 Notes

- The fix handles CORS at the Vercel serverless function level
- CORS headers are set before any Express middleware runs
- OPTIONS requests are handled immediately (no Express processing)
- Default fallback includes production URL if env var not set

## 🚀 Next Steps

1. ✅ Code fix applied (committed)
2. ⏳ Set `ALLOWED_ORIGINS` in Vercel backend environment variables
3. ⏳ Redeploy backend
4. ⏳ Test in production

