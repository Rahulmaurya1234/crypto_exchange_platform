# Development Guide - Cryptians P2P Marketplace Backend

This guide is for developers working on the Cryptians backend codebase.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Database Design](#database-design)
- [API Development](#api-development)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)
- [Git Workflow](#git-workflow)

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/your-org/cryptians-backend.git
cd cryptians-backend/server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Local Database

**Option A: Docker (Recommended)**
```bash
docker-compose up -d mongodb redis
```

**Option B: Manual Installation**
```bash
# MongoDB
brew install mongodb-community  # macOS
sudo apt install mongodb         # Ubuntu

# Redis
brew install redis              # macOS
sudo apt install redis-server   # Ubuntu
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with local development values:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://admin:password@localhost:27017
DBNAME=cryptians_dev
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=dev-access-secret-min-32-characters-long
JWT_REFRESH_SECRET=dev-refresh-secret-min-32-characters-long
```

### 5. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:5000` with auto-reload on file changes.

## Development Environment

### Recommended Tools

**Code Editor**
- VS Code with extensions:
  - ESLint
  - Prettier
  - MongoDB for VS Code
  - Docker
  - GitLens
  - Thunder Client (API testing)

**Database Tools**
- MongoDB Compass (GUI for MongoDB)
- RedisInsight (GUI for Redis)

**API Testing**
- Postman or Thunder Client
- Import collection from `docs/postman/`

**Version Control**
- Git 2.x+
- GitHub Desktop (optional)

### VS Code Configuration

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "javascript.preferences.importModuleSpecifier": "relative",
  "files.eol": "\n"
}
```

Create `.vscode/launch.json` for debugging:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/index.js",
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal"
    }
  ]
}
```

## Project Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│           Routes Layer                   │  ← HTTP endpoints
│  (Platform A & Platform B separation)    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Controllers Layer                 │  ← Request/Response handling
│  - Validate input (Joi)                  │
│  - Call services                         │
│  - Format responses                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Services Layer                   │  ← Business logic
│  - Trade lifecycle management            │
│  - Fee calculations                      │
│  - Price feeds                           │
│  - Notifications                         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Models Layer                    │  ← Data persistence
│  - Mongoose schemas                      │
│  - Database operations                   │
│  - Data validation                       │
└──────────────────────────────────────────┘
```

### Middleware Flow

```
Request
  │
  ├─► languageMiddleware (detect lang)
  │
  ├─► rateLimitMiddleware (check limits)
  │
  ├─► authenticate (verify JWT)
  │
  ├─► authorize (check permissions)
  │
  ├─► validate (Joi schema)
  │
  ├─► Controller
  │
  ├─► Service
  │
  ├─► Model
  │
  └─► Response / Error Handler
```

## Coding Standards

### JavaScript Style Guide

**ES Modules**
```javascript
// Use ES6 imports/exports
import { Router } from "express";
export const router = Router();

// NOT CommonJS
// const { Router } = require("express");
// module.exports = router;
```

**Async/Await**
```javascript
// Use async/await
export const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    res.json(new ApiResponse(200, "User found", user));
});

// Avoid callbacks and .then()
```

**Error Handling**
```javascript
// Use custom error classes
if (!user) {
    throw new NotFoundError("USER_001"); // Error code from constants
}

// Or with parameters
throw new BadRequestError("VAL_001", { field: "email" });
```

**Naming Conventions**
```javascript
// camelCase for variables and functions
const userId = req.params.id;
function calculateFees() {}

// PascalCase for classes and models
class ApiError extends Error {}
const User = mongoose.model("User");

// UPPER_CASE for constants
const MAX_LOGIN_ATTEMPTS = 5;
const TRADE_STATUS = { PENDING: "pending" };
```

### File Naming

- Routes: `user.routes.js`
- Controllers: `user.controller.js`
- Services: `user.service.js`
- Models: `User.model.js` (PascalCase)
- Middleware: `auth.middleware.js`
- Validators: `user.validator.js`
- Utils: `helpers.js`, `logger.js`

### Code Structure

**Controller Template**
```javascript
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { BadRequestError, NotFoundError } from "../utils/ApiError.js";
import * as userService from "../services/user.service.js";

/**
 * Get user profile
 * @route GET /api/v1/users/:id
 * @access Private
 */
export const getUserProfile = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
        throw new NotFoundError("USER_001");
    }

    res.json(new ApiResponse(200, "User profile retrieved", user));
});
```

**Service Template**
```javascript
import User from "../models/User.model.js";
import { NotFoundError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export const getUserById = async (userId) => {
    try {
        const user = await User.findById(userId).select("-password");
        return user;
    } catch (error) {
        logger.error("Error fetching user:", error);
        throw error;
    }
};

export const createUser = async (userData) => {
    const user = new User(userData);
    await user.save();
    return user;
};
```

**Validator Template**
```javascript
import Joi from "joi";

export const createUserSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])"))
        .messages({
            "string.pattern.base": "Password must contain uppercase, lowercase, number and special character",
        }),
});
```

## Database Design

### Schema Relationships

```
User (1) ──── (N) Listings
  │
  ├──── (N) Trades (as buyer)
  │
  ├──── (N) Trades (as seller)
  │
  ├──── (1) KYC
  │
  └──── (N) Reviews (embedded)

