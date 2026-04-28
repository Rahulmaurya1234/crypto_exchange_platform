# 🚀 Cryptians P2P Marketplace - Complete API Testing Guide

## 📋 Table of Contents
1. [Environment Setup](#environment-setup)
2. [Cookie Configuration](#cookie-configuration)
3. [Test Users Data](#test-users-data)
4. [Authentication Flow](#authentication-flow)
5. [Platform A APIs (User-Facing)](#platform-a-apis-user-facing)
6. [Platform B APIs (Admin Panel)](#platform-b-apis-admin-panel)
7. [WebSocket Testing](#websocket-testing)

---

## 🔧 Environment Setup

### Postman Environment Variables
Create a new environment in Postman with these variables:

```
BASE_URL: http://localhost:5000
API_VERSION: v1
ACCESS_TOKEN: (will be set automatically after login)
REFRESH_TOKEN: (will be set automatically after login)
USER_ID: (will be set automatically after login)
```

### Important: Enable Cookie Handling
1. Go to Postman Settings → General
2. Enable "Automatically follow redirects"
3. Disable "Automatically follow original HTTP method"
4. In each request, go to Settings → Enable "Send cookies"

---

## 🍪 Cookie Configuration

### Check Cookies After Login
After successful login, check cookies:
- Go to Postman → Cookies → Manage Cookies
- Look for domain: `localhost:5000`
- You should see: `refresh_token` cookie

### Auto-Extract Tokens Script
Add this to **Tests** tab in login request:

```javascript
// Extract tokens from response
if (pm.response.code === 200) {
    const jsonData = pm.response.json();

    // Save access token
    pm.environment.set("ACCESS_TOKEN", jsonData.data.accessToken);

    // Save user ID
    pm.environment.set("USER_ID", jsonData.data.user._id);

    // Refresh token is in cookies
    console.log("✅ Login successful! Tokens saved.");
}
```

### Add Authorization to All Protected Routes
For protected endpoints, add to **Headers**:
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

Or use **Authorization** tab → Type: Bearer Token → Token: `{{ACCESS_TOKEN}}`

---

## 👥 Test Users Data

### User 1: Regular Buyer (John Doe)
```json
{
  "email": "john.buyer@example.com",
  "password": "BuyerPass123!",
  "name": "John Doe",
  "mobileNumber": "9876543210",
  "role": "buyer"
}
```

### User 2: Seller (Sarah Smith)
```json
{
  "email": "sarah.seller@example.com",
  "password": "SellerPass123!",
  "name": "Sarah Smith",
  "mobileNumber": "9876543211",
  "role": "seller"
}
```

### User 3: Instant Seller (Mike Johnson)
```json
{
  "email": "mike.instant@example.com",
  "password": "InstantPass123!",
  "name": "Mike Johnson",
  "mobileNumber": "9876543212",
  "role": "instant_seller"
}
```

### User 4: Support Agent
```json
{
  "email": "support@cryptians.com",
  "password": "SupportPass123!",
  "name": "Support Agent",
  "mobileNumber": "9876543213",
  "role": "support"
}
```

### User 5: Admin User
```json
{
  "email": "admin@cryptians.com",
  "password": "AdminPass123!",
  "name": "Admin User",
  "mobileNumber": "9876543214",
  "role": "admin"
}
```

---

## 🔐 Authentication Flow

### 1. Register User (POST)
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/auth/register`

**Request Body:**
```json
{
  "email": "john.buyer@example.com",
  "password": "BuyerPass123!",
  "name": "John Doe",
  "mobileNumber": "9876543210"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your OTP.",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john.buyer@example.com",
    "otpSent": true,
    "otpExpiresIn": 300
  }
}
```

**Note:** OTP will be sent via SMS/Email. For testing, check server logs for OTP.

---

### 2. Verify OTP (POST)
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/auth/verify-otp`

**Request Body:**
```json
{
  "email": "john.buyer@example.com",
  "otp": "123456"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully. Account activated.",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.buyer@example.com",
      "name": "John Doe",
      "mobileNumber": "9876543210",
      "role": "buyer",
      "isVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**✅ Check:** `refresh_token` cookie should be set in browser

---

### 3. Login (POST)
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/auth/login`

**Request Body:**
```json
{
  "email": "john.buyer@example.com",
  "password": "BuyerPass123!"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.buyer@example.com",
      "name": "John Doe",
      "role": "buyer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**✅ Check:**
- Access token in response body
- Refresh token in cookies
- Save access token to environment variable

---

### 4. Refresh Token (POST)
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "{{REFRESH_TOKEN}}"
}
```

**Note:** If refresh token is in cookies, you don't need to send it in body.

---

### 5. Logout (POST)
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/auth/logout`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**✅ Check:** `refresh_token` cookie should be cleared

---

### 6. Forgot Password (POST)
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john.buyer@example.com"
}
```

---

### 7. Reset Password (POST)
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/auth/reset-password`

**Request Body:**
```json
{
  "email": "john.buyer@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123!"
}
```

---

### 8. Change Password (POST) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/auth/change-password`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "currentPassword": "BuyerPass123!",
  "newPassword": "NewBuyerPass123!"
}
```

---

## 🏪 Platform A APIs (User-Facing)

### 📊 User Profile APIs

#### Get Own Profile (GET) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/users/profile`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Update Profile (PUT) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/users/profile`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "bio": "Crypto enthusiast and trader",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "altMobileNumber": "9876543299",
  "preferredLanguage": "en"
}
```

---

#### Get User By ID (GET) [Public]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/users/507f1f77bcf86cd799439011`

---

#### Get User Reviews (GET) [Public]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/users/507f1f77bcf86cd799439011/reviews`

---

#### Add Review (POST) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/users/507f1f77bcf86cd799439011/reviews`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "tradeId": "507f1f77bcf86cd799439012",
  "rating": 5,
  "comment": "Excellent trader! Fast and reliable."
}
```

---

### 🆔 KYC APIs

#### Submit KYC (POST) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/kyc/submit`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "documentType": "aadhaar",
  "documentNumber": "123456789012",
  "frontImage": "https://s3.amazonaws.com/kyc/front.jpg",
  "backImage": "https://s3.amazonaws.com/kyc/back.jpg",
  "selfieImage": "https://s3.amazonaws.com/kyc/selfie.jpg",
  "address": "123 Main Street, Mumbai",
  "dateOfBirth": "1990-01-15"
}
```

---

#### Get KYC Status (GET) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/kyc/status`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 📝 Listing APIs

#### Create Listing (POST) [Protected - Seller Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/listings`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "cryptoType": "USDT",
  "availableAmount": 1000,
  "pricePerUnit": 83.50,
  "priceType": "fixed",
  "minTradeLimit": 100,
  "maxTradeLimit": 5000,
  "paymentMethods": ["upi", "imps", "bank_transfer"],
  "timeLimit": 30,
  "terms": "Payment must be made within 30 minutes",
  "instructions": "Please send payment to UPI ID: seller@paytm"
}
```

---

#### Search Listings (GET) [Public]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/listings?minAmount=100&maxAmount=10000&paymentMethod=upi&page=1&limit=20`

**Query Parameters:**
- `minAmount`: Minimum trade amount
- `maxAmount`: Maximum trade amount
- `paymentMethod`: upi, imps, neft, rtgs, bank_transfer
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

---

#### Get My Listings (GET) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/listings/my-listings`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Get Listing By ID (GET) [Public]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/listings/507f1f77bcf86cd799439013`

---

#### Update Listing (PUT) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/listings/507f1f77bcf86cd799439013`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "pricePerUnit": 84.00,
  "minTradeLimit": 200,
  "maxTradeLimit": 6000,
  "isAvailable": true
}
```

---

#### Delete Listing (DELETE) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/listings/507f1f77bcf86cd799439013`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Pause Listing (PATCH) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/listings/507f1f77bcf86cd799439013/pause`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Resume Listing (PATCH) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/listings/507f1f77bcf86cd799439013/resume`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 💱 Trade APIs

#### Initiate Trade (POST) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/trades`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "listingId": "507f1f77bcf86cd799439013",
  "amount": 1000,
  "paymentMethod": "upi"
}
```

---

#### Get My Trades (GET) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/trades/my-trades?status=active&page=1&limit=20`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Get Trade By ID (GET) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/trades/507f1f77bcf86cd799439014`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Confirm Payment (POST) [Protected - Buyer]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/trades/507f1f77bcf86cd799439014/confirm-payment`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "paymentProof": "https://s3.amazonaws.com/proofs/payment123.jpg",
  "transactionId": "UPI123456789",
  "notes": "Payment sent via UPI"
}
```

---

#### Release Crypto (POST) [Protected - Seller]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/trades/507f1f77bcf86cd799439014/release`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Cancel Trade (POST) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/trades/507f1f77bcf86cd799439014/cancel`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

---

#### Create Dispute (POST) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/trades/507f1f77bcf86cd799439014/dispute`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "reason": "payment_not_received",
  "description": "I made the payment but seller hasn't released the crypto.",
  "evidence": [
    "https://s3.amazonaws.com/evidence/screenshot1.jpg",
    "https://s3.amazonaws.com/evidence/screenshot2.jpg"
  ]
}
```

---

### 💬 Chat APIs

#### Get User's Chats (GET) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/chat`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Get Chat By Trade ID (GET) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/chat/trade/507f1f77bcf86cd799439014`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Get Unread Count (GET) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/chat/unread/count`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Get Chat Messages (GET) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/chat/507f1f77bcf86cd799439015/messages?page=1&limit=50`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Send Message (POST) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/chat/507f1f77bcf86cd799439015/messages`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "message": "Hello! I've made the payment. Please check.",
  "attachments": []
}
```

---

#### Mark Chat as Read (POST) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/chat/507f1f77bcf86cd799439015/read`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 👤 Profile APIs (Platform A)

