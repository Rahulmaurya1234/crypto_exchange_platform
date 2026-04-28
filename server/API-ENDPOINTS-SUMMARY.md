# Cryptians P2P Marketplace - API Endpoints Summary

This document provides a comprehensive overview of all implemented API endpoints for the Cryptians P2P Cryptocurrency Marketplace.

## Base URL
```
http://localhost:5000/api/v1
```

---

## Platform A - User-Facing APIs

### 1. Authentication (`/api/v1/auth`)
**Already Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login user | Public |
| POST | `/auth/verify-otp` | Verify OTP | Public |
| POST | `/auth/resend-otp` | Resend OTP | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/logout` | Logout user | Private |
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password | Public |
| POST | `/auth/change-password` | Change password | Private |

---

### 2. KYC (`/api/v1/platform-a/kyc`)
**NEW - Just Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/kyc/submit` | Submit KYC for verification | Private |
| GET | `/kyc/status` | Get own KYC status | Private |

---

### 3. Listings (`/api/v1/platform-a/listings`)
**NEW - Just Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/listings` | Create new listing | Private (Sellers) |
| GET | `/listings` | Search/filter listings | Public |
| GET | `/listings/my-listings` | Get own listings | Private |
| GET | `/listings/:id` | Get listing by ID | Public |
| PUT | `/listings/:id` | Update listing | Private |
| DELETE | `/listings/:id` | Delete listing | Private |
| PATCH | `/listings/:id/pause` | Pause listing | Private |
| PATCH | `/listings/:id/resume` | Resume listing | Private |

---

### 4. Trades (`/api/v1/platform-a/trades`)
**NEW - Just Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/trades` | Initiate new trade | Private (Buyers) |
| GET | `/trades` | Get user's trades | Private |
| GET | `/trades/stats` | Get trade statistics | Private |
| GET | `/trades/:id` | Get trade by ID | Private |
| POST | `/trades/:id/deposit-escrow` | Mark escrow deposited (Seller) | Private (Sellers) |
| POST | `/trades/:id/upload-payment` | Upload payment proof (Buyer) | Private (Buyers) |
| POST | `/trades/:id/confirm-payment` | Confirm payment (Seller) | Private (Sellers) |
| POST | `/trades/:id/complete` | Complete trade (Release escrow) | Private (Sellers) |
| POST | `/trades/:id/cancel` | Cancel trade | Private |

---

### 5. Chat (`/api/v1/platform-a/chat`)
**NEW - Just Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/chat` | Get user's chats | Private |
| GET | `/chat/unread/count` | Get unread message count | Private |
| GET | `/chat/trade/:tradeId` | Get chat by trade ID | Private |
| GET | `/chat/:id` | Get chat by ID | Private |
| GET | `/chat/:id/messages` | Get messages for chat | Private |
| POST | `/chat/:id/messages` | Send message | Private |
| POST | `/chat/:id/read` | Mark chat as read | Private |

---

### 6. Profile (`/api/v1/platform-a/profile`)
**NEW - Just Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/profile` | Get own profile | Private |
| PUT | `/profile` | Update profile | Private |
| GET | `/profile/stats` | Get profile statistics | Private |
| POST | `/profile/avatar` | Upload avatar | Private |
| PUT | `/profile/preferences` | Update preferences | Private |
| GET | `/profile/:userId` | Get public profile by user ID | Public |

---

### 7. Wallet (`/api/v1/platform-a/wallet`)
**NEW - Just Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/wallet` | Get wallet information | Private |
| GET | `/wallet/escrow` | Get escrow deposit info | Private |
| PUT | `/wallet/crypto-address` | Update crypto wallet address | Private |
| PUT | `/wallet/bank-details` | Update bank details | Private |
| POST | `/wallet/upi` | Add UPI ID | Private |

---

## Platform B - Admin-Facing APIs

### 8. Admin (`/api/v1/platform-b/admin`)
**NEW - Just Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/admin/stats` | Get dashboard statistics | Admin |
| GET | `/admin/users` | Get all users | Admin |
| GET | `/admin/users/:id` | Get user by ID | Admin |
| POST | `/admin/users/:id/suspend` | Suspend user | Admin |
| POST | `/admin/users/:id/unsuspend` | Unsuspend user | Admin |
| POST | `/admin/users/:id/ban` | Ban user | Admin |
| POST | `/admin/users/:id/approve-instant-seller` | Approve instant seller | Admin |
| GET | `/admin/kyc` | Get all KYCs | Admin |
| GET | `/admin/kyc/pending` | Get pending KYC submissions | Admin |
| POST | `/admin/kyc/:id/review` | Review KYC | Admin |
| GET | `/admin/trades` | Get all trades | Admin |

---

### 9. Analytics (`/api/v1/platform-b/analytics`)
**NEW - Just Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/analytics/overview` | Get platform overview | Admin |
| GET | `/analytics/users` | Get user analytics | Admin |
| GET | `/analytics/trades` | Get trade analytics | Admin |
| GET | `/analytics/revenue` | Get revenue analytics | Admin |
| GET | `/analytics/listings` | Get listing analytics | Admin |

---

### 10. Disputes (`/api/v1/platform-b/disputes`)
**NEW - Just Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/disputes` | Get all disputes | Admin/Support |
| GET | `/disputes/open` | Get open disputes | Admin/Support |
| GET | `/disputes/stats` | Get dispute statistics | Admin/Support |
| GET | `/disputes/:id` | Get dispute by ID | Admin/Support |
| POST | `/disputes/:id/assign` | Assign dispute to support agent | Admin |
| POST | `/disputes/:id/resolve` | Resolve dispute | Admin |

---

### 11. Escrow (`/api/v1/platform-b/escrow`)
**NEW - Just Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/escrow` | Get all escrow transactions | Admin |
| GET | `/escrow/stats` | Get escrow statistics | Admin |
| GET | `/escrow/pending` | Get pending transactions | Admin |
| GET | `/escrow/hash/:hash` | Get transaction by hash | Admin |
| GET | `/escrow/user/:userId` | Get user's escrow transactions | Admin |
| GET | `/escrow/:id` | Get transaction by ID | Admin |
| POST | `/escrow/:id/status` | Update transaction status | Admin |
| POST | `/escrow/hash/:hash/confirmations` | Update confirmations | Admin |

---

### 12. Support (`/api/v1/platform-b/support`)
**NEW - Just Implemented**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/support/stats` | Get support statistics | Admin/Support |
| GET | `/support/tickets` | Get support tickets | Admin/Support |
| GET | `/support/my-tickets` | Get assigned tickets | Support |
| POST | `/support/chat/:chatId/join` | Join chat as support agent | Support |

---

## Status Summary

### ✅ Completed Implementations

**Platform A (User-facing):**
1. ✅ Authentication - Already existed
2. ✅ KYC - Controller + Routes + Service
3. ✅ Listings - Controller + Routes + Service
4. ✅ Trades - Controller + Routes + Service
5. ✅ Chat - Controller + Routes + Service
6. ✅ Profile - Controller + Routes
7. ✅ Wallet - Controller + Routes + Service

**Platform B (Admin-facing):**
1. ✅ Admin - Controller + Routes
2. ✅ Analytics - Controller + Routes
3. ✅ Disputes - Controller + Routes + Service
4. ✅ Escrow - Controller + Routes + Service
5. ✅ Support - Controller + Routes

### 📋 Files Created

**Services (New):**
- `server/src/services/trade.service.js`
- `server/src/services/chat.service.js`
- `server/src/services/wallet.service.js`
- `server/src/services/dispute.service.js`
- `server/src/services/escrow.service.js`

**Platform-A Controllers & Routes:**
- `server/src/api/v1/platform-a/trades/` (controller.js, routes.js, index.js)
- `server/src/api/v1/platform-a/chat/` (controller.js, routes.js, index.js)
- `server/src/api/v1/platform-a/profile/` (controller.js, routes.js, index.js)
- `server/src/api/v1/platform-a/wallet/` (controller.js, routes.js, index.js)

**Platform-B Controllers & Routes:**
- `server/src/api/v1/platform-b/admin/` (controller.js, routes.js, index.js)
- `server/src/api/v1/platform-b/analytics/` (controller.js, routes.js, index.js)
- `server/src/api/v1/platform-b/disputes/` (controller.js, routes.js, index.js)
- `server/src/api/v1/platform-b/escrow/` (controller.js, routes.js, index.js)
- `server/src/api/v1/platform-b/support/` (controller.js, routes.js, index.js)

**Updated Files:**
- `server/src/routes/index.js` - Updated to include all new routes

---

## 🔄 Pending Tasks

### Medium Priority:
1. **WebSocket Implementation** - For real-time chat functionality
2. **BullMQ Configuration** - For background job processing
3. **Validators** - Create request validation schemas for all endpoints
4. **Integration Tests** - Test all API endpoints

### Lower Priority:
1. **API Documentation** - Generate Swagger/OpenAPI documentation
2. **Rate Limiting** - Configure rate limits per endpoint
3. **Logging Enhancement** - Add detailed request/response logging

---

## Testing with Postman

1. Import the base URL: `http://localhost:5000/api/v1`
2. Create authentication token by calling `/auth/register` and `/auth/login`
3. Use the returned `accessToken` in the Authorization header for protected routes:
   ```
   Authorization: Bearer <your-access-token>
   ```

### Sample Test Flow:

1. **Register User**: POST `/auth/register`
2. **Verify OTP**: POST `/auth/verify-otp`
3. **Login**: POST `/auth/login`
4. **Submit KYC**: POST `/platform-a/kyc/submit`
5. **Create Listing**: POST `/platform-a/listings`
6. **Initiate Trade**: POST `/platform-a/trades`
7. **Send Message**: POST `/platform-a/chat/:id/messages`

---

## Notes

- All timestamps are in ISO 8601 format
- All responses follow the ApiResponse format: `{ statusCode, data, message, success }`
- Error responses follow ApiError format with proper error codes
- Pagination is available on list endpoints with `page` and `limit` query parameters
- File uploads (avatars, KYC documents, payment proofs) require additional multipart/form-data handling

---

**Last Updated**: December 2, 2025
**Total Endpoints**: 80+
**Implementation Status**: ✅ All Core Modules Complete
