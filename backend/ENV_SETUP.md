# 🔧 Backend Environment Variables Setup Guide

## Quick Start

1. **Copy the example file**:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Fill in your values** in the `.env` file

3. **Never commit `.env`** - it's already in `.gitignore`

## Required Variables

### ✅ Essential (Must Have)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### 🔧 Recommended

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `ALLOWED_ORIGINS` | CORS allowed origins | Auto-detected in dev |

### 📧 Email (Optional - Only if using OTP)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `EMAIL_USER` | Gmail address | Your Gmail account |
| `EMAIL_PSAS` | Gmail App Password | See instructions below |

## 🔑 How to Get Values

### MongoDB URL
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password

### JWT Secret
Generate a secure random key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and use it as `JWT_SECRET`

### Gmail App Password (for OTP emails)
1. Go to [Google Account](https://myaccount.google.com/)
2. Security → 2-Step Verification (enable if not already)
3. App Passwords → Generate new app password
4. Select "Mail" and your device
5. Copy the 16-character password
6. Use it as `EMAIL_PSAS` (note: there's a typo in the code, but use `EMAIL_PSAS`)

## 📝 Example .env File

```env
# Development
PORT=5000
NODE_ENV=development
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/mockx?retryWrites=true&w=majority
JWT_SECRET=your_generated_32_character_secret_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
EMAIL_USER=yourname@gmail.com
EMAIL_PSAS=abcd efgh ijkl mnop
```

## 🚀 Production Setup

For production (Vercel), set these in **Vercel Dashboard** → **Settings** → **Environment Variables**:

```env
NODE_ENV=production
MONGODB_URL=your_production_mongodb_url
JWT_SECRET=your_production_jwt_secret
ALLOWED_ORIGINS=https://mock-x.vercel.app,https://www.mock-x.vercel.app
EMAIL_USER=your_production_email@gmail.com
EMAIL_PSAS=your_production_app_password
```

## ⚠️ Important Notes

1. **Never commit `.env`** - It contains secrets!
2. **Use different secrets** for development and production
3. **JWT_SECRET** must be at least 32 characters
4. **EMAIL_PSAS** is your Gmail App Password, NOT your regular password
5. **ALLOWED_ORIGINS** should not have spaces after commas

## 🧪 Testing Your Setup

After setting up `.env`, test it:

```bash
cd backend
npm run dev
```

You should see:
- ✅ MongoDB connected
- 🚀 Server running on port 5000

If you see errors, check:
- MongoDB URL is correct
- JWT_SECRET is set
- All required variables are present

