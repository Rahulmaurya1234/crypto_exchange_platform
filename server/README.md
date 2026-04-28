# Cryptians P2P Cryptocurrency Marketplace - Backend API

A production-ready backend API for a peer-to-peer cryptocurrency marketplace supporting USDT/INR trades with escrow automation, real-time chat, and comprehensive admin controls.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Production Deployment](#production-deployment)
- [Contributing](#contributing)

## Overview

Cryptians is a dual-platform P2P cryptocurrency marketplace:

- **Platform A (Client)**: Buyer/seller marketplace for USDT/INR P2P trades
- **Platform B (Admin)**: Support, escrow control, and system administration

### Core Concept

- **Non-custodial INR**: Platform only custodies USDT in escrow; INR transfers happen directly between users
- **Automated Escrow**: Smart contract-based USDT escrow with automatic release
- **Review System**: Verified trade reviews for seller reputation
- **Multi-language**: English and Hindi support

## Key Features

### User Features
- User registration and JWT-based authentication
- Role-based access control (Buyer, Seller, Instant Seller)
- KYC verification with document upload (Aadhaar, PAN, etc.)
- Create and manage USDT sell listings
- Browse and filter available listings
- Complete P2P trade lifecycle with escrow
- Real-time chat between buyers and sellers
- Payment proof upload and verification
- Review system for completed trades
- Multi-language error messages (English/Hindi)

### Admin Features (Platform B)
- User management and verification
- KYC document review and approval
- Manual escrow release controls
- Dispute resolution system
- Audit log viewing
- System configuration management
- Seller verification and instant seller approval

### Technical Features
- Production-ready error handling
- Redis-backed rate limiting
- Winston structured logging with rotation
- Joi request validation
- Database abstraction (MongoDB/AWS DocumentDB)
- Docker containerization
- PM2 cluster mode support
- Graceful shutdown handling
- Health check endpoints
- Security headers with Helmet
- CORS configuration

## Tech Stack

### Core
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: JavaScript (ES Modules)

### Database & Cache
- **Database**: MongoDB (dev) / AWS DocumentDB (prod)
- **ODM**: Mongoose
- **Cache**: Redis
- **Job Queue**: BullMQ (planned)

### Authentication & Security
- **Auth**: JWT with refresh tokens
- **Validation**: Joi
- **Security**: Helmet, CORS, bcrypt
- **Rate Limiting**: express-rate-limit with Redis store

### Communication
- **Real-time**: Socket.io (planned)
- **SMS**: Twilio
- **Email**: Nodemailer

### DevOps & Monitoring
- **Logging**: Winston with daily-rotate-file
- **Process Manager**: PM2
- **Containerization**: Docker, Docker Compose
- **File Storage**: AWS S3

### Blockchain Integration
- **Price Feeds**: Binance, CoinGecko, Chainlink (planned)
- **Escrow**: Ethereum/BSC smart contracts (planned)

## Architecture

### Dual Platform Separation

```
┌─────────────────────────────────────────────────────────┐
│                     Platform A (Client)                  │
│  - User Registration & Auth                              │
│  - KYC Submission                                        │
│  - Create/Browse Listings                                │
│  - Trade Execution                                       │
│  - Chat & Payments                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Platform B (Admin/Support)             │
│  - User Verification                                     │
│  - KYC Review & Approval                                 │
│  - Escrow Manual Controls                                │
│  - Dispute Resolution                                    │
│  - Audit Logs & Analytics                                │
└─────────────────────────────────────────────────────────┘
```

### Application Layers

```
┌─────────────────┐
│   Routes        │ ← API endpoints (Platform A & B)
└────────┬────────┘
         │
┌────────▼────────┐
│  Controllers    │ ← Request handling
└────────┬────────┘
         │
┌────────▼────────┐
│   Services      │ ← Business logic
└────────┬────────┘
         │
┌────────▼────────┐
│    Models       │ ← Database schemas
└─────────────────┘
```

## Prerequisites

- Node.js >= 20.x
- MongoDB >= 6.x OR AWS DocumentDB
- Redis >= 7.x
- Docker & Docker Compose (optional)
- PM2 (for production)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Cryptians-application/server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Configuration](#environment-configuration))

### 4. Start development server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Environment Configuration

Create a `.env` file in the server root. Key variables:

### Server
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
```

### Database
```env
# MongoDB (Development)
MONGO_URI=mongodb://admin:password@localhost:27017
DBNAME=cryptians_dev

# AWS DocumentDB (Production)
AWS_DOCUMENTDB_URI=mongodb://username:password@docdb-cluster.region.docdb.amazonaws.com:27017/?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
AWS_DOCUMENTDB_CA_CERT=./config/rds-combined-ca-bundle.pem
```

### Redis
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### JWT
```env
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### AWS S3 (File Uploads)
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=cryptians-uploads
```

### SMS & Email
```env
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@cryptians.com
SMTP_PASSWORD=your-smtp-password
```

### Escrow Configuration
```env
ESCROW_PLATFORM_FEE_PERCENT=1.0
ESCROW_VOLATILITY_BUFFER_PERCENT=0.20
ESCROW_GAS_BUFFER_PERCENT=0.30
ESCROW_WALLET_ADDRESS=0x1234567890abcdef
ESCROW_WALLET_PRIVATE_KEY=your-private-key
```

See `.env.example` for complete configuration options.

## Database Setup

### Option 1: Local MongoDB with Docker

```bash
docker run -d \
  --name cryptians-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -e MONGO_INITDB_DATABASE=cryptians_dev \
  -v mongodb_data:/data/db \
  mongo:latest
```

### Option 2: MongoDB Atlas

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist your IP address
3. Create database user
4. Copy connection string to `MONGO_URI` in `.env`

### Option 3: AWS DocumentDB (Production)

1. Create DocumentDB cluster in AWS
2. Download certificate bundle:
```bash
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O ./config/rds-combined-ca-bundle.pem
```
3. Configure `AWS_DOCUMENTDB_URI` in `.env`

### Redis Setup

```bash
docker run -d \
  --name cryptians-redis \
  -p 6379:6379 \
  redis:alpine
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Features:
- Auto-restart on file changes (nodemon)
- Detailed error messages
- Source maps enabled

### Production Mode

```bash
npm start
```

### Using PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs cryptians-api

# Restart
pm2 restart cryptians-api

# Stop
pm2 stop cryptians-api
```

## Docker Deployment

### Development with Docker Compose

```bash
# Start all services (MongoDB, Redis, API)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Production Docker Build

```bash
# Build image
docker build -t cryptians-api:latest .

# Run container
docker run -d \
  --name cryptians-api \
  -p 5000:5000 \
  --env-file .env.production \
  cryptians-api:latest
```

### Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-12-02T10:30:00.000Z",
  "database": {
    "status": "connected",
    "name": "cryptians_dev"
  },
  "redis": {
    "status": "connected"
  }
}
```

## Project Structure

```
server/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.config.js    # MongoDB/DocumentDB config
│   │   ├── redis.config.js       # Redis connection
│   │   └── jwt.config.js         # JWT settings
│   │
│   ├── constants/           # Application constants
│   │   ├── roles.js             # User roles & permissions
│   │   ├── statuses.js          # Status enums
│   │   └── error-codes.js       # Error code mappings
│   │
│   ├── locales/             # Internationalization
│   │   ├── en/errors.json       # English error messages
│   │   ├── hi/errors.json       # Hindi error messages
│   │   └── index.js             # i18n utilities
│   │
│   ├── models/              # Database schemas (11 models)
│   │   ├── User.model.js        # User with embedded reviews
│   │   ├── KYC.model.js         # KYC verification
│   │   ├── Listing.model.js     # Sell listings
│   │   ├── Trade.model.js       # P2P trades
│   │   ├── Chat.model.js        # Chat conversations
│   │   ├── Message.model.js     # Chat messages
│   │   ├── Payment.model.js     # Payment proofs
│   │   ├── Dispute.model.js     # Trade disputes
│   │   ├── EscrowTransaction.model.js  # Blockchain txns
│   │   ├── Notification.model.js       # User notifications
│   │   └── AuditLog.model.js    # Security audit logs
│   │
│   ├── validators/          # Joi validation schemas
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   ├── kyc.validator.js
│   │   ├── listing.validator.js
│   │   ├── trade.validator.js
│   │   ├── chat.validator.js
│   │   └── common.validator.js
│   │
│   ├── middleware/          # Express middleware
│   │   ├── validate.middleware.js    # Joi validation
│   │   ├── auth.middleware.js        # JWT authentication
│   │   ├── rbac.middleware.js        # Role-based access
│   │   ├── rate-limit.middleware.js  # Rate limiting
│   │   └── error.middleware.js       # Error handling
│   │
│   ├── services/            # Business logic
│   │   ├── auth.service.js          # Authentication
│   │   ├── fee-calculator.service.js # Fee calculations
│   │   ├── price-feed.service.js    # USDT/INR pricing
│   │   ├── notification.service.js  # Notifications
│   │   └── audit.service.js         # Audit logging
│   │
│   ├── controllers/         # Route handlers (to be implemented)
│   ├── routes/              # API routes (to be implemented)
│   │   ├── platform-a/      # Client APIs
│   │   └── platform-b/      # Admin APIs
│   │
│   ├── utils/               # Utilities
│   │   ├── ApiError.js      # Custom error classes
│   │   ├── ApiResponse.js   # Response formatter
│   │   ├── logger.js        # Winston logger
│   │   └── asyncHandler.js  # Async wrapper
│   │
│   ├── app.js               # Express app setup
│   └── index.js             # Server entry point
│
├── logs/                    # Application logs
├── config/                  # External configs
├── .env.example             # Environment template
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── ecosystem.config.js      # PM2 configuration
├── package.json
└── README.md
```

## API Documentation

### Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://api.cryptians.com`

### API Versioning

All endpoints are prefixed with `/api/v1`

### Authentication

Most endpoints require JWT authentication:

```http
Authorization: Bearer <access_token>
```

### Platform A Endpoints (Client)

```
POST   /api/v1/auth/register           # User registration
POST   /api/v1/auth/login              # User login
POST   /api/v1/auth/refresh            # Refresh access token
POST   /api/v1/auth/logout             # Logout

GET    /api/v1/kyc                     # Get KYC status
POST   /api/v1/kyc/submit              # Submit KYC documents
PUT    /api/v1/kyc/update              # Update KYC

GET    /api/v1/listings                # Browse listings
POST   /api/v1/listings                # Create listing (sellers only)
GET    /api/v1/listings/:id            # Get listing details
PUT    /api/v1/listings/:id            # Update listing
DELETE /api/v1/listings/:id            # Delete listing

POST   /api/v1/trades                  # Initiate trade
GET    /api/v1/trades/:id              # Get trade details
POST   /api/v1/trades/:id/payment      # Mark payment sent
POST   /api/v1/trades/:id/confirm      # Confirm payment received
POST   /api/v1/trades/:id/dispute      # Open dispute

GET    /api/v1/chats                   # Get chat list
GET    /api/v1/chats/:id/messages      # Get chat messages
POST   /api/v1/chats/:id/messages      # Send message

GET    /api/v1/users/profile           # Get own profile
PUT    /api/v1/users/profile           # Update profile
GET    /api/v1/users/:id/reviews       # Get user reviews
POST   /api/v1/users/:id/reviews       # Add review
```

### Platform B Endpoints (Admin/Support)

```
GET    /api/v1/admin/users             # List all users
GET    /api/v1/admin/users/:id         # Get user details
PUT    /api/v1/admin/users/:id/verify  # Verify seller
PUT    /api/v1/admin/users/:id/ban     # Ban user

GET    /api/v1/admin/kyc/pending       # Pending KYC submissions
PUT    /api/v1/admin/kyc/:id/approve   # Approve KYC
PUT    /api/v1/admin/kyc/:id/reject    # Reject KYC

GET    /api/v1/admin/disputes          # List disputes
GET    /api/v1/admin/disputes/:id      # Get dispute details
PUT    /api/v1/admin/disputes/:id/resolve # Resolve dispute

POST   /api/v1/admin/escrow/:id/release   # Manual escrow release
POST   /api/v1/admin/escrow/:id/refund    # Refund escrow

GET    /api/v1/admin/audit-logs        # View audit logs
GET    /api/v1/admin/analytics         # Platform analytics
```

### Response Format

#### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Invalid email or password",
  "errorCode": "AUTH_001",
  "statusCode": 401,
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

#### Validation Error

```json
{
  "success": false,
  "message": "email is required, password must be at least 8 characters",
  "errorCode": "VAL_001",
  "statusCode": 400,
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

### Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|---------|
| Authentication | 5 requests | 15 minutes |
| OTP | 3 requests | 5 minutes |
| KYC | 10 requests | 15 minutes |
| Listings | 30 requests | 15 minutes |
| Trades | 20 requests | 15 minutes |
| Chat | 100 requests | 1 minute |
| Admin | 60 requests | 1 minute |

## Security

### Implemented Security Measures

1. **Authentication & Authorization**
   - JWT-based authentication with refresh tokens
   - Role-based access control (RBAC)
   - Permission-based route protection

2. **Input Validation**
   - Joi schema validation on all inputs
   - Request body size limits (16kb)
   - SQL injection prevention via Mongoose

3. **Security Headers**
   - Helmet.js with CSP configuration
   - CORS with whitelist
   - XSS protection
   - CSRF protection (planned)

4. **Rate Limiting**
   - Redis-backed rate limiting
   - Different limits per endpoint type
   - IP-based tracking

5. **Data Protection**
   - Bcrypt password hashing
   - Sensitive data encryption at rest
   - HTTPS enforcement in production
   - Environment variable isolation

6. **Logging & Monitoring**
   - Comprehensive audit logs
   - Immutable audit trail
   - Security event logging
   - Error tracking

7. **File Upload Security**
   - File type validation
   - Size restrictions
   - Malware scanning (planned)
   - S3 bucket policies

### Security Best Practices

- Never commit `.env` files
- Rotate JWT secrets regularly
- Use strong, unique passwords for all services
- Keep dependencies updated (`npm audit`)
- Enable 2FA for admin accounts
- Regular security audits
- Monitor logs for suspicious activity

## Production Deployment

### Pre-deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database (AWS DocumentDB)
- [ ] Set strong JWT secrets (min 32 characters)
- [ ] Configure Redis with password
- [ ] Set up AWS S3 bucket with proper IAM policies
- [ ] Configure SMS/Email providers
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring (CloudWatch, Datadog, etc.)
- [ ] Configure log aggregation
- [ ] Test all endpoints
- [ ] Run security audit (`npm audit`)

### Deployment Options

#### Option 1: AWS EC2 + PM2

```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup
git clone <repository-url>
cd Cryptians-application/server
npm ci --only=production

# Configure environment
cp .env.example .env.production
nano .env.production

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### Option 2: Docker + AWS ECS

```bash
# Build and push to ECR
docker build -t cryptians-api:latest .
docker tag cryptians-api:latest <ecr-repo-url>:latest
docker push <ecr-repo-url>:latest

# Deploy to ECS (use ECS task definition)
```

#### Option 3: Kubernetes

```bash
# Create ConfigMap and Secrets
kubectl create configmap cryptians-env --from-env-file=.env.production
kubectl create secret generic cryptians-secrets --from-literal=jwt-secret=<secret>

# Deploy
kubectl apply -f k8s/deployment.yml
kubectl apply -f k8s/service.yml
```

### Environment-Specific Configuration

**Development**
```env
NODE_ENV=development
LOG_LEVEL=debug
MONGO_URI=mongodb://localhost:27017
```

**Staging**
```env
NODE_ENV=staging
LOG_LEVEL=info
AWS_DOCUMENTDB_URI=mongodb://staging-cluster...
```

**Production**
```env
NODE_ENV=production
LOG_LEVEL=warn
AWS_DOCUMENTDB_URI=mongodb://production-cluster...
```

### Monitoring & Logging

#### Log Files

Logs are stored in `./logs/` directory:

- `error.log` - Error level logs
- `combined.log` - All logs
- `http.log` - HTTP access logs
- `audit.log` - Security audit trail

#### Health Monitoring

```bash
# Health check endpoint
curl http://localhost:5000/health

# PM2 monitoring
pm2 monit

# Docker health check
docker ps --filter "health=healthy"
```

#### Metrics to Monitor

- API response times
- Database connection pool
- Redis memory usage
- Error rates
- Active trades count
- Escrow balance
- User registrations

## Scripts

```json
{
  "dev": "nodemon src/index.js",
  "start": "node src/index.js",
  "test": "jest --coverage",
  "lint": "eslint src/",
  "format": "prettier --write src/"
}
```

## Contributing

### Development Workflow

1. Create feature branch
2. Make changes with proper commits
3. Run linting and tests
4. Create pull request
5. Code review
6. Merge to main

### Commit Convention

```
feat: Add user review system
fix: Resolve escrow calculation bug
docs: Update API documentation
refactor: Optimize database queries
test: Add trade lifecycle tests
```

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Email: support@cryptians.com
- Documentation: [docs-url]

## License

Proprietary - All rights reserved

---

**Built with ❤️ for secure P2P cryptocurrency trading**
