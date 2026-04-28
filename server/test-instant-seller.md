# Instant Seller & Regular Seller API Testing Guide

## Prerequisites

1. **Create Test Users:**
   - Regular Seller (for regular listing flow)
   - Instant Seller (for instant seller flow)
   - Admin User (for approval)

2. **Get Auth Tokens:**
   - Login as each user to get their JWT tokens

---

## TEST DATA

### Test User 1: Regular Seller
```json
{
  "email": "regular.seller@test.com",
  "password": "Test@123456",
  "name": "Regular Seller",
  "role": "seller"
}
```

### Test User 2: Instant Seller Candidate
```json
{
  "email": "instant.seller@test.com",
  "password": "Test@123456",
  "name": "Instant Seller",
  "role": "seller"
}
```

### Test User 3: Admin
```json
{
  "email": "admin@test.com",
  "password": "Admin@123456",
  "name": "Admin User",
  "role": "admin"
}
```

---

## FLOW 1: REGULAR SELLER (Traditional Flow)

### Step 1: Login as Regular Seller
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "regular.seller@test.com",
    "password": "Test@123456"
  }'
```

**Save the `accessToken` from response as `REGULAR_SELLER_TOKEN`**

### Step 2: Create Regular Listing
```bash
curl -X POST http://localhost:5000/api/v1/platform-a/listings \
  -H "Authorization: Bearer REGULAR_SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cryptoType": "USDT",
    "availableAmount": 5000,
    "pricePerUnit": 92,
    "priceType": "fixed",
    "minTradeLimit": 500,
    "maxTradeLimit": 5000,
    "paymentMethods": ["upi", "imps", "bank_transfer"],
    "timeLimit": 30,
    "terms": "Payment must be made within 30 minutes",
    "instructions": "Please use the provided UPI ID for payment",
    "autoReplyMessage": "Thank you for your order! Please complete payment within 30 minutes."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "listing": {
      "_id": "...",
      "status": "active",
      "isInstantSeller": false,
      "createdBy": "RegularSeller",
      "availableAmount": 5000,
      "pricePerUnit": 92
    }
  },
  "message": "Listing created successfully"
}
```

### Step 3: Get Own Listings (Regular Seller)
```bash
curl http://localhost:5000/api/v1/platform-a/listings/my-listings \
  -H "Authorization: Bearer REGULAR_SELLER_TOKEN"
```

### Step 4: Search All Listings (Public)
```bash
curl "http://localhost:5000/api/v1/platform-a/listings?isInstantSeller=false&page=1&limit=10"
```

---

## FLOW 2: INSTANT SELLER (Pre-Deposit Flow)

### Step 1: Login as Instant Seller Candidate
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instant.seller@test.com",
    "password": "Test@123456"
  }'
```

**Save the `accessToken` as `INSTANT_SELLER_TOKEN`**

### Step 2: Calculate Required Deposit
```bash
curl "http://localhost:5000/api/v1/platform-a/listings/instant-seller/calculate-deposit?amount=2000&network=ethereum"
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "calculation": {
      "originalAmount": 2000,
      "platformFeePercent": 4,
      "platformFeeUSDT": 80,
      "gasFeeUSDT": 6,
      "totalDepositRequired": 2086,
      "displayAmount": 2000,
      "feeBreakdown": {
        "platformFee": 80,
        "gasFee": 6,
        "totalFees": 86
      }
    }
  },
  "message": "Deposit calculation successful"
}
```

**Note:** User needs to deposit 2086 USDT to platform's escrow wallet.

### Step 3: Create Instant Seller Listing (After Depositing)
```bash
curl -X POST http://localhost:5000/api/v1/platform-a/listings/instant-seller \
  -H "Authorization: Bearer INSTANT_SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cryptoType": "USDT",
    "availableAmount": 2000,
    "pricePerUnit": 91,
    "priceType": "fixed",
    "minTradeLimit": 100,
    "maxTradeLimit": 2000,
    "paymentMethods": ["upi", "imps"],
    "timeLimit": 30,
    "terms": "Instant seller - USDT already in escrow",
    "instructions": "Fast transaction - crypto will be released immediately after payment confirmation",
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "totalDepositAmount": 2086,
    "originalAmount": 2000,
    "platformFeeUSDT": 80,
    "gasFeeUSDT": 6,
    "network": "ethereum"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "listing": {
      "_id": "LISTING_ID_HERE",
      "status": "pending",
      "isInstantSeller": true,
      "createdBy": "InstantSeller",
      "depositVerified": false,
      "availableAmount": 2000,
      "escrowTransactionHash": "0x1234567890abcdef..."
    },
    "deposit": {
      "_id": "DEPOSIT_ID_HERE",
      "status": "pending",
      "transactionHash": "0x1234567890abcdef...",
      "totalDepositAmount": 2086,
      "originalAmount": 2000
    }
  },
  "message": "Listing created successfully. Awaiting admin approval."
}
```

**Save the `listing._id` as `LISTING_ID`**

### Step 4: Get Own Deposit History
```bash
curl http://localhost:5000/api/v1/platform-a/listings/instant-seller/deposits \
  -H "Authorization: Bearer INSTANT_SELLER_TOKEN"
```

### Step 5: Get Own Listings (Should show pending listing)
```bash
curl http://localhost:5000/api/v1/platform-a/listings/my-listings \
  -H "Authorization: Bearer INSTANT_SELLER_TOKEN"
```

---

## FLOW 3: ADMIN APPROVAL

### Step 1: Login as Admin
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123456"
  }'
