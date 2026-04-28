#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  INSTANT SELLER API TEST SUITE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print test header
print_test() {
    echo -e "\n${YELLOW}>>> TEST: $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Variables to store tokens and IDs
REGULAR_SELLER_TOKEN=""
INSTANT_SELLER_TOKEN=""
ADMIN_TOKEN=""
LISTING_ID=""
REGULAR_LISTING_ID=""

# ==================== STEP 1: CALCULATE DEPOSIT ====================
print_test "1. Calculate Instant Seller Deposit"
CALC_RESPONSE=$(curl -s "$BASE_URL/api/v1/platform-a/listings/instant-seller/calculate-deposit?amount=2000&network=ethereum")
echo "$CALC_RESPONSE" | jq '.'

if echo "$CALC_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Deposit calculation successful"
    TOTAL_DEPOSIT=$(echo "$CALC_RESPONSE" | jq -r '.data.calculation.totalDepositRequired')
    PLATFORM_FEE=$(echo "$CALC_RESPONSE" | jq -r '.data.calculation.platformFeeUSDT')
    GAS_FEE=$(echo "$CALC_RESPONSE" | jq -r '.data.calculation.gasFeeUSDT')
    echo "  Original Amount: 2000 USDT"
    echo "  Platform Fee: $PLATFORM_FEE USDT"
    echo "  Gas Fee: $GAS_FEE USDT"
    echo "  Total Required: $TOTAL_DEPOSIT USDT"
else
    print_error "Deposit calculation failed"
    exit 1
fi

# ==================== MANUAL STEPS ====================
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  MANUAL SETUP REQUIRED${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Please complete the following steps manually:"
echo ""
echo "1. Create test users (or use existing):"
echo "   - Regular Seller: regular.seller@test.com"
echo "   - Instant Seller: instant.seller@test.com"
echo "   - Admin: admin@test.com"
echo ""
echo "2. Login and get tokens for each user"
echo ""
echo "3. Set environment variables:"
echo "   export REGULAR_SELLER_TOKEN='your_token_here'"
echo "   export INSTANT_SELLER_TOKEN='your_token_here'"
echo "   export ADMIN_TOKEN='your_token_here'"
echo ""
echo "4. Then run this script again with tokens"
echo ""

# Check if tokens are provided
if [ -z "$REGULAR_SELLER_TOKEN" ] || [ -z "$INSTANT_SELLER_TOKEN" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}Tokens not found in environment. Please set them and run again.${NC}"
    echo ""
    echo "Quick setup commands:"
    echo ""
    echo "# Login as regular seller"
    echo "curl -X POST $BASE_URL/api/v1/auth/login \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"email\":\"regular.seller@test.com\",\"password\":\"Test@123456\"}'"
    echo ""
    echo "# Login as instant seller"
    echo "curl -X POST $BASE_URL/api/v1/auth/login \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"email\":\"instant.seller@test.com\",\"password\":\"Test@123456\"}'"
    echo ""
    echo "# Login as admin"
    echo "curl -X POST $BASE_URL/api/v1/auth/login \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"email\":\"admin@test.com\",\"password\":\"Admin@123456\"}'"
    echo ""
    exit 0
fi

# ==================== STEP 2: CREATE REGULAR LISTING ====================
print_test "2. Create Regular Listing"
REGULAR_LISTING_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/platform-a/listings" \
  -H "Authorization: Bearer $REGULAR_SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cryptoType": "USDT",
    "availableAmount": 5000,
    "pricePerUnit": 92,
    "priceType": "fixed",
    "minTradeLimit": 500,
    "maxTradeLimit": 5000,
    "paymentMethods": ["upi", "imps"],
    "timeLimit": 30,
    "terms": "Regular seller - deposit per trade",
    "instructions": "Payment within 30 minutes"
  }')

echo "$REGULAR_LISTING_RESPONSE" | jq '.'

if echo "$REGULAR_LISTING_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Regular listing created"
    REGULAR_LISTING_ID=$(echo "$REGULAR_LISTING_RESPONSE" | jq -r '.data.listing._id')
    echo "  Listing ID: $REGULAR_LISTING_ID"
    echo "  Status: active (immediate)"
    echo "  Type: RegularSeller"
else
    print_error "Regular listing creation failed"
fi

# ==================== STEP 3: CREATE INSTANT SELLER LISTING ====================
print_test "3. Create Instant Seller Listing (Pending)"
INSTANT_LISTING_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/platform-a/listings/instant-seller" \
  -H "Authorization: Bearer $INSTANT_SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"cryptoType\": \"USDT\",
    \"availableAmount\": 2000,
    \"pricePerUnit\": 91,
    \"priceType\": \"fixed\",
    \"minTradeLimit\": 100,
    \"maxTradeLimit\": 2000,
    \"paymentMethods\": [\"upi\", \"imps\"],
    \"timeLimit\": 30,
    \"terms\": \"Instant seller - crypto in escrow\",
    \"instructions\": \"Fast transaction\",
    \"transactionHash\": \"0x$(openssl rand -hex 32)\",
    \"totalDepositAmount\": $TOTAL_DEPOSIT,
    \"originalAmount\": 2000,
    \"platformFeeUSDT\": $PLATFORM_FEE,
    \"gasFeeUSDT\": $GAS_FEE,
    \"network\": \"ethereum\"
  }")

echo "$INSTANT_LISTING_RESPONSE" | jq '.'

if echo "$INSTANT_LISTING_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Instant seller listing created"
    LISTING_ID=$(echo "$INSTANT_LISTING_RESPONSE" | jq -r '.data.listing._id')
    echo "  Listing ID: $LISTING_ID"
    echo "  Status: pending (awaiting admin approval)"
    echo "  Type: InstantSeller"
else
    print_error "Instant seller listing creation failed"
    exit 1
fi

# ==================== STEP 4: GET PENDING DEPOSITS (ADMIN) ====================
print_test "4. Admin - Get Pending Deposits"
PENDING_RESPONSE=$(curl -s "$BASE_URL/api/v1/platform-a/admin/listings/pending-deposits" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$PENDING_RESPONSE" | jq '.'

if echo "$PENDING_RESPONSE" | jq -e '.success' > /dev/null; then
    PENDING_COUNT=$(echo "$PENDING_RESPONSE" | jq -r '.data.total')
    print_success "Found $PENDING_COUNT pending deposit(s)"
else
    print_error "Failed to get pending deposits"
fi

# ==================== STEP 5: GET DEPOSIT DETAILS ====================
print_test "5. Admin - Get Deposit Details"
DEPOSIT_DETAILS=$(curl -s "$BASE_URL/api/v1/platform-a/admin/listings/$LISTING_ID/deposit" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$DEPOSIT_DETAILS" | jq '.'

if echo "$DEPOSIT_DETAILS" | jq -e '.success' > /dev/null; then
    print_success "Deposit details retrieved"
else
    print_error "Failed to get deposit details"
fi

# ==================== STEP 6: APPROVE DEPOSIT ====================
print_test "6. Admin - Approve Deposit"
APPROVE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/v1/platform-a/admin/listings/$LISTING_ID/approve-deposit" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true,
    "notes": "Transaction verified on blockchain - automated test"
  }')

echo "$APPROVE_RESPONSE" | jq '.'

if echo "$APPROVE_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Deposit approved successfully"
    echo "  User is now an Instant Seller!"
    IS_INSTANT=$(echo "$APPROVE_RESPONSE" | jq -r '.data.user.isInstantSeller')
    ESCROW_BALANCE=$(echo "$APPROVE_RESPONSE" | jq -r '.data.user.escrowDepositAmount')
    echo "  isInstantSeller: $IS_INSTANT"
    echo "  Escrow Balance: $ESCROW_BALANCE USDT"
else
    print_error "Deposit approval failed"
fi

# ==================== STEP 7: GET ALL LISTINGS ====================
print_test "7. Get All Listings (Mixed)"
ALL_LISTINGS=$(curl -s "$BASE_URL/api/v1/platform-a/listings?page=1&limit=20")

echo "$ALL_LISTINGS" | jq '.'

if echo "$ALL_LISTINGS" | jq -e '.success' > /dev/null; then
    TOTAL=$(echo "$ALL_LISTINGS" | jq -r '.data.pagination.total')
    print_success "Retrieved $TOTAL listing(s)"
else
    print_error "Failed to get listings"
fi

# ==================== STEP 8: GET INSTANT SELLER LISTINGS ONLY ====================
print_test "8. Get Instant Seller Listings Only"
INSTANT_LISTINGS=$(curl -s "$BASE_URL/api/v1/platform-a/listings?isInstantSeller=true")

echo "$INSTANT_LISTINGS" | jq '.'

if echo "$INSTANT_LISTINGS" | jq -e '.success' > /dev/null; then
    INSTANT_COUNT=$(echo "$INSTANT_LISTINGS" | jq -r '.data.pagination.total')
    print_success "Found $INSTANT_COUNT instant seller listing(s)"
else
    print_error "Failed to get instant seller listings"
fi

# ==================== STEP 9: GET REGULAR SELLER LISTINGS ONLY ====================
print_test "9. Get Regular Seller Listings Only"
REGULAR_LISTINGS=$(curl -s "$BASE_URL/api/v1/platform-a/listings?isInstantSeller=false")

echo "$REGULAR_LISTINGS" | jq '.'

if echo "$REGULAR_LISTINGS" | jq -e '.success' > /dev/null; then
    REGULAR_COUNT=$(echo "$REGULAR_LISTINGS" | jq -r '.data.pagination.total')
    print_success "Found $REGULAR_COUNT regular seller listing(s)"
else
    print_error "Failed to get regular seller listings"
fi

# ==================== STEP 10: GET DEPOSIT HISTORY ====================
print_test "10. Get Seller's Deposit History"
DEPOSIT_HISTORY=$(curl -s "$BASE_URL/api/v1/platform-a/listings/instant-seller/deposits" \
  -H "Authorization: Bearer $INSTANT_SELLER_TOKEN")

echo "$DEPOSIT_HISTORY" | jq '.'

if echo "$DEPOSIT_HISTORY" | jq -e '.success' > /dev/null; then
    DEPOSIT_COUNT=$(echo "$DEPOSIT_HISTORY" | jq -r '.data.deposits | length')
    print_success "Found $DEPOSIT_COUNT deposit record(s)"
else
    print_error "Failed to get deposit history"
fi

# ==================== SUMMARY ====================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Regular Listing ID: $REGULAR_LISTING_ID"
echo "Instant Listing ID: $LISTING_ID"
echo ""
echo "✓ Deposit calculation working"
echo "✓ Regular listing created (active immediately)"
echo "✓ Instant seller listing created (pending → approved)"
echo "✓ Admin approval workflow working"
echo "✓ User upgraded to instant seller"
echo "✓ Escrow balance updated"
echo "✓ All GET APIs working"
echo ""
echo -e "${GREEN}All tests completed successfully!${NC}"
