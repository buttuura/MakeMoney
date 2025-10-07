# GetCash Backend API

A Node.js/Express backend for GetCash application with cross-device user synchronization.

## Features

✅ **Cross-Device Authentication**
- Register once, login from any device
- JWT token-based authentication
- Secure password hashing with bcrypt

✅ **User Management**
- User registration and login
- Profile management
- Balance tracking across devices

✅ **Security**
- Rate limiting (10 requests per minute)
- CORS protection
- Helmet security headers
- JWT token authentication

✅ **Admin Features**
- Admin user management
- User statistics
- Balance management

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/balance` - Get user balance
- `POST /api/user/balance` - Update user balance

### Admin
- `GET /api/admin/users` - Get all users (admin only)

## Deployment on Render.com

### Step 1: Create Repository
```bash
cd backend
git init
git add .
git commit -m "Initial backend setup"
git branch -M main
git remote add origin YOUR_BACKEND_REPO_URL
git push -u origin main
```

### Step 2: Deploy on Render.com
1. Go to [Render.com](https://render.com)
2. Create new account or login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `getcash-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Set Environment Variables
In Render dashboard, add:
- `JWT_SECRET`: `your-super-secure-jwt-secret-key`
- `NODE_ENV`: `production`

### Step 4: Get Your API URL
After deployment, you'll get a URL like:
`https://getcash-backend.onrender.com`

## Local Development

### Setup
```bash
cd backend
npm install
```

### Run Development Server
```bash
npm run dev
```

### Test API
```bash
# Health check
curl https://your-api-url.onrender.com/

# Register user
curl -X POST https://your-api-url.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "phone": "+256700123456",
    "password": "password123"
  }'

# Login user
curl -X POST https://your-api-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+256700123456",
    "password": "password123"
  }'
```

## Default Admin User

- **Phone**: `+256700000000`
- **Password**: `admin123`
- **Role**: `admin`

## Cross-Device Flow

1. **User registers on Device A** → Data saved to Render.com backend
2. **User switches to Device B** → Login with phone number
3. **Backend returns user data** → Balance, profile, all data synced
4. **User makes changes on Device B** → Automatically synced
5. **User returns to Device A** → All changes available

## Production Considerations

For production deployment:
- Replace in-memory storage with PostgreSQL/MongoDB
- Add proper logging
- Implement data backup
- Add more comprehensive validation
- Set up monitoring and alerts