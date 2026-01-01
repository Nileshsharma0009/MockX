# 🚀 Production Deployment Checklist

## ✅ Pre-Deployment Verification

### Security
- [x] `.env` files are in `.gitignore` (verified)
- [x] No hardcoded secrets in code (verified)
- [x] JWT_SECRET uses environment variable (verified)
- [x] MongoDB URL uses environment variable (verified)
- [x] Cookie settings use `secure` flag in production (verified)

### CORS & Routes
- [x] CORS configured with environment variables
- [x] All API routes properly configured
- [x] Frontend API calls use environment variables
- [x] No hardcoded localhost URLs in production code

### Code Quality
- [x] Error handling in place
- [x] Server properly configured
- [x] Database connection with error handling

---

## 🔧 Required Environment Variables

### Backend (Vercel/Production)
Set these in your hosting platform's environment variables:

```env
PORT=5000
NODE_ENV=production
MONGODB_URL=your_production_mongodb_url
JWT_SECRET=your_strong_jwt_secret_key
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://mock-x.vercel.app
EMAIL_USER=your_email@gmail.com
EMAIL_PSAS=your_email_app_password
```

### Frontend (Vercel/Production)
Set these in your hosting platform's environment variables:

```env
VITE_API_BASE=https://your-backend-api-url.com
VITE_SHEET_URL=your_google_sheet_url (if using)
```

---

## ⚠️ Important Notes

1. **CORS Origins**: Make sure `ALLOWED_ORIGINS` includes your production frontend URL
2. **API Base URL**: Update `VITE_API_BASE` in frontend to point to your production backend
3. **Cookie Settings**: Cookies will automatically use `secure: true` and `sameSite: "none"` in production (when `NODE_ENV=production`)
4. **Database**: Ensure MongoDB connection string is for production database

---

## 🧪 Testing Before Push

1. ✅ All routes working locally
2. ✅ CORS working with environment variables
3. ✅ Authentication flow working
4. ✅ No console errors in browser
5. ✅ Environment variables properly loaded

---

## 📝 Git Push Checklist

- [x] `.env` files are NOT committed (in .gitignore)
- [x] No secrets in code
- [x] All environment variables documented
- [x] CORS configured for production
- [x] Routes verified

**You're good to push! 🚀**

