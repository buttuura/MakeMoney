@echo off
REM GetCash Backend Deployment Script for Windows

echo 🚀 GetCash Backend Deployment to Render.com
echo ==============================================
echo.

REM Step 1: Create GitHub repository
echo 📋 STEP 1: Create GitHub Repository
echo 1. Go to https://github.com/new
echo 2. Repository name: getcash-backend  
echo 3. Description: GetCash API backend for cross-device sync
echo 4. Make it Public
echo 5. Don't initialize with README (we have files already)
echo 6. Click 'Create repository'
echo.
echo Press Enter when you've created the GitHub repository...
pause > nul

REM Get the GitHub repository URL
echo 📝 Enter your GitHub repository URL:
echo Example: https://github.com/buttuura/getcash-backend.git
set /p REPO_URL="Repository URL: "

REM Step 2: Push to GitHub
echo.
echo 📤 STEP 2: Pushing to GitHub...
git branch -M main
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo ✅ Backend code pushed to GitHub!

REM Step 3: Deploy to Render.com instructions
echo.
echo 🌐 STEP 3: Deploy to Render.com
echo 1. Go to https://render.com
echo 2. Create account or sign in
echo 3. Click 'New +' → 'Web Service'
echo 4. Connect your GitHub account
echo 5. Select the 'getcash-backend' repository
echo 6. Configure deployment:
echo    - Name: getcash-backend
echo    - Environment: Node
echo    - Build Command: npm install  
echo    - Start Command: npm start
echo    - Plan: Free
echo.
echo 7. Set Environment Variables:
echo    - JWT_SECRET: getcash-super-secure-jwt-key-2025
echo    - NODE_ENV: production
echo.
echo 8. Click 'Create Web Service'
echo.
echo ⏳ Deployment will take 5-10 minutes...
echo.
echo 📋 After deployment:
echo 1. Copy your Render.com URL (e.g., https://getcash-backend-xxxx.onrender.com)
echo 2. Update frontend API URL in js/api-service.js
echo 3. Test cross-device access!
echo.
echo 🎉 Your users will then be able to login from ANY device!
echo.
echo Need help? Check RENDER_DEPLOYMENT.md for detailed instructions.
echo.
pause