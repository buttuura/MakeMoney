# Render.com Deployment Guide for GetCash Backend

## Step 1: Create Render Account
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with your GitHub account (recommended)

## Step 2: Deploy Web Service
1. **Click "New +" button** (top right corner)
2. **Select "Web Service"**
3. **Choose "Build and deploy from a Git repository"**
4. **Connect GitHub** (if not already connected)
5. **Find and select your repository:** `buttuura/GetCash-backend`

## Step 3: Configure Deployment Settings

### Basic Settings:
- **Name:** `getcash-backend` (or any name you prefer)
- **Region:** Choose closest to your location
- **Branch:** `master`
- **Root Directory:** Leave empty (or `.`)
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Plan Selection:
- **Select "Free"** (0$/month)
- Note: Free tier sleeps after 15 min of inactivity, wakes up on first request

## Step 4: Environment Variables (CRITICAL!)
Click **"Advanced"** and add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `your-super-secret-jwt-key-12345` |
| `PORT` | `10000` |

**Important:** Replace `your-super-secret-jwt-key-12345` with a strong random string!

## Step 5: Deploy
1. **Click "Create Web Service"**
2. Wait for deployment (usually 2-5 minutes)
3. You'll get a URL like: `https://getcash-backend-xxxx.onrender.com`

## Step 6: Test Your Backend
Once deployed, test these endpoints:
- `GET https://your-render-url.onrender.com/` - Should return "GetCash API Server Running"
- `POST https://your-render-url.onrender.com/api/register` - User registration
- `POST https://your-render-url.onrender.com/api/login` - User login

## Next Steps After Deployment:
1. Copy your Render.com URL
2. Update frontend `js/api-service.js` with the new URL
3. Test cross-device functionality

## Troubleshooting:
- If deployment fails, check the build logs in Render dashboard
- Make sure all environment variables are set correctly
- Ensure your repository is public (required for free tier)