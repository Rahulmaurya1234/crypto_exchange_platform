# API Reference - Cryptians P2P Marketplace

Complete API reference for the Cryptians backend.

**Base URL**: `https://api.cryptians.com/api/v1`
**Version**: 1.0.0

## Table of Contents

- [Authentication](#authentication)
- [Platform A (Client APIs)](#platform-a-client-apis)
  - [Auth Endpoints](#auth-endpoints)
  - [User Endpoints](#user-endpoints)
  - [KYC Endpoints](#kyc-endpoints)
  - [Listing Endpoints](#listing-endpoints)
  - [Trade Endpoints](#trade-endpoints)
  - [Chat Endpoints](#chat-endpoints)
  - [Payment Endpoints](#payment-endpoints)
- [Platform B (Admin APIs)](#platform-b-admin-apis)
  - [User Management](#user-management)
  - [KYC Management](#kyc-management)
  - [Trade Management](#trade-management)
  - [Dispute Management](#dispute-management)
  - [Escrow Management](#escrow-management)
  - [Analytics](#analytics)
- [Response Formats](#response-formats)
- [Error Codes](#error-codes)
- [Rate Limits](#rate-limits)

## Authentication

Most endpoints require authentication using JWT tokens.

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept-Language: en  # or 'hi' for Hindi
```

### Token Refresh

Access tokens expire after 15 minutes. Use the refresh endpoint before they expire.

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Platform A (Client APIs)

### Auth Endpoints

#### Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "mobileNumber": "9876543210",
  "role": "buyer"
}
```

**Validation:**
- `name`: 2-100 characters
- `email`: Valid email format
- `password`: Min 8 chars, must include uppercase, lowercase, number, special char
- `mobileNumber`: 10 digits
- `role`: "buyer" or "seller"

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your mobile number.",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "otpSent": true
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

**Error Codes:**
- `AUTH_003`: Email already exists
- `AUTH_004`: Mobile number already exists
- `VAL_001`: Validation error

---

#### Verify OTP

```http
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Mobile number verified successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer",
      "isVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

**Error Codes:**
- `AUTH_010`: Invalid or expired OTP
- `AUTH_006`: User not found

---

#### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

**Error Codes:**
- `AUTH_001`: Invalid email or password
- `AUTH_002`: Account is suspended
- `AUTH_007`: Email not verified

---

#### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

#### Request Password Reset

```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset OTP sent to your mobile",
  "data": {
    "otpSent": true,
    "expiresIn": 300
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

#### Reset Password

```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass@456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

**Error Codes:**
- `AUTH_010`: Invalid or expired OTP
- `AUTH_006`: User not found

---

### User Endpoints

#### Get Own Profile

```http
GET /users/profile
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "mobileNumber": "9876543210",
    "role": "seller",
    "isVerified": true,
    "kycStatus": {
      "status": "approved",
      "level": "level_2"
    },
    "tradingStats": {
      "totalTrades": 45,
      "completedTrades": 42,
      "canceledTrades": 3,
      "completionRate": 93.33
    },
    "averageRating": 4.7,
    "totalReviews": 38,
    "isInstantSeller": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

#### Update Profile

```http
PUT /users/profile
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "bankDetails": {
    "accountHolderName": "John Doe",
    "accountNumber": "1234567890",
    "ifscCode": "HDFC0001234",
    "bankName": "HDFC Bank"
  },
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe Updated",
    // ... updated fields
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

#### Get User Reviews

```http
GET /users/:userId/reviews
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "reviewerId": "reviewer_user_id",
        "reviewerName": "Jane Smith",
        "tradeId": "trade_id",
        "rating": 5,
        "comment": "Excellent seller! Quick response and smooth transaction.",
        "isVerifiedTrade": true,
        "createdAt": "2025-11-20T14:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 38
    }
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

#### Add Review

```http
POST /users/:userId/reviews
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "tradeId": "trade_id",
  "rating": 5,
  "comment": "Great seller!"
}
```

**Validation:**
- Can only review after completing a trade
- Cannot review the same trade twice
- Rating: 1-5

**Response (201):**
```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "review": {
      "_id": "review_id",
      "rating": 5,
      "comment": "Great seller!"
    }
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

**Error Codes:**
- `TRADE_002`: Cannot review incomplete trade
- `TRADE_003`: Already reviewed this trade
- `PERM_002`: Permission denied

---

### KYC Endpoints

#### Get KYC Status

```http
GET /kyc
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "KYC status retrieved",
  "data": {
    "_id": "kyc_id",
    "userId": "user_id",
    "status": "approved",
    "level": "level_2",
    "documents": [
      {
        "type": "aadhaar",
        "number": "XXXX-XXXX-1234",
        "fileUrl": "https://s3.amazonaws.com/...",
        "verificationStatus": "verified"
      },
      {
        "type": "pan",
        "number": "XXXPX1234X",
        "fileUrl": "https://s3.amazonaws.com/...",
        "verificationStatus": "verified"
      }
    ],
    "submittedAt": "2024-02-01T10:00:00.000Z",
    "reviewedAt": "2024-02-02T15:30:00.000Z"
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

#### Submit KYC

```http
POST /kyc/submit
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
fullName: "John Doe"
dateOfBirth: "1990-01-15"
address: "123 Main St, Mumbai, MH 400001"

documents[0][type]: "aadhaar"
documents[0][number]: "1234-5678-9012"
documents[0][file]: <file>

documents[1][type]: "pan"
documents[1][number]: "ABCDE1234F"
documents[1][file]: <file>
```

**Supported Document Types:**
- `aadhaar`
- `pan`
- `passport`
- `driving_license`
- `voter_id`

**Response (201):**
```json
{
  "success": true,
  "message": "KYC submitted successfully. Under review.",
  "data": {
    "_id": "kyc_id",
    "status": "pending",
    "submittedAt": "2025-12-02T10:30:00.000Z"
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

**Error Codes:**
- `KYC_002`: KYC already submitted
- `KYC_003`: Invalid document format
- `VAL_001`: Missing required fields

---

### Listing Endpoints

#### Browse Listings

```http
GET /listings
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): Sort field (default: createdAt)
- `order` (optional): asc or desc (default: desc)
- `minAmount` (optional): Minimum crypto amount
- `maxAmount` (optional): Maximum crypto amount
- `paymentMethods` (optional): Comma-separated (UPI,IMPS,NEFT)
- `sellerId` (optional): Filter by seller

**Response (200):**
```json
{
  "success": true,
  "message": "Listings retrieved successfully",
  "data": {
    "listings": [
      {
        "_id": "listing_id",
        "listingNumber": "LST-20251202-0001",
        "sellerId": "seller_user_id",
        "sellerName": "John Doe",
        "cryptoAmount": 5000,
        "availableAmount": 4200,
        "pricePerUnit": 84.50,
        "minOrderAmount": 100,
        "maxOrderAmount": 2000,
        "paymentMethods": ["UPI", "IMPS"],
        "description": "Quick release, online most of the time",
        "status": "active",
        "isActive": true,
        "totalOrders": 12,
        "sellerRating": 4.8,
        "sellerCompletionRate": 95.5,
        "createdAt": "2025-12-01T08:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 87,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

#### Create Listing

```http
POST /listings
Authorization: Bearer <access_token>
```

**Required Role:** Seller or Instant Seller
**Required:** KYC Level 2 approved

**Request Body:**
```json
{
  "cryptoAmount": 5000,
  "pricePerUnit": 84.50,
  "minOrderAmount": 100,
  "maxOrderAmount": 2000,
  "paymentMethods": ["UPI", "IMPS"],
  "description": "Quick release, online most of the time"
}
```

**Validation:**
- `cryptoAmount`: 10 - 100,000 USDT
- `pricePerUnit`: > 0
- `minOrderAmount`: >= 10
- `maxOrderAmount`: <= cryptoAmount
- `paymentMethods`: At least one method
- `description`: Max 500 characters (optional)

**Response (201):**
```json
{
  "success": true,
  "message": "Listing created successfully",
  "data": {
    "_id": "listing_id",
    "listingNumber": "LST-20251202-0025",
    "cryptoAmount": 5000,
    "pricePerUnit": 84.50,
    "status": "active",
    "createdAt": "2025-12-02T10:30:00.000Z"
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

**Error Codes:**
- `KYC_004`: KYC not approved or insufficient level
- `PERM_002`: Only sellers can create listings
- `LISTING_001`: Insufficient funds

---

#### Get Listing Details

```http
GET /listings/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Listing details retrieved",
  "data": {
    "_id": "listing_id",
    "listingNumber": "LST-20251202-0001",
    "seller": {
      "_id": "seller_id",
      "name": "John Doe",
      "averageRating": 4.8,
      "totalReviews": 42,
      "completionRate": 95.5,
      "totalTrades": 150
    },
    "cryptoAmount": 5000,
    "availableAmount": 4200,
    "pricePerUnit": 84.50,
    "currentMarketPrice": 83.80,
    "minOrderAmount": 100,
    "maxOrderAmount": 2000,
    "paymentMethods": ["UPI", "IMPS"],
    "description": "Quick release, online most of the time",
    "status": "active",
    "totalOrders": 12,
    "createdAt": "2025-12-01T08:00:00.000Z"
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

#### Update Listing

```http
PUT /listings/:id
Authorization: Bearer <access_token>
```

**Note:** Can only update own listings

**Request Body:**
```json
{
  "pricePerUnit": 85.00,
  "isActive": true,
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Listing updated successfully",
  "data": {
    "_id": "listing_id",
    "pricePerUnit": 85.00,
    "updatedAt": "2025-12-02T10:30:00.000Z"
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

#### Delete Listing

```http
DELETE /listings/:id
Authorization: Bearer <access_token>
```

**Note:** Cannot delete if there are active trades

**Response (200):**
```json
{
  "success": true,
  "message": "Listing deleted successfully",
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

**Error Codes:**
- `LISTING_003`: Cannot delete listing with active trades

---

### Trade Endpoints

#### Initiate Trade

```http
POST /trades
Authorization: Bearer <access_token>
```

**Required Role:** Buyer

**Request Body:**
```json
{
  "listingId": "listing_id",
  "cryptoAmount": 500
}
```

**Validation:**
- Amount must be within listing's min/max range
- Amount must be <= available amount
- Buyer must have approved KYC

**Response (201):**
```json
{
  "success": true,
  "message": "Trade initiated successfully",
  "data": {
    "_id": "trade_id",
    "tradeNumber": "TRD-20251202-0045",
    "listingId": "listing_id",
    "buyerId": "buyer_id",
    "sellerId": "seller_id",
    "cryptoAmount": 500,
    "sellerMustSend": 505.25,
    "buyerWillReceive": 500,
    "totalINRAmount": 42500,
    "feeBreakdown": {
      "cryptoAmount": 500,
      "platformFee": 5.00,
      "gasEstimate": 0.15,
      "volatilityBuffer": 0.10,
      "totalFees": 5.25
    },
    "status": "pending",
    "escrowStatus": "awaiting_deposit",
    "paymentMethods": ["UPI", "IMPS"],
    "timeline": [
      {
        "event": "trade_created",
        "timestamp": "2025-12-02T10:30:00.000Z",
        "actor": "buyer"
      }
    ],
    "expiresAt": "2025-12-02T11:00:00.000Z",
    "createdAt": "2025-12-02T10:30:00.000Z"
  },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

**Error Codes:**
- `KYC_001`: KYC verification required
- `LISTING_002`: Listing not available
- `TRADE_004`: Amount out of range
- `TRADE_005`: Insufficient listing amount

---

#### Get Trade Details

```http
GET /trades/:id
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trade details retrieved",
  "data": {
    "_id": "trade_id",
    "tradeNumber": "TRD-20251202-0045",
    "buyer": {
      "_id": "buyer_id",
      "name": "Jane Smith",
      "averageRating": 4.6
    },
    "seller": {
      "_id": "seller_id",
      "name": "John Doe",
      "averageRating": 4.8
    },
    "listing": {
      "_id": "listing_id",
      "listingNumber": "LST-20251202-0001"
    },
    "cryptoAmount": 500,
    "totalINRAmount": 42500,
    "status": "payment_pending",
    "escrowStatus": "deposited",
    "paymentMethods": ["UPI", "IMPS"],
    "timeline": [
      {
        "event": "trade_created",
        "timestamp": "2025-12-02T10:30:00.000Z",
        "actor": "buyer"
      },
      {
        "event": "escrow_deposited",
        "timestamp": "2025-12-02T10:32:00.000Z",
        "metadata": {
          "txHash": "0xabc..."
        }
      }
    ],
    "createdAt": "2025-12-02T10:30:00.000Z"
  },
  "timestamp": "2025-12-02T10:35:00.000Z"
}
```

---

#### Mark Payment Sent

```http
POST /trades/:id/payment
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Required Role:** Buyer

**Request Body (FormData):**
```
paymentMethod: "UPI"
transactionId: "UPI123456789"
amount: 42500
proofFile: <file>
note: "Paid via UPI"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment marked as sent. Waiting for seller confirmation.",
  "data": {
    "trade": {
      "_id": "trade_id",
      "status": "payment_sent",
      "buyerPaymentDetails": {
        "paymentMethod": "UPI",
        "transactionId": "UPI123456789",
        "amount": 42500,
        "proofUrl": "https://s3.amazonaws.com/...",
        "paidAt": "2025-12-02T10:40:00.000Z"
      }
    }
  },
  "timestamp": "2025-12-02T10:40:00.000Z"
}
```

**Error Codes:**
- `TRADE_006`: Invalid trade status
- `PERM_002`: Only buyer can mark payment

---

#### Confirm Payment Received

```http
POST /trades/:id/confirm
Authorization: Bearer <access_token>
```

**Required Role:** Seller

**Request Body:**
```json
{
  "confirmed": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment confirmed. Escrow will be released automatically.",
  "data": {
    "trade": {
      "_id": "trade_id",
      "status": "payment_confirmed",
      "escrowStatus": "releasing"
    }
  },
  "timestamp": "2025-12-02T11:00:00.000Z"
}
```

**Error Codes:**
- `TRADE_006`: Invalid trade status
- `PERM_002`: Only seller can confirm payment

---

#### Open Dispute

```http
POST /trades/:id/dispute
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
reason: "payment_not_received"
description: "I sent payment but seller is not responding"
evidenceFiles: <file1>, <file2>
```

**Response (201):**
```json
{
  "success": true,
  "message": "Dispute opened successfully. Support team will review.",
  "data": {
    "dispute": {
      "_id": "dispute_id",
      "disputeNumber": "DSP-20251202-0003",
      "tradeId": "trade_id",
      "initiatedBy": "buyer",
      "reason": "payment_not_received",
      "status": "open"
    }
  },
  "timestamp": "2025-12-02T11:15:00.000Z"
}
```

---

### Chat Endpoints

#### Get Chat List

```http
GET /chats
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Chats retrieved successfully",
  "data": {
    "chats": [
      {
        "_id": "chat_id",
        "tradeId": "trade_id",
        "participants": [
          {
            "_id": "user1_id",
            "name": "John Doe"
          },
          {
            "_id": "user2_id",
            "name": "Jane Smith"
          }
        ],
        "lastMessage": {
          "content": "Payment sent",
          "senderId": "user2_id",
          "timestamp": "2025-12-02T10:40:00.000Z"
        },
        "unreadCount": 2,
        "createdAt": "2025-12-02T10:30:00.000Z"
      }
    ]
  },
  "timestamp": "2025-12-02T11:00:00.000Z"
}
```

---

#### Get Chat Messages

```http
GET /chats/:id/messages
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Messages per page (default: 50)

**Response (200):**
```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "chatId": "chat_id",
        "senderId": "sender_id",
        "senderName": "Jane Smith",
        "content": "Payment sent via UPI",
        "type": "text",
        "isRead": true,
        "createdAt": "2025-12-02T10:40:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 15
    }
  },
  "timestamp": "2025-12-02T11:00:00.000Z"
}
```

---

#### Send Message

```http
POST /chats/:id/messages
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Hello, I've sent the payment",
  "type": "text"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "_id": "message_id",
      "chatId": "chat_id",
      "senderId": "sender_id",
      "content": "Hello, I've sent the payment",
      "type": "text",
      "createdAt": "2025-12-02T11:00:00.000Z"
    }
  },
  "timestamp": "2025-12-02T11:00:00.000Z"
}
```

---

## Platform B (Admin APIs)

All Platform B endpoints require admin/support roles and are prefixed with `/admin`.

### User Management

#### List All Users

```http
GET /admin/users
Authorization: Bearer <admin_access_token>
```

**Required Role:** Support, Support Manager, Admin, Super Admin

**Query Parameters:**
- `page`, `limit`, `sortBy`, `order`
- `role` (optional): Filter by role
- `kycStatus` (optional): Filter by KYC status
- `search` (optional): Search by name/email

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "seller",
        "kycStatus": { "status": "approved" },
        "accountStatus": "active",
        "totalTrades": 45,
        "completionRate": 93.33
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### Ban/Suspend User

```http
PUT /admin/users/:id/ban
Authorization: Bearer <admin_access_token>
```

**Required Role:** Admin, Super Admin

**Request Body:**
```json
{
  "reason": "Fraudulent activities detected",
  "duration": 30
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": {
    "userId": "user_id",
    "accountStatus": "suspended",
    "suspendedUntil": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### KYC Management

#### Get Pending KYC Submissions

```http
GET /admin/kyc/pending
Authorization: Bearer <admin_access_token>
```

**Required Role:** Support, Support Manager, Admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "_id": "kyc_id",
        "user": {
          "_id": "user_id",
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "status": "pending",
        "documents": [ ... ],
        "submittedAt": "2025-12-01T10:00:00.000Z"
      }
    ]
  }
}
```

---

#### Approve KYC

```http
PUT /admin/kyc/:id/approve
Authorization: Bearer <admin_access_token>
```

**Required Role:** Support, Support Manager, Admin

**Request Body:**
```json
{
  "level": "level_2",
  "remarks": "All documents verified"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "KYC approved successfully",
  "data": {
    "kycId": "kyc_id",
    "status": "approved",
    "level": "level_2"
  }
}
```

---

#### Reject KYC

```http
PUT /admin/kyc/:id/reject
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "reason": "Blurred documents, please resubmit clear photos"
}
```

---

### Escrow Management

#### Manual Escrow Release

```http
POST /admin/escrow/:tradeId/release
Authorization: Bearer <admin_access_token>
```

**Required Role:** Support Manager, Admin, Super Admin

**Request Body:**
```json
{
  "reason": "Dispute resolved in favor of buyer",
  "releaseToAddress": "0xbuyer_wallet_address"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Escrow released successfully",
  "data": {
    "tradeId": "trade_id",
    "txHash": "0xabc...",
    "amount": 500,
    "releasedTo": "buyer"
  }
}
```

---

### Analytics

#### Platform Statistics

```http
GET /admin/analytics/overview
Authorization: Bearer <admin_access_token>
```

**Required Role:** Support Manager, Admin, Super Admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 5420,
    "activeListings": 287,
    "completedTrades": 12456,
    "totalVolume": 1245678.50,
    "pendingDisputes": 12,
    "averageTradeTime": 3600
  }
}
```

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errorCode": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

## Error Codes

| Code | Message | HTTP Status |
|------|---------|-------------|
| **Authentication** |||
| AUTH_001 | Invalid email or password | 401 |
| AUTH_002 | Account is suspended | 403 |
| AUTH_003 | Email already exists | 409 |
| AUTH_004 | Mobile number  | 409 |
| AUTH_006 | User not found | 404 |
| AUTH_007 | Email not verified | 403 |
| AUTH_010 | Invalid or expired OTP | 400 |
| AUTH_012 | Authentication required | 401 |
| **KYC** |||
| KYC_001 | KYC verification required | 403 |
| KYC_002 | KYC already submitted | 409 |
| KYC_003 | Invalid document format | 400 |
| KYC_004 | Insufficient KYC level | 403 |
| **Listing** |||
| LISTING_001 | Insufficient funds | 400 |
| LISTING_002 | Listing not available | 404 |
| LISTING_003 | Cannot delete with active trades | 409 |
| **Trade** |||
| TRADE_001 | Trade not found | 404 |
| TRADE_002 | Cannot review incomplete trade | 400 |
| TRADE_003 | Already reviewed this trade | 409 |
| TRADE_004 | Amount out of range | 400 |
| TRADE_005 | Insufficient listing amount | 400 |
| TRADE_006 | Invalid trade status | 400 |
| **Permissions** |||
| PERM_001 | Access denied | 403 |
| PERM_002 | Insufficient permissions | 403 |
| **Validation** |||
| VAL_001 | Validation error | 400 |

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|---------|
| Authentication | 5 requests | 15 minutes |
| OTP | 3 requests | 5 minutes |
| KYC | 10 requests | 15 minutes |
| Listings | 30 requests | 15 minutes |
| Trades | 20 requests | 15 minutes |
| Chat | 100 requests | 1 minute |
| Admin | 60 requests | 1 minute |
| General | 100 requests | 15 minutes |

**Headers:**
- `X-RateLimit-Limit`: Total allowed requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Timestamp when limit resets

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "statusCode": 429,
  "retryAfter": 300,
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

---

## WebSocket Events (Planned)

```javascript
// Connect to WebSocket
const socket = io("wss://api.cryptians.com", {
  auth: {
    token: "<access_token>"
  }
});

// Listen for events
socket.on("trade:status", (data) => {
  console.log("Trade status updated:", data);
});

socket.on("message:received", (data) => {
  console.log("New message:", data);
});

socket.on("notification", (data) => {
  console.log("Notification:", data);
});

// Send message
socket.emit("message:send", {
  chatId: "chat_id",
  content: "Hello"
});
```

---

**API Version**: 1.0.0
**Last Updated**: 2025-12-02
**Support**: api-support@cryptians.com
