# Vigil Backend - Cybersecurity Platform

A comprehensive MERN stack backend for cybersecurity monitoring, threat analysis, and breach management with NLP and GenAI capabilities.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Breach Management**: Complete CRUD operations for security breaches
- **Analytics**: Real-time security metrics and trend analysis
- **Scan Reports**: Vulnerability and security scan report management
- **NLP Services**: Natural language processing for security text analysis
- **AI Integration**: OpenAI-powered threat analysis and risk assessment
- **Real-time Monitoring**: Live security metrics and alerts

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Natural** - NLP library
- **OpenAI API** - AI/ML services
- **Winston** - Logging
- **Joi** - Validation

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/vigil
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   PORT=5000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Breaches
- `GET /api/breaches` - List breaches with filtering
- `POST /api/breaches` - Create new breach
- `GET /api/breaches/:id` - Get breach details
- `PUT /api/breaches/:id` - Update breach
- `DELETE /api/breaches/:id` - Delete breach
- `GET /api/breaches/stats/overview` - Breach statistics

### Analytics
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/metrics` - Analytics metrics
- `GET /api/analytics/trends/:metric` - Trend data
- `POST /api/analytics/metrics` - Create metric

### Reports
- `GET /api/reports` - List scan reports
- `POST /api/reports` - Create scan report
- `GET /api/reports/:id` - Get report details
- `GET /api/reports/export/:id` - Export report

### NLP Services
- `POST /api/nlp/analyze` - Text analysis
- `POST /api/nlp/sentiment-analysis` - Sentiment analysis
- `POST /api/nlp/extract-entities` - Entity extraction
- `POST /api/nlp/classify` - Text classification

### AI Services
- `POST /api/ai/analyze-threat` - AI threat analysis
- `POST /api/ai/analyze-breach` - AI breach analysis
- `POST /api/ai/assess-risk` - Risk assessment
- `POST /api/ai/generate-report` - Generate reports

## Data Models

### User
- Authentication and profile management
- Role-based permissions (admin, analyst, viewer)
- User preferences and settings

### Breach
- Security breach information
- AI-powered analysis and risk scoring
- Attack type classification

### AnalyticsData
- Security metrics and KPIs
- Trend analysis and reporting
- Performance monitoring

### ScanReport
- Vulnerability scan results
- Security assessment reports
- AI-enhanced analysis

## Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - API request throttling
- **Input Validation** - Joi schema validation
- **Password Hashing** - bcrypt encryption
- **CORS Protection** - Cross-origin security
- **JWT Authentication** - Secure token-based auth

## AI & NLP Capabilities

### Natural Language Processing
- Security text analysis
- Sentiment analysis
- Entity extraction
- Text classification
- Automatic summarization

### AI-Powered Analysis
- Threat risk assessment
- Breach impact analysis
- Automated report generation
- Risk scoring and prioritization
- Intelligent recommendations

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Logging
- Winston-based structured logging
- Separate log files for errors and combined logs
- Console logging in development

### Database
- MongoDB with Mongoose ODM
- Automatic indexing for performance
- Data validation and sanitization

## Environment Variables

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

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## API Documentation

### Authentication Headers
```javascript
Authorization: Bearer <jwt_token>
```

### Response Format
```javascript
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Format
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
