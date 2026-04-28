# 📊 P2P Trading Calculation Examples

## **Example from PPT: 10,000 USDT Trade**

### **Seller Configuration**
- **Seller's Net Price:** ₹90.00 per USDT (what seller wants to receive)
- **Crypto Amount:** 10,000 USDT

---

## **REGULAR SELLER CALCULATION**

### **A. INR Side (What Buyer Pays)**

```
Seller's Net Amount    = 10,000 USDT × ₹90.00        = ₹900,000
Platform Fee (5%)      = ₹900,000 × 5%                = ₹45,000
Gas Fee (1%)           = ₹900,000 × 1%                = ₹9,000
─────────────────────────────────────────────────────────────
Total Buyer Pays       = ₹900,000 + ₹45,000 + ₹9,000 = ₹954,000

Effective Price/USDT   = ₹954,000 ÷ 10,000           = ₹95.40
```

### **B. Crypto Side (What Seller Deposits to Escrow)**

```
Buyer Will Receive     = 10,000 USDT
Platform Fee (4%)      = 10,000 × 4%                  = 400 USDT
─────────────────────────────────────────────────────────────
Seller Must Deposit    = 10,000 + 400                 = 10,400 USDT
```

### **Summary:**
- ✅ **Buyer pays:** ₹954,000 INR → Gets 10,000 USDT
- ✅ **Seller deposits:** 10,400 USDT → Receives ₹900,000 INR
- ✅ **Platform earns:** ₹45,000 + ₹9,000 = ₹54,000 INR + 400 USDT

---

## **API Response Example (Regular Seller)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order amount calculated successfully",
  "data": {
    "calculation": {
      "cryptoAmount": 10000,
      "sellerPricePerUnit": 90.0,
      "effectivePricePerUnit": 95.4,
      "liveUsdtPrice": 89.94,

      "sellerNetINR": 900000,
      "platformFeeINR": 45000,
      "gasFeeINR": 9000,
      "totalINRBuyerPays": 954000,

      "platformFeeUSDT": 400,
      "sellerMustDepositUSDT": 10400,
      "buyerWillReceive": 10000,

      "feeBreakdown": {
        "platformFeePercent": 5,
        "platformFeeINR": 45000,
        "platformFeeUSDT": 400,
        "gasFeePercent": 1,
        "gasFeeINR": 9000,
        "cryptoPlatformFeePercent": 4
      },

      "sellerDetails": {
        "name": "John Doe",
        "bankDetails": {
          "bankName": "HDFC Bank",
          "accountNumber": "1234567890",
          "ifscCode": "HDFC0001234",
          "upiId": "john@paytm"
        },
        "paymentMethods": ["upi", "imps", "bank_transfer"],
        "isInstantSeller": false
      },

      "escrowWallet": "0xABCDEF123456...",

      "calculationNote": "Regular Seller: Seller must deposit 10400 USDT to escrow. You pay ₹954000 for 10000 USDT."
    }
  },
  "timestamp": "2025-12-05T10:00:00.000Z"
}
```

---

## **INSTANT SELLER CALCULATION**

For instant sellers, the crypto amount is **FIXED** (already deposited).

### **Scenario:** Instant Seller has 5,000 USDT deposited

```
Crypto Already Deposited = 5,000 USDT
Seller's Net Price       = ₹92.00 per USDT
```

### **Calculation:**

```
Seller's Net Amount    = 5,000 USDT × ₹92.00        = ₹460,000
Platform Fee (5%)      = ₹460,000 × 5%              = ₹23,000
Gas Fee (1%)           = ₹460,000 × 1%              = ₹4,600
─────────────────────────────────────────────────────────────
Total Buyer Pays       = ₹460,000 + ₹23,000 + ₹4,600 = ₹487,600