Listing (1) ──── (N) Trades

Trade (1) ──── (N) Messages
  │
  ├──── (1) Chat
  │
  ├──── (0..1) Dispute
  │
  ├──── (N) Payments
  │
  └──── (N) EscrowTransactions
```

### Indexing Strategy

```javascript
// User model
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ mobileNumber: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ "kycStatus.status": 1 });
userSchema.index({ averageRating: -1 }); // For sorting sellers

// Trade model
tradeSchema.index({ tradeNumber: 1 }, { unique: true });
tradeSchema.index({ buyerId: 1, status: 1 });
tradeSchema.index({ sellerId: 1, status: 1 });
tradeSchema.index({ listingId: 1 });
tradeSchema.index({ createdAt: -1 });

// Listing model
listingSchema.index({ sellerId: 1, status: 1 });
listingSchema.index({ cryptoAmount: 1 });
listingSchema.index({ pricePerUnit: 1 });
listingSchema.index({ isActive: 1, status: 1 });
```

### Query Optimization

```javascript
// BAD - Multiple database calls
const user = await User.findById(userId);
const kyc = await KYC.findOne({ userId });
const trades = await Trade.find({ buyerId: userId });

// GOOD - Use populate and aggregation
const user = await User.findById(userId)
    .populate("kycId")
    .lean();

const userWithStats = await User.aggregate([
    { $match: { _id: userId } },
    {
        $lookup: {
            from: "trades",
            localField: "_id",
            foreignField: "buyerId",
            as: "buyerTrades"
        }
    },
    {
        $project: {
            name: 1,
            email: 1,
            totalTrades: { $size: "$buyerTrades" }
        }
    }
]);
```

## API Development

### Creating a New Endpoint

#### 1. Define Validation Schema

`src/validators/listing.validator.js`
```javascript
export const createListingSchema = Joi.object({
    cryptoAmount: Joi.number().min(10).max(100000).required(),
    pricePerUnit: Joi.number().min(1).required(),
    minOrderAmount: Joi.number().min(10).required(),
    maxOrderAmount: Joi.number().max(Joi.ref("cryptoAmount")).required(),
    paymentMethods: Joi.array().items(Joi.string().valid("UPI", "IMPS", "NEFT")).min(1).required(),
    description: Joi.string().max(500).optional(),
});
```

#### 2. Create Service Function

`src/services/listing.service.js`
```javascript
export const createListing = async (sellerId, listingData) => {
    // Verify seller is KYC approved
    const seller = await User.findById(sellerId);
    if (!seller.canCreateListing()) {
        throw new ForbiddenError("KYC_004");
    }

    // Get current USDT/INR price
    const currentPrice = await getUsdtInrPrice();

    // Create listing
    const listing = new Listing({
        ...listingData,
        sellerId,
        currentMarketPrice: currentPrice,
        status: LISTING_STATUS.ACTIVE,
    });

    await listing.save();

    // Send notification
    await notificationService.sendListingCreated(seller, listing);

    return listing;
};
```

#### 3. Create Controller

`src/controllers/listing.controller.js`
```javascript
export const createListing = asyncHandler(async (req, res) => {
    const listing = await listingService.createListing(
        req.user._id,
        req.body
    );

    res.status(201).json(
        new ApiResponse(201, "Listing created successfully", listing)
    );
});
```

#### 4. Define Route

`src/routes/platform-a/listing.routes.js`
```javascript
import { Router } from "express";
import * as listingController from "../../controllers/listing.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { canCreateListing } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createListingSchema } from "../../validators/listing.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    canCreateListing(),
    validate(createListingSchema),
    listingController.createListing
);

export default router;
```

#### 5. Register Route in App

`src/routes/index.js`
```javascript
import listingRoutes from "./platform-a/listing.routes.js";

export default (app) => {
    app.use("/api/v1/listings", listingRoutes);
};
```

## Testing

### Unit Tests

Create `tests/services/listing.service.test.js`:
```javascript
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as listingService from "../../src/services/listing.service.js";
import User from "../../src/models/User.model.js";
import Listing from "../../src/models/Listing.model.js";

describe("Listing Service", () => {
    beforeEach(async () => {
        // Setup test data
        await User.create({
            email: "seller@test.com",
            name: "Test Seller",
            role: "seller",
            kycStatus: { status: "approved" }
        });
    });

    afterEach(async () => {
        // Cleanup
        await User.deleteMany({});
        await Listing.deleteMany({});
    });

    it("should create listing for approved seller", async () => {
        const seller = await User.findOne({ email: "seller@test.com" });

        const listingData = {
            cryptoAmount: 1000,
            pricePerUnit: 83.50,
            minOrderAmount: 100,
            maxOrderAmount: 1000,
            paymentMethods: ["UPI"]
        };

        const listing = await listingService.createListing(
            seller._id,
            listingData
        );

        expect(listing).toBeDefined();
        expect(listing.cryptoAmount).toBe(1000);
        expect(listing.status).toBe("active");
    });

    it("should reject listing for non-KYC seller", async () => {
        const seller = await User.create({
            email: "nokyc@test.com",
            name: "No KYC Seller",
            role: "seller"
        });

        await expect(
            listingService.createListing(seller._id, {})
        ).rejects.toThrow();
    });
});
```

### Integration Tests

Create `tests/integration/listing.test.js`:
```javascript
import request from "supertest";
import app from "../../src/app.js";