#### Get Own Profile (GET) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/profile`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Update Profile (PUT) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/profile`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "name": "John Doe",
  "bio": "Experienced crypto trader",
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

---

#### Update Preferences (PUT) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/profile/preferences`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "emailNotifications": true,
  "smsNotifications": true,
  "pushNotifications": true,
  "tradeAlerts": true,
  "marketingEmails": false,
  "preferredLanguage": "en",
  "theme": "dark"
}
```

---

#### Get Public Profile (GET) [Public]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/profile/507f1f77bcf86cd799439011`

---

### 💰 Wallet APIs

#### Get Wallet Info (GET) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/wallet`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Update Crypto Address (PUT) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/wallet/crypto-address`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "cryptoWalletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "network": "polygon"
}
```

---

#### Update Bank Details (PUT) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/wallet/bank-details`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "accountHolderName": "John Doe",
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "bankName": "State Bank of India",
  "branchName": "Mumbai Main Branch"
}
```

---

#### Add UPI ID (POST) [Protected]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-a/wallet/upi`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "upiId": "john@paytm",
  "isDefault": true
}
```

---

## 🛡️ Platform B APIs (Admin Panel)

### Admin Authentication
**Use the same login endpoint** but with admin credentials:

```json
{
  "email": "admin@cryptians.com",
  "password": "AdminPass123!"
}
```

---

### 📊 Admin Dashboard

#### Get Dashboard Stats (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/admin/stats`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 👥 User Management

