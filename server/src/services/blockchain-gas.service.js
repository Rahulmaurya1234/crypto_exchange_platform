// src/services/blockchain-gas.service.js
import axios from "axios";
import { logger } from "../utils/logger.js";

/**
 * Get current gas price from blockchain
 * Uses multiple sources for reliability
 */
export const getCurrentGasPrice = async (network = "ethereum") => {
    try {
        let gasPrice;

        switch (network) {
            case "ethereum":
                gasPrice = await getEthereumGasPrice();
                break;
            case "polygon":
                gasPrice = await getPolygonGasPrice();
                break;
            case "bsc":
                gasPrice = await getBSCGasPrice();
                break;
            case "tron":
                gasPrice = await getTronGasPrice();
                break;
            default:
                gasPrice = await getEthereumGasPrice();
        }

        return gasPrice;
    } catch (error) {
        logger.error("Error fetching gas price:", error);
        // Fallback to default
        return {
            slow: 30,
            standard: 50,
            fast: 70,
            unit: "gwei",
            fallback: true,
        };
    }
};

/**
 * Get Ethereum gas price from multiple sources
 */
const getEthereumGasPrice = async () => {
    try {
        // Method 1: Use Etherscan API
        if (process.env.ETHERSCAN_API_KEY) {
            try {
                const response = await axios.get(
                    `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY}`,
                    { timeout: 5000 }
                );

                if (response.data.status === "1") {
                    return {
                        slow: parseFloat(response.data.result.SafeGasPrice),
                        standard: parseFloat(response.data.result.ProposeGasPrice),
                        fast: parseFloat(response.data.result.FastGasPrice),
                        unit: "gwei",
                        source: "etherscan",
                    };
                }
            } catch (error) {
                logger.warn("Etherscan API failed, trying fallback:", error.message);
            }
        }

        // Method 2: Use EthGasStation
        try {
            const gasStationResponse = await axios.get(
                "https://ethgasstation.info/api/ethgasAPI.json",
                { timeout: 5000 }
            );

            return {
                slow: gasStationResponse.data.safeLow / 10,
                standard: gasStationResponse.data.average / 10,
                fast: gasStationResponse.data.fast / 10,
                unit: "gwei",
                source: "ethgasstation",
            };
        } catch (error) {
            logger.warn("EthGasStation failed, using default:", error.message);
        }

        // Fallback to reasonable defaults
        return {
            slow: 30,
            standard: 50,
            fast: 70,
            unit: "gwei",
            source: "default",
            fallback: true,
        };
    } catch (error) {
        logger.error("All Ethereum gas price methods failed:", error);
        throw error;
    }
};

/**
 * Get Polygon gas price
 */
const getPolygonGasPrice = async () => {
    try {
        const response = await axios.get(
            "https://gasstation-mainnet.matic.network/v2",
            { timeout: 5000 }
        );

        return {
            slow: response.data.safeLow.maxFee,
            standard: response.data.standard.maxFee,
            fast: response.data.fast.maxFee,
            unit: "gwei",
            source: "polygon-gasstation",
        };
    } catch (error) {
        logger.error("Error fetching Polygon gas price:", error);
        return {
            slow: 30,
            standard: 50,
            fast: 100,
            unit: "gwei",
            source: "default",
            fallback: true,
        };
    }
};

/**
 * Get BSC gas price
 */
const getBSCGasPrice = async () => {
    try {
        // BSC typically has lower gas fees
        return {
            slow: 3,
            standard: 5,
            fast: 7,
            unit: "gwei",
            source: "bsc-default",
        };
    } catch (error) {
        logger.error("Error fetching BSC gas price:", error);
        return {
            slow: 3,
            standard: 5,
            fast: 7,
            unit: "gwei",
            source: "default",
            fallback: true,
        };
    }
};

/**
 * Get Tron energy cost
 */
const getTronGasPrice = async () => {
    try {
        // Tron uses energy, not gas
        // Average TRC20 transfer costs ~14,000 energy
        const energyCost = 14000;
        const sunPerEnergy = 420; // Current rate
        const totalSun = energyCost * sunPerEnergy;
        const totalTRX = totalSun / 1000000; // Convert SUN to TRX

        return {
            slow: totalTRX * 0.8,
            standard: totalTRX,
            fast: totalTRX * 1.2,
            unit: "trx",
            source: "tron-estimate",
        };
    } catch (error) {
        logger.error("Error calculating Tron fee:", error);
        return {
            slow: 10,
            standard: 15,
            fast: 20,
            unit: "trx",
            source: "default",
            fallback: true,
        };
    }
};

/**
 * Get token price from CoinGecko
 */
export const getTokenPrice = async (network) => {
    try {
        const tokenIds = {
            ethereum: "ethereum",
            polygon: "matic-network",
            bsc: "binancecoin",
            tron: "tron",
        };

        const tokenId = tokenIds[network] || "ethereum";

        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`,
            { timeout: 5000 }
        );

        return response.data[tokenId]?.usd || getFallbackPrice(network);
    } catch (error) {
        logger.error("Error fetching token price:", error);
        return getFallbackPrice(network);
    }
};

/**
 * Get fallback price
 */
const getFallbackPrice = (network) => {
    const fallbackPrices = {
        ethereum: 2000,
        polygon: 0.8,
        bsc: 300,
        tron: 0.1,
    };
    return fallbackPrices[network] || 2000;
};

/**
 * Calculate gas fee in USDT with buffer
 * @param {string} network - Blockchain network
 * @param {number} cryptoPrice - Current price of network's native token (ETH, MATIC, BNB)
 * @param {number} bufferPercent - Additional buffer percentage (default: 20%)
 * @returns {object} Gas fee details
 */
export const calculateGasFeeWithBuffer = async (
    network = "ethereum",
    cryptoPrice = null,
    bufferPercent = 20
) => {
    try {
        // Get current gas prices
        const gasPrices = await getCurrentGasPrice(network);

        // Get network token price if not provided
        if (!cryptoPrice) {
            cryptoPrice = await getTokenPrice(network);
        }

        // Gas limit for USDT (ERC20) transfer
        const gasLimit = 65000;

        // Calculate gas cost in native token
        const gasCostInToken = (gasPrices.standard * gasLimit) / 1e9; // Convert gwei to ETH/BNB/MATIC

        // Convert to USD
        const gasCostUSD = gasCostInToken * cryptoPrice;

        // Add buffer
        const bufferAmount = (gasCostUSD * bufferPercent) / 100;
        const totalGasFeeUSDT = gasCostUSD + bufferAmount;

        return {
            network,
            gasPrice: {
                slow: gasPrices.slow,
                standard: gasPrices.standard,
                fast: gasPrices.fast,
                unit: gasPrices.unit,
                source: gasPrices.source,
                fallback: gasPrices.fallback || false,
            },
            gasLimit,
            baseGasFee: parseFloat(gasCostUSD.toFixed(6)),
            bufferPercentage: bufferPercent,
            bufferAmount: parseFloat(bufferAmount.toFixed(6)),
            totalGasFee: parseFloat(totalGasFeeUSDT.toFixed(6)),
            networkTokenPrice: cryptoPrice,
            calculatedAt: new Date(),
        };
    } catch (error) {
        logger.error("Error calculating gas fee with buffer:", error);

        // Fallback with safe defaults
        return {
            network,
            baseGasFee: 5,
            bufferPercentage: bufferPercent,
            bufferAmount: 1,
            totalGasFee: 6,
            calculatedAt: new Date(),
            fallback: true,
        };
    }
};

export default {
    getCurrentGasPrice,
    getTokenPrice,
    calculateGasFeeWithBuffer,
};
