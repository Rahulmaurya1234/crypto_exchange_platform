// src/middleware/kycCheck.js
// Middleware to ensure the user has completed KYC verification

export const kycCheck = (req, res, next) => {
    // Assuming req.user is populated by authentication middleware
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!req.user.isKycApproved) {
        return res.status(403).json({ message: "KYC verification required" });
    }
    next();
};
