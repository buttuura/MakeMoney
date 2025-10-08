# GetCash Backend API

Complete backend API for the GetCash admin approval system.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Run Locally
```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

### 4. Deploy to Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use these settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node.js

## 📡 API Endpoints

### Deposit Management
- `POST /api/deposits/submit` - Submit new deposit request
- `GET /api/deposits/requests` - Get all deposits (admin)
- `PUT /api/deposits/approve/:id` - Approve specific deposit  
- `PUT /api/deposits/reject/:id` - Reject specific deposit

### User Management
- `PUT /api/users/update-level/:id` - Update user level after approval

### Notifications
- `GET /api/notifications/user/:id` - Get notifications for user
- `PUT /api/notifications/read/:id` - Mark notification as read

### Utility
- `GET /health` - Health check
- `GET /api/stats` - System statistics

## 🗄️ Data Storage

Currently uses **in-memory storage** for quick setup. For production:

### Option 1: Add Database
- PostgreSQL (recommended for Render)
- MySQL
- MongoDB

### Option 2: Use Database Service  
- Supabase (PostgreSQL)
- PlanetScale (MySQL)
- MongoDB Atlas

## 🔧 Configuration

### CORS Settings
The server allows requests from:
- `https://buttuura.github.io` (your GitHub Pages)
- `http://localhost:*` (local development)
- `http://127.0.0.1:*` (local development)

### Environment Variables
See `.env.example` for all available configuration options.

## 🧪 Testing

### Test Endpoints
```bash
# Health check
curl https://your-render-url.onrender.com/health

# Submit test deposit
curl -X POST https://your-render-url.onrender.com/api/deposits/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "userName": "Test User", 
    "phone": "+256700123456",
    "amount": 50000,
    "level": "intern",
    "levelDisplayName": "Intern Level"
  }'

# Get deposits (admin)
curl https://your-render-url.onrender.com/api/deposits/requests
```

## 📊 Features

✅ **Complete Deposit Workflow** - Submit, approve, reject deposits  
✅ **Real-time Notifications** - User notifications for approval/rejection  
✅ **User Level Management** - Automatic level updates after approval  
✅ **Admin Dashboard Data** - All data needed for admin panel  
✅ **CORS Configured** - Ready for your frontend  
✅ **Error Handling** - Robust error responses  
✅ **Health Monitoring** - Health check and stats endpoints  

## 🚀 Deployment Steps

1. **Push to GitHub** (if not already done)
2. **Connect to Render**:
   - Go to render.com
   - Connect GitHub repository
   - Create new Web Service
   - Point to this `backend-api` folder
3. **Configure Environment**:
   - Set environment variables in Render dashboard
4. **Deploy**:
   - Render will automatically build and deploy
5. **Update Frontend**:
   - Your frontend is already configured for this API!

## 🔗 Integration

Your frontend (`js/api-service.js`) is already configured to use:
```javascript
this.baseURL = 'https://getcash-backend-1.onrender.com';
```

Just update this URL to your new Render service URL once deployed!

## 📈 Scaling

This backend can handle:
- ✅ Unlimited deposits and users
- ✅ Real-time notifications  
- ✅ Cross-device synchronization
- ✅ Multiple admins
- ✅ High traffic loads

Ready for production use!