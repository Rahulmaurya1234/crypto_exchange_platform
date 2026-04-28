# 🏗️ Cryptians — Complete Application Documentation

> **Purpose:** Yeh document ek new intern ke liye hai jisko pura application samajhna hai — har ek feature, flow, file, aur process detail mein.
>
> **Last Updated:** 12 March 2026

---

## 📋 Table of Contents

1. [Application Overview](#1-application-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [How to Run Locally](#4-how-to-run-locally)
5. [Authentication System](#5-authentication-system)
6. [KYC (Know Your Customer)](#6-kyc-know-your-customer)
7. [Marketplace & Listings](#7-marketplace--listings)
8. [Trade Lifecycle](#8-trade-lifecycle)
9. [Chat System](#9-chat-system)
10. [Escrow System](#10-escrow-system)
11. [Instant Seller System](#11-instant-seller-system)
12. [Dispute & Appeal System](#12-dispute--appeal-system)
13. [Wallet System](#13-wallet-system)
14. [Notification System](#14-notification-system)
15. [Admin Panel (Platform B)](#15-admin-panel-platform-b)
16. [Role-Based Access Control (RBAC)](#16-role-based-access-control-rbac)
17. [Background Jobs & Workers](#17-background-jobs--workers)
18. [Deployment](#18-deployment)
19. [Pending Tasks / Incomplete Features](#19-pending-tasks--incomplete-features)

---

## 1. Application Overview

**Cryptians** ek **Peer-to-Peer (P2P) USDT Marketplace** hai jahan users USDT (crypto) buy/sell kar sakte hain INR mein.

### Kya karta hai?
- **Buyer** marketplace pe listing dekhta hai → seller se chat karta hai → trade initiate karta hai → INR pay karta hai → USDT receive karta hai.
- **Seller** listing create karta hai → buyer se INR receive karta hai → USDT release hota hai escrow se.
- **Admin** sab monitor karta hai — KYC approve, escrow verify, disputes resolve.

### 3 Applications hai:

| App | Port | Path | Description |
|-----|------|------|-------------|
| **Server** (Backend API) | 8080 | `server/` | Node.js + Express + MongoDB + Redis |
| **Client** (User App) | 5173 | `client/` | React + Vite + TypeScript |
| **Admin** (Admin Panel) | 5174 | `admin/` | React + Vite + TypeScript + TailwindCSS |

### API Architecture:
- **Platform A** = User-facing APIs → `/api/v1/platform-a/*`
- **Platform B** = Admin-facing APIs → `/api/v1/platform-b/*`

---

## 2. Tech Stack

### Backend (Server)
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | API Server |
| **MongoDB + Mongoose** | Database & ODM |
| **Redis** | Caching, OTP storage, Session management |
| **BullMQ** | Background job queues (trade timeout, email, etc.) |
| **Socket.IO** | Real-time communication (chat, notifications) |
| **JWT** | Authentication (Access + Refresh tokens) |
| **SendGrid** | Email service (OTP, notifications) |
| **Twilio** | SMS OTP service |
| **Cloudflare R2** | File uploads (KYC docs, payment proofs) |
| **Helmet** | Security headers |
| **bcryptjs** | Password hashing |

### Frontend (Client & Admin)
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI Framework |
| **Vite** | Build tool |
| **TypeScript** | Type safety |
| **React Router** | Routing |
| **Socket.IO Client** | Real-time events |
| **React Toastify** | Toast notifications |
| **Redux Toolkit** (Admin) | State management |
| **TailwindCSS** (Admin only) | Styling |

---

## 3. Project Structure

```
cryptians/
├── server/                    # Backend API
│   ├── src/
│   │   ├── api/               # API route handlers (v1/)
│   │   │   └── v1/
│   │   │       ├── platform-a/ # User-facing routes
│   │   │       │   ├── auth/
│   │   │       │   ├── kyc/
│   │   │       │   ├── listings/
│   │   │       │   ├── trades/
│   │   │       │   ├── chat/
│   │   │       │   ├── profile/
│   │   │       │   ├── wallet/
│   │   │       │   ├── reviews/
│   │   │       │   └── notifications/
│   │   │       └── platform-b/ # Admin-facing routes
│   │   │           ├── auth/
│   │   │           ├── admin/
│   │   │           ├── analytics/
│   │   │           ├── disputes/
│   │   │           ├── escrow/
│   │   │           ├── listings/
│   │   │           ├── support/
│   │   │           └── trades/
│   │   ├── config/            # Configuration files
│   │   │   ├── database.config.js   # MongoDB connection
│   │   │   ├── redis.config.js      # Redis connection
│   │   │   ├── socket.config.js     # Socket.IO events
│   │   │   ├── bullmq.config.js     # Job queue config
│   │   │   ├── jwt.config.js        # JWT settings
│   │   │   ├── sendgrid.config.js   # Email config
│   │   │   ├── twilio.config.js     # SMS config
│   │   │   └── r2.config.js         # Cloudflare R2 uploads
│   │   ├── constants/         # App constants
│   │   │   ├── statuses.js    # All status enums
│   │   │   └── roles.js       # RBAC roles & permissions
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/         # Express middlewares
│   │   │   ├── auth.middleware.js    # JWT verification
│   │   │   ├── rbac.middleware.js    # Role-based access
│   │   │   ├── rate-limit.middleware.js
│   │   │   ├── multer.middleware.js  # File uploads
│   │   │   └── error.middleware.js   # Error handler
│   │   ├── models/            # Mongoose models (17 files)
│   │   │   ├── User.model.js        # 814 lines
│   │   │   ├── Trade.model.js       # 578 lines
│   │   │   ├── Listing.model.js     # 456 lines
│   │   │   ├── Chat.model.js
│   │   │   ├── Message.model.js
│   │   │   ├── KYC.model.js
│   │   │   ├── Dispute.model.js
│   │   │   ├── EscrowTransaction.model.js
│   │   │   ├── InstantSellerDeposit.model.js
│   │   │   ├── Notification.model.js
│   │   │   ├── Otp.model.js
│   │   │   └── ...more
│   │   ├── services/          # Business logic (18 files)
│   │   │   ├── auth.service.js
│   │   │   ├── trade.service.js      # 1749 lines!
│   │   │   ├── escrow.service.js     # 729 lines
│   │   │   ├── listing.service.js
│   │   │   ├── chat.service.js
│   │   │   ├── kyc.service.js
│   │   │   ├── dispute.service.js
│   │   │   ├── notification.service.js
│   │   │   ├── wallet.service.js
│   │   │   ├── email.service.js
│   │   │   ├── fee-calculator.service.js
│   │   │   ├── price-feed.service.js
│   │   │   └── ...more
│   │   ├── workers/           # BullMQ workers
│   │   │   ├── trade.worker.js      # Trade timeout
│   │   │   ├── escrow.worker.js     # Escrow processing
│   │   │   ├── email.worker.js      # Email queue
│   │   │   ├── notification.worker.js
│   │   │   └── kyc.worker.js
│   │   ├── validators/        # Joi/Express validation
│   │   ├── utils/             # Helper utilities
│   │   └── websocket/         # Socket.IO handlers
│   └── package.json
│
├── client/                    # User-facing React app
│   └── src/
│       ├── pages/
│       │   ├── Landing.tsx         # Homepage
│       │   ├── Login.tsx           # Login page
│       │   ├── Register.tsx        # Registration
│       │   ├── ForgotPassword.tsx  # Password reset
│       │   ├── VerifyOtp.tsx       # OTP verification
│       │   ├── Marketplace.tsx     # Browse listings
│       │   ├── Marketplace/CreateListing.tsx
│       │   ├── MyListings.tsx      # Seller's listings
│       │   ├── Trades.tsx          # Trade history
│       │   ├── ChatPage.tsx        # Trade chat (71KB!)
│       │   ├── AllChats.tsx        # Chat list
│       │   ├── SubmitKyc.tsx       # KYC form
│       │   ├── Profile.tsx         # User profile
│       │   └── WalletPage.tsx      # Wallet management
│       ├── components/
│       │   ├── Header.tsx          # Navbar + notifications
│       │   ├── Chat/              # Chat components
│       │   ├── Notifications/     # Notification bell
│       │   └── wallet/            # Wallet components
│       ├── api/               # API client
│       ├── services/          # Frontend services
│       └── utils/             # Frontend utilities
│
├── admin/                     # Admin panel React app
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx       # Admin dashboard
│       │   ├── Login.tsx           # Admin login
│       │   ├── Users.tsx           # User management
│       │   ├── KYC.tsx             # KYC review (34KB)
│       │   ├── Trades.tsx          # Trade monitoring
│       │   ├── Escrow.tsx          # Escrow management (80KB!)
│       │   ├── InstantSellerEscrow.tsx
│       │   ├── Disputes.tsx        # Dispute resolution
│       │   ├── Appeals.tsx         # Appeal management
│       │   ├── AdminUsers.tsx      # User admin
│       │   ├── AdminLogs.tsx       # Audit logs
│       │   ├── AdminAds.tsx        # Ad management
│       │   └── Settings.tsx        # Platform settings
│       ├── store/             # Redux store
│       └── components/        # Shared components
│
├── nginx/                     # Nginx config (production)
├── docker-compose.yml         # Docker setup
└── start-dev.bat             # Dev startup script
```

---

## 4. How to Run Locally

### Prerequisites:
- Node.js v18+
- MongoDB (local or Atlas)
- Redis (local or cloud)

### Steps:

```bash
# 1. Server start karo
cd server
npm install
cp .env.example .env     # .env fill karo (MongoDB, Redis, JWT secrets, etc.)
npm run dev              # Port 8080

# 2. Client start karo (new terminal)
cd client
npm install
npm run dev              # Port 5173

# 3. Admin start karo (new terminal)
cd admin
npm install
npm run dev              # Port 5174
```

### Important `.env` Variables (Server):
```
MONGODB_URI=mongodb://localhost:27017/cryptians
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret
REFRESH_JWT_SECRET=your_refresh_secret
SENDGRID_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
R2_ACCESS_KEY_ID=your_key
CLIENT_URL=http://localhost:5173,http://localhost:5174
```

---

## 5. Authentication System

### 5.1 Registration Flow (2-Step Verification)

```
Step 1: Send OTP → POST /api/v1/platform-a/auth/send-registration-otp
  → User enters Email + Mobile Number
  → OTP (6-digit) generate hota hai
  → Same OTP Email (SendGrid) aur SMS (Twilio) dono pe jaata hai
  → Response mein redirection signal milta hai

Step 2: Complete Registration → POST /api/v1/platform-a/auth/register
  → User OTP, Password, aur profile details enter karta hai
  → Server check karta hai ki OTP valid hai aur expires toh nahi hua
  → User create hota hai → emailVerified: true, phoneVerified: true
  → JWT Access + Refresh tokens generate hote hain
  → User redirect to Dashboard ✅
```

**Key Files:**
- `server/src/api/v1/platform-a/auth/controller.js` → `sendRegistrationOTP`, `register`
- `server/src/models/Otp.model.js` → OTP storage (type: "email_verification" & "phone_verification")
- `client/src/pages/Register.tsx` — Step 1 UI
- `client/src/pages/VerifyOtp.tsx` — Step 2 UI

**Key Files:**
- `server/src/services/auth.service.js` → `createAndSendOTP()`, `verifyOTPByEmail()`
- `server/src/models/Otp.model.js` → OTP schema (5 min TTL)
- `client/src/pages/Register.tsx` → Registration form
- `client/src/pages/VerifyOtp.tsx` → OTP input

### 5.2 Login Flow (2-Step Auth)

```
Step 1: Auth Initial → POST /api/v1/platform-a/auth/login/send-otp
  → User Email/Phone aur Password enter karta hai
  → Server password verify karta hai (bcrypt)
  → Agar sahi hai, toh 6-digit OTP email/SMS pe jaata hai
  → Status code 200 with "OTP sent" message

Step 2: Verify & Login → POST /api/v1/platform-a/auth/login/verify-otp
  → User OTP enter karta hai
  → Server OTP verify karke Access + Refresh tokens issue karta hai
  → Tokens HTTP-Only cookies mein set hote hain
  → User redirected to Home/Marketplace page ✅
```

**Token System:**
- **Access Token** → `Authorization: Bearer <token>` header mein jaata hai
- **Refresh Token** → httpOnly cookie mein store hota hai
- Jab access token expire ho → `POST /auth/refresh` call hota hai automatically

### 5.3 Forgot Password Flow

```
User clicks "Forgot Password?" → /forgot-password page
  → Email enter karta hai
  → OTP jaata hai email pe (+ SMS if configured)
  → OTP verify karta hai
  → New password set karta hai
  → Login page pe redirect
```

**Key Files:**
- `server/src/services/auth.service.js` → `requestPasswordReset()`, `resetPassword()`
- `client/src/pages/ForgotPassword.tsx`

### 5.4 Admin Login (Platform B)

```
Separate login page → POST /api/v1/platform-b/auth/login
  → Only roles: admin, super_admin, support, support_manager allowed
  → Same JWT system but different route
```

---

## 6. KYC (Know Your Customer)

### 6.1 Kya hai KYC?
Trading karne se pehle user ko apni identity verify karni padti hai. Bina KYC ke user listing create ya trade initiate nahi kar sakta.

### 6.2 KYC Levels

| Level | Name | Requirements | Permissions |
|-------|------|-------------|-------------|
| **Level 0** | No KYC | Nothing | Browse marketplace only |
| **Level 1** | Basic | Email + Phone verified | Limited trading |
| **Level 2** | Full | ID (Aadhaar/PAN) + Selfie | Full trading |
| **Level 3** | Enhanced | Address proof | Higher limits |

### 6.3 KYC Submission Flow

```
User goes to /kyc-submit page
  → Fills: Full Name, DOB
  → Uploads: Aadhaar Front, Aadhaar Back, PAN Card, Selfie
  → Fills Bank Details: Account Number, IFSC, Bank Name, UPI ID
  → Submits → POST /api/v1/platform-a/kyc/submit
  → KYC status = "submitted"
  → Admin gets notification
  → Admin reviews on Platform B (/kyc page)
  → Admin Approves OR Rejects (with reason)
  → User gets notification of result
```

### 6.4 KYC Statuses

| Status | Meaning |
|--------|---------|
| `not_submitted` | User ne abhi tak KYC submit nahi kiya |
| `pending` | Submit hua hai, review ke liye wait |
| `submitted` | Documents submit ho gaye |
| `under_review` | Admin review kar raha hai |
| `approved` | ✅ Approved — user can trade |
| `rejected` | ❌ Rejected — reason diya jaata hai |
| `resubmit_required` | Admin ne bola documents dobara submit karo |

### 6.5 KYC Documents Stored

Documents **Cloudflare R2** pe upload hote hain (S3-compatible storage).

**Key Files:**
- `server/src/models/KYC.model.js` → KYC schema
- `server/src/services/kyc.service.js` → KYC business logic
- `server/src/workers/kyc.worker.js` → Background processing
- `client/src/pages/SubmitKyc.tsx` → KYC form (32KB)
- `admin/src/pages/KYC.tsx` → Admin KYC review (34KB)

---

## 7. Marketplace & Listings

### 7.1 Kya hai Marketplace?
Marketplace wo jagah hai jahan sellers apne USDT sell karne ke listings lagaate hain. Buyers yahan browse karte hain.

### 7.2 Listing Create Flow (Seller Side)

```
Seller goes to /market/create
  → Fills: USDT Amount, Price per USDT (INR), Min/Max trade limits
  → Selects: Payment methods (UPI, IMPS, NEFT, RTGS, Bank Transfer)
  → Sets: Time limit (15-120 minutes), Terms, Instructions
  → Optional: Auto-reply message
  → Submits → POST /api/v1/platform-a/listings
  → Listing status = "active"
  → Shows up on Marketplace
```

### 7.3 Two Types of Sellers

| Type | Description | Flow |
|------|-------------|------|
| **Regular Seller** | Normal user who creates listing | Deposits USDT to escrow AFTER buyer initiates trade |
| **Instant Seller** | Pre-approved by admin, USDT already deposited | Buyer gets USDT instantly from pre-deposited escrow |

### 7.4 Listing Fields

```javascript
{
  sellerId,                    // Who created
  cryptoType: "USDT",         // Only USDT supported
  availableAmount: 500,       // How much USDT available
  originalAmount: 500,        // Original amount listed
  pricePerUnit: 92.50,        // Price per 1 USDT in INR
  minTradeLimit: 1000,        // Min trade in INR
  maxTradeLimit: 50000,       // Max trade in INR
  paymentMethods: ["upi", "imps"],
  timeLimit: 30,              // Minutes for payment
  isInstantSeller: false,     // Regular or Instant
  createdBy: "RegularSeller", // or "InstantSeller"
  terms: "...",               // Trading terms
  instructions: "...",        // Payment instructions
  autoReplyMessage: "...",    // Auto message to buyer
  status: "active",           // Current status
  reservedAmount: 0,          // Amount locked in active trades
}
```

### 7.5 Listing Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Instant seller listing — admin approval needed |
| `active` | ✅ Live on marketplace |
| `paused` | Seller ne temporarily pause kiya |
| `completed` | Sab amount sell ho gaya |
| `expired` | Time limit khatam |
| `cancelled` | Seller ne cancel kiya |
| `suspended` | Admin ne suspend kiya |
| `rejected` | Instant seller deposit rejected |

### 7.6 Marketplace Browse (Buyer Side)

```
Buyer goes to /market
  → Sees all active listings
  → Sort by: Price, Rating, Completion Rate
  → Filter by: Payment method, Instant seller only
  → Click on listing → Opens chat with seller
  → From chat, initiates trade
```

**Key Files:**
- `server/src/models/Listing.model.js` → Listing schema
- `server/src/services/listing.service.js` → Listing logic (23KB)
- `client/src/pages/Marketplace.tsx` → Browse listings (24KB)
- `client/src/pages/Marketplace/CreateListing.tsx` → Create form
- `client/src/pages/MyListings.tsx` → Seller's listings (17KB)

---

## 8. Trade Lifecycle ⭐ (MOST IMPORTANT)

### 8.1 Overview
Trade tab sabse complex part hai application ka. Yeh poora flow samajhna ek intern ke liye critical hai.

### 8.2 Regular Seller Trade Flow (Step by Step)

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGULAR SELLER TRADE FLOW                     │
├──────────┬──────────────────────────────────────────────────────┤
│  Step 1  │ Buyer clicks "Buy" on listing                        │
│          │ → Chat opens between buyer & seller                  │
│          │ → Status: (no trade yet, just chatting)               │
├──────────┼──────────────────────────────────────────────────────┤
│  Step 2  │ Buyer fills trade form in chat:                      │
│          │   - USDT amount                                      │
│          │   - Wallet address                                   │
│          │   - Payment method                                   │
│          │   - Aadhaar front + back (required)                  │
│          │   - ✅ Consent checkbox                               │
│          │ → POST /trades/initiate                               │
│          │ → Status: "pending_seller_deposit"                    │
│          │ → 30 min timer starts                                 │
├──────────┼──────────────────────────────────────────────────────┤
│  Step 3  │ Seller deposits USDT to platform escrow wallet       │
│          │ → Seller submits tx hash                              │
│          │ → Status: "deposit_submitted"                         │
│          │ → Waiting for admin to verify                         │
├──────────┼──────────────────────────────────────────────────────┤
│  Step 4  │ Admin (Platform B) verifies deposit on blockchain    │
│          │ → If valid: Status → "escrow_confirmed"               │
│          │ → If invalid: Trade cancelled                         │
│          │ → 30 min payment timer starts for buyer               │
├──────────┼──────────────────────────────────────────────────────┤
│  Step 5  │ Buyer transfers INR to seller's bank account         │
│          │ → Buyer uploads payment proof (screenshot + UTR)      │
│          │ → Status: "payment_proof_uploaded"                    │
├──────────┼──────────────────────────────────────────────────────┤
│  Step 6  │ Seller checks bank & confirms INR received           │
│          │ → Status: "pending_seller_confirmation"               │
├──────────┼──────────────────────────────────────────────────────┤
│  Step 7  │ Admin releases USDT from escrow to buyer's wallet    │
│          │ → Status: "completed" ✅                               │
│          │ → Both users can leave reviews                        │
└──────────┴──────────────────────────────────────────────────────┘
```

### 8.3 Instant Seller Trade Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   INSTANT SELLER TRADE FLOW                      │
├──────────┬──────────────────────────────────────────────────────┤
│  Step 1  │ Buyer clicks "Buy" on instant seller listing         │
│          │ → Chat opens                                          │
├──────────┼──────────────────────────────────────────────────────┤
│  Step 2  │ Buyer fills trade form                                │
│          │ → Status: "pending_seller_confirmation"               │
│          │ → USDT already deposited (no deposit step needed!)    │
│          │ → Balance deducted from seller's escrow balance       │
├──────────┼──────────────────────────────────────────────────────┤
│  Step 3  │ Seller confirms the trade                             │
│          │ → Status: "escrow_confirmed"                          │
│          │ → 30 min payment timer starts for buyer               │
├──────────┼──────────────────────────────────────────────────────┤
│  Step 4  │ Buyer transfers INR + uploads proof                   │
│          │ → Status: "payment_proof_uploaded"                    │
├──────────┼──────────────────────────────────────────────────────┤
│  Step 5  │ Seller confirms INR received                          │
│          │ → If autoReleaseEnabled: USDT auto-released!          │
│          │ → Status: "completed" ✅                               │
└──────────┴──────────────────────────────────────────────────────┘
```

### 8.4 All Trade Statuses

| Status | Description | Next Step |
|--------|-------------|-----------|
| `initiated` | Trade started (legacy) | Seller deposit |
| `pending_seller_deposit` | Waiting for seller to deposit USDT | Seller submits tx hash |
| `deposit_submitted` | Seller submitted tx hash | Admin verifies |
| `escrow_confirmed` | ✅ Escrow locked, buyer can pay | Buyer pays INR |
| `pending_payment` | Waiting for buyer INR payment | Buyer uploads proof |
| `payment_proof_uploaded` | Buyer uploaded proof | Seller confirms |
| `pending_seller_confirmation` | Seller checking payment | Seller confirms / Dispute |
| `completed` | ✅ Trade done | Reviews |
| `cancelled` | ❌ Cancelled by user/system | — |
| `expired` | ⏰ Timeout | — |
| `disputed` | ⚠️ Dispute raised | Admin resolves |
| `appealed` | 📋 Appeal filed | Admin reviews |
| `refunded` | 💰 Escrow refunded to seller | — |

### 8.5 Fee Structure

```
Platform Fee: 5% on INR amount (charged to buyer)
Gas Fee: 1% on INR amount (charged to buyer)
Crypto Platform Fee: 4% on USDT amount (charged to seller)

Example: Buyer wants 100 USDT @ ₹92.50/USDT
  Seller receives: ₹9,250 (net INR)
  Platform fee: ₹462.50 (5%)
  Gas fee: ₹92.50 (1%)
  Buyer pays total: ₹9,805 (₹9,250 + ₹462.50 + ₹92.50)
  Seller must deposit: 104 USDT (100 + 4% platform fee)
```

**Key Files:**
- `server/src/services/trade.service.js` → Trade logic (1749 lines!)
- `server/src/models/Trade.model.js` → Trade schema (578 lines)
- `server/src/services/fee-calculator.service.js` → Fee calculation
- `server/src/services/price-feed.service.js` → Live USDT price
- `client/src/pages/ChatPage.tsx` → Trade UI inside chat (71KB!)
- `client/src/pages/Trades.tsx` → Trade history (49KB)

---

## 9. Chat System

### 9.1 Kaise kaam karta hai?
Har trade ke saath ek chat hota hai. Buyer listing pe click karta hai → chat create hota hai → usme trade initiate hota hai.

### 9.2 Chat Features

- **Real-time messaging** via Socket.IO
- **Text messages** — buyer/seller normal chat
- **System messages** — automated status updates (e.g., "Escrow confirmed")
- **Form messages** — interactive forms inside chat:
  - `BUYER_REQUEST_FORM` — trade initiation form with amount breakdown.
  - `DEPOSIT_CONFIRMATION_FORM` — seller ko escrow deposit karne ka form (tx hash input).
  - `PAYMENT_PROOF_FORM` — buyer ko payment proof upload karne ka form (UTR + Screenshot).
  - `PAYMENT_CONFIRMATION_FORM` — seller ko payment confirm karne ka form (Confirm/Dispute buttons).
- **Action Type System** — system messages triggers actions:
  - `seller-deposit-required` / `seller-confirmation-required`
  - `admin-verified-deposit`
  - `buyer-payment-uploaded`

### 9.3 Chat Model

```javascript
Chat = {
  type: "direct",                    // direct / group / channel
  tradeId: ObjectId,                 // Associated trade
  listingId: ObjectId,               // Associated listing
  participants: [
    { userId, role: "buyer", joinedAt, lastReadAt },
    { userId, role: "seller", joinedAt, lastReadAt }
  ],
  createdBy: "buyer",               // Who started
  isActive: true,                    // Active or closed
  lastMessageAt: Date
}
```

### 9.4 Socket Events (Real-time)

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:message` | Client → Server | Send message |
| `chat:new_message` | Server → Client | Receive message |
| `chat:typing` | Both ways | Typing indicator |
| `order:created` | Server → Client | Trade initiated |
| `order:deposit_required` | Server → Client | Deposit needed |
| `order:escrow_confirmed` | Server → Client | Escrow verified |
| `order:payment_uploaded` | Server → Client | Payment proof uploaded |
| `order:payment_confirmed` | Server → Client | Seller confirmed |
| `order:completed` | Server → Client | Trade done |
| `order:cancelled` | Server → Client | Trade cancelled |
| `notification` | Server → Client | New notification |

**Key Files:**
- `server/src/models/Chat.model.js` → Chat schema
- `server/src/models/Message.model.js` → Message schema with forms
- `server/src/services/chat.service.js` → Chat logic (10KB)
- `server/src/config/socket.config.js` → Socket events (13KB)
- `client/src/pages/ChatPage.tsx` → Chat UI (71KB — biggest file!)
- `client/src/pages/AllChats.tsx` → Chat list

---

## 10. Escrow System

### 10.1 Kya hai Escrow?
Escrow ek "middle-man wallet" hai jahan seller ka USDT lock hota hai jab tak trade complete nahi ho jaata. Isse buyer ko guarantee milti hai ki USDT milega.

### 10.2 Escrow Transaction Types

| Type | Description |
|------|-------------|
| `deposit` | Seller deposits USDT to escrow |
| `release` | USDT released to buyer (trade complete) |
| `refund` | USDT refunded to seller (trade cancelled/disputed) |
| `fee_collection` | Platform fee collected |
| `instant_seller_deposit` | Instant seller ke balance mein deposit |
| `instant_seller_withdrawal` | Instant seller withdrawal |

### 10.3 Escrow Flow (Regular Trade)

```
1. Seller submits tx hash → Admin verifies on blockchain
2. If valid → EscrowTransaction record created (status: "confirmed")
3. Trade continues → buyer pays INR
4. Seller confirms → Admin releases escrow
5. EscrowTransaction record created (type: "release", status: "completed")
6. USDT goes to buyer's wallet address
```

### 10.4 Admin Escrow Actions

Admin can:
- **Verify deposit** → Check blockchain tx, approve/reject
- **Release to buyer** → Send USDT to buyer wallet
- **Refund to seller** → Return USDT to seller (dispute resolution)

**Key Files:**
- `server/src/models/EscrowTransaction.model.js` → Escrow schema
- `server/src/services/escrow.service.js` → Escrow logic (729 lines)
- `server/src/workers/escrow.worker.js` → Background processing
- `admin/src/pages/Escrow.tsx` → Admin escrow UI (80KB — huge!)

---

## 11. Instant Seller System

### 11.1 Kya hai Instant Seller?
Normal seller ko har trade pe USDT deposit karna hota hai. Instant Seller pehle se apna USDT platform pe deposit kar deta hai — toh buyer ko instantly USDT mil sakta hai bina wait kiye.

### 11.2 Instant Seller Becoming Flow

```
1. Regular seller KYC approved hona chahiye
2. Admin manually user ko instant_seller approve karta hai
3. Seller USDT deposit karta hai (via blockchain tx)
4. Admin deposit verify karta hai
5. User.isInstantSeller = true
6. User.escrowDepositAmount = deposited amount
7. Ab seller instant listings create kar sakta hai
```

### 11.3 Instant Seller Deposit Model

```javascript
InstantSellerDeposit = {
  sellerId,
  listingId,
  originalAmount: 500,           // USDT deposited
  platformFeeUSDT: 20,           // 4% fee
  gasFeeUSDT: 5,
  totalDepositAmount: 525,
  transactionHash: "0x123...",
  blockchainNetwork: "ethereum",  // ethereum/polygon/bsc/tron
  status: "pending",             // pending → approved / rejected / refunded
  depositVerified: false,
  verifiedBy: adminId,
  expiresAt: Date,               // 7 days to verify
}
```

### 11.4 Instant Seller Trade Difference

| Aspect | Regular Seller | Instant Seller |
|--------|---------------|----------------|
| Deposit timing | After buyer initiates | Pre-deposited |
| Initial trade status | `pending_seller_deposit` | `pending_seller_confirmation` |
| Admin verification | Required for every trade | Only for initial deposit |
| Auto-release | No | Yes (optional) |
| Speed | Slower (needs deposit + verify) | Faster (no deposit step) |

**Key Files:**
- `server/src/models/InstantSellerDeposit.model.js` → Deposit schema
- `admin/src/pages/InstantSellerEscrow.tsx` → Admin manage instant deposits

---

## 12. Dispute & Appeal System

### 12.1 Dispute Flow

```
Trade stuck at any point (e.g., buyer paid but seller not confirming)
  → Either party raises dispute
  → Status: "disputed"
  → Dispute record created with reason + evidence
  → Admin gets notified
  → Admin investigates (checks chat, payment proof, blockchain)
  → Admin resolves:
    → "buyer_favor" → Release USDT to buyer
    → "seller_favor" → Refund USDT to seller
    → "partial_refund" → Split
    → "no_action" → Close without action
```

### 12.2 Dispute Model

```javascript
Dispute = {
  tradeId,
  createdBy: userId,
  reason: "Seller not responding after payment",
  evidence: [
    { type: "screenshot", url: "...", description: "..." },
    { type: "bank_statement", url: "..." }
  ],
  status: "open",           // open → assigned → under_investigation → resolved/closed
  assignedTo: supportId,    // Support agent
  resolution: "buyer_favor",
  resolutionNotes: "...",
  resolvedBy: adminId
}
```

### 12.3 Appeal System

```
After trade completed/cancelled, user disagrees
  → Files appeal with reason
  → trade.isAppealed = true
  → Admin reviews appeal
  → appealResolution: approved / rejected
  → If approved → trade outcome may be reversed
```

**Key Files:**
- `server/src/models/Dispute.model.js` → Dispute schema
- `server/src/services/dispute.service.js` → Dispute logic
- `admin/src/pages/Disputes.tsx` → Admin dispute UI
- `admin/src/pages/Appeals.tsx` → Admin appeal UI

---

## 13. Wallet System

### 13.1 User ke paas kya hota hai?

```javascript
User = {
  cryptoWalletAddress: "0x...",  // User's external USDT wallet
  bankDetails: {
    accountHolderName: "...",
    accountNumber: "...",
    ifscCode: "...",
    bankName: "...",
    upiId: "...",
    isVerified: false            // Admin verification
  },
  escrowDepositAmount: 0         // Instant seller balance
}
```

### 13.2 Wallet Page Features

- View crypto wallet address
- Update crypto wallet address
- View/update bank details
- View escrow balance (instant sellers)
- View transaction history
- Get platform deposit address

**Key Files:**
- `server/src/services/wallet.service.js` → Wallet logic
- `client/src/pages/WalletPage.tsx` → Wallet UI (30KB)

---

## 14. Notification System

### 14.1 Two Types

1. **Real-time Toast** — Socket.IO se instant popup (react-toastify)
2. **Persistent Notification** — Database mein save, notification bell mein show

### 14.2 Notification Events

| Event | Receiver | Type |
|-------|----------|------|
| Trade initiated | Seller | 🤝 success |
| Escrow confirmed | Both | 🛡️ success |
| Payment proof uploaded | Seller | 💰 info |
| Payment confirmed | Buyer | ✅ success |
| Trade completed | Both | 🎉 success |
| Trade cancelled | Both | ❌ error |
| Trade appealed | Admin | ⚖️ warning |
| KYC approved/rejected | User | 📋 info |
| Deposit approved/rejected | Seller | 💳 info |

### 14.3 Admin Notifications

Admin ke liye alag notification system hai (`AdminNotification.model.js`):
- New KYC submission
- New trade needing escrow verification
- New dispute raised
- New deposit for verification

**Key Files:**
- `server/src/services/notification.service.js` → Notification logic (27KB!)
- `server/src/services/adminNotification.service.js` → Admin notifications (13KB)
- `server/src/models/Notification.model.js` → User notification schema
- `server/src/models/AdminNotification.model.js` → Admin notification schema
- `server/src/workers/notification.worker.js` → Background notification worker
- `client/src/components/Header.tsx` → Notification handler (23KB)
- `client/src/components/Notifications/` → Notification bell component

---

## 15. Admin Panel (Platform B)

### 15.1 Admin Pages

| Page | URL | Purpose |
|------|-----|---------|
| **Dashboard** | `/dashboard` | Overview stats, charts |
| **Users** | `/users` | View all users, manage roles, suspend/ban |
| **KYC** | `/kyc` | Review KYC submissions, approve/reject |
| **Trades** | `/trades` | Monitor all trades, view details |
| **Escrow** | `/escrow` | Verify deposits, release/refund escrow |
| **Instant Seller Escrow** | `/instant-seller-escrow` | Manage instant seller deposits |
| **Disputes** | `/disputes` | Investigate and resolve disputes |
| **Appeals** | `/appeals` | Review trade appeals |
| **Logs** | (AdminLogs) | Audit trail of all actions |
| **Ads** | (AdminAds) | Manage platform ads |
| **Settings** | `/settings` | Platform configuration |

### 15.2 Admin User Management

Admin can:
- View all users with search/filter
- Change user role (buyer → seller → instant_seller)
- Suspend or ban accounts
- Verify bank details
- View user's trades, KYC, chat history

---

## 16. Role-Based Access Control (RBAC)

### 16.1 Roles

| Role | Platform | Description |
|------|----------|-------------|
| `buyer` | A | Default role, can buy USDT |
| `seller` | A | Can create listings and sell USDT |
| `instant_seller` | A | Pre-deposits USDT, instant trades |
| `support` | B | View-only access to admin |
| `support_manager` | B | Can resolve disputes, suspend users |
| `admin` | B | Full admin access |
| `super_admin` | B | Highest level access |

### 16.2 Permission Examples

```
CREATE_LISTING     → [seller, instant_seller]
INITIATE_TRADE     → [buyer, seller, instant_seller]
REVIEW_KYC         → [support, support_manager, admin]
APPROVE_KYC        → [support_manager, admin]
MANAGE_ESCROW      → [admin, super_admin]
RESOLVE_DISPUTE    → [support, support_manager, admin]
MANAGE_USERS       → [admin, super_admin]
VIEW_AUDIT_LOGS    → [admin, super_admin]
```

**Key Files:**
- `server/src/constants/roles.js` → All roles, hierarchy, permissions
- `server/src/middleware/rbac.middleware.js` → Permission checking
- `server/src/middleware/auth.middleware.js` → JWT verification

---

## 17. Background Jobs & Workers

### 17.1 BullMQ Workers

| Worker | File | Purpose |
|--------|------|---------|
| **Trade Worker** | `trade.worker.js` | Auto-cancel expired trades, timeout handling |
| **Escrow Worker** | `escrow.worker.js` | Process escrow transactions |
| **Email Worker** | `email.worker.js` | Send emails asynchronously |
| **Notification Worker** | `notification.worker.js` | Process notification queue |
| **KYC Worker** | `kyc.worker.js` | Background KYC processing |

### 17.2 Trade Timeout Logic

```
Trade created → Timer set (30 minutes)
  → If seller doesn't deposit in time → Auto-cancel
  → If buyer doesn't pay in time → Auto-cancel
  → Listing amount restored
  → Instant seller balance restored (if applicable)
```

**Key Files:**
- `server/src/workers/` → All worker files
- `server/src/jobs/` → Job definitions
- `server/src/queues/` → Queue configurations
- `server/src/config/bullmq.config.js` → BullMQ setup

---

## 18. Deployment

### 18.1 Setup

- **Server:** Vultr VPS (planned)
- **Docker Compose** for containerization
- **Nginx** as reverse proxy
- **Cloudflare** for DNS + CDN + SSL

### 18.2 Docker Services

```yaml
services:
  server:    # Node.js API
  redis:     # Redis cache
  # MongoDB is on Atlas (cloud)
```

**Key Files:**
- `docker-compose.yml` — Development
- `docker-compose.prod.yml` — Production
- `nginx/` — Nginx config
- `vultr_deployment_guide.md` — Deployment guide (24KB)

---

## 19. Pending Tasks / Incomplete Features

> ⚠️ Yeh features ya toh incomplete hain ya future mein implement karne hain.

### 🔴 High Priority

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Blockchain Auto-Verification** | ❌ Not implemented | Logic for Web3.js/Ethers.js is missing. Admin manually matches `txHash` from Platform B. No real-time chain scanning. |
| 2 | **Auto Escrow Release** | ⚠️ Partial | Instant sellers use a hardcoded `AUTO-RELEASE-` string. Regular sellers require manual Admin release on Platform B. |
| 3 | **2FA (TOTP)** | ❌ Schema only | User model has `twoFactorSecret` but no Google Authenticator/TOTP logic in auth service. |
| 4 | **Support Ticket System** | ❌ Placeholder | Admin UI exists but no backend model or service for tickets. |
| 5 | **Review & Rating UI** | ⚠️ Backend done | Backend routes exist for reviews, but Frontend (Client/Admin) UI is missing or incomplete. |
| 6 | **External Crypto Withdrawals** | ❌ Missing | No logic or service for users to withdraw USDT from their wallet to an external address. Only internal balance deductions exist. |
| 7 | **Real Email/SMS Services** | ❌ Fake/TODO | `notification.service.js` has `TODO` for SendGrid/Twilio. Currently only `console.log` happens. |
| 8 | **Live Price & Gas Feeds** | ⚠️ Hardcoded fallbacks | Price feed returns fixed `83.50` and Gas estimate uses hardcoded `$2000 ETH` if external APIs fail. |
| 9 | **Audit Logging Coverage** | ⚠️ Incomplete | `AuditLog` exists but is not triggered in critical paths like Listing creation or Dispute updates. |
| 10 | **Admin Dashboard Stats** | ✅ Fake Data | `AdminDashboard.tsx` uses hardcoded `PLACEHOLDER_STATS` instead of fetching from the existing `/api/v1/platform-b/analytics/overview` endpoint. |
| 11 | **Support Admin UI Integration** | ✅ Frontend missing | Backend `/api/v1/platform-b/support/*` endpoints exist but `admin/src/pages/Support.tsx` is just a static mockup. |
| 12 | **Admin Settings Updates** | ✅ Read-only UI | `Settings.tsx` shows user info but update mechanisms are disabled and backend routes for updating profile are missing. |

### 🟡 Medium Priority

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 6 | **Analytics dashboard** | ✅ Routes exist | Backend analytics routes exist but admin dashboard charts may be basic |
| 7 | **Multi-language support** | ⚠️ Partial | `locales/` folder exists, `languageMiddleware` is used, but only EN/HI supported |
| 8 | **Ads management** | ✅ Backend done | `Ad.model.js`, `ad.controller.js`, `ad.route.js` exist. Admin page exists |
| 9 | **Rate limiting** | ✅ Implemented | `rate-limit.middleware.js` with Redis-based rate limiting |
| 10 | **KYC provider integration** | ❌ Manual only | Schema supports ShuftiPro/Signzy/Sumsub but only "manual" provider used |

### 🟢 Low Priority

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 11 | **User search/filter on marketplace** | ✅ Done | Search by amount, price, payment method, seller type |
| 12 | **Email templates** | ✅ Done | SendGrid email templates for OTP, notifications |
| 13 | **Audit logging** | ✅ Done | `AuditLog.model.js` tracks all admin actions |
| 14 | **Soft delete** | ✅ Done | Users and listings support soft delete |
| 15 | **Wallet Withdrawals** | ❌ Pending | Crypto address update exists but direct withdrawal flow to external wallet needs clear logic |
| 16 | **CI/CD pipeline** | ❌ Not set up | Planned for Vultr deployment |

---

## 📖 Quick Reference — API Endpoints

### Platform A (User)
```
POST   /api/v1/platform-a/auth/send-registration-otp → Step 1: Send OTP
POST   /api/v1/platform-a/auth/register              → Step 2: Create User
POST   /api/v1/platform-a/auth/login/send-otp         → Step 1: Auth & Send OTP
POST   /api/v1/platform-a/auth/login/verify-otp       → Step 2: Final Login
POST   /api/v1/platform-a/auth/refresh                → Refresh token
POST   /api/v1/platform-a/auth/forgot-password         → Request reset OTP
POST   /api/v1/platform-a/auth/reset-password          → Verify & Reset password

POST   /api/v1/platform-a/kyc/submit           → Submit KYC
GET    /api/v1/platform-a/kyc/status            → KYC status

GET    /api/v1/platform-a/listings              → Browse listings
POST   /api/v1/platform-a/listings              → Create listing
GET    /api/v1/platform-a/listings/my            → My listings

POST   /api/v1/platform-a/trades/initiate       → Initiate trade
GET    /api/v1/platform-a/trades                 → My trades
POST   /api/v1/platform-a/trades/:id/upload-proof → Upload payment proof
POST   /api/v1/platform-a/trades/:id/confirm     → Confirm payment

GET    /api/v1/platform-a/chat                   → My chats
POST   /api/v1/platform-a/chat/create            → Create chat
GET    /api/v1/platform-a/chat/:id/messages       → Chat messages

GET    /api/v1/platform-a/wallet                  → Wallet info
PUT    /api/v1/platform-a/wallet/crypto-address    → Update wallet

GET    /api/v1/platform-a/profile                 → My profile
PUT    /api/v1/platform-a/profile                 → Update profile

GET    /api/v1/platform-a/notifications            → My notifications
```

### Platform B (Admin)
```
POST   /api/v1/platform-b/auth/login             → Admin login
GET    /api/v1/platform-b/admin/users             → All users
GET    /api/v1/platform-b/admin/dashboard          → Dashboard stats

GET    /api/v1/platform-b/admin/kyc/pending        → Pending KYCs
POST   /api/v1/platform-b/admin/kyc/:id/approve    → Approve KYC
POST   /api/v1/platform-b/admin/kyc/:id/reject     → Reject KYC

GET    /api/v1/platform-b/trades                   → All trades
GET    /api/v1/platform-b/escrow                   → Escrow transactions
POST   /api/v1/platform-b/escrow/verify/:tradeId   → Verify deposit
POST   /api/v1/platform-b/escrow/release/:tradeId  → Release to buyer
POST   /api/v1/platform-b/escrow/refund/:tradeId   → Refund to seller

GET    /api/v1/platform-b/disputes                 → All disputes
POST   /api/v1/platform-b/disputes/:id/resolve     → Resolve dispute

GET    /api/v1/platform-b/analytics                → Analytics data
```

---

## 🗺️ Visual Flow — Complete User Journey

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Register │────▶│Verify OTP│────▶│Submit KYC│────▶│KYC Review│
│          │     │          │     │          │     │ (Admin)  │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
                                              ┌─────────▼─────────┐
                                              │  KYC Approved ✅   │
                                              └─────────┬─────────┘
                                                        │
                              ┌──────────────────┬──────┴──────┐
                              ▼                  ▼              ▼
                        ┌──────────┐      ┌──────────┐   ┌──────────┐
                        │  Browse  │      │  Create  │   │  Wallet  │
                        │Marketplace│      │ Listing │   │  Setup   │
                        └────┬─────┘      └──────────┘   └──────────┘
                             │
                    ┌────────▼────────┐
                    │  Open Chat with │
                    │     Seller      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Initiate Trade  │
                    │ (Fill Form)     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                              ▼
     ┌────────────────┐           ┌────────────────┐
     │ Regular Seller │           │ Instant Seller │
     │ Deposit USDT   │           │ (Pre-deposited)│
     └───────┬────────┘           └───────┬────────┘
             │                            │
             ▼                            ▼
     ┌────────────────┐           ┌────────────────┐
     │ Admin Verifies │           │ Seller Confirms│
     │ Deposit        │           │ Trade          │
     └───────┬────────┘           └───────┬────────┘
             │                            │
             └──────────┬─────────────────┘
                        ▼
               ┌────────────────┐
               │ Buyer Pays INR │
               │ Uploads Proof  │
               └───────┬────────┘
                        ▼
               ┌────────────────┐
               │ Seller Confirms│
               │ INR Received   │
               └───────┬────────┘
                        ▼
               ┌────────────────┐
               │ USDT Released  │
               │ Trade Complete │
               │      ✅        │
               └────────────────┘
```

---

> **📌 Intern ke liye Tips:**
> 1. Pehle `server/src/constants/statuses.js` aur `roles.js` padhna — sab statuses aur roles yahan defined hain
> 2. Phir `server/src/models/` — har model ka schema samjho
> 3. Phir `server/src/services/trade.service.js` — sabse important file, trade ka poora flow yahan hai
> 4. Frontend ke liye `client/src/pages/ChatPage.tsx` padho — yahi pe sab action hota hai
> 5. Admin ke liye `admin/src/pages/Escrow.tsx` — sabse bada admin file
> 6. `.env.example` file check karo environment variables ke liye
> 7. Postman collection import karo (`Postman_Collection_Complete.json`) — sab APIs test kar sakte ho