describe("Listing API", () => {
    let authToken;

    beforeAll(async () => {
        // Login and get token
        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: "seller@test.com", password: "Test@1234" });

        authToken = response.body.data.accessToken;
    });

    it("POST /api/v1/listings - should create listing", async () => {
        const response = await request(app)
            .post("/api/v1/listings")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                cryptoAmount: 1000,
                pricePerUnit: 83.50,
                minOrderAmount: 100,
                maxOrderAmount: 1000,
                paymentMethods: ["UPI"]
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("_id");
    });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/services/listing.service.test.js

# Run in watch mode
npm test -- --watch
```

## Debugging

### Using VS Code Debugger

1. Set breakpoints in code
2. Press F5 or Run > Start Debugging
3. Use Debug Console to inspect variables

### Console Logging

```javascript
// Use logger instead of console.log
import { logger } from "../utils/logger.js";

logger.info("User logged in", { userId: user._id });
logger.error("Database error", { error: error.message });
logger.debug("Processing trade", { tradeId, status });
```

### MongoDB Queries

```javascript
// Enable Mongoose debug mode in development
if (process.env.NODE_ENV === "development") {
    mongoose.set("debug", true);
}

// This will log all queries to console
```

### Redis Debugging

```bash
# Monitor Redis commands in real-time
redis-cli monitor

# Check keys
redis-cli keys "*"

# Get key value
redis-cli get "key-name"
```

## Common Tasks

### Adding a New Model

1. Create model file: `src/models/NewModel.model.js`
```javascript
import mongoose from "mongoose";

const newModelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    // ... fields
}, { timestamps: true });

// Add indexes
newModelSchema.index({ name: 1 });

const NewModel = mongoose.model("NewModel", newModelSchema);
export default NewModel;
```

2. Export from `src/models/index.js`
```javascript
export { default as NewModel } from "./NewModel.model.js";
```

### Adding a New Error Code

1. Add to `src/constants/error-codes.js`
```javascript
export const ERROR_CODES = {
    // ... existing codes
    NEW_ERR_001: "Description of error",
};
```

2. Add translations in `src/locales/en/errors.json`
```json
{
    "NEW_ERR_001": "English error message"
}
```

3. Add Hindi translation in `src/locales/hi/errors.json`
```json
{
    "NEW_ERR_001": "हिंदी त्रुटि संदेश"
}
```

### Adding a New Role or Permission

1. Update `src/constants/roles.js`
```javascript
export const ROLES = {
    // ... existing roles
    NEW_ROLE: "new_role",
};

export const PERMISSIONS = {
    NEW_ACTION: [ROLES.ADMIN, ROLES.NEW_ROLE],
};
```

2. Create middleware if needed
```javascript
export const canPerformNewAction = () => {
    return hasPermission(PERMISSIONS.NEW_ACTION);
};
```

## Git Workflow

### Branch Strategy

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feature/user-reviews
  │     ├── feature/instant-seller
  │     ├── bugfix/trade-calculation
  │     └── hotfix/security-patch
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(trade): Add escrow auto-release functionality

Implemented automatic USDT release after 24 hours of buyer payment confirmation.
Added BullMQ job for scheduled release.

Closes #123
```

```
fix(auth): Resolve JWT expiration issue

Fixed bug where refresh tokens were expiring too early.
Updated JWT_REFRESH_EXPIRATION handling.

Fixes #456
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Environment variables documented
```

## Performance Tips

### Database Optimization

```javascript
// Use .lean() for read-only queries
const users = await User.find().lean();

// Select only needed fields
const users = await User.find().select("name email");

// Use pagination
const users = await User.find()
    .skip((page - 1) * limit)
    .limit(limit);

// Use aggregation for complex queries
const stats = await Trade.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: "$sellerId", totalVolume: { $sum: "$cryptoAmount" } } }
]);
```

### Caching Strategy

```javascript
import { redisClient } from "../config/redis.config.js";

// Cache expensive queries
export const getPopularListings = async () => {
    const cacheKey = "listings:popular";

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Query database
    const listings = await Listing.find({ isActive: true })
        .sort({ viewCount: -1 })
        .limit(20);

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(listings));

    return listings;
};
```

---

## Quick Reference

### Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm test                       # Run tests
npm run lint                   # Run ESLint

# Database
mongosh cryptians_dev          # Open MongoDB shell
redis-cli                      # Open Redis CLI

# Docker
docker-compose up -d           # Start services
docker-compose logs -f api     # View logs
docker-compose down            # Stop services

# PM2
pm2 list                       # List processes
pm2 logs                       # View logs
pm2 monit                      # Monitor
```

### Environment Variables Reference

See `.env.example` for complete list.

---

Happy coding!
