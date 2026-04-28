// src/controllers/kyc.controller.js
import User, {
  KYC_STATUSES,
  USER_ROLES,
} from "../models/User.model.js";
import { sendEmail, getKycAdminEmail } from "../utils/email.util.js";

const { CLIENT_URL } = process.env;

// -------------------------
// 4.1 User: submit KYC
// -------------------------
export const submitKyc = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      aadhar_number,
      pan_number,
      reference_1_name,
      reference_1_mobile,
      reference_2_name,
      reference_2_mobile,
    } = req.body;

    const files = req.files || {};
    const aadharFile = files.aadhar_image?.[0];
    const panFile = files.pan_image?.[0];

    // Basic validation
    if (!aadhar_number || !pan_number) {
      return res.status(400).json({
        success: false,
        message: "Aadhar number and PAN number are required.",
      });
    }

    if (!aadharFile || !panFile) {
      return res.status(400).json({
        success: false,
        message: "Both Aadhar and PAN images are required.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // If KYC already approved, do not allow resubmit directly
    if (user.kycStatus === KYC_STATUSES.APPROVED) {
      return res.status(400).json({
        success: false,
        message: "KYC already approved. No need to resubmit.",
      });
    }

    // Map to schema fields
    user.kyc = {
      aadharNumber: aadhar_number,
      aadharImageUrl: aadharFile.location || aadharFile.path, // S3 location or local path
      panNumber: pan_number,
      panImageUrl: panFile.location || panFile.path,
      reference1Name: reference_1_name,
      reference1Mobile: reference_1_mobile,
      reference2Name: reference_2_name,
      reference2Mobile: reference_2_mobile,
    };

    user.kycStatus = KYC_STATUSES.SUBMITTED;
    user.kycSubmittedAt = new Date();
    user.kycReviewedAt = null;
    user.kycReviewedBy = null;
    user.kycRejectionReason = undefined;

    await user.save();

    // -------------------
    // Emails
    // -------------------
    const adminEmail = getKycAdminEmail();

    // Email: To admin – "New KYC submitted"
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: "New KYC Submitted",
        text: `New KYC submitted by ${user.name} (${user.email}).`,
        html: `<p>New KYC submitted by <strong>${user.name}</strong> (${user.email}).</p>`,
      });
    }

    // Email: To user – "We received your KYC"
    await sendEmail({
      to: user.email,
      subject: "We received your KYC",
      text: "KYC submitted — our team will review in 2–3 hours.",
      html: `<p>KYC submitted — our team will review in 2–3 hours.</p>`,
    });

    return res.status(200).json({
      success: true,
      message: "KYC submitted — our team will review in 2–3 hours.",
      data: user.toSafeObject(),
    });
  } catch (err) {
    console.error("submitKyc error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to submit KYC." });
  }
};

// -------------------------
// 4.2 Admin: KYC queue list
// -------------------------
export const getKycQueue = async (_req, res) => {
  try {
    const users = await User.find({
      kycStatus: KYC_STATUSES.SUBMITTED,
    })
      .select(
        "name email mobileNumber city state kyc kycSubmittedAt kycStatus createdAt"
      )
      .sort({ kycSubmittedAt: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.error("getKycQueue error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch KYC queue." });
  }
};

// -------------------------
// 4.2 Admin: approve KYC
// -------------------------
export const approveKyc = async (req, res) => {
  try {
    const adminUser = req.user;
    const { userId } = req.params;

    if (!adminUser || adminUser.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.kycStatus === KYC_STATUSES.APPROVED) {
      return res.status(400).json({
        success: false,
        message: "KYC already approved.",
      });
    }

    user.kycStatus = KYC_STATUSES.APPROVED;
    user.kycReviewedAt = new Date();
    user.kycReviewedBy = adminUser._id;
    user.kycRejectionReason = undefined;

    await user.save();

    // Email to user – "Your KYC is approved — you can now post & contact."
    await sendEmail({
      to: user.email,
      subject: "Your KYC is approved",
      text: "Your KYC is approved — you can now post & contact.",
      html: `<p>Your KYC is approved — you can now post & contact.</p>`,
    });

    // Log action
    const { createLog } = await import("./log.controller.js");
    await createLog({
      adminId: adminUser._id,
      targetType: "kyc",
      targetId: user._id,
      action: "Approved KYC",
      reason: "Standard approval",
    });

    return res.status(200).json({
      success: true,
      message: "KYC approved successfully.",
      data: user.toSafeObject(),
    });
  } catch (err) {
    console.error("approveKyc error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to approve KYC." });
  }
};

// -------------------------
// 4.2 Admin: reject KYC
// -------------------------
export const rejectKyc = async (req, res) => {
  try {
    const adminUser = req.user;
    const { userId } = req.params;
    const { reason } = req.body;

    if (!adminUser || adminUser.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.kycStatus = KYC_STATUSES.REJECTED;
    user.kycReviewedAt = new Date();
    user.kycReviewedBy = adminUser._id;
    user.kycRejectionReason = reason.trim();

    await user.save();

    const reuploadLink = CLIENT_URL
      ? `${CLIENT_URL.replace(/\/$/, "")}/kyc-upload`
      : "/kyc-upload";

    // Email to user – rejected with re-upload link
    await sendEmail({
      to: user.email,
      subject: "Your KYC was rejected",
      text: `Your KYC was rejected for the following reason:\n\n${reason}\n\nYou can re-upload your documents here: ${reuploadLink}`,
      html: `<p>Your KYC was rejected for the following reason:</p>
             <p><strong>${reason}</strong></p>
             <p>You can re-upload your documents here:
             <a href="${reuploadLink}">${reuploadLink}</a></p>`,
    });

    // Log action
    const { createLog } = await import("./log.controller.js");
    await createLog({
      adminId: adminUser._id,
      targetType: "kyc",
      targetId: user._id,
      action: "Rejected KYC",
      reason: reason,
    });

    return res.status(200).json({
      success: true,
      message: "KYC rejected successfully.",
      data: user.toSafeObject(),
    });
  } catch (err) {
    console.error("rejectKyc error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reject KYC." });
  }
};