```

**Save the `accessToken` as `ADMIN_TOKEN`**

### Step 2: Get All Pending Deposits
```bash
curl http://localhost:5000/api/v1/platform-a/admin/listings/pending-deposits \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "deposits": [
      {
        "_id": "...",
        "status": "pending",
        "transactionHash": "0x1234567890abcdef...",
        "totalDepositAmount": 2086,
        "originalAmount": 2000,
        "sellerId": {
          "name": "Instant Seller",
          "email": "instant.seller@test.com"
        },
        "listingId": {
          "availableAmount": 2000,
          "pricePerUnit": 91
        },
        "createdAt": "..."
      }
    ],
    "total": 1
  }
}
```

### Step 3: Get Specific Deposit Details
```bash
curl http://localhost:5000/api/v1/platform-a/admin/listings/LISTING_ID/deposit \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Step 4A: Approve Deposit ✅
```bash
curl -X PATCH http://localhost:5000/api/v1/platform-a/admin/listings/LISTING_ID/approve-deposit \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true,
    "notes": "Transaction hash verified on Ethereum blockchain. Deposit confirmed."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "listing": {
      "_id": "...",
      "status": "active",
      "depositVerified": true,
      "verifiedAt": "..."
    },
    "deposit": {
      "status": "approved",
      "depositVerified": true
    },
    "user": {
      "isInstantSeller": true,
      "escrowDepositAmount": 2000,
      "instantSellerApprovedAt": "...",
      "badges": [
        {
          "type": "instant_seller",
          "earnedAt": "..."
        }
      ]
    }
  },
  "message": "Deposit approved successfully. Seller is now an Instant Seller!"
}
```

### Step 4B: Reject Deposit (Alternative) ❌
```bash
curl -X PATCH http://localhost:5000/api/v1/platform-a/admin/listings/LISTING_ID/approve-deposit \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": false,
    "rejectionReason": "Transaction hash not found on blockchain",
    "canResubmit": true
  }'
```

---

## FLOW 4: RESUBMIT REJECTED LISTING

### Step 1: Resubmit with New Transaction Hash
```bash
curl -X PATCH http://localhost:5000/api/v1/platform-a/listings/instant-seller/LISTING_ID/resubmit \
  -H "Authorization: Bearer INSTANT_SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newTransactionHash": "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    "comments": "Corrected transaction hash - please verify again"
  }'
```

---

## VERIFICATION TESTS

### Test 1: Search for Instant Seller Listings
```bash
curl "http://localhost:5000/api/v1/platform-a/listings?isInstantSeller=true&page=1&limit=10"
```

### Test 2: Get Specific Listing by ID
```bash
curl http://localhost:5000/api/v1/platform-a/listings/LISTING_ID
```

### Test 3: Check User Profile (Should show isInstantSeller = true)
```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer INSTANT_SELLER_TOKEN"
```

### Test 4: Get All Listings (Mixed)
```bash
curl "http://localhost:5000/api/v1/platform-a/listings?page=1&limit=20"
```

This should show both regular and instant seller listings.

---

## COMPARISON TABLE

| Feature | Regular Seller | Instant Seller |
|---------|---------------|----------------|
| **Listing Status** | Active immediately | Pending → Admin approval → Active |
| **Deposit Required** | No upfront deposit | Yes (2086 USDT for 2000 USDT listing) |
| **User.isInstantSeller** | false | true (after approval) |
| **User.escrowDepositAmount** | 0 | 2000 (original amount only) |
| **Listing.depositVerified** | N/A | true (after approval) |
| **Badge** | None | instant_seller badge |
| **Trade Speed** | Slow (wait for deposit) | Instant (pre-deposited) |

---

## ERROR SCENARIOS TO TEST

### 1. Duplicate Transaction Hash
```bash
# Try creating another listing with same transaction hash
curl -X POST http://localhost:5000/api/v1/platform-a/listings/instant-seller \
  -H "Authorization: Bearer INSTANT_SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "availableAmount": 1000,
    "pricePerUnit": 91,
    "minTradeLimit": 100,
    "maxTradeLimit": 1000,
    "paymentMethods": ["upi"],
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "totalDepositAmount": 1043,
    "originalAmount": 1000,
    "platformFeeUSDT": 40,
    "gasFeeUSDT": 3,
    "network": "ethereum"
  }'
```

**Expected:** Error "Transaction hash already used"

### 2. Approve Already Approved Listing
```bash
# Try approving the same listing again
curl -X PATCH http://localhost:5000/api/v1/platform-a/admin/listings/LISTING_ID/approve-deposit \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true,
    "notes": "Already approved"
  }'
```

**Expected:** Error "Listing is not pending approval"

### 3. Resubmit Active Listing
```bash
# Try resubmitting an active (approved) listing
curl -X PATCH http://localhost:5000/api/v1/platform-a/listings/instant-seller/ACTIVE_LISTING_ID/resubmit \
  -H "Authorization: Bearer INSTANT_SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newTransactionHash": "0xnew123",
    "comments": "Test"
  }'
```

**Expected:** Error "Only rejected listings can be resubmitted"

---

## NOTES

- Replace `REGULAR_SELLER_TOKEN`, `INSTANT_SELLER_TOKEN`, `ADMIN_TOKEN` with actual tokens
- Replace `LISTING_ID` with actual listing IDs from responses
- All timestamps are in ISO 8601 format
- Notifications are currently logged (check server logs)
- Gas fees are calculated in real-time from blockchain (with fallback)

---

## CLEANUP (After Testing)

Delete test listings:
```bash
curl -X DELETE http://localhost:5000/api/v1/platform-a/listings/LISTING_ID \
  -H "Authorization: Bearer SELLER_TOKEN"
```
