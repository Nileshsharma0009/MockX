# Frontend-Backend Integration with Axios

## Setup Complete ✅

### What's been set up:

1. **Axios API utility** (`src/utils/api.js`)
   - Centralized axios instance with base URL pointing to backend
   - Auth endpoints for signup, login, and logout
   - Automatic cookie handling with `withCredentials: true`

2. **Signup Page** (`src/pages/Signup.jsx`)
   - Uses `authAPI.signup()` for form submission
   - Better error handling from axios responses
   - Loading state while request is pending

3. **Login Page** (`src/pages/Login.jsx`)
   - Uses `authAPI.login()` for form submission
   - Consistent error handling
   - Token automatically stored in HTTP-only cookies

### How to Test Locally:

#### Terminal 1 - Start Backend:
```bash
cd backend
npm run dev
```
You should see: `Server is running on port 6000`

#### Terminal 2 - Start Frontend:
```bash
cd frontend/web
npm run dev
```
You should see: `VITE v... ready in ... ms` with a local URL (usually `http://localhost:5173`)

#### In Browser:

1. **Test Signup:**
   - Navigate to `/signup`
   - Fill form: name, email, password, confirm password
   - Click "Create account"
   - Should redirect to home page on success

2. **Test Login:**
   - Navigate to `/login`
   - Fill form: email, password (use same credentials from signup)
   - Click "Log in"
   - Should redirect to home page on success
   - Check DevTools → Application → Cookies for `token` cookie

3. **Test Logout:**
   - Make sure you're logged in
   - Find logout button and click it
   - Should clear token cookie and redirect

#### Debugging:

If you see errors:
1. Check **Browser Console** (F12 → Console tab) for error messages
2. Check **Network Tab** (F12 → Network) to see request/response
3. Check **Backend Console** for server-side errors
4. Make sure backend is running on `http://localhost:6000`
5. Make sure frontend `.env.local` has `VITE_API_BASE=http://localhost:6000`

### API Endpoints Used:

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login existing user
- `POST /api/auth/logout` - Logout and clear cookie

All requests automatically include credentials (cookies) via axios configuration.
