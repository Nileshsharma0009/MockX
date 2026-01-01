# 🚀 Production Deployment Guide

## ✅ CORS Configuration - Ready for Production

The CORS configuration is now set up to work with:
- **Local Development**: Any localhost port (flexible)
- **Production**: `https://mock-x.vercel.app` (and www variant)

## 🔧 Required Vercel Environment Variables

### Backend Project (`mockx-backend`)

Go to **Vercel Dashboard** → **Backend Project** → **Settings** → **Environment Variables**

Add/Update these variables:

```env
NODE_ENV=production
MONGODB_URL=your_production_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret_key
ALLOWED_ORIGINS=https://mock-x.vercel.app,https://www.mock-x.vercel.app
EMAIL_USER=your_email@gmail.com
EMAIL_PSAS=your_email_app_password
PORT=5000
```

**Important**: 
- Set `ALLOWED_ORIGINS` to your exact frontend URL(s)
- Use comma-separated values for multiple origins
- No spaces after commas

### Frontend Project (`mock-x`)

Go to **Vercel Dashboard** → **Frontend Project** → **Settings** → **Environment Variables**

Add/Update:

```env
VITE_API_BASE=https://mockx-backend.vercel.app
VITE_SHEET_URL=your_google_sheet_url (if using)
```

## 📝 How CORS Works

### Development Mode
- Allows any `http://localhost:*` origin automatically
- Also checks against `ALLOWED_ORIGINS` if set
- Default includes common Vite ports

### Production Mode
- Only allows origins listed in `ALLOWED_ORIGINS`
- Strict security - no localhost allowed
- Logs blocked origins for debugging

## 🧪 Testing After Deployment

1. **Test CORS**:
   - Open browser console on `https://mock-x.vercel.app`
   - Check for CORS errors
   - Should see successful API calls

2. **Test Authentication**:
   - Try login/signup
   - Check cookies are set (DevTools → Application → Cookies)
   - Verify `/api/auth/me` works

3. **Test OTP**:
   - Try sending OTP
   - Should work without CORS errors

## 🔍 Troubleshooting

If you still see CORS errors:

1. **Check Environment Variables**:
   - Verify `ALLOWED_ORIGINS` includes exact frontend URL
   - Check `NODE_ENV=production` is set
   - Redeploy after changing env vars

2. **Check URLs Match Exactly**:
   - `https://mock-x.vercel.app` (no trailing slash)
   - `https://www.mock-x.vercel.app` (if using www)
   - Case-sensitive!

3. **Check Backend Logs**:
   - Vercel Dashboard → Backend Project → Logs
   - Look for CORS warning messages
   - Should show blocked origins if any

## ✅ Ready to Deploy

Your code is now production-ready:
- ✅ CORS configured for production
- ✅ Localhost works in development
- ✅ Production URLs included in defaults
- ✅ Environment variable support
- ✅ Proper error handling

**Next Steps**:
1. Set environment variables in Vercel
2. Push to git
3. Vercel will auto-deploy
4. Test in production

