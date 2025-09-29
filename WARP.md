# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

VIGIL is a comprehensive MERN stack cybersecurity monitoring platform featuring AI-powered threat analysis, breach management, and real-time security analytics. The platform integrates advanced NLP capabilities and OpenAI for intelligent threat assessment.

## Development Commands

### Quick Start
```powershell
# Install all dependencies and start development environment
.\start-dev.bat

# Test setup and configuration
.\test-setup.bat

# Start production environment
.\start-production.bat
```

### Backend Commands
```bash
cd backend

# Development server with hot reload
npm run dev

# Production server
npm start

# Run tests
npm test

# Seed database with sample data
npm run seed
```

### Frontend Commands
```bash
cd frontend1

# Development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Database Commands
```bash
# Start MongoDB locally
mongod --dbpath ./data/db

# Access MongoDB shell
mongosh

# Check database health
curl http://localhost:5000/api/health
```

### Testing Commands
```bash
# Test backend API health
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vigil.com","password":"admin123"}'

# Test breaches API (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/breaches
```

## Architecture Overview

### System Architecture
VIGIL follows a 3-tier MERN architecture with specialized AI/ML services:

**Frontend (Next.js 15 + TypeScript)**
- Modern React 19 with App Router
- Tailwind CSS for styling
- TypeScript for type safety
- Responsive cybersecurity dashboard

**Backend (Node.js + Express)**
- RESTful API design with JWT authentication
- Role-based access control (Admin, Analyst, Viewer)
- Rate limiting and security middleware
- Structured logging with Winston

**Database (MongoDB)**
- Document-based storage for flexible security data
- Indexed collections for performance
- Aggregation pipelines for analytics

### AI/ML Integration
The platform features a sophisticated AI layer:

**NLP Service (`services/nlpService.js`)**
- Natural language processing for security text analysis
- Sentiment analysis using the Sentiment library
- Entity extraction (IPs, emails, URLs, organizations)
- Security-specific keyword detection
- Threat scoring algorithms (0-100 scale)
- Key phrase extraction with frequency analysis

**AI Service (`services/aiService.js`)**
- OpenAI GPT integration for advanced threat analysis
- Structured prompt engineering for security contexts
- Fallback analysis when API is unavailable
- Risk assessment with confidence scoring
- Automated recommendation generation

### Data Models

**Core Security Models:**
- `Breach`: Comprehensive breach data with AI analysis fields
- `User`: Role-based authentication with JWT
- `ScanReport`: Security assessment reports
- `AnalyticsData`: Metrics and trending data

**Key Model Features:**
- MongoDB indexes for performance optimization
- Virtual fields for computed properties
- Static methods for complex queries
- Pre-save middleware for data consistency
- Text search indexes for security content

### API Architecture

**Authentication & Authorization:**
- JWT-based stateless authentication
- Middleware-based role verification
- Protected routes with granular permissions

**Security Routes:**
- `/api/breaches` - Breach management and statistics
- `/api/analytics` - Dashboard metrics and trends
- `/api/reports` - Scan report operations
- `/api/nlp` - Natural language processing
- `/api/ai` - AI-powered threat analysis

**Request/Response Patterns:**
- Consistent JSON API responses
- Joi validation for all inputs
- Structured error handling
- Request logging and monitoring

### Frontend Architecture

**Component Structure:**
- Modular component design in `src/Components/`
- TypeScript interfaces in `src/Entities/`
- Centralized API client in `src/lib/api.ts`
- App Router for modern routing

**State Management:**
- React hooks for local state
- Context for global auth state
- Server state via API calls

## Development Patterns

### Error Handling
- Global error middleware catches unhandled errors
- Structured error responses with proper HTTP codes
- Fallback mechanisms for AI service failures
- Comprehensive logging for debugging

### Security Implementations
- Helmet.js for security headers
- Express rate limiting
- Input validation with Joi
- CORS configuration
- JWT token expiration handling

### AI/ML Integration Patterns
- Graceful degradation when AI services unavailable
- Confidence scoring for AI predictions
- Structured prompt templates
- Response parsing with fallbacks

### Database Patterns
- Mongoose ODM with schema validation
- Aggregation pipelines for analytics
- Text search indexes for security content
- Date-based queries with proper indexing

## Configuration

### Environment Setup
Critical environment variables in `backend/.env`:
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Authentication security
- `OPENAI_API_KEY` - AI features (optional)
- `CORS_ORIGIN` - Frontend URL
- Rate limiting and security parameters

### Default Ports
- Backend: 5000
- Frontend: 3000
- MongoDB: 27017

### AI Configuration
- OpenAI GPT-3.5-turbo for threat analysis
- Fallback analysis when API unavailable
- Configurable temperature and token limits
- System prompts for security contexts

## Common Development Tasks

### Adding New Security Features
1. Define Mongoose model in `backend/models/`
2. Create API routes in `backend/routes/`
3. Implement business logic in `backend/services/`
4. Add frontend components in `frontend1/src/Components/`
5. Update TypeScript interfaces in `frontend1/src/Entities/`

### AI Analysis Integration
- Use `aiService.analyzeThreat()` for threat assessment
- Use `nlpService.analyzeSecurityText()` for text processing
- Implement fallback logic for service failures
- Parse AI responses with error handling

### Database Operations
- Use Mongoose static methods for complex queries
- Implement proper indexing for performance
- Use aggregation pipelines for analytics
- Handle date ranges and filtering

### Testing Endpoints
- Use health check endpoint for monitoring
- Test with default seeded users
- Validate JWT token handling
- Check rate limiting behavior

## Troubleshooting

### MongoDB Issues
- Ensure MongoDB service is running
- Check connection string in `.env`
- Verify database permissions
- Monitor connection pooling

### AI Service Issues
- Verify OpenAI API key configuration
- Check API quota and billing status
- Test fallback analysis functionality
- Monitor response parsing errors

### Port Conflicts
- Kill existing Node.js processes
- Use `fix-ports.bat` for Windows cleanup
- Update port configuration in `.env`
- Check firewall settings

### Build Issues
- Clear `node_modules` and reinstall
- Check Node.js version compatibility (18+)
- Verify TypeScript configuration
- Update dependencies if needed