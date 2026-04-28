// src/services/fee-calculator.service.js
import { calculateGasFeeWithBuffer } from "./blockchain-gas.service.js";
import { logger } from "../utils/logger.js";

/**
 * Fee Calculator Service
 * Calculates platform fees, gas estimates, and volatility buffers
 */

/**
 * Calculate total fees for a trade (INR-based calculation)
 * @param {number} cryptoAmount - Amount of USDT buyer wants to receive
 * @param {number} sellerPricePerUnit - Seller's net price per USDT in INR
 * @returns {object} Fee breakdown
 */
export const calculateTradeFees = async (cryptoAmount, sellerPricePerUnit) => {
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT) || 5.0; // 5%
    const gasFeePercent = parseFloat(process.env.GAS_FEE_PERCENT) || 1.0; // 1%
    const cryptoPlatformFeePercent = parseFloat(process.env.ESCROW_PLATFORM_FEE_PERCENT) || 4.0; // 4% in USDT

    // A. INR CALCULATION (What buyer pays)
    // Seller's net amount (what seller receives in INR)
    const sellerNetINR = cryptoAmount * sellerPricePerUnit;

    // Platform fee in INR (5% of seller's net)
    const platformFeeINR = (sellerNetINR * platformFeePercent) / 100;

    // Gas fee in INR (1% of seller's net)
    const gasFeeINR = (sellerNetINR * gasFeePercent) / 100;

    // Total INR buyer must pay
    const totalINRBuyerPays = sellerNetINR + platformFeeINR + gasFeeINR;

    // Effective price per USDT for buyer
    const effectivePricePerUnit = totalINRBuyerPays / cryptoAmount;

    // B. CRYPTO CALCULATION (What seller deposits to escrow)
    // Platform fee in USDT (4% of crypto amount)
    const platformFeeUSDT = (cryptoAmount * cryptoPlatformFeePercent * gasFeePercent) / 100;

    // Total USDT seller must deposit to escrow
    const sellerMustDepositUSDT = cryptoAmount + platformFeeUSDT;

    return {
        // INR breakdown (buyer side)
        sellerNetINR,
        platformFeeINR,
        gasFeeINR,
        totalINRBuyerPays,
        effectivePricePerUnit,

        // Crypto breakdown (seller side)
        cryptoAmount, // What buyer receives
        platformFeeUSDT,
        sellerMustDepositUSDT, // What seller deposits to escrow

        // Legacy compatibility
        sellerMustSend: sellerMustDepositUSDT,
        totalINRAmount: totalINRBuyerPays,

        feeBreakdown: {
            platformFeePercent,
            platformFeeINR,
            platformFeeUSDT,
            gasFeePercent,
            gasFeeINR,
            cryptoPlatformFeePercent,
        },
    };
};

/**
 * Estimate blockchain gas fee for releasing USDT
 * @returns {number} Estimated gas fee in USDT
 */
export const estimateGasFee = async () => {
    // Simplified estimation
    // In production, query blockchain for current gas price
    // and calculate actual transaction cost

    const averageGasPriceGwei = 30; // Example: 30 gwei
    const gasLimit = 65000; // ERC20 transfer gas limit
    const ethPrice = 2000; // Example: $2000 per ETH
    const usdtPrice = 1; // $1 per USDT

    // Calculate gas cost in ETH
    const gasCostEth = (averageGasPriceGwei * gasLimit) / 1e9;

    // Convert to USD
    const gasCostUsd = gasCostEth * ethPrice;

    // Convert to USDT
    const gasCostUsdt = gasCostUsd / usdtPrice;

    return Math.ceil(gasCostUsdt * 100) / 100; // Round up to 2 decimals
};

/**
 * Calculate instant seller deposit requirement
 * @param {number} monthlyVolume - Expected monthly volume in USDT
 * @returns {number} Required deposit amount
 */
export const calculateInstantSellerDeposit = (monthlyVolume) => {
    const minDeposit = parseFloat(process.env.INSTANT_SELLER_MIN_DEPOSIT_USDT) || 500;
    const maxDeposit = parseFloat(process.env.INSTANT_SELLER_MAX_DEPOSIT_USDT) || 5000;

    // Calculate 20% of monthly volume
    let requiredDeposit = monthlyVolume * 0.20;

    // Clamp between min and max
    requiredDeposit = Math.max(minDeposit, Math.min(requiredDeposit, maxDeposit));

    return Math.ceil(requiredDeposit);
};

/**
 * Calculate platform revenue from a trade
 * @param {object} feeBreakdown - Fee breakdown from calculateTradeFees
 * @returns {number} Platform revenue in USDT
 */
export const calculatePlatformRevenue = (feeBreakdown) => {
    // Platform keeps the fee, gas buffer, and volatility buffer
    // Gas estimate is used for actual gas payment
    return feeBreakdown.platformFeeAmount + feeBreakdown.gasBuffer + feeBreakdown.volatilityBuffer;
};

/**
 * Calculate total fees for instant seller deposit
 * @param {number} cryptoAmount - Amount of USDT to list
 * @param {string} network - Blockchain network
 * @returns {object} Complete fee breakdown
 */
export const calculateInstantSellerDepositFees = async (cryptoAmount, network = "ethereum") => {
    try {
        const platformFeePercent = parseFloat(process.env.INSTANT_SELLER_PLATFORM_FEE_PERCENT) || 4.0; // 4% for instant seller
        const gasBufferPercent = parseFloat(process.env.GAS_BUFFER_PERCENT) || 20; // 20% buffer

        // Platform fee in USDT
        const platformFeeUSDT = (cryptoAmount * platformFeePercent) / 100;

        // Get real-time gas fee with buffer
        const gasFeeData = await calculateGasFeeWithBuffer(network, null, gasBufferPercent);

        // Total deposit required
        const totalDepositRequired = cryptoAmount + platformFeeUSDT + gasFeeData.totalGasFee;
        const escrowWalletAddress = process.env.ESCROW_WALLET_ADDRESS || "N/A";

        return {
            // Original amount
            originalAmount: cryptoAmount,

            // Platform fee
            platformFeePercent,
            platformFeeUSDT: parseFloat(platformFeeUSDT.toFixed(6)),

            // Gas fee (with buffer)
            gasFeeUSDT: gasFeeData.totalGasFee,
            gasFeeCalculation: gasFeeData,

            // Total
            totalDepositRequired: parseFloat(totalDepositRequired.toFixed(6)),

            // What user sees in balance after approval
            displayAmount: cryptoAmount,
            escrowWalletAddress,

            // Breakdown
            feeBreakdown: {
                platformFee: parseFloat(platformFeeUSDT.toFixed(6)),
                gasFee: gasFeeData.totalGasFee,
                totalFees: parseFloat((platformFeeUSDT + gasFeeData.totalGasFee).toFixed(6)),
            },
        };
    } catch (error) {
        logger.error("Error calculating instant seller deposit fees:", error);

        // Fallback calculation
        const platformFeeUSDT = (cryptoAmount * 4) / 100;
        const gasFeeUSDT = 6; // Fallback gas fee

        return {
            originalAmount: cryptoAmount,
            platformFeePercent: 4,
            platformFeeUSDT: parseFloat(platformFeeUSDT.toFixed(6)),
            gasFeeUSDT,
            totalDepositRequired: parseFloat((cryptoAmount + platformFeeUSDT + gasFeeUSDT).toFixed(6)),
            displayAmount: cryptoAmount,
            feeBreakdown: {
                platformFee: parseFloat(platformFeeUSDT.toFixed(6)),
                gasFee: gasFeeUSDT,
                totalFees: parseFloat((platformFeeUSDT + gasFeeUSDT).toFixed(6)),
            },
            fallback: true,
        };
    }
};

export const getPlatformWallet = async (currency = "usdt", network = "ethereum") => {
    try {
        // Map networks to env variables or use fallback
        const networkKey = network.toUpperCase().replace(/\s+/g, "_");
        const envKey = `ESCROW_WALLET_ADDRESS_${networkKey}`;
        
        let depositAddress = process.env[envKey] || process.env.ESCROW_WALLET_ADDRESS;

        if (!depositAddress) {
            // Fallback for demo/common networks if not in env
            const fallbacks = {
                "ethereum": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                "bsc": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                "tron": "TR7NHqjuSXPAbST9DB3BDnvvXuxfHCY4Dz",
            };
            depositAddress = fallbacks[network.toLowerCase()] || fallbacks["ethereum"];
        }

        return depositAddress;
    } catch (error) {
        logger.error("Error getting platform wallet deposit address:", error);
        throw error;
    }
};

export default {
    calculateTradeFees,
    estimateGasFee,
    calculateInstantSellerDeposit,
    calculateInstantSellerDepositFees,
    calculatePlatformRevenue,
    getPlatformWallet
};
