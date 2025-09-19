# VIGIL - Cybersecurity Monitoring Platform

A comprehensive MERN stack application for cybersecurity monitoring, threat analysis, and breach management with advanced NLP and GenAI capabilities.

## 🚀 Features

### Core Functionality
- **Breach Management**: Complete lifecycle management of security breaches
- **Threat Analysis**: Real-time threat detection and analysis
- **Security Analytics**: Comprehensive dashboard with metrics and trends
- **Scan Reports**: Vulnerability and security assessment reports
- **Risk Prediction**: AI-powered risk assessment and scoring

### AI & NLP Capabilities
- **Natural Language Processing**: Advanced text analysis for security content
- **Sentiment Analysis**: Analyze threat descriptions and communications
- **Entity Extraction**: Identify organizations, dates, IPs, and other entities
- **AI Threat Analysis**: OpenAI-powered threat assessment and recommendations
- **Automated Reporting**: Generate comprehensive security reports

### Security Features
- **Authentication**: JWT-based secure authentication
- **Role-based Access Control**: Admin, Analyst, and Viewer roles
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive data validation and sanitization
- **Security Headers**: Helmet.js protection

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React 19** - Latest React features

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Natural** - NLP processing
- **OpenAI API** - AI/ML services

### AI & NLP Libraries
- **Natural.js** - Natural language processing
- **Compromise** - Lightweight NLP
- **Sentiment** - Sentiment analysis
- **OpenAI** - GPT integration

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **MongoDB** 6.x or higher
- **npm** or **yarn** package manager
- **OpenAI API Key** (optional, for AI features)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vigil
   ```

2. **Install dependencies**
   ```bash
   # Windows
   install-dependencies.bat
   
   # Or manually
   npm install
   cd frontend1 && npm install && cd ..
   cd backend && npm install && cd ..
   ```

3. **Configure environment**
   - Edit `backend/.env` file with your settings
   - Set MongoDB connection string
   - Set JWT secret key
   - Set OpenAI API key (optional)

4. **Start development environment**
   ```bash
   # Windows
   start-dev.bat
   
   # Or manually
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend1 && npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/api/health

### Option 2: Manual Setup

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend1
   npm install
   npm run dev
   ```

## 📁 Project Structure

```
vigil/
├── frontend1/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── Components/       # React components
│   │   └── Entities/         # TypeScript interfaces
│   ├── Pages/                # Additional pages
│   └── package.json
├── backend/                   # Express.js Backend
│   ├── config/               # Configuration files
│   ├── models/               # MongoDB models
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── middleware/           # Express middleware
│   ├── utils/                # Utility functions
│   └── package.json
├── start-dev.bat             # Development startup script
├── start-production.bat      # Production startup script
├── install-dependencies.bat  # Dependency installer
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env` file:

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

### MongoDB Setup

1. **Install MongoDB**
   - Download from: https://www.mongodb.com/try/download/community
   - Install MongoDB Community Server

2. **Create data directory**
   ```bash
   mkdir data\db
   ```

3. **Start MongoDB**
   ```bash
   mongod --dbpath ./data/db
   ```

## 📊 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Breaches
- `GET /api/breaches` - List breaches with filtering
- `POST /api/breaches` - Create new breach
- `GET /api/breaches/:id` - Get breach details
- `GET /api/breaches/stats/overview` - Breach statistics

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/trends/:metric` - Trend analysis
- `POST /api/analytics/metrics` - Create analytics data

### Reports
- `GET /api/reports` - List scan reports
- `POST /api/reports` - Create scan report
- `GET /api/reports/export/:id` - Export report

### AI & NLP
- `POST /api/nlp/analyze` - Text analysis
- `POST /api/ai/analyze-threat` - AI threat analysis
- `POST /api/ai/generate-report` - AI report generation

## 🔐 Security

### Authentication
```javascript
// Include JWT token in requests
headers: {
  'Authorization': 'Bearer <your-jwt-token>'
}
```

### User Roles
- **Admin**: Full system access
- **Analyst**: Create/edit breaches and reports
- **Viewer**: Read-only access

## 🤖 AI Features

### Natural Language Processing
- Security text analysis
- Sentiment analysis
- Entity extraction (organizations, IPs, dates)
- Text classification
- Automatic summarization

### AI-Powered Analysis
- Threat risk assessment (0-100 score)
- Breach impact analysis
- Automated report generation
- Risk prioritization
- Intelligent recommendations

## 📈 Analytics & Monitoring

### Dashboard Metrics
- Total breaches and incidents
- Risk level distribution
- Attack type trends
- Response time metrics
- Security score trends

### Real-time Features
- Live threat monitoring
- Automated alerts
- Performance metrics
- User activity tracking

## 🚀 Deployment

### Development
```bash
# Windows
start-dev.bat

# Manual
cd backend && npm run dev
cd frontend1 && npm run dev
```

### Production
```bash
# Windows
start-production.bat

# Manual
cd backend && npm start
cd frontend1 && npm run build && npm start
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### API Testing
Use tools like Postman or curl to test endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 📝 Development

### Adding New Features
1. Create models in `backend/models/`
2. Add routes in `backend/routes/`
3. Implement services in `backend/services/`
4. Add frontend components in `frontend1/src/Components/`

### Code Style
- Use TypeScript for frontend
- Follow Express.js conventions for backend
- Use async/await for asynchronous operations
- Implement proper error handling

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify database permissions

2. **Port Already in Use**
   - Change ports in configuration
   - Kill existing processes on ports 3000/5000

3. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - Fallback mode will work without API key

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Logs
- Backend logs: `backend/logs/`
- Frontend logs: Browser console
- MongoDB logs: Check MongoDB configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**VIGIL** - Empowering cybersecurity teams with AI-driven threat analysis and comprehensive breach management.