Effective Price/USDT   = ₹487,600 ÷ 5,000           = ₹97.52
```

### **Summary:**
- ✅ **Buyer pays:** ₹487,600 INR → Gets 5,000 USDT **instantly**
- ✅ **Seller receives:** ₹460,000 INR (from their pre-deposited 5,000 USDT)
- ✅ **No deposit wait time** (crypto already in escrow)

---

## **API Response Example (Instant Seller)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order amount calculated successfully",
  "data": {
    "calculation": {
      "cryptoAmount": 5000,
      "sellerPricePerUnit": 92.0,
      "effectivePricePerUnit": 97.52,
      "liveUsdtPrice": 89.94,

      "sellerNetINR": 460000,
      "platformFeeINR": 23000,
      "gasFeeINR": 4600,
      "totalINRBuyerPays": 487600,

      "platformFeeUSDT": 200,
      "sellerMustDepositUSDT": 5200,
      "buyerWillReceive": 5000,

      "feeBreakdown": {
        "platformFeePercent": 5,
        "platformFeeINR": 23000,
        "platformFeeUSDT": 200,
        "gasFeePercent": 1,
        "gasFeeINR": 4600,
        "cryptoPlatformFeePercent": 4
      },

      "sellerDetails": {
        "name": "Instant Seller Inc",
        "bankDetails": {
          "bankName": "ICICI Bank",
          "accountNumber": "9876543210",
          "ifscCode": "ICIC0001234",
          "upiId": "instantseller@paytm"
        },
        "paymentMethods": ["upi"],
        "isInstantSeller": true
      },

      "escrowWallet": "0xABCDEF123456...",

      "calculationNote": "Instant Seller: Crypto already deposited. You pay ₹487600 for 5000 USDT."
    }
  },
  "timestamp": "2025-12-05T10:00:00.000Z"
}
```

---

## **Small Trade Example: 1,000 USDT**

### **Seller's Net Price:** ₹95.00 per USDT

```
Seller's Net Amount    = 1,000 USDT × ₹95.00       = ₹95,000
Platform Fee (5%)      = ₹95,000 × 5%              = ₹4,750
Gas Fee (1%)           = ₹95,000 × 1%              = ₹950
─────────────────────────────────────────────────────────────
Total Buyer Pays       = ₹95,000 + ₹4,750 + ₹950  = ₹100,700

Effective Price/USDT   = ₹100,700 ÷ 1,000         = ₹100.70
```

**Crypto Deposit (Seller):**
```
Platform Fee (4%)      = 1,000 × 4%                = 40 USDT
Seller Must Deposit    = 1,000 + 40                = 1,040 USDT
```

---

## **Environment Variables Required**

Add these to your `.env` file:

```env
# INR Fee Percentages (buyer pays)
PLATFORM_FEE_PERCENT=5.0        # 5% platform fee on seller's net INR
GAS_FEE_PERCENT=1.0             # 1% gas fee on seller's net INR

# Crypto Fee Percentage (seller deposits)
ESCROW_PLATFORM_FEE_PERCENT=4.0 # 4% platform fee in USDT

# Escrow Wallet
ESCROW_WALLET_ADDRESS=0x1234567890abcdef...
```

---

## **Key Differences:**

| Feature | Regular Seller | Instant Seller |
|---------|---------------|----------------|
| **Crypto Deposit** | Seller deposits **after** order created | Already deposited **before** listing |
| **Wait Time** | 15 min for seller deposit + verification | **No wait** - instant release |
| **Calculation** | Buyer specifies USDT amount | Works with **fixed** available USDT |
| **Risk** | Lower (deposit on demand) | Higher (pre-funded) |
| **Speed** | Slower (deposit wait) | **Instant** ⚡ |

---

## **Testing Checklist:**

### ✅ Regular Seller (10,000 USDT @ ₹90/USDT)
- [ ] Seller net: ₹900,000
- [ ] Platform fee INR: ₹45,000 (5%)
- [ ] Gas fee INR: ₹9,000 (1%)
- [ ] **Total buyer pays: ₹954,000** ✅
- [ ] Effective price: ₹95.40/USDT
- [ ] Seller deposits: 10,400 USDT (10,000 + 400)

### ✅ Instant Seller (5,000 USDT @ ₹92/USDT)
- [ ] Seller net: ₹460,000
- [ ] Platform fee INR: ₹23,000 (5%)
- [ ] Gas fee INR: ₹4,600 (1%)
- [ ] **Total buyer pays: ₹487,600** ✅
- [ ] Effective price: ₹97.52/USDT
- [ ] Crypto already deposited ✅

### ✅ Small Trade (1,000 USDT @ ₹95/USDT)
- [ ] Seller net: ₹95,000
- [ ] Platform fee INR: ₹4,750 (5%)
- [ ] Gas fee INR: ₹950 (1%)
- [ ] **Total buyer pays: ₹100,700** ✅
- [ ] Seller deposits: 1,040 USDT

---

**Created:** 2025-12-05
**Purpose:** Calculation examples for P2P trading platform
**Status:** ✅ Fixed and Ready for Testing
