import Ad from "../models/Ad.model.js";
import { USER_ROLES } from "../models/User.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// -------------------------
// Admin: Get All Ads
// -------------------------
export const getAllAds = asyncHandler(async (req, res) => {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
        query.status = status;
    }

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { tokenName: { $regex: search, $options: "i" } },
        ];
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: { path: "user", select: "name email" },
    };

    const skip = (options.page - 1) * options.limit;

    const ads = await Ad.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit);

    const total = await Ad.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            ads,
            pagination: {
                total,
                page: options.page,
                limit: options.limit,
                pages: Math.ceil(total / options.limit),
            },
        }, "Ads fetched successfully")
    );
});

// -------------------------
// Admin: Update Ad Status
// -------------------------
export const updateAdStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["active", "paused", "removed"].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const ad = await Ad.findById(id);

    if (!ad) {
        throw new ApiError(404, "Ad not found");
    }

    ad.status = status;
    await ad.save();

    // Log action
    const { createLog } = await import("./log.controller.js");
    await createLog({
        adminId: req.user._id,
        targetType: "ad",
        targetId: ad._id,
        action: `Updated Ad Status to ${status}`,
        reason: reason || "Admin action",
    });

    const response = new ApiResponse(200, { ad }, `Ad status updated to ${status}`);
    return res.status(200).json(response);
});

// -------------------------
// User: Create Ad (KYC protected)
// -------------------------
export const createAd = asyncHandler(async (req, res) => {
    // Support both camelCase and snake_case from the body
    const {
        title,
        tokenName: tokenNameCamel,
        token_name: tokenNameSnake,
        direction,
        pricePerUnit: pricePerUnitCamel,
        price_per_unit: pricePerUnitSnake,
        minQuantity: minQuantityCamel,
        min_qty: minQtySnake,
        maxQuantity: maxQuantityCamel,
        max_qty: maxQtySnake,
        quantityAvailable: quantityAvailableCamel,
        quantity_available: quantityAvailableSnake,
        locationCity: locationCityCamel,
        location_city: locationCitySnake,
        locationState: locationStateCamel,
        location_state: locationStateSnake,
        paymentTerms: paymentTermsCamel,
        payment_terms: paymentTermsSnake,
        imageUrl: imageUrlBody,
    } = req.body;

    const tokenName = tokenNameCamel || tokenNameSnake;
    const pricePerUnitRaw = pricePerUnitCamel ?? pricePerUnitSnake;
    const minQuantityRaw = minQuantityCamel ?? minQtySnake;
    const maxQuantityRaw = maxQuantityCamel ?? maxQtySnake;
    const quantityAvailableRaw = quantityAvailableCamel ?? quantityAvailableSnake;
    const locationCity = locationCityCamel || locationCitySnake;
    const locationState = locationStateCamel || locationStateSnake;
    const paymentTerms = paymentTermsCamel || paymentTermsSnake;

    // Parse numbers
    const pricePerUnit = pricePerUnitRaw != null ? Number(pricePerUnitRaw) : null;
    const minQuantity = minQuantityRaw != null ? Number(minQuantityRaw) : null;
    const maxQuantity = maxQuantityRaw != null ? Number(maxQuantityRaw) : null;
    const quantityAvailable =
        quantityAvailableRaw != null ? Number(quantityAvailableRaw) : null;

    // Ensure KYC approved
    if (!req.user?.isKycApproved || !req.user.isKycApproved()) {
        throw new ApiError(403, "KYC verification required to create ads");
    }

    // Basic validation
    if (
        !title ||
        !tokenName ||
        !direction ||
        pricePerUnit == null ||
        minQuantity == null ||
        maxQuantity == null ||
        quantityAvailable == null ||
        !locationCity ||
        !locationState
    ) {
        throw new ApiError(400, "Missing required ad fields");
    }

    // Image handling: prefer file from multer, fallback to body imageUrl (if any)
    let imageUrl = imageUrlBody || null;
    if (req.file) {
        // multer-s3: req.file.location
        // disk: req.file.path or req.file.filename
        imageUrl = req.file.location || req.file.key || req.file.path || imageUrlBody || null;
    }

    const ad = await Ad.create({
        user: req.user._id,
        title,
        tokenName,
        direction,
        pricePerUnit,
        minQuantity,
        maxQuantity,
        quantityAvailable,
        locationCity,
        locationState,
        paymentTerms,
        imageUrl,
        status: "active", // or "pending" if you want moderation
    });

    return res
        .status(201)
        .json(new ApiResponse(201, { ad }, "Ad created successfully"));
});


