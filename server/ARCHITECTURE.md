# Architecture Documentation - Cryptians P2P Marketplace Backend

This document describes the architecture, design decisions, and technical implementation of the Cryptians backend system.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Principles](#architecture-principles)
- [System Architecture](#system-architecture)
- [Data Architecture](#data-architecture)
- [Security Architecture](#security-architecture)
- [API Architecture](#api-architecture)
- [Infrastructure Architecture](#infrastructure-architecture)
- [Design Patterns](#design-patterns)
- [Design Decisions](#design-decisions)
- [Scalability Considerations](#scalability-considerations)

## System Overview

### Purpose

Cryptians is a peer-to-peer cryptocurrency marketplace enabling USDT/INR trades with automated escrow management, KYC verification, and comprehensive admin controls.

### Key Characteristics

- **Non-custodial**: Platform only holds USDT in escrow; INR transfers are P2P
- **Dual Platform**: Separate interfaces for clients (Platform A) and admin/support (Platform B)
- **Automated**: Smart escrow release based on trade lifecycle
- **Secure**: Multi-layer security with KYC, RBAC, and audit logging
- **Scalable**: Designed for horizontal scaling with cluster mode

### Technology Stack

```
┌─────────────────────────────────────────────────────┐
│                   Application Layer                  │
│              Node.js 20 + Express.js                 │
└─────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│   MongoDB/     │ │    Redis    │ │  AWS S3/SMS/   │
│  DocumentDB    │ │   (Cache)   │ │     Email      │
└────────────────┘ └─────────────┘ └────────────────┘
```

## Architecture Principles

### 1. Separation of Concerns

- **Routes**: HTTP endpoint definitions
- **Controllers**: Request/response handling
- **Services**: Business logic implementation
- **Models**: Data persistence and validation

### 2. Single Responsibility

Each module has one well-defined responsibility:
- `fee-calculator.service.js`: Only calculates fees
- `price-feed.service.js`: Only fetches USDT/INR price
- `auth.middleware.js`: Only handles authentication

### 3. DRY (Don't Repeat Yourself)

- Centralized error handling
- Reusable validators
- Shared utilities (logger, response formatters)
- Common middleware

### 4. Security by Design

- Input validation on all endpoints
- Role-based access control
- Rate limiting
- Audit logging
- Encrypted sensitive data

### 5. Fail Fast

- Configuration validation on startup
- Database connection checks
- Required environment variable validation

### 6. Graceful Degradation

- Price feed fallback chain (Binance → CoinGecko → Static)
- Redis failure doesn't crash the app
- Graceful shutdown on process termination

## System Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│              (Platform A Web/Mobile, Platform B Admin)       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS/WSS
┌──────────────────────────▼──────────────────────────────────┐
│                      API Gateway Layer                       │
│                    (Nginx Load Balancer)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Middleware Pipeline                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Language Detection → Rate Limit → CORS → Helmet   │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     Route Layer                              │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │   Platform A Routes │    │  Platform B Routes  │        │
│  │  (Client APIs)      │    │  (Admin APIs)       │        │
│  └─────────────────────┘    └─────────────────────┘        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Authentication & Authorization                  │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐         │
│  │  JWT Auth  │  │  RBAC Check │  │  Validation  │         │
│  └────────────┘  └─────────────┘  └──────────────┘         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     Controller Layer                         │
│          (Request parsing, Response formatting)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Auth    │ │  Trade   │ │  KYC     │ │  Escrow  │       │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Data Access Layer                       │
│                    (Mongoose Models)                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌───────▼───────┐ ┌───────▼────────┐
│   MongoDB/     │ │     Redis     │ │   External     │
│  DocumentDB    │ │   (Cache)     │ │   Services     │
│  (Persistent)  │ │ (Rate Limit)  │ │ (S3, SMS, etc.)│
└────────────────┘ └───────────────┘ └────────────────┘
```

### Component Interaction

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/v1/trades
       │ {buyerId, listingId, cryptoAmount}
       ▼
┌─────────────────────────────────────────┐
│          Middleware Pipeline             │
│  1. languageMiddleware                   │
│  2. rateLimitMiddleware                  │
│  3. authenticate                         │
│  4. authorize(ROLES.BUYER)               │
│  5. validate(createTradeSchema)          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│      trade.controller.js                 │
│  - Extract req.body                      │
│  - Call tradeService.createTrade()       │
│  - Format ApiResponse                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│      trade.service.js                    │
│  1. Fetch listing                        │
│  2. Validate availability                │
│  3. Get USDT/INR price                   │
│  4. Calculate fees                       │
│  5. Create trade record                  │
│  6. Lock listing amount                  │
│  7. Send notifications                   │
│  8. Log audit trail                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│           Database Layer                 │
│  - Save Trade document                   │
│  - Update Listing availability           │
│  - Create Notification                   │
│  - Log AuditLog                          │
└─────────────────────────────────────────┘
```

## Data Architecture

### Database Schema Design

#### Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                 │
│  - _id, email, password, role, kycStatus                    │
│  - reviews [] (embedded)                                     │
│  - averageRating, totalReviews                              │
│  - tradingStats, bankDetails, walletAddress                 │
└────┬──────────────┬─────────────────┬──────────────────────┘
     │              │                 │
     │ sellerId     │ buyerId         │ userId
     │              │                 │
┌────▼────────┐ ┌───▼──────────┐ ┌───▼──────┐
│  Listing    │ │    Trade     │ │   KYC    │
│             │ │              │ │          │
│ - amount    │ │ - status     │ │ - docs   │
│ - price     │ │ - escrow     │ │ - status │
│ - payment   │ │ - timeline   │ │ - level  │
└─────┬───────┘ └───┬──────────┘ └──────────┘
      │             │
      │ listingId   │ tradeId
      │             │
      └─────────────┼────────────────┬──────────┐
                    │                │          │
            ┌───────▼───────┐ ┌──────▼──────┐  │
            │     Chat      │ │   Payment   │  │
            │               │ │             │  │
            │ - participants│ │ - proof     │  │
            │ - lastMessage │ │ - method    │  │
            └───┬───────────┘ └─────────────┘  │
                │                               │
                │ chatId                        │ tradeId
                │                               │
        ┌───────▼────────┐            ┌────────▼─────────┐
        │    Message     │            │     Dispute      │
        │                │            │                  │
        │ - content      │            │ - reason         │
        │ - sender       │            │ - resolution     │
        └────────────────┘            └──────────────────┘
```

#### Data Modeling Decisions

**1. Embedded vs Referenced Documents**

- **Embedded**: Reviews in User model
  - Reason: Reviews are always fetched with user profile
  - Benefit: Single query for user + reviews
  - Trade-off: Document size growth (acceptable due to review limits)

- **Referenced**: Trade → Listing, User
  - Reason: Independent lifecycle, many-to-one relationship
  - Benefit: Data normalization, no duplication

**2. Denormalization for Performance**

```javascript
// Trade model includes cached seller/buyer names
{
  sellerId: ObjectId,
  sellerName: "John Doe",  // Cached for quick display
  buyerId: ObjectId,
  buyerName: "Jane Smith"  // Cached for quick display
}
```

Reason: Avoid joins when listing trades

**3. Timeline Events**

```javascript
timeline: [
  {
    event: "trade_created",
    timestamp: Date,
    actor: "buyer",
    metadata: { ... }
  }
]
```

Reason: Immutable audit trail, easy to query trade history

### Database Indexing Strategy

```javascript
// User Collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ mobileNumber: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ "kycStatus.status": 1 })
db.users.createIndex({ averageRating: -1 })  // For seller rankings

// Trade Collection
db.trades.createIndex({ tradeNumber: 1 }, { unique: true })
db.trades.createIndex({ buyerId: 1, status: 1 })
db.trades.createIndex({ sellerId: 1, status: 1 })
db.trades.createIndex({ listingId: 1 })
db.trades.createIndex({ status: 1, createdAt: -1 })  // For admin dashboard
db.trades.createIndex({ createdAt: -1 })  // For pagination

// Listing Collection
db.listings.createIndex({ sellerId: 1, status: 1 })
db.listings.createIndex({ isActive: 1, status: 1 })
db.listings.createIndex({ cryptoAmount: 1 })
db.listings.createIndex({ pricePerUnit: 1 })

// AuditLog Collection (Capped)
db.auditlogs.createIndex({ userId: 1, createdAt: -1 })
db.auditlogs.createIndex({ action: 1, createdAt: -1 })
db.auditlogs.createIndex({ createdAt: -1 })
```

### Caching Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    Cache Layers                          │
└─────────────────────────────────────────────────────────┘

Layer 1: Redis Cache
├── Price Feeds (TTL: 1 minute)
│   └── "price:usdt:inr" → 83.50
│
├── Active Listings (TTL: 5 minutes)
│   └── "listings:active:page:1" → [...]
│
├── User Sessions (TTL: 7 days)
│   └── "session:user:<userId>" → {accessToken, refreshToken}
│
├── Rate Limiting (TTL: 15 minutes)
│   └── "ratelimit:auth:<ip>" → attemptCount
│
└── OTP Verification (TTL: 5 minutes)
    └── "otp:<mobileNumber>" → hashedOTP

Layer 2: Application Memory (Planned)
├── Configuration
├── Static content
└── Hot data

Layer 3: CDN (Planned for static assets)
```

## Security Architecture

### Defense in Depth

```
┌──────────────────────────────────────────────────────────┐
│                  Layer 1: Network                         │
│  - Firewall, VPC, Security Groups                        │
│  - DDoS protection (CloudFlare/AWS Shield)               │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                  Layer 2: Transport                       │
│  - HTTPS/TLS 1.3                                          │
│  - SSL Certificate validation                             │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                Layer 3: Application                       │
│  - Rate limiting (Redis-backed)                           │
│  - CORS whitelist                                         │
│  - Helmet security headers                                │
│  - Input validation (Joi)                                 │
│  - SQL injection prevention (Mongoose)                    │
│  - XSS protection                                         │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│             Layer 4: Authentication                       │
│  - JWT with short expiration (15 min)                     │
│  - Refresh token rotation                                 │
│  - Password hashing (bcrypt, rounds: 10)                  │
│  - OTP verification (Twilio)                              │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│             Layer 5: Authorization                        │
│  - Role-based access control (RBAC)                       │
│  - Permission matrix                                      │
│  - Resource ownership validation                          │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                Layer 6: Data                              │
│  - Encryption at rest (MongoDB)                           │
│  - Encryption in transit (TLS)                            │
│  - Sensitive field encryption (crypto)                    │
│  - Audit logging (immutable)                              │
└───────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌───────┐                                              ┌────────┐
│Client │                                              │ Server │
└───┬───┘                                              └────┬───┘
    │                                                       │
    │  POST /api/v1/auth/register                          │
    │  {email, password, name, mobile}                     │
    ├──────────────────────────────────────────────────────>│
    │                                                       │
    │                                  1. Validate input    │
    │                                  2. Hash password     │
    │                                  3. Create user       │
    │                                  4. Send OTP          │
    │                                                       │
    │  {success: true, userId, otpSent: true}              │
    │<──────────────────────────────────────────────────────┤
    │                                                       │
    │  POST /api/v1/auth/verify-otp                        │
    │  {userId, otp}                                        │
    ├──────────────────────────────────────────────────────>│
    │                                                       │
    │                                  1. Verify OTP        │
    │                                  2. Mark verified     │
    │                                  3. Generate tokens   │
    │                                                       │
    │  {accessToken, refreshToken}                         │
    │<──────────────────────────────────────────────────────┤
    │                                                       │
    │  GET /api/v1/users/profile                           │
    │  Authorization: Bearer <accessToken>                 │
    ├──────────────────────────────────────────────────────>│
    │                                                       │
    │                                  1. Verify JWT        │
    │                                  2. Check expiration  │
    │                                  3. Fetch user        │
    │                                                       │
    │  {user: {...}}                                        │
    │<──────────────────────────────────────────────────────┤
    │                                                       │
    │  (After 15 minutes - token expired)                  │
    │  GET /api/v1/users/profile                           │
    │  Authorization: Bearer <expired-token>               │
    ├──────────────────────────────────────────────────────>│
    │                                                       │
    │  401 Unauthorized - Token expired                    │
    │<──────────────────────────────────────────────────────┤
    │                                                       │
    │  POST /api/v1/auth/refresh                           │
    │  {refreshToken}                                       │
    ├──────────────────────────────────────────────────────>│
    │                                                       │
    │                                  1. Verify refresh    │
    │                                  2. Generate new pair │
    │                                                       │
    │  {accessToken, refreshToken}                         │
    │<──────────────────────────────────────────────────────┤
```

### Authorization Matrix

```
┌────────────────┬──────┬────────┬─────────┬─────────┬──────┬───────┐
│    Action      │Buyer │ Seller │ Instant │ Support │ SPMGR│ Admin │
│                │      │        │ Seller  │         │      │       │
├────────────────┼──────┼────────┼─────────┼─────────┼──────┼───────┤
│ View Listings  │  ✓   │   ✓    │    ✓    │    ✓    │  ✓   │   ✓   │
│ Create Listing │  ✗   │   ✓    │    ✓    │    ✗    │  ✗   │   ✗   │
│ Initiate Trade │  ✓   │   ✗    │    ✗    │    ✗    │  ✗   │   ✗   │
│ Approve KYC    │  ✗   │   ✗    │    ✗    │    ✓    │  ✓   │   ✓   │
│ Manual Escrow  │  ✗   │   ✗    │    ✗    │    ✗    │  ✓   │   ✓   │
│ View All Users │  ✗   │   ✗    │    ✗    │    ✓    │  ✓   │   ✓   │
│ Ban User       │  ✗   │   ✗    │    ✗    │    ✗    │  ✗   │   ✓   │
│ System Config  │  ✗   │   ✗    │    ✗    │    ✗    │  ✗   │   ✓   │
└────────────────┴──────┴────────┴─────────┴─────────┴──────┴───────┘
```

## API Architecture

### RESTful Design

```
Resource-based URLs:
✓ GET    /api/v1/listings           (List all)
✓ POST   /api/v1/listings           (Create)
✓ GET    /api/v1/listings/:id       (Get one)
✓ PUT    /api/v1/listings/:id       (Update)
✓ DELETE /api/v1/listings/:id       (Delete)

Action-based sub-resources:
✓ POST   /api/v1/trades/:id/payment       (Mark paid)
✓ POST   /api/v1/trades/:id/confirm       (Confirm received)
✓ POST   /api/v1/trades/:id/dispute       (Open dispute)

Avoid:
✗ /api/v1/getListings
✗ /api/v1/createListing
✗ /api/v1/listing_details/:id
```

### Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response payload
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

Error response:
```json
{
  "success": false,
  "message": "Invalid email or password",
  "errorCode": "AUTH_001",
  "statusCode": 401,
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

### Pagination

```javascript
// Request
GET /api/v1/listings?page=1&limit=20&sortBy=createdAt&order=desc

// Response
{
  "success": true,
  "data": {
    "listings": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Infrastructure Architecture

### Deployment Architecture (Production)

```
                          ┌──────────────┐
                          │   Route 53   │ (DNS)
                          └──────┬───────┘
                                 │
                          ┌──────▼──────────┐
                          │   CloudFront    │ (CDN)
                          └──────┬──────────┘
                                 │
                          ┌──────▼──────────┐
                          │  Load Balancer  │ (ALB)
                          │  (SSL/TLS)      │
                          └──────┬──────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
          ┌──────▼─────┐  ┌──────▼─────┐  ┌─────▼──────┐
          │   ECS/EC2  │  │   ECS/EC2  │  │  ECS/EC2   │
          │   Node.js  │  │   Node.js  │  │  Node.js   │
          │ (Instance1)│  │ (Instance2)│  │(Instance3) │
          └──────┬─────┘  └──────┬─────┘  └─────┬──────┘
                 │               │               │
                 └───────────────┼───────────────┘
                                 │
         ┌───────────────────────┼──────────────────────┐
         │                       │                      │
  ┌──────▼────────┐    ┌─────────▼────────┐   ┌────────▼────────┐
  │  DocumentDB   │    │  ElastiCache     │   │   AWS S3        │
  │  (Primary +   │    │  Redis           │   │  (File Storage) │
  │   Replica)    │    │  (Cluster mode)  │   │                 │
  └───────────────┘    └──────────────────┘   └─────────────────┘
```

### Container Architecture

```
Docker Compose Services:

┌─────────────────────────────────────────────────────────┐
│                    cryptians-network                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  MongoDB     │  │    Redis     │  │  Node.js API │  │
│  │              │  │              │  │              │  │
│  │ Port: 27017  │  │ Port: 6379   │  │ Port: 5000   │  │
│  │              │  │              │  │ Instances: 4 │  │
│  │ Volume:      │  │ Volume:      │  │ Volume:      │  │
│  │ mongodb_data │  │ redis_data   │  │ ./src, ./logs│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Repository Pattern (via Mongoose Models)

```javascript
// Model acts as repository
class UserRepository {
    async findById(id) {
        return await User.findById(id);
    }

    async create(userData) {
        return await User.create(userData);
    }
}
```

### 2. Service Layer Pattern

```javascript
// Controllers call services, not models directly
export const createTrade = asyncHandler(async (req, res) => {
    const trade = await tradeService.createTrade(req.user._id, req.body);
    res.json(new ApiResponse(201, "Trade created", trade));
});
```

### 3. Factory Pattern (Error Classes)

```javascript
// ApiError factory methods
export const BadRequestError = (code, params, lang) =>
    new ApiError(400, code, params, lang);

export const NotFoundError = (code, params, lang) =>
    new ApiError(404, code, params, lang);
```

### 4. Middleware Chain Pattern

```javascript
router.post(
    "/",
    authenticate,
    authorize(ROLES.SELLER),
    validate(createListingSchema),
    rateLimitMiddleware.listing,
    listingController.create
);
```

### 5. Strategy Pattern (Price Feed)

```javascript
// Multiple price fetching strategies with fallback
const strategies = [
    fetchFromBinance,
    fetchFromCoinGecko,
    fetchFromChainlink,
    getStaticFallback
];

for (const strategy of strategies) {
    const price = await strategy();
    if (price) return price;
}
```

## Design Decisions

### 1. Database Choice: MongoDB

**Why MongoDB over PostgreSQL?**
- Flexible schema for evolving features
- Native support for nested documents (reviews, timeline)
- Horizontal scaling with sharding
- AWS DocumentDB compatibility for production

**Trade-off**: Less strict data integrity, but acceptable for marketplace

### 2. Embedded Reviews in User Model

**Why not separate Review collection?**
- Reviews always fetched with user profile
- Reduces join operations
- Faster seller reputation display

**Trade-off**: Document size growth, but limited by review cap

### 3. JWT vs Session-based Auth

**Why JWT?**
- Stateless, no server-side session storage
- Works across multiple instances
- Easy to scale horizontally

**Trade-off**: Token revocation complexity, mitigated with short expiration + refresh tokens

### 4. Redis for Rate Limiting

**Why Redis over in-memory?**
- Shared state across multiple instances
- Persistent across server restarts
- Atomic increment operations

**Trade-off**: Additional infrastructure, but necessary for cluster mode

### 5. Joi for Validation

**Why Joi over Zod?**
- User preference (explicitly requested)
- Mature ecosystem
- Better error messages customization

### 6. PM2 Cluster Mode

**Why PM2 over single instance?**
- Utilizes all CPU cores
- Zero-downtime restarts
- Automatic process recovery

**Trade-off**: Increased memory usage, but acceptable for production

## Scalability Considerations

### Horizontal Scaling

```
Current: Single server
  └── 4 PM2 instances

Future: Load balanced
  ├── Server 1: 4 instances
  ├── Server 2: 4 instances
  └── Server 3: 4 instances

Total: 12 concurrent processes
```

### Database Scaling

```
Phase 1: Single MongoDB instance
Phase 2: Replica set (1 primary + 2 replicas)
Phase 3: Sharding by userId
```

### Caching Strategy

```
Level 1: Redis (current)
Level 2: Application memory (planned)
Level 3: CDN for static content (planned)
```

### Bottleneck Identification

**Potential Bottlenecks:**
1. Database queries → Solution: Indexing, caching
2. Price feed API calls → Solution: Caching with TTL
3. File uploads → Solution: Direct S3 upload
4. Real-time chat → Solution: Socket.io with Redis adapter

---

## Future Enhancements

1. **WebSocket Integration**: Real-time chat and notifications
2. **GraphQL API**: Alternative to REST for flexible queries
3. **Microservices**: Split into auth, trade, chat services
4. **Message Queue**: BullMQ for background jobs
5. **Analytics**: Real-time dashboard with aggregation pipeline
6. **Blockchain Integration**: Direct smart contract interaction

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
