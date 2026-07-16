# Community Garden Platform - Deployment Guide

## Overview

This guide will help you deploy the Community Garden & Crop Sharing Platform to production. The application consists of a Next.js frontend and a Node.js backend with MongoDB database.

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Git installed
- Domain name (optional)
- SSL certificate (for production)

## Environment Setup

### 1. Database Setup

#### Option A: MongoDB Atlas (Recommended)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `server/.env` with your MongoDB URI

#### Option B: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/community-garden` as your URI

### 2. Environment Variables

#### Server Environment (`server/.env`)
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/community-garden

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5000
NODE_ENV=production

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# OpenAI API (for AI features)
OPENAI_API_KEY=your-openai-api-key

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=https://your-domain.com
```

#### Client Environment (`client/.env.local`)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api

# Map Configuration
NEXT_PUBLIC_MAP_API_KEY=your-map-api-key

# App Configuration
NEXT_PUBLIC_APP_NAME=Community Garden Platform
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Deployment Options

### Option 1: Vercel + Railway (Recommended)

#### Frontend (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

#### Backend (Railway)
1. Create account at [Railway](https://railway.app)
2. Connect your GitHub repository
3. Set environment variables
4. Deploy automatically

### Option 2: DigitalOcean App Platform

1. Create account at [DigitalOcean](https://www.digitalocean.com)
2. Create a new App
3. Connect your GitHub repository
4. Configure build settings:
   - Frontend: `client` directory, build command: `npm run build`
   - Backend: `server` directory, start command: `npm start`
5. Set environment variables
6. Deploy

### Option 3: AWS/GCP/Azure

#### Using Docker (Recommended for cloud providers)

Create `Dockerfile` for server:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Create `Dockerfile` for client:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Local Development Setup

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies
npm run install-all
```

### 2. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

### 3. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## Production Checklist

### Security
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Use environment variables for sensitive data
- [ ] Enable rate limiting
- [ ] Set up proper error handling

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Optimize images
- [ ] Enable caching headers
- [ ] Set up database indexes

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics
- [ ] Monitor database performance
- [ ] Set up uptime monitoring

## Testing

### 1. Run Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### 2. Manual Testing Checklist
- [ ] User registration and login
- [ ] Garden creation and management
- [ ] Crop listing and requests
- [ ] Messaging system
- [ ] Community feed
- [ ] Map functionality
- [ ] Admin panel
- [ ] AI features

## Troubleshooting

### Common Issues

#### Database Connection
- Check MongoDB URI format
- Ensure database is accessible
- Check firewall settings

#### CORS Issues
- Verify FRONTEND_URL in server environment
- Check CORS configuration in server

#### Build Failures
- Check Node.js version compatibility
- Clear node_modules and reinstall
- Check for missing environment variables

#### Image Upload Issues
- Verify Cloudinary credentials
- Check file size limits
- Ensure proper image formats

## Maintenance

### Regular Tasks
- Monitor database performance
- Update dependencies
- Backup database
- Monitor error logs
- Update SSL certificates

### Scaling Considerations
- Use MongoDB Atlas for database scaling
- Implement Redis for session storage
- Use CDN for static assets
- Consider microservices architecture for large scale

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review error logs
3. Check GitHub issues
4. Contact support team

## License

This project is licensed under the MIT License.