// -------------------------
// Public: Browse Ads
// -------------------------
export const browseAds = asyncHandler(async (req, res) => {
    // Frontend sends snake_case query params:
    // token_name, min_price, max_price, direction, city, page, limit
    const {
        token_name,
        direction,
        city,
        min_price,
        max_price,
        page = "1",
        limit = "10",
    } = req.query;

    // Normalize pagination
    const numericPage = Number.isFinite(Number(page)) && Number(page) > 0
        ? Number(page)
        : 1;

    const numericLimit = Number.isFinite(Number(limit)) && Number(limit) > 0
        ? Number(limit)
        : 10;

    const skip = (numericPage - 1) * numericLimit;

    // Build Mongo filter mapping snake_case → camelCase schema fields
    const query = {
        status: "active", // only show active ads to public; adjust if you want
    };

    if (token_name) {
        // assuming Ad has `tokenName` field
        query.tokenName = String(token_name).toUpperCase().trim();
    }

    if (direction) {
        const d = String(direction).toLowerCase();
        if (d === "buy" || d === "sell") {
            query.direction = d;
        }
    }

    if (city) {
        // case-insensitive, starts-with match on locationCity
        query.locationCity = new RegExp(`^${String(city).trim()}`, "i");
    }

    if (min_price || max_price) {
        query.pricePerUnit = {};
        if (min_price) {
            query.pricePerUnit.$gte = Number(min_price);
        }
        if (max_price) {
            query.pricePerUnit.$lte = Number(max_price);
        }
    }

    // Query data + total count in parallel
    const [ads, total] = await Promise.all([
        Ad.find(query)
            .populate("user", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit),
        Ad.countDocuments(query),
    ]);

    const pagination = {
        page: numericPage,
        limit: numericLimit,
        total,
        totalPages: Math.max(Math.ceil(total / numericLimit), 1),
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { ads, pagination },
                "Ads fetched successfully"
            )
        );
});

// -------------------------
// Public: Ad Detail
// -------------------------
export const getAdDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ad = await Ad.findById(id).populate("user", "name email mobileNumber");
    if (!ad) {
        throw new ApiError(404, "Ad not found");
    }

    const viewer = req.user; // may be undefined for unauthenticated requests
    let contactInfo = null;
    let cta = null;

    if (viewer && viewer.isKycApproved() && ad.user && ad.user.isKycApproved && ad.user.isKycApproved()) {
        // Both viewer and seller are KYC approved
        contactInfo = ad.user.mobileNumber;
    } else {
        // Mask seller number
        const number = ad.user?.mobileNumber || "";
        const masked = number.replace(/(\d{2})(\d{4})(\d{4})/, "$1XXXX$3");
        contactInfo = masked || "N/A";
        cta = "Complete KYC to view contact";
    }

    // Audit log when viewer attempts to view contact (if viewer is KYC approved)
    if (viewer && viewer.isKycApproved()) {
        const { createLog } = await import("./log.controller.js");
        await createLog({
            adminId: null,
            targetType: "ad",
            targetId: ad._id,
            action: "view_contact",
            reason: cta ? "KYC not approved" : "viewed",
            metadata: { viewerId: viewer._id },
        });
    }

    return res.status(200).json(
        new ApiResponse(200, { ad, contactInfo, cta }, "Ad detail fetched successfully")
    );
});

// -------------------------
// Admin: Delete Ad (soft delete)
// -------------------------
export const deleteAd = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ad = await Ad.findById(id);
    if (!ad) {
        throw new ApiError(404, "Ad not found");
    }
    ad.status = "removed";
    await ad.save();
    const { createLog } = await import("./log.controller.js");
    await createLog({
        adminId: req.user._id,
        targetType: "ad",
        targetId: ad._id,
        action: "soft_delete",
        reason: "Admin action",
    });
    return res.status(200).json(new ApiResponse(200, { ad }, "Ad deleted (soft) successfully"));
});

// -------------------------
// Admin: Flag Ad
// -------------------------
export const flagAd = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const ad = await Ad.findById(id);
    if (!ad) {
        throw new ApiError(404, "Ad not found");
    }
    // For simplicity, we just log the flag action; you could add a field on Ad if needed.
    const { createLog } = await import("./log.controller.js");
    await createLog({
        adminId: req.user._id,
        targetType: "ad",
        targetId: ad._id,
        action: "flag",
        reason: reason || "No reason provided",
    });
    return res.status(200).json(new ApiResponse(200, { ad }, "Ad flagged successfully"));
});

export const getAdContact = async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id)
            .populate("user", "name email mobileNumber kycStatus");

        if (!ad) {
            return res.status(404).json({ message: "Ad not found" });
        }

        if (req.user.kycStatus !== "approved") {
            return res.status(403).json({ message: "KYC not approved" });
        }

        return res.json({
            name: ad.user.name,
            mobile: ad.user.mobileNumber,
            email: ad.user.email,
        });
    } catch (err) {
        console.error("getAdContact error:", err);
        res.status(500).json({ message: err.message });
    }
};

