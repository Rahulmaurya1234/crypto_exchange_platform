// src/api/v1/platform-b/analytics/controller.js
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../../utils/ApiResponse.js";
import User from "../../../../models/User.model.js";
import Trade from "../../../../models/Trade.model.js";
import Listing from "../../../../models/Listing.model.js";
import * as kycService from "../../../../services/kyc.service.js";
import * as escrowService from "../../../../services/escrow.service.js";
import { TRADE_STATUS, ACCOUNT_STATUS } from "../../../../constants/index.js";

/**
 * Get platform overview
 * @route GET /api/v1/platform-b/analytics/overview
 * @access Admin
 */
export const getPlatformOverview = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        activeUsers,
        totalTrades,
        completedTrades,
        totalListings,
        activeListings,
        kycStats,
        escrowStats,
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ accountStatus: ACCOUNT_STATUS.ACTIVE }),
        Trade.countDocuments(),
        Trade.countDocuments({ status: TRADE_STATUS.COMPLETED }),
        Listing.countDocuments(),
        Listing.countDocuments({ status: "active" }),
        kycService.getKYCStats(),
        escrowService.getEscrowStats(),
    ]);

    const overview = {
        users: {
            total: totalUsers,
            active: activeUsers,
        },
        trades: {
            total: totalTrades,
            completed: completedTrades,
            completionRate: totalTrades > 0 ? ((completedTrades / totalTrades) * 100).toFixed(2) : 0,
        },
        listings: {
            total: totalListings,
            active: activeListings,
        },
        kyc: kycStats,
        escrow: escrowStats,
    };

    res.json(new ApiResponse(200, { overview }, "Platform overview retrieved successfully"));
});

/**
 * Get user analytics
 * @route GET /api/v1/platform-b/analytics/users
 * @access Admin
 */
export const getUserAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const query = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [
        totalUsers,
        usersByRole,
        usersByKycStatus,
        usersByAccountStatus,
        newUsersCount,
    ] = await Promise.all([
        User.countDocuments(query),
        User.aggregate([
            { $match: query },
            { $group: { _id: "$role", count: { $sum: 1 } } },
        ]),
        User.aggregate([
            { $match: query },
            { $group: { _id: "$kycStatus", count: { $sum: 1 } } },
        ]),
        User.aggregate([
            { $match: query },
            { $group: { _id: "$accountStatus", count: { $sum: 1 } } },
        ]),
        User.countDocuments({
            createdAt: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
        }),
    ]);

    const analytics = {
        total: totalUsers,
        newUsersLast30Days: newUsersCount,
        byRole: {},
        byKycStatus: {},
        byAccountStatus: {},
    };

    usersByRole.forEach((item) => {
        analytics.byRole[item._id] = item.count;
    });

    usersByKycStatus.forEach((item) => {
        analytics.byKycStatus[item._id] = item.count;
    });

    usersByAccountStatus.forEach((item) => {
        analytics.byAccountStatus[item._id] = item.count;
    });

    res.json(new ApiResponse(200, { analytics }, "User analytics retrieved successfully"));
});

/**
 * Get trade analytics
 * @route GET /api/v1/platform-b/analytics/trades
 * @access Admin
 */
export const getTradeAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const query = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [
        totalTrades,
        tradesByStatus,
        volumeStats,
        recentTrades,
    ] = await Promise.all([
        Trade.countDocuments(query),
        Trade.aggregate([
            { $match: query },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Trade.aggregate([
            { $match: { ...query, status: TRADE_STATUS.COMPLETED } },
            {
                $group: {
                    _id: null,
                    totalVolume: { $sum: "$totalINRAmount" },
                    totalCrypto: { $sum: "$cryptoAmount" },
                    averageTradeSize: { $avg: "$totalINRAmount" },
                },
            },
        ]),
        Trade.countDocuments({
            createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
        }),
    ]);

    const analytics = {
        total: totalTrades,
        tradesLast7Days: recentTrades,
        byStatus: {},
        volume: volumeStats[0] || {
            totalVolume: 0,
            totalCrypto: 0,
            averageTradeSize: 0,
        },
    };

    tradesByStatus.forEach((item) => {
        analytics.byStatus[item._id] = item.count;
    });

    res.json(new ApiResponse(200, { analytics }, "Trade analytics retrieved successfully"));
});

