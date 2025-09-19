# VIGIL Setup Guide

Complete step-by-step setup guide for the VIGIL cybersecurity monitoring platform.

## 🚀 Quick Start (Automated)

### Windows Users
1. **Run the installer**
   ```cmd
   install-dependencies.bat
   ```

2. **Configure environment**
   - Edit `backend/.env` file with your settings
   - Set MongoDB connection string
   - Set JWT secret key
   - Set OpenAI API key (optional)

3. **Start development environment**
   ```cmd
   start-dev.bat
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📋 Prerequisites

### Required Software
- **Node.js** 18.x or higher
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`

- **MongoDB** 6.x or higher
  - Download from: https://www.mongodb.com/try/download/community
  - Verify installation: `mongod --version`

### Optional Software
- **OpenAI API Key** (for AI features)
  - Get from: https://platform.openai.com/api-keys
  - Without this, the system will use fallback analysis

## 🛠️ Manual Setup

### Step 1: Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd frontend1
npm install
```

### Step 2: Configure Environment

1. **Copy environment template**
   ```bash
   cd backend
   cp env.example .env
   ```

2. **Edit `.env` file**
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/vigil
   DB_NAME=vigil

   # Server
   PORT=5000
   NODE_ENV=development

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d

   # OpenAI API (Optional)
   OPENAI_API_KEY=your-openai-api-key-here

   # Security
   BCRYPT_ROUNDS=12
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # CORS
   CORS_ORIGIN=http://localhost:3000

   # Logging
   LOG_LEVEL=info
   ```

### Step 3: Setup MongoDB

#### Option A: Local MongoDB
1. **Create data directory**
   ```bash
   mkdir data\db
   ```

2. **Start MongoDB**
   ```bash
   mongod --dbpath ./data/db
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### Step 4: Seed Database (Optional)

```bash
cd backend
npm run seed
```

This creates:
- Sample users (admin, analyst, viewer)
- Sample breach data
- Sample analytics data

### Step 5: Start Development Servers

#### Option A: Using Batch Files (Windows)
```cmd
start-dev.bat
```

#### Option B: Manual Start

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**
```bash
cd frontend1
npm run dev
```

## 🔐 Default User Accounts

After seeding, you can login with:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@vigil.com | admin123 | Full system access |
| Analyst | analyst@vigil.com | analyst123 | Create/edit breaches and reports |
| Viewer | viewer@vigil.com | viewer123 | Read-only access |

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Breaches
- `GET /api/breaches` - List breaches
- `POST /api/breaches` - Create breach
- `GET /api/breaches/:id` - Get breach details
- `GET /api/breaches/stats/overview` - Breach statistics

### Analytics
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/trends/:metric` - Trend analysis

### AI & NLP
- `POST /api/nlp/analyze` - Text analysis
- `POST /api/ai/analyze-threat` - AI threat analysis
- `POST /api/ai/generate-report` - Generate reports

### Health Check
- `GET /api/health` - API health status

## 🧪 Testing the Setup

### Option A: Automated Test
```cmd
test-setup.bat
```

### Option B: Manual Testing

1. **Test Backend Health**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Test Login**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@vigil.com","password":"admin123"}'
   ```

3. **Test Breaches API**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/breaches
   ```

## 🔧 Configuration Options

### Frontend Configuration
- Update `frontend1/src/lib/api.ts` to change API base URL
- Modify `frontend1/next.config.ts` for Next.js settings

### Backend Configuration
- Database: Update `MONGODB_URI` in `.env`
- Security: Update `JWT_SECRET` and rate limiting settings
- AI Features: Add `OPENAI_API_KEY` for full AI capabilities

### Port Configuration
- Backend: Change `PORT` in `.env` (default: 5000)
- Frontend: Change port in `package.json` scripts (default: 3000)

## 🚀 Production Deployment

### Option A: Production Batch File
```cmd
start-production.bat
```

### Option B: Manual Production Setup

1. **Build Frontend**
   ```bash
   cd frontend1
   npm run build
   ```

2. **Start Production Servers**
   ```bash
   # Backend
   cd backend
   npm start
   
   # Frontend
   cd frontend1
   npm start
   ```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db/vigil
JWT_SECRET=your-production-secret-key
CORS_ORIGIN=https://your-domain.com
```

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Ensure MongoDB is running: `mongod --version`
- Check connection string in `.env`
- Verify MongoDB service is started

#### Port Already in Use
```bash
Error: listen EADDRINUSE :::5000
```
**Solution:**
- Kill existing processes: `taskkill /F /IM node.exe`
- Change port in `.env` file
- Use different ports for frontend/backend

#### OpenAI API Errors
```bash
Error: Invalid API key
```
**Solution:**
- Verify API key is correct
- Check API quota and billing
- System works in fallback mode without API key

#### Build Errors
```bash
Error: Cannot find module
```
**Solution:**
- Delete `node_modules` and reinstall: `npm install`
- Check Node.js version compatibility
- Clear npm cache: `npm cache clean --force`

### Logs and Debugging

#### Backend Logs
- Location: `backend/logs/`
- Files: `error.log`, `combined.log`
- Console: Development mode shows logs in terminal

#### Frontend Logs
- Browser console (F12)
- Next.js development logs in terminal

#### MongoDB Logs
- Check MongoDB configuration
- Default location: MongoDB installation logs

## 📞 Support

### Getting Help
1. Check this setup guide
2. Review error logs
3. Test individual components
4. Check system requirements

### System Requirements
- **OS**: Windows 10/11, macOS, Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Internet connection for AI features

### Performance Tips
- Use SSD storage for MongoDB
- Allocate sufficient RAM to Node.js
- Use production mode for better performance
- Enable MongoDB indexing for large datasets

---

**VIGIL** - Your comprehensive cybersecurity monitoring solution with AI-powered threat analysis.
