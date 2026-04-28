// src/services/price-feed.service.js
import { getRedisClient } from "../config/redis.config.js";
import { logger } from "../utils/logger.js";

const PRICE_CACHE_KEY = "usdt_inr_price";
const PRICE_CACHE_TTL = 60; // 60 seconds

/**
 * Get current USDT/INR price with fallback chain
 * Chainlink → Binance → CoinGecko → Cache
 */
export const getUsdtInrPrice = async () => {
    try {
        // Try to get from cache first
        const cachedPrice = await getCachedPrice();
        if (cachedPrice) {
            return cachedPrice;
        }

        // Try Binance API
        let price = await getBinancePrice();
        if (price) {
            await cachePrice(price);
            return price;
        }

        // Fallback to CoinGecko
        price = await getCoinGeckoPrice();
        if (price) {
            await cachePrice(price);
            return price;
        }

        // If all fail, return cached price (even if expired)
        const stalePrice = await getCachedPrice(true);
        if (stalePrice) {
            logger.warn("Using stale cached price as fallback");
            return stalePrice;
        }

        // Last resort: return default price
        logger.error("All price sources failed, using default price");
        return 83.50; // Default fallback price
    } catch (error) {
        logger.error("Error fetching USDT/INR price:", error);
        return 83.50; // Default fallback
    }
};

/**
 * Get price from cache
 */
const getCachedPrice = async (allowStale = false) => {
    try {
        const redis = getRedisClient();
        const cached = await redis.get(PRICE_CACHE_KEY);

        if (cached) {
            const data = JSON.parse(cached);
            const age = Date.now() - data.timestamp;

            if (allowStale || age < PRICE_CACHE_TTL * 1000) {
                return data.price;
            }
        }
        return null;
    } catch (error) {
        logger.error("Redis cache error:", error);
        return null;
    }
};

/**
 * Cache price in Redis
 */
const cachePrice = async (price) => {
    try {
        const redis = getRedisClient();
        await redis.setEx(
            PRICE_CACHE_KEY,
            PRICE_CACHE_TTL,
            JSON.stringify({
                price,
                timestamp: Date.now(),
            })
        );
    } catch (error) {
        logger.error("Failed to cache price:", error);
    }
};

/**
 * Get price from Binance API
 */
const getBinancePrice = async () => {
    try {
        const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=USDTINR");
        if (!response.ok) return null;

        const data = await response.json();
        const price = parseFloat(data.price);

        if (price && price > 0) {
            logger.info(`Binance USDT/INR price: ${price}`);
            return price;
        }
        return null;
    } catch (error) {
        logger.error("Binance API error:", error);
        return null;
    }
};

/**
 * Get price from CoinGecko API
 */
const getCoinGeckoPrice = async () => {
    try {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=inr"
        );
        if (!response.ok) return null;

        const data = await response.json();
        const price = data?.tether?.inr;

        if (price && price > 0) {
            logger.info(`CoinGecko USDT/INR price: ${price}`);
            return price;
        }
        return null;
    } catch (error) {
        logger.error("CoinGecko API error:", error);
        return null;
    }
};

/**
 * Get price with specific source
 */
export const getPriceFromSource = async (source) => {
    switch (source) {
        case "binance":
            return await getBinancePrice();
        case "coingecko":
            return await getCoinGeckoPrice();
        default:
            return await getUsdtInrPrice();
    }
};

/**
 * Periodically update price cache (call from background job)
 */
export const updatePriceCache = async () => {
    try {
        const price = await getUsdtInrPrice();
        logger.info(`Price cache updated: ${price} INR/USDT`);
        return price;
    } catch (error) {
        logger.error("Failed to update price cache:", error);
    }
};

export default {
    getUsdtInrPrice,
    getPriceFromSource,
    updatePriceCache,
};
