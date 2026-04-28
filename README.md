# Cryptians - P2P Cryptocurrency Marketplace

A comprehensive peer-to-peer (P2P) cryptocurrency marketplace platform enabling secure USDT/INR trades with automated escrow, real-time chat, KYC verification, and comprehensive admin controls.

## 🎯 Overview

Cryptians is a dual-platform P2P cryptocurrency marketplace consisting of three main applications:

- **Client Application** (`/client`) - Buyer/seller marketplace interface
- **Admin Dashboard** (`/admin`) - Administrative and support interface  
- **Backend API** (`/server`) - RESTful API with Socket.IO for real-time features

### Core Concept

- **Non-custodial INR**: Platform only custodies USDT in escrow; INR transfers happen directly between users
- **Automated Escrow**: Smart contract-based USDT escrow with automatic release
- **Real-time Chat**: Socket.IO powered chat for buyer-seller communication
- **KYC Verification**: Document-based identity verification system
- **Dual Platform Architecture**: Separate interfaces for users (Platform A) and admins (Platform B)

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│  React + TypeScript + Redux Toolkit + Socket.IO Client       │
│  - Marketplace browsing & filtering                          │
│  - Listing creation & management                             │
│  - Trade initiation & tracking                              │
│  - Real-time chat interface                                 │
│  - KYC submission                                           │
│  - Wallet management                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/WSS
┌───────────────────────▼─────────────────────────────────────┐
│                    Backend API Server                         │
│  Node.js + Express + Socket.IO + BullMQ                      │
│  - RESTful API (Platform A & B)                              │
│  - Real-time WebSocket server                                │
│  - Background job processing                                │
│  - Rate limiting & security                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│   MongoDB    │ │    Redis    │ │   AWS S3    │
│  (Database)  │ │   (Cache)   │ │  (Storage)  │
└──────────────┘ └─────────────┘ └─────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  Admin Dashboard                             │
│  React + TypeScript + Redux Toolkit                          │
│  - User management & verification                            │
│  - KYC document review                                      │
│  - Trade & dispute management                               │
│  - Escrow controls                                          │
│  - Analytics & reporting                                    │
└───────────────────────────────────────────────────────────────┘
```

### Dual Platform Separation

**Platform A (Client APIs)** - `/api/v1/platform-a/*`
- User registration & authentication
- KYC submission
- Listing creation & browsing
- Trade execution
- Chat & messaging
- Payment proof upload

**Platform B (Admin APIs)** - `/api/v1/platform-b/*`
- User verification & management
- KYC review & approval
- Manual escrow controls
- Dispute resolution
- Audit logs & analytics
- Support ticket management

---

## 🛠️ Tech Stack

### Client Application (`/client`)

- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4
- **State Management**: Redux Toolkit 2.11.0
- **Routing**: React Router DOM 7.10.0
- **Styling**: Tailwind CSS 4.1.17
- **Forms**: React Hook Form 7.67.0 + Zod 4.1.13
- **Real-time**: Socket.IO Client 4.8.1
- **HTTP Client**: Axios 1.13.2
- **Icons**: Lucide React 0.555.0
- **Date Handling**: date-fns 4.1.0

### Admin Dashboard (`/admin`)

- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.2
- **State Management**: Redux Toolkit 2.11.0
- **Routing**: React Router DOM 7.10.1
- **Styling**: Tailwind CSS 3.4.1
- **Forms**: Formik 2.4.9 + Yup 1.7.1
- **HTTP Client**: Axios (via RTK Query)
- **Notifications**: React Toastify 11.0.5
- **Charts**: Recharts 3.5.1

### Backend API (`/server`)

- **Runtime**: Node.js 20+
- **Framework**: Express.js 5.1.0
- **Language**: JavaScript (ES Modules)
- **Database**: MongoDB 8.16.0 (Mongoose ODM)
- **Cache**: Redis 4.6.12
- **Real-time**: Socket.IO 4.6.1
- **Job Queue**: BullMQ 5.0.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Validation**: Joi 18.0.2
- **File Storage**: AWS S3 SDK 3.940.0
- **Security**: Helmet 8.1.0, CORS 2.8.5
- **Rate Limiting**: express-rate-limit 7.1.5
- **Logging**: Winston 3.11.0
- **Email**: Nodemailer 7.0.11
- **SMS**: Twilio 4.23.0

---

## 📂 Project Structure

```
CryptiansApplication/
├── client/                    # Client Application (Platform A)
│   ├── src/
│   │   ├── api/              # API configuration (axios, SummaryApi)
│   │   ├── app/              # Redux store & hooks
│   │   ├── components/       # Reusable components
│   │   │   └── Chat/        # Chat components (forms, timers)
│   │   ├── features/         # Feature slices (auth)
│   │   ├── layout/           # Layout components
│   │   ├── pages/            # Route pages
│   │   │   ├── Marketplace.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   ├── AllChats.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── ...
│   │   ├── services/         # Services (socket.service.ts)
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utilities
│   ├── package.json
│   └── vite.config.ts
│
├── admin/                     # Admin Dashboard (Platform B)
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── layout/      # Layout components
│   │   │   └── user/        # User management components
│   │   ├── pages/            # Admin pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Users.tsx
│   │   │   ├── KYC.tsx
│   │   │   ├── Trades.tsx
│   │   │   ├── Disputes.tsx
│   │   │   └── ...
│   │   ├── store/            # Redux store
│   │   │   ├── api/         # RTK Query APIs
│   │   │   └── slices/      # Redux slices
│   │   └── utils/            # Utilities
│   ├── package.json
│   └── vite.config.ts
│
└── server/                    # Backend API
    ├── src/
    │   ├── api/
    │   │   └── v1/
    │   │       ├── platform-a/    # Client APIs
    │   │       │   ├── auth/
    │   │       │   ├── chat/
    │   │       │   ├── listings/
    │   │       │   ├── trades/
    │   │       │   ├── kyc/
    │   │       │   └── profile/
    │   │       └── platform-b/    # Admin APIs
    │   │           ├── admin/
    │   │           ├── support/
    │   │           ├── disputes/
    │   │           └── escrow/
    │   ├── config/           # Configuration files
    │   │   ├── database.config.js
    │   │   ├── redis.config.js
    │   │   ├── socket.config.js
    │   │   └── jwt.config.js
    │   ├── models/            # Mongoose models (11 models)
    │   │   ├── User.model.js
    │   │   ├── Trade.model.js
    │   │   ├── Chat.model.js
    │   │   ├── Listing.model.js
    │   │   └── ...
    │   ├── services/         # Business logic
    │   │   ├── trade.service.js
    │   │   ├── chat.service.js
    │   │   ├── escrow.service.js
    │   │   └── ...
    │   ├── middleware/       # Express middleware
    │   │   ├── auth.middleware.js
    │   │   ├── rbac.middleware.js
    │   │   └── rate-limit.middleware.js
    │   ├── validators/       # Joi validation schemas
    │   ├── workers/          # BullMQ workers
    │   ├── utils/            # Utilities
    │   ├── app.js            # Express app setup
    │   └── index.js          # Server entry point
    ├── logs/                 # Application logs
    ├── package.json
    ├── Dockerfile
    └── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.x
- MongoDB >= 6.x (or MongoDB Atlas)
- Redis >= 7.x
- npm or yarn

### 1. Clone Repository

```bash
git clone <repository-url>
cd CryptiansApplication
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Install admin dependencies
cd ../admin
npm install
```

### 3. Environment Configuration

#### Server Environment (`.env` in `/server`)

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174

# Database
MONGO_URI=mongodb://localhost:27017/cryptians_dev
# OR MongoDB Atlas
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/cryptians_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# AWS S3 (Optional for local dev)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=cryptians-uploads

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@cryptians.com
SMTP_PASSWORD=your-smtp-password

# SMS (Optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Client Environment (`.env` in `/client`)

```env
VITE_API_URL=http://localhost:5000
```

#### Admin Environment (`.env` in `/admin`)

```env
VITE_API_URL=http://localhost:5000
```

### 4. Start Services

#### Option A: Start Individually

**Terminal 1 - Start Server:**
```bash
cd server
npm run dev
```
Server runs on `http://localhost:5000`

**Terminal 2 - Start Client:**
```bash
cd client
npm run dev
```
Client runs on `http://localhost:5173`

**Terminal 3 - Start Admin:**
```bash
cd admin
npm run dev
```
Admin runs on `http://localhost:5174` (or next available port)

#### Option B: Docker Compose (Recommended)

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 5. Verify Installation

- **Server Health**: `http://localhost:5000/health`
- **Client App**: `http://localhost:5173`
- **Admin Dashboard**: `http://localhost:5174`

---

## 📚 Key Features

### Client Application Features

- ✅ **Marketplace Browsing**
  - Filter listings by crypto type, payment method, price range
  - Search sellers by name
  - View seller ratings and completion rates
  - Real-time listing updates

- ✅ **Listing Management**
  - Create USDT sell listings with pricing
  - Set trade limits (min/max)
  - Configure payment methods (UPI, IMPS, Bank Transfer)
  - Manage active listings

- ✅ **Trade Execution**
  - Initiate trades from listings
  - Complete trade lifecycle with escrow
  - Upload payment proofs
  - Track trade status in real-time

- ✅ **Real-time Chat**
  - Socket.IO powered chat interface
  - Trade-based chat rooms
  - Message history persistence
  - Typing indicators
  - Read receipts

- ✅ **KYC Submission**
  - Document upload (Aadhaar, PAN, Passport)
  - Status tracking
  - Re-submission on rejection

- ✅ **User Profile**
  - Profile management
  - Trading statistics
  - Review system
  - Wallet integration

### Admin Dashboard Features

- ✅ **User Management**
  - View all users
  - User verification
  - Account suspension/banning
  - User statistics

- ✅ **KYC Review**
  - Pending KYC queue
  - Document review interface
  - Approve/reject with reasons
  - KYC level management

- ✅ **Trade Management**
  - View all trades
  - Trade status monitoring
  - Manual intervention capabilities

- ✅ **Dispute Resolution**
  - View disputes
  - Resolve conflicts
  - Refund/escrow controls

- ✅ **Escrow Controls**
  - Manual escrow release
  - Refund processing
  - Instant seller escrow management

- ✅ **Analytics & Reporting**
  - Dashboard statistics
  - User activity tracking
  - Trade volume metrics
  - Audit log viewing

### Backend API Features

- ✅ **Authentication & Authorization**
  - JWT-based authentication
  - Refresh token rotation
  - Role-based access control (7 roles)
  - Permission-based route protection

- ✅ **Real-time Communication**
  - Socket.IO server
  - Trade-based chat rooms
  - User presence tracking
  - Typing indicators

- ✅ **Background Processing**
  - BullMQ job queues
  - Email notifications
  - Trade timeout monitoring
  - Escrow monitoring

- ✅ **Security**
  - Rate limiting (Redis-backed)
  - Input validation (Joi)
  - Security headers (Helmet)
  - CORS configuration
  - Audit logging

- ✅ **File Management**
  - AWS S3 integration
  - Direct upload support
  - Payment proof storage
  - KYC document storage

---

## 🔌 API Documentation

### Base URLs

- **Development**: `http://localhost:5000`
- **API Version**: `/api/v1`

### Platform A Endpoints (Client)

#### Authentication
```
POST   /api/v1/platform-a/auth/register
POST   /api/v1/platform-a/auth/login
POST   /api/v1/platform-a/auth/verify-otp
POST   /api/v1/platform-a/auth/refresh
POST   /api/v1/platform-a/auth/logout
```

#### Listings
```
GET    /api/v1/platform-a/listings
POST   /api/v1/platform-a/listings
GET    /api/v1/platform-a/listings/:id
PUT    /api/v1/platform-a/listings/:id
DELETE /api/v1/platform-a/listings/:id
GET    /api/v1/platform-a/listings/my-listings
```

#### Trades
```
POST   /api/v1/platform-a/trades
GET    /api/v1/platform-a/trades
GET    /api/v1/platform-a/trades/:id
POST   /api/v1/platform-a/trades/:id/deposit-escrow
POST   /api/v1/platform-a/trades/:id/upload-payment
POST   /api/v1/platform-a/trades/:id/confirm-payment
POST   /api/v1/platform-a/trades/:id/cancel
```

#### Chat
```
GET    /api/v1/platform-a/chat
GET    /api/v1/platform-a/chat/trade/:tradeId
GET    /api/v1/platform-a/chat/:id
GET    /api/v1/platform-a/chat/:id/messages
POST   /api/v1/platform-a/chat/:id/messages
POST   /api/v1/platform-a/chat/:id/read
GET    /api/v1/platform-a/chat/unread/count
```

#### KYC
```
GET    /api/v1/platform-a/kyc
POST   /api/v1/platform-a/kyc/submit
PUT    /api/v1/platform-a/kyc/update
```

#### Profile
```
GET    /api/v1/platform-a/profile
PUT    /api/v1/platform-a/profile
GET    /api/v1/platform-a/users/:id
```

### Platform B Endpoints (Admin)

#### Admin
```
GET    /api/v1/platform-b/admin/users
GET    /api/v1/platform-b/admin/users/:id
PUT    /api/v1/platform-b/admin/users/:id/verify
PUT    /api/v1/platform-b/admin/users/:id/ban
GET    /api/v1/platform-b/admin/kyc/pending
PUT    /api/v1/platform-b/admin/kyc/:id/approve
PUT    /api/v1/platform-b/admin/kyc/:id/reject
GET    /api/v1/platform-b/admin/disputes
PUT    /api/v1/platform-b/admin/disputes/:id/resolve
```

#### Escrow
```
POST   /api/v1/platform-b/escrow/:id/release
POST   /api/v1/platform-b/escrow/:id/refund
```

#### Support
```
GET    /api/v1/platform-b/support/tickets
POST   /api/v1/platform-b/support/tickets
PUT    /api/v1/platform-b/support/tickets/:id
```

For detailed API documentation, see:
- [Server API Reference](./server/API-REFERENCE.md)
- [API Endpoints Summary](./server/API-ENDPOINTS-SUMMARY.md)

---

## 🔐 Authentication Flow

### User Registration & Login

1. **Register**: `POST /api/v1/platform-a/auth/register`
   - Creates user account
   - Sends OTP to mobile/email

2. **Verify OTP**: `POST /api/v1/platform-a/auth/verify-otp`
   - Verifies OTP
   - Returns `accessToken` and `refreshToken`

3. **Access Protected Routes**: Include token in header
   ```
   Authorization: Bearer <accessToken>
   ```

4. **Token Refresh**: When access token expires (15 min)
   ```
   POST /api/v1/platform-a/auth/refresh
   Body: { refreshToken: "..." }
   ```

### Socket.IO Authentication

Socket connections require JWT token:

```javascript
const socket = io(baseURL, {
  auth: { token: accessToken },
  transports: ['websocket', 'polling']
});
```

---

## 💬 Real-time Chat Flow

### Chat Room Creation

1. **Buyer clicks "Buy Now"** on a listing
2. **Navigates to** `/chat/new/:listingId`
3. **Fills Buyer Request Form** (USDT amount, payment method)
4. **Submits form** → Creates Trade + Chat
5. **Redirects to** `/chat/:tradeId`
6. **Chat room is active** with both buyer and seller

### Message Flow

1. **Client sends message** via Socket.IO:
   ```javascript
   socketService.sendMessage({
     tradeId: "trade123",
     text: "Hello!",
     senderRole: "buyer"
   });
   ```

2. **Server broadcasts** to trade room:
   ```javascript
   io.to(`trade:${tradeId}`).emit("new-message", message);
   ```

3. **Persists message** via REST API:
   ```
   POST /api/v1/platform-a/chat/:chatId/messages
   ```

4. **All participants receive** message in real-time

---

## 🗄️ Database Models

### Core Models

- **User**: User accounts, roles, KYC status, reviews
- **Listing**: Sell listings with pricing and limits
- **Trade**: P2P trade lifecycle with escrow
- **Chat**: Trade-based chat rooms
- **Message**: Chat messages with read receipts
- **KYC**: KYC document submissions
- **Payment**: Payment proof uploads
- **Dispute**: Trade disputes
- **EscrowTransaction**: Blockchain transaction tracking
- **Notification**: User notifications
- **AuditLog**: Security audit trail

See [Server Architecture](./server/ARCHITECTURE.md) for detailed schema documentation.

---

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting (Redis-backed)
- ✅ Input validation (Joi schemas)
- ✅ Security headers (Helmet)
- ✅ CORS whitelist
- ✅ Password hashing (bcrypt)
- ✅ Audit logging
- ✅ File upload validation
- ✅ SQL injection prevention (Mongoose)

---

## 🧪 Development

### Running in Development Mode

All three applications support hot-reload:

```bash
# Server (nodemon)
cd server && npm run dev

# Client (Vite HMR)
cd client && npm run dev

# Admin (Vite HMR)
cd admin && npm run dev
```

### Code Structure Guidelines

- **Client**: Component-based architecture with Redux for state
- **Admin**: RTK Query for API calls, Redux for state
- **Server**: Layered architecture (Routes → Controllers → Services → Models)

### Testing

```bash
# Server tests (when implemented)
cd server && npm test

# Client tests (when implemented)
cd client && npm test
```

---

## 🐳 Docker Deployment

### 1. Development Method (Hot Reload + Debugging)
Run all services (Server, Client, Admin) with live reloading. Best for coding.

```bash
# Start all services
docker-compose up

# Run in background
docker-compose up -d
```

**Access Points:**
- **Client App**: [http://localhost:5173](http://localhost:5173)
- **Admin Dashboard**: [http://localhost:5174](http://localhost:5174)
- **Server API**: [http://localhost:5000](http://localhost:5000)

### 2. Production Method (Optimized + Nginx Gateway)
Simulate a real production environment where apps are built and served via Nginx.

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d --build
```

**Access Points:**
- **Client App**: [http://localhost](http://localhost) (Port 80)
- **Admin Dashboard**: [http://localhost:81](http://localhost:81) (Port 81)
- **Server API**: Accessed via internal gateway or [http://localhost:5000](http://localhost:5000)

### 3. Redeployment (Update Application)
When you have new code changes and need to update the running production application:

```bash
# 1. Pull latest changes (if using git)
git pull origin main

# 2. Rebuild and restart containers
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Clean up unused images (optional)
docker image prune -f
```

---

## 📊 Monitoring & Logging

### Log Files

Server logs are stored in `/server/logs/`:
- `error.log` - Error level logs
- `combined.log` - All logs
- `http.log` - HTTP access logs
- `audit.log` - Security audit trail

### Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-12-04T10:30:00.000Z",
  "database": { "status": "connected" },
  "redis": { "status": "connected" }
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Formatting changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

---

## 📖 Additional Documentation

- [Server Architecture](./server/ARCHITECTURE.md) - Detailed backend architecture
- [API Reference](./server/API-REFERENCE.md) - Complete API documentation
- [Deployment Guide](./server/DEPLOYMENT.md) - Production deployment instructions
- [Development Guide](./server/DEVELOPMENT.md) - Development setup and workflows

---

## 📄 License

Proprietary - All rights reserved

---

## 👥 Authors

- **Govind Ghosh** - Initial development

---

## 🙏 Acknowledgments

Built with modern web technologies for secure and scalable P2P cryptocurrency trading.

---

**Last Updated**: May 2026