#### Get All Users (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/admin/users?status=active&page=1&limit=20`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Query Parameters:**
- `status`: active, inactive, suspended, banned
- `role`: buyer, seller, instant_seller
- `kycStatus`: pending, approved, rejected
- `search`: Search by name or email

---

#### Get User By ID (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/admin/users/507f1f77bcf86cd799439011`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Suspend User (POST) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/admin/users/507f1f77bcf86cd799439011/suspend`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Suspicious trading activity detected",
  "duration": 7
}
```

---

#### Ban User (POST) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/admin/users/507f1f77bcf86cd799439011/ban`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "status": "banned",
  "reason": "Repeated fraudulent activities"
}
```

---

#### Unsuspend User (POST) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/admin/users/507f1f77bcf86cd799439011/unsuspend`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 🆔 KYC Management

#### Get Pending KYCs (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/admin/kyc/pending`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Get All KYCs (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/admin/kyc?status=pending&page=1&limit=20`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Review KYC (POST) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/admin/kyc/507f1f77bcf86cd799439016/review`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Approve KYC:**
```json
{
  "status": "approved",
  "notes": "All documents verified successfully"
}
```

**Reject KYC:**
```json
{
  "status": "rejected",
  "rejectionReason": "Document images are not clear. Please resubmit.",
  "notes": "Front side of Aadhaar card is blurry"
}
```

---

### 🔍 Dispute Management

