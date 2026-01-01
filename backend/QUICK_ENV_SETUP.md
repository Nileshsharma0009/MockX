# ⚡ Quick .env Setup for Backend

## Step 1: Create .env File

**Option A - Copy template:**
```powershell
cd backend
copy env.template .env
```

**Option B - Create manually:**
Create a new file named `.env` in the `backend` folder

## Step 2: Fill in Your Values

Open `.env` and replace the placeholder values:

```env
# Server
PORT=5000
NODE_ENV=development

# Database - REQUIRED
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# JWT Secret - REQUIRED (generate with command below)
JWT_SECRET=paste_your_generated_secret_here

# CORS - For local development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,https://mock-x.vercel.app

# Email - Optional (only if using OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PSAS=your_gmail_app_password
```

## Step 3: Generate JWT Secret

Run this command to generate a secure JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as `JWT_SECRET` in your `.env` file.

## Step 4: Get MongoDB URL

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create/Select your cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Paste in `.env` as `MONGODB_URL`

## Step 5: Test

```powershell
npm run dev
```

You should see:
- ✅ MongoDB connected
- 🚀 Server running on port 5000

## ✅ Minimum Required Variables

For the app to work, you MUST set:
- `MONGODB_URL` - Database connection
- `JWT_SECRET` - Authentication secret

Everything else has defaults or is optional.

## 📝 Example Complete .env

```env
PORT=5000
NODE_ENV=development
MONGODB_URL=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/mockx?retryWrites=true&w=majority
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,https://mock-x.vercel.app
EMAIL_USER=myemail@gmail.com
EMAIL_PSAS=abcd efgh ijkl mnop
```

## ⚠️ Important

- **Never commit `.env`** - It's in `.gitignore`
- Use different values for development and production
- Keep your secrets safe!