/**
 * Get revenue analytics
 * @route GET /api/v1/platform-b/analytics/revenue
 * @access Admin
 */
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const query = {
        ...Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
        status: TRADE_STATUS.COMPLETED,
    };

    const revenueData = await Trade.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                totalFees: { $sum: "$feeBreakdown.totalFees" },
                totalPlatformFees: { $sum: "$feeBreakdown.platformFeeAmount" },
                totalTrades: { $sum: 1 },
                totalVolume: { $sum: "$totalINRAmount" },
            },
        },
    ]);

    const analytics = revenueData[0] || {
        totalFees: 0,
        totalPlatformFees: 0,
        totalTrades: 0,
        totalVolume: 0,
    };

    res.json(new ApiResponse(200, { analytics }, "Revenue analytics retrieved successfully"));
});

/**
 * Get listing analytics
 * @route GET /api/v1/platform-b/analytics/listings
 * @access Admin
 */
export const getListingAnalytics = asyncHandler(async (req, res) => {
    const [
        totalListings,
        listingsByStatus,
        activeSellers,
        instantSellers,
    ] = await Promise.all([
        Listing.countDocuments(),
        Listing.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Listing.distinct("sellerId", { status: "active" }).then(sellers => sellers.length),
        User.countDocuments({ isInstantSeller: true }),
    ]);

    const analytics = {
        total: totalListings,
        activeSellers,
        instantSellers,
        byStatus: {},
    };

    listingsByStatus.forEach((item) => {
        analytics.byStatus[item._id] = item.count;
    });

    res.json(new ApiResponse(200, { analytics }, "Listing analytics retrieved successfully"));
});

export const getDashboardStats = asyncHandler(async (req, res) => {
    const { range = "7days" } = req.query;

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // Determine date range
    if (range === "7days") {
        startDate.setDate(startDate.getDate() - 6);
    } else if (range === "30days") {
        startDate.setDate(startDate.getDate() - 29);
    } else if (range === "thisMonth") {
        startDate.setDate(1); // Start of current month
    } else if (range === "allTime") {
        startDate = new Date(0); // Beginning of time
    } else {
        startDate.setDate(startDate.getDate() - 6); // Default 7 days
    }

    const dateFilter = { createdAt: { $gte: startDate } };

    // 1. Time-Series: Revenue & Volume
    const revenueAndVolumeSeries = await Trade.aggregate([
        { 
            $match: { 
                ...dateFilter,
                status: TRADE_STATUS.COMPLETED
            } 
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                revenue: { $sum: "$feeBreakdown.platformFeeAmount" },
                volume: { $sum: "$totalINRAmount" },
                tradesCount: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // 2. Time-Series: New Users
    const newUsersSeries = await User.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                users: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Format series data (fill missing dates with 0 for smooth charts)
    const formatTimeSeries = (data, key1, key2 = null, key3 = null) => {
        const formatted = [];
        const resultDict = data.reduce((acc, item) => {
            acc[item._id] = item;
            return acc;
        }, {});

        // Helper to format date like '12-Mar'
        const getFormattedDate = (dateOb) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${dateOb.getDate()}-${months[dateOb.getMonth()]}`;
        };

        if (range === "allTime") return data; // Skip padding for allTime to save bandwidth initially

        let currentDate = new Date(startDate);
        const now = new Date();
        
        while (currentDate <= now) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const displayDate = getFormattedDate(currentDate);
            
            const existing = resultDict[dateStr];
            
            let entry = { date: displayDate, _rawDate: dateStr };
            entry[key1] = existing ? existing[key1] : 0;
            
            if (key2) entry[key2] = existing ? existing[key2] : 0;
            if (key3) entry[key3] = existing ? existing[key3] : 0;

            formatted.push(entry);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return formatted;
    };

    const volumeRevenueData = formatTimeSeries(revenueAndVolumeSeries, 'revenue', 'volume', 'tradesCount');
    const usersData = formatTimeSeries(newUsersSeries, 'users');

    // 3. KYC Distribution (Pie Chart)
    const kycDistribution = await User.aggregate([
        {
            $group: {
                _id: "$kycStatus",
                value: { $sum: 1 }
            }
        },
        {
            $project: {
                name: "$_id",
                value: 1,
                _id: 0
            }
        }
    ]);

    // Summary Stats
    const summaryStats = {
        totalRevenue: revenueAndVolumeSeries.reduce((sum, item) => sum + item.revenue, 0),
        totalVolume: revenueAndVolumeSeries.reduce((sum, item) => sum + item.volume, 0),
        newUsers: newUsersSeries.reduce((sum, item) => sum + item.users, 0)
    };

    res.json(new ApiResponse(200, { 
        series: {
            volumeAndRevenue: volumeRevenueData,
            users: usersData,
            kyc: kycDistribution
        },
        summary: summaryStats
    }, "Dashboard dashboard-stats retrieved successfully"));
});

export default {
    getPlatformOverview,
    getUserAnalytics,
    getTradeAnalytics,
    getRevenueAnalytics,
    getListingAnalytics,
    getDashboardStats
};