#### Get All Disputes (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/disputes?status=open&page=1&limit=20`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Get Dispute Stats (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/disputes/stats`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Get Open Disputes (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/disputes/open`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Assign Dispute (POST) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/disputes/507f1f77bcf86cd799439017/assign`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "assignedTo": "507f1f77bcf86cd799439018",
  "priority": "high",
  "notes": "Urgent case - large amount involved"
}
```

---

#### Resolve Dispute (POST) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/disputes/507f1f77bcf86cd799439017/resolve`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "resolution": "release_to_seller",
  "resolutionNotes": "Evidence shows payment was received. Releasing funds to seller.",
  "refundAmount": 0
}
```

**Refund Case:**
```json
{
  "resolution": "refund_buyer",
  "resolutionNotes": "Seller failed to respond. Refunding buyer.",
  "refundAmount": 1000
}
```

---

### 🔐 Escrow Management

#### Get Escrow Stats (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/escrow/stats`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Get All Escrow Transactions (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/escrow?status=locked&page=1&limit=20`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Get Pending Transactions (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/escrow/pending`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Get Transaction By Hash (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/escrow/hash/0x123abc...`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

#### Update Transaction Status (POST) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/escrow/507f1f77bcf86cd799439019/status`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{
  "status": "released",
  "transactionHash": "0x123abc...",
  "notes": "Funds released successfully"
}
```

---

### 📈 Analytics APIs

#### Get Platform Analytics (GET) [Admin Only]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/analytics?period=month&startDate=2024-01-01&endDate=2024-01-31`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 🎫 Support Ticket Management

#### Get All Tickets (GET) [Support/Admin]
**Endpoint:** `{{BASE_URL}}/api/{{API_VERSION}}/platform-b/support?status=open&page=1&limit=20`

**Headers:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

---

## 🌐 WebSocket Testing

### Option 1: Using Browser Console

1. **Open Browser Console** (F12)
2. **Install Socket.IO Client** (if testing locally):

```html
<script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
```

3. **Connect to WebSocket:**

```javascript
// Replace with your access token
const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Connect to server
const socket = io("http://localhost:5000", {
    auth: {
        token: accessToken
    }
});

// Connection events
socket.on("connect", () => {
    console.log("✅ Connected to WebSocket!", socket.id);
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected from WebSocket");
});

socket.on("connect_error", (error) => {
    console.error("Connection error:", error.message);
});
```

---

### WebSocket Events for Chat

#### 1. Join a Chat Room
```javascript
socket.emit("chat:join", "CHAT_ID_HERE");
```

#### 2. Send Typing Indicator
```javascript
socket.emit("chat:typing", {
    chatId: "CHAT_ID_HERE",
    isTyping: true
});
```

#### 3. Listen for New Messages
```javascript
socket.on("message:new", (data) => {
    console.log("New message received:", data);
});
```

#### 4. Listen for Typing Indicators
```javascript
socket.on("chat:typing", (data) => {
    console.log(`User ${data.userId} is typing:`, data.isTyping);
});
```

#### 5. Mark Message as Read
```javascript
socket.emit("message:read", {
    chatId: "CHAT_ID_HERE",
    messageId: "MESSAGE_ID_HERE"
});
```

#### 6. Listen for Read Receipts
```javascript
socket.on("message:read", (data) => {
    console.log("Message read by:", data.userId);
});
```

---

### WebSocket Events for Trade Updates

#### Subscribe to Trade Updates
```javascript
socket.emit("trade:subscribe", "TRADE_ID_HERE");
```

#### Listen for Trade Status Changes
```javascript
socket.on("trade:status_update", (data) => {
    console.log("Trade status updated:", data);
});
```

#### Listen for Trade Timeout
```javascript
socket.on("trade:timeout", (data) => {
    console.log("Trade timed out:", data);
});
```

---

### WebSocket Events for Notifications

#### Listen for New Notifications
```javascript
socket.on("notification:new", (data) => {
    console.log("New notification:", data);
});
```

---

### User Presence

#### Set User as Online
```javascript
socket.emit("user:online");
```

#### Listen for User Status Changes
```javascript
socket.on("user:status", (data) => {
    console.log(`User ${data.userId} is now:`, data.status);
});
```

---

### Complete Chat Test Flow (Two Users)

**User 1 (Buyer):**
```javascript
// Connect
const socket1 = io("http://localhost:5000", {
    auth: { token: "BUYER_ACCESS_TOKEN" }
});

// Join chat
socket1.emit("chat:join", "CHAT_ID");

// Send message
socket1.emit("chat:typing", { chatId: "CHAT_ID", isTyping: true });

// Listen for messages
socket1.on("message:new", (data) => {
    console.log("Buyer received:", data);
});
```

**User 2 (Seller):**
```javascript
// Connect
const socket2 = io("http://localhost:5000", {
    auth: { token: "SELLER_ACCESS_TOKEN" }
});

// Join same chat
socket2.emit("chat:join", "CHAT_ID");

// Send message via REST API (not socket)
// Then socket will emit to other user

// Listen for messages
socket2.on("message:new", (data) => {
    console.log("Seller received:", data);
});

// Listen for typing
socket2.on("chat:typing", (data) => {
    console.log("Buyer is typing...");
});
```

---

### Option 2: Using Postman WebSocket

1. **Create New Request** → Select **WebSocket**
2. **URL:** `ws://localhost:5000`
3. **Connect**
4. **Send Authentication:**

```json
{
  "type": "auth",
  "token": "YOUR_ACCESS_TOKEN"
}
```

5. **Send Events:**

```json
{
  "event": "chat:join",
  "data": "CHAT_ID_HERE"
}
```

---

## ✅ Testing Checklist

### Authentication & Cookies
- [ ] Register new user
- [ ] Check OTP in server logs
- [ ] Verify OTP
- [ ] Check `refresh_token` cookie is set
- [ ] Login with credentials
- [ ] Check access token in response
- [ ] Use access token in Authorization header
- [ ] Test protected endpoints
- [ ] Refresh token
- [ ] Logout and check cookie is cleared

### User Flow (Buyer)
- [ ] Register as buyer
- [ ] Login
- [ ] Update profile
- [ ] Submit KYC
- [ ] Search listings
- [ ] Initiate trade
- [ ] Confirm payment
- [ ] Send chat message
- [ ] Rate seller

### User Flow (Seller)
- [ ] Register as seller
- [ ] Login
- [ ] Create listing
- [ ] View my listings
- [ ] Receive trade request
- [ ] View chat messages
- [ ] Release crypto
- [ ] Update listing

### Admin Flow
- [ ] Login as admin
- [ ] View dashboard stats
- [ ] View all users
- [ ] View pending KYCs
- [ ] Approve/Reject KYC
- [ ] View disputes
- [ ] Assign dispute
- [ ] Resolve dispute
- [ ] View escrow transactions

### WebSocket Testing
- [ ] Connect to socket with valid token
- [ ] Join chat room
- [ ] Send message from User 1
- [ ] Receive message on User 2
- [ ] Test typing indicators
- [ ] Test read receipts
- [ ] Subscribe to trade updates
- [ ] Test user presence

---

## 🐛 Common Issues & Solutions

### Issue: Cookies Not Being Set
**Solution:**
- Check Postman settings: Enable "Send cookies"
- Ensure server is running on same domain
- Check `REFRESH_COOKIE_SECURE` in `.env` (should be `false` for localhost)

### Issue: 401 Unauthorized
**Solution:**
- Check if access token is expired (15 minutes)
- Refresh token
- Re-login if refresh token expired

### Issue: WebSocket Authentication Failed
**Solution:**
- Ensure token is passed in `auth` object during connection
- Check token is valid and not expired
- Verify JWT_SECRET matches server

### Issue: CORS Error
**Solution:**
- Check `CLIENT_URL` in `.env`
- Ensure Postman or browser origin is allowed

---

## 📝 Notes

1. **OTP Verification:** For testing, check server console logs for OTP codes
2. **File Uploads:** For KYC documents, use S3 URLs or test image URLs
3. **MongoDB IDs:** Replace example IDs with actual IDs from your database
4. **Rate Limiting:** May need to wait if hitting rate limits during testing
5. **Environment:** Make sure MongoDB, Redis, and server are all running

---

## 🚀 Quick Start Script

Save this as HTML and open in browser for quick WebSocket testing:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Cryptians WebSocket Test</title>
    <script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
</head>
<body>
    <h1>Cryptians WebSocket Tester</h1>

    <div>
        <label>Access Token:</label>
        <input type="text" id="token" style="width: 500px;" />
        <button onclick="connect()">Connect</button>
    </div>

    <div>
        <label>Chat ID:</label>
        <input type="text" id="chatId" />
        <button onclick="joinChat()">Join Chat</button>
    </div>

    <div id="status">Disconnected</div>
    <div id="messages"></div>

    <script>
        let socket;

        function connect() {
            const token = document.getElementById('token').value;
            socket = io("http://localhost:5000", {
                auth: { token }
            });

            socket.on("connect", () => {
                document.getElementById('status').innerText = "✅ Connected";
            });

            socket.on("message:new", (data) => {
                const div = document.createElement('div');
                div.textContent = JSON.stringify(data);
                document.getElementById('messages').appendChild(div);
            });
        }

        function joinChat() {
            const chatId = document.getElementById('chatId').value;
            socket.emit("chat:join", chatId);
        }
    </script>
</body>
</html>
```

---

**Happy Testing! 🎉**

For issues or questions, check server logs at `./logs/` directory.
