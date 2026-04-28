// src/services/trade.service.js
import Trade from "../models/Trade.model.js";
import Listing from "../models/Listing.model.js";
import User from "../models/User.model.js";
import Chat from "../models/Chat.model.js";
import Dispute from "../models/Dispute.model.js";
import Message from "../models/Message.model.js";
import KYC from "../models/KYC.model.js";
import { TRADE_STATUS } from "../constants/index.js";
import { logger } from "../utils/logger.js";
import * as listingService from "./listing.service.js";
import * as feeCalculatorService from "./fee-calculator.service.js";
import * as priceFeedService from "./price-feed.service.js";
import * as socketEvents from "../config/socket.config.js";
import * as notificationService from "./notification.service.js";
import * as auditService from "./audit.service.js";
import { AUDIT_ACTION, ROLES, ESCROW_TRANSACTION_TYPE, ESCROW_TRANSACTION_STATUS } from "../constants/index.js";
import EscrowTransaction from "../models/EscrowTransaction.model.js";
import { escrowMonitorQueue } from "../queues/index.js";

/**
 * Initiate a new trade
 */
// export const initiateTrade = async (buyerId, tradeData) => {
//     try {
//         const { listingId, cryptoAmount, buyerWalletAddress, paymentMethod, chatId, isShareDocument, aadhaarFrontUrl, aadhaarBackUrl } = tradeData;

//         // Validate chatId exists
//         if (!chatId) {
//             throw new Error("chatId is required. Chat must be created before initiating trade.");
//         }

//         // Verify chat exists and buyer is participant
//         const chat = await Chat.findById(chatId);
//         if (!chat) {
//             throw new Error("Chat not found");
//         }

//         const isBuyerParticipant = chat.participants.some(
//             p => p.userId.toString() === buyerId.toString() && p.role === "buyer"
//         );
//         if (!isBuyerParticipant) {
//             throw new Error("You are not authorized for this chat");
//         }

//         // Check if chat already has a trade
//         if (chat.tradeId) {
//             throw new Error("This chat already has an active trade");
//         }

//         // Get listing
//         const listing = await Listing.findById(listingId).populate("sellerId");
//         if (!listing || listing.status !== "active") {
//             throw new Error("Listing not available");
//         }

//         // Verify amount is within limits
//         const totalINR = cryptoAmount;
//         if (totalINR < listing.minTradeLimit || totalINR > listing.maxTradeLimit) {
//             throw new Error("Amount is outside trade limits");
//         }

//         // Verify available amount
//         if (cryptoAmount > listing.availableAmount) {
//             throw new Error("Insufficient amount in listing");
//         }

//         // Calculate fees
//         const feeBreakdown = await feeCalculatorService.calculateTradeFees(
//             cryptoAmount,
//             listing.pricePerUnit
//         );

//         // Determine initial status and timer based on seller type
//         const isInstantSeller = listing.isInstantSeller || false;
//         const createdBy = listing.createdBy

//         // For instant sellers, check and deduct balance
//         if (isInstantSeller && createdBy === "InstantSeller") {
//             const seller = listing.sellerId;

//             // Check if seller has sufficient balance
//             if (!seller.hasInstantSellerBalance(feeBreakdown.sellerMustSend)) {
//                 throw new Error(
//                     `Insufficient instant seller balance. Required: ${feeBreakdown.sellerMustSend}, Available: ${seller.escrowDepositAmount}`
//                 );
//             }
//         }

//         const initialStatus = (isInstantSeller && createdBy === "InstantSeller")
//             ? TRADE_STATUS.PENDING_SELLER_CONFIRMATION  // Instant seller: wait for seller to confirm trade
//             : TRADE_STATUS.PENDING_SELLER_DEPOSIT;  // Regular seller: wait for deposit

//         // Set timer based on seller type
//         // Regular seller: 15 min for deposit, Instant seller: 30 min for payment
//         const timerMinutes = 30;
//         const expiresAt = new Date(Date.now() + timerMinutes * 60000);

//         // Validate isShareDocument is always true (required to initiate trade)
//         if (!isShareDocument) {
//             throw new Error("Check is required to initiate the trade. Buyer must consent to share Aadhaar documents.");
//         }

//         // Validate Aadhaar proof URLs are provided
//         if (!aadhaarFrontUrl || !aadhaarBackUrl) {
//             throw new Error("Aadhaar front and back URLs are required to initiate the trade");
//         }

//         // Create trade with properly mapped fee values
//         const trade = new Trade({
//             listingId,
//             buyerId,
//             sellerId: listing.sellerId,
//             cryptoAmount,
//             pricePerUnit: listing.pricePerUnit,
//             totalINRAmount: feeBreakdown.totalINRBuyerPays,

//             // Fee breakdown object
//             feeBreakdown: feeBreakdown.feeBreakdown,

//             // INR breakdown (buyer side) - stored as top-level fields
//             sellerNetINR: feeBreakdown.sellerNetINR,
//             platformFeeINR: feeBreakdown.platformFeeINR,
//             gasFeeINR: feeBreakdown.gasFeeINR,
//             effectivePricePerUnit: feeBreakdown.effectivePricePerUnit,

//             // Crypto breakdown (seller side) - stored as top-level fields
//             platformFeeUSDT: feeBreakdown.platformFeeUSDT,
//             sellerMustDepositUSDT: feeBreakdown.sellerMustDepositUSDT,

//             // Legacy fields
//             sellerMustSend: feeBreakdown.sellerMustSend,
//             buyerWillReceive: cryptoAmount,

//             buyerWalletAddress,
//             paymentMethod,
//             paymentTimeLimit: listing.timeLimit || 30,
//             expiresAt,
//             isInstantSeller,
//             autoReleaseEnabled: createdBy === "InstantSeller" ? true : false,
//             chatId: chat._id,
//             status: initialStatus,
//             isShareDocument: isShareDocument, // Always true - required to initiate trade

//             // Store buyer's Aadhaar proof (required for all trades)
//             buyerAadhaarProof: {
//                 frontImageUrl: aadhaarFrontUrl,
//                 backImageUrl: aadhaarBackUrl,
//                 uploadedAt: new Date(),
//             },
//         });

//         trade.addTimelineEvent(
//             "Trade Initiated",
//             `Buyer initiated trade for ${cryptoAmount} USDT. ${(isInstantSeller && createdBy === "InstantSeller") ? 'Waiting for seller to confirm trade' : 'Waiting for seller deposit'}`,
//             buyerId
//         );

//         await trade.save();

//         // Update chat with trade ID
//         chat.tradeId = trade._id;
//         await chat.save();

//         // Decrease listing available amount (soft reserve)
//         await listingService.decreaseAvailableAmount(listingId, cryptoAmount);

//         // NOTE: For instant sellers, balance will be deducted when seller confirms the trade
//         // (in confirmInstantSellerTrade function), not immediately when buyer initiates

//         logger.info("Trade initiated", { tradeId: trade._id, buyerId, sellerId: listing.sellerId });

//         // Emit socket events
//         socketEvents.emitOrderCreated(trade);

//         // Create system message in chat
//         await Message.createSystemMessage(
//             chat._id,
//             `Trade initiated for ${cryptoAmount} USDT. ${(isInstantSeller && createdBy === "InstantSeller") ? "Waiting for seller to confirm trade." : "Waiting for seller to deposit crypto."
//             }`,
//             {
//                 messageType: "action",
//                 actionType: (isInstantSeller && createdBy === "InstantSeller") ? "seller-confirmation-required" : "seller-deposit-required",
//             }

//         );

//         // Emit appropriate socket event based on seller type
//         if (isInstantSeller && createdBy === "InstantSeller") {
//             // For instant sellers, emit event for seller to confirm trade
//             socketEvents.emitDepositRequired(trade); // Reusing this event, can create new one if needed
//         } else {
//             // For regular sellers, emit deposit required
//             socketEvents.emitDepositRequired(trade);
//         }

//         return trade;
//     } catch (error) {
//         logger.error("Error initiating trade:", error);
//         throw error;
//     }
// };

export const initiateTrade = async (buyerId, tradeData) => {
  try {
    const {
      listingId,
      cryptoAmount,
      cryptoType = "USDT",
      networkName,
      buyerWalletAddress,
      paymentMethod,
      chatId,
      isShareDocument,
      aadhaarFrontUrl,
      aadhaarBackUrl,
    } = tradeData;

    // Validate chatId exists
    if (!chatId) {
      throw new Error(
        "chatId is required. Chat must be created before initiating trade."
      );
    }

    // Verify chat exists and buyer is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    const isBuyerParticipant = chat.participants.some(
      (p) => p.userId.toString() === buyerId.toString() && p.role === "buyer"
    );
    if (!isBuyerParticipant) {
      throw new Error("You are not authorized for this chat");
    }

    // Check if chat already has a trade
    if (chat.tradeId) {
      throw new Error("This chat already has an active trade");
    }

    // Get listing
    const listing = await Listing.findById(listingId).populate("sellerId");
    if (!listing || listing.status !== "active") {
      throw new Error("Listing not available");
    }

    // Verify amount is within limits
    const totalINR = cryptoAmount;
    if (totalINR < listing.minTradeLimit || totalINR > listing.maxTradeLimit) {
      throw new Error("Amount is outside trade limits");
    }

    // Verify available amount
    if (cryptoAmount > listing.availableAmount) {
      throw new Error("Insufficient amount in listing");
    }

    // Calculate fees
    const feeBreakdown = await feeCalculatorService.calculateTradeFees(
      cryptoAmount,
      listing.pricePerUnit
    );

    // Determine initial status and timer based on seller type
    const isInstantSeller = listing.isInstantSeller || false;
    const createdBy = listing.createdBy;

    // For instant sellers, check and deduct balance
    if (isInstantSeller && createdBy === "InstantSeller") {
      const seller = listing.sellerId;

      // Check if seller has sufficient balance
      if (!seller.hasInstantSellerBalance(feeBreakdown.sellerMustSend)) {
        throw new Error(
          `Insufficient instant seller balance. Required: ${feeBreakdown.sellerMustSend}, Available: ${seller.escrowDepositAmount}`
        );
      }
    }

    const initialStatus =
      isInstantSeller && createdBy === "InstantSeller"
        ? TRADE_STATUS.PENDING_SELLER_CONFIRMATION // Instant seller: wait for seller to confirm trade
        : TRADE_STATUS.PENDING_SELLER_DEPOSIT; // Regular seller: wait for deposit

    // Set timer based on seller type
    // Regular seller: 15 min for deposit, Instant seller: 30 min for payment
    const timerMinutes = 30;
    const expiresAt = new Date(Date.now() + timerMinutes * 60000);

    // Validate isShareDocument is always true (required to initiate trade)
    if (!isShareDocument) {
      throw new Error(
        "Check is required to initiate the trade. Buyer must consent to share Aadhaar documents."
      );
    }

    // Validate Aadhaar proof URLs are provided
    if (!aadhaarFrontUrl || !aadhaarBackUrl) {
      throw new Error(
        "Aadhaar front and back URLs are required to initiate the trade"
      );
    }

    // Get platform wallet based on network
    const escrowAddress = await feeCalculatorService.getPlatformWallet(cryptoType, networkName);

    // Create trade with properly mapped fee values
    const trade = new Trade({
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      cryptoAmount,
      cryptoType,
      networkName,
      pricePerUnit: listing.pricePerUnit,
      totalINRAmount: feeBreakdown.totalINRBuyerPays,
      buyerReceivedAmount: cryptoAmount, // Net buyer receives
      sellerDepositAmount: feeBreakdown.sellerMustDepositUSDT, // Total seller sends

      // Fee breakdown object
      feeBreakdown: feeBreakdown.feeBreakdown,

      // INR breakdown (buyer side)
      sellerNetINR: feeBreakdown.sellerNetINR,
      platformFeeINR: feeBreakdown.platformFeeINR,
      gasFeeINR: feeBreakdown.gasFeeINR,
      effectivePricePerUnit: feeBreakdown.effectivePricePerUnit,

      // Crypto breakdown (seller side)
      platformFeeUSDT: feeBreakdown.platformFeeUSDT,
      sellerMustDepositUSDT: feeBreakdown.sellerMustDepositUSDT,

      // Legacy fields
      sellerMustSend: feeBreakdown.sellerMustSend,
      buyerWillReceive: cryptoAmount,

      buyerWalletAddress,
      escrowAddress, // Generated based on network
      paymentMethod,
      paymentTimeLimit: listing.timeLimit || 30,
      expiresAt,
      isInstantSeller,
      autoReleaseEnabled: createdBy === "InstantSeller" ? true : false,
      chatId: chat._id,
      status: initialStatus,
      isShareDocument: isShareDocument, // Always true - required to initiate trade

      // Store buyer's Aadhaar proof (required for all trades)
      buyerAadhaarProof: {
        frontImageUrl: aadhaarFrontUrl,
        backImageUrl: aadhaarBackUrl,
        uploadedAt: new Date(),
      },
    });

    trade.addTimelineEvent(
      "Trade Initiated",
      `Buyer initiated trade for ${cryptoAmount} USDT. ${isInstantSeller && createdBy === "InstantSeller" ? "Waiting for seller to confirm trade" : "Waiting for seller deposit"}`,
      buyerId
    );

    await trade.save();

    // Log the audit event for admin visibility
    await auditService.logTradeAction(
      AUDIT_ACTION.TRADE_CREATE,
      buyerId,
      "BUYER",
      trade._id,
      {
        cryptoAmount,
        cryptoType,
        networkName,
        totalINRAmount: trade.totalINRAmount,
      }
    );

    // Update chat with trade ID
    chat.tradeId = trade._id;
    await chat.save();

    // ✅ Reserve listing amount (NOT final deduction)
    await listingService.reserveAmountForTrade(listingId, cryptoAmount);

    // NOTE: For instant sellers, balance will be deducted when seller confirms the trade
    // (in confirmInstantSellerTrade function), not immediately when buyer initiates

    logger.info("Trade initiated", {
      tradeId: trade._id,
      buyerId,
      sellerId: listing.sellerId,
    });

    // Emit socket events
    socketEvents.emitOrderCreated(trade);

    // Send real-time notification (Toast + History)
    notificationService.notifyTradeInitiated(trade);

    // Create system message in chat
    await Message.createSystemMessage(
      chat._id,
      `Trade initiated for ${cryptoAmount} USDT. ${isInstantSeller && createdBy === "InstantSeller"
        ? "Waiting for seller to confirm trade."
        : "Waiting for seller to deposit crypto."
      }`,
      {
        messageType: "action",
        actionType:
          isInstantSeller && createdBy === "InstantSeller"
            ? "seller-confirmation-required"
            : "seller-deposit-required",
      }
    );

    // Emit appropriate socket event based on seller type
    if (isInstantSeller && createdBy === "InstantSeller") {
      // For instant sellers, emit event for seller to confirm trade
      socketEvents.emitDepositRequired(trade); // Reusing this event, can create new one if needed
    } else {
      // For regular sellers, emit deposit required
      socketEvents.emitDepositRequired(trade);
    }

    return trade;
  } catch (error) {
    logger.error("Error initiating trade:", error);
    throw error;
  }
};

/**
 * Get trade by ID
 * Includes seller's bank details from KYC for buyer to make payment
 * Conditionally includes buyer's Aadhaar document if isShareDocument is enabled
 */
export const getTradeById = async (tradeId, requestingUserId = null) => {
  const trade = await Trade.findById(tradeId)
    .populate("buyerId", "name avatar averageRating totalReviews")
    .populate(
      "sellerId",
      "name avatar averageRating totalReviews isInstantSeller"
    )
    .populate("listingId")
    .populate("chatId");

  if (!trade) {
    return null;
  }

  // Fetch seller's KYC details to get bank information
  const sellerKYC = await KYC.findOne({ userId: trade.sellerId._id }).select(
    "bankDetails"
  );

  // Attach bank details to the trade object for easy access
  if (sellerKYC && sellerKYC.bankDetails) {
    trade._doc.sellerBankDetails = {
      accountHolderName: sellerKYC.bankDetails.accountHolderName,
      accountNumber: sellerKYC.bankDetails.accountNumber,
      ifscCode: sellerKYC.bankDetails.ifscCode,
      bankName: sellerKYC.bankDetails.bankName,
      branch: sellerKYC.bankDetails.branch,
      upiId: sellerKYC.bankDetails.upiId,
    };
  }

  // Share buyer's Aadhaar document with seller if buyer consented
  if (
    trade.isShareDocument &&
    requestingUserId &&
    trade.sellerId._id.toString() === requestingUserId.toString()
  ) {
    const buyerKYC = await KYC.findOne({ userId: trade.buyerId._id }).select(
      "documents"
    );

    if (buyerKYC && buyerKYC.documents) {
      // Find the Aadhaar document
      const aadhaarDoc = buyerKYC.documents.find(
        (doc) => doc.documentType === "aadhaar"
      );

      if (aadhaarDoc) {
        trade._doc.buyerAadhaarDocument = {
          documentNumber: aadhaarDoc.documentNumber,
          frontImageUrl: aadhaarDoc.frontImageUrl,
          backImageUrl: aadhaarDoc.backImageUrl,
          uploadedAt: aadhaarDoc.uploadedAt,
        };
      }
    }
  }

  return trade;
};

/**
 * Get user's trades (buyer or seller)
 */
export const getUserTrades = async (userId, filters = {}) => {
  const { page = 1, limit = 20, status, role } = filters;

  const query = {};

  if (role === "buyer") {
    query.buyerId = userId;
  } else if (role === "seller") {
    query.sellerId = userId;
  } else {
    query.$or = [{ buyerId: userId }, { sellerId: userId }];
  }

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [trades, total] = await Promise.all([
    Trade.find(query)
      .populate("buyerId", "name avatar averageRating")
      .populate("sellerId", "name avatar averageRating isInstantSeller")
      .populate("listingId", "cryptoType pricePerUnit")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Trade.countDocuments(query),
  ]);

  return {
    trades,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all trades with DEPOSITED status
 * Optionally include buyer's Aadhaar if requesting user is the seller and consented
 * */
export const getAllDepositedTrades = async (requestingUserId = null) => {
  // 1️⃣ Fetch trades with status DEPOSITED
  const trades = await Trade.find({ status: TRADE_STATUS.DEPOSIT_SUBMITTED })
    .populate("buyerId", "name avatar averageRating totalReviews")
    .populate(
      "sellerId",
      "name avatar averageRating totalReviews isInstantSeller"
    )
    .populate("listingId")
    .populate("chatId")
    .lean(); // IMPORTANT: makes mutation safe & faster

  if (!trades.length) return [];

  // 2️⃣ Collect seller & buyer IDs
  const sellerIds = [...new Set(trades.map((t) => t.sellerId._id.toString()))];
  const buyerIds = [...new Set(trades.map((t) => t.buyerId._id.toString()))];

  // 3️⃣ Fetch KYCs in bulk (no N+1 query stupidity)
  const kycs = await KYC.find({
    userId: { $in: [...sellerIds, ...buyerIds] },
  }).select("userId bankDetails documents");

  const kycMap = new Map(kycs.map((k) => [k.userId.toString(), k]));

  // 4️⃣ Attach extra data
  for (const trade of trades) {
    // Seller bank details
    const sellerKYC = kycMap.get(trade.sellerId._id.toString());
    if (sellerKYC?.bankDetails) {
      trade.sellerBankDetails = {
        accountHolderName: sellerKYC.bankDetails.accountHolderName,
        accountNumber: sellerKYC.bankDetails.accountNumber,
        ifscCode: sellerKYC.bankDetails.ifscCode,
        bankName: sellerKYC.bankDetails.bankName,
        branch: sellerKYC.bankDetails.branch,
        upiId: sellerKYC.bankDetails.upiId,
      };
    }

    // Buyer Aadhaar (ONLY if consent + seller requesting)
    if (
      trade.isShareDocument &&
      requestingUserId &&
      trade.sellerId._id.toString() === requestingUserId.toString()
    ) {
      const buyerKYC = kycMap.get(trade.buyerId._id.toString());
      const aadhaarDoc = buyerKYC?.documents?.find(
        (d) => d.documentType === "aadhaar"
      );

      if (aadhaarDoc) {
        trade.buyerAadhaarDocument = {
          documentNumber: aadhaarDoc.documentNumber,
          frontImageUrl: aadhaarDoc.frontImageUrl,
          backImageUrl: aadhaarDoc.backImageUrl,
          uploadedAt: aadhaarDoc.uploadedAt,
        };
      }
    }
  }

  return trades;
};

/**
 * Mark escrow deposited (Legacy - kept for backward compatibility)
 * Use submitDepositHash instead for new implementations
 */
export const markEscrowDeposited = async (
  tradeId,
  sellerId,
  transactionHash,
  escrowAddress
) => {
  try {
    const trade = await Trade.findOne({ _id: tradeId, sellerId });

    if (!trade) {
      throw new Error("Trade not found or unauthorized");
    }

    if (trade.status !== TRADE_STATUS.PENDING_SELLER_DEPOSIT) {
      throw new Error("Invalid trade status for escrow deposit");
    }

    // Update to DEPOSIT_SUBMITTED status
    trade.status = TRADE_STATUS.DEPOSIT_SUBMITTED;
    trade.escrowTransactionHash = transactionHash;
    trade.escrowAddress = escrowAddress;
    trade.addTimelineEvent(
      "Deposit Hash Submitted",
      `Seller submitted tx hash: ${transactionHash}. Waiting for verification.`,
      sellerId
    );

    await trade.save();

    logger.info("Escrow deposit hash submitted", { tradeId, transactionHash });

    return trade;
  } catch (error) {
    logger.error("Error marking escrow deposited:", error);
    throw error;
  }
};

/**
 * Upload payment proof (buyer)
 */
export const uploadPaymentProof = async (tradeId, buyerId, paymentDetails) => {
  try {
    const trade = await Trade.findOne({ _id: tradeId, buyerId });

    if (!trade) {
      throw new Error("Trade not found or unauthorized");
    }

    if (!trade.canUploadPaymentProof()) {
      throw new Error("Cannot upload payment proof at this stage");
    }

    // Validate required payment details
    if (!paymentDetails.proofUrl) {
      throw new Error(
        "Payment proof URL is required. Please upload the payment screenshot first."
      );
    }

    if (!paymentDetails.transactionId && !paymentDetails.utr) {
      throw new Error("Transaction ID (UTR) is required");
    }

    await trade.uploadPaymentProof(paymentDetails);

    logger.info("Payment proof uploaded", { tradeId, buyerId });

    // Emit socket event
    socketEvents.emitPaymentUploaded(trade);

    // Send real-time notification (Toast + History)
    notificationService.notifyPaymentUploaded(trade);

    // Create system message
    await Message.createSystemMessage(
      trade.chatId,
      `Buyer uploaded payment proof. Waiting for seller confirmation.`,
      {
        messageType: "action",
        actionType: "payment-proof-uploaded",
      }
    );

    return trade;
  } catch (error) {
    logger.error("Error uploading payment proof:", error);
    throw error;
  }
};

/**
 * Confirm payment (seller)
 */
export const confirmPayment = async (tradeId, sellerId, remarks = "") => {
  try {
    const trade = await Trade.findOne({ _id: tradeId, sellerId });

    if (!trade) {
      throw new Error("Trade not found or unauthorized");
    }

    if (!trade.canConfirmPayment()) {
      throw new Error("Cannot confirm payment at this stage");
    }

    await trade.confirmPayment(remarks);

    logger.info("Payment confirmed", { tradeId, sellerId });

    // Log the audit event
    await auditService.logTradeAction(
      AUDIT_ACTION.PAYMENT_CONFIRM,
      sellerId,
      "SELLER",
      trade._id,
      { remarks }
    );

    // Emit socket event
    socketEvents.emitOrderPaymentConfirmed(trade);

    // Send real-time notification
    notificationService.notifyPaymentConfirmedBySeller(trade);

    return trade;
  } catch (error) {
    logger.error("Error confirming payment:", error);
    throw error;
  }
};

/**
 * Complete trade (release escrow)
 */
// export const completeTrade = async (tradeId, releaseHash) => {
//   try {
//     const trade = await Trade.findById(tradeId);

//     if (!trade) {
//       throw new Error("Trade not found");
//     }

//     if (trade.status !== TRADE_STATUS.PENDING_CONFIRMATION) {
//       throw new Error("Trade not ready for completion");
//     }

//     await trade.complete(releaseHash);

//     // Update user statistics
//     await Promise.all([
//       User.findByIdAndUpdate(trade.buyerId, {
//         $inc: { totalTradesCompleted: 1 },
//       }),
//       User.findByIdAndUpdate(trade.sellerId, {
//         $inc: { totalTradesCompleted: 1 },
//       }),
//     ]);

//     logger.info("Trade completed", { tradeId, releaseHash });

//     return trade;
//   } catch (error) {
//     logger.error("Error completing trade:", error);
//     throw error;
//   }
// };

export const completeTrade = async (tradeId, releaseHash) => {
  try {
    const trade = await Trade.findById(tradeId);

    if (!trade) {
      throw new Error("Trade not found");
    }

    if (trade.status !== TRADE_STATUS.PENDING_CONFIRMATION) {
      throw new Error("Trade not ready for completion");
    }

    await trade.complete(releaseHash);
    // ✅ Finalize listing deduction after successful trade
    await listingService.finalizeTradeAmount(
      trade.listingId,
      trade.cryptoAmount
    );

    // Update user statistics
    await Promise.all([
      User.findByIdAndUpdate(trade.buyerId, {
        $inc: { totalTradesCompleted: 1 },
      }),
      User.findByIdAndUpdate(trade.sellerId, {
        $inc: { totalTradesCompleted: 1 },
      }),
    ]);

    logger.info("Trade completed", { tradeId, releaseHash });

    // Log the audit event
    await auditService.logTradeAction(
      AUDIT_ACTION.TRADE_COMPLETE,
      trade.sellerId,
      "SYSTEM",
      trade._id,
      { releaseHash }
    );

    // Emit socket event
    socketEvents.emitOrderCompleted(trade);

    // Send real-time notification (Toast + History)
    notificationService.notifyTradeCompleted(trade);

    return trade;
  } catch (error) {
    logger.error("Error completing trade:", error);
    throw error;
  }
};

/**
 * Cancel trade
 */
// export const cancelTrade = async (tradeId, userId, reason) => {
//   try {
//     const trade = await Trade.findOne({
//       _id: tradeId,
//       $or: [{ buyerId: userId }, { sellerId: userId }],
//     });

//     if (!trade) {
//       throw new Error("Trade not found or unauthorized");
//     }

//     // Check if trade can be cancelled
//     const cancellableStatuses = [
//       TRADE_STATUS.INITIATED,
//       TRADE_STATUS.PENDING_DEPOSIT,
//       TRADE_STATUS.ESCROW_LOCKED,
//     ];

//     if (!cancellableStatuses.includes(trade.status)) {
//       throw new Error("Trade cannot be cancelled at this stage");
//     }

//     await trade.cancel(userId, reason);

//     // Restore listing amount if escrow not deposited
//     if (
//       trade.status === TRADE_STATUS.INITIATED ||
//       trade.status === TRADE_STATUS.PENDING_DEPOSIT
//     ) {
//       const listing = await Listing.findById(trade.listingId).populate(
//         "sellerId"
//       );
//       if (listing) {
//         listing.availableAmount += trade.cryptoAmount;
//         await listing.save();

//         // Restore instant seller balance if it was deducted
//         if (trade.isInstantSeller && listing.sellerId) {
//           const User = (await import("../models/User.model.js")).default;
//           const seller = await User.findById(listing.sellerId._id);
//           if (seller && seller.isInstantSeller) {
//             await seller.addInstantSellerBalance(trade.sellerMustSend);
//             logger.info("Instant seller balance restored after cancellation", {
//               tradeId,
//               sellerId: seller._id,
//               restoredAmount: trade.sellerMustSend,
//             });
//           }
//         }
//       }
//     }

//     logger.info("Trade cancelled", { tradeId, userId, reason });

//     // Emit socket event
//     socketEvents.emitOrderCancelled(trade, reason);

//     // Create system message
//     await Message.createSystemMessage(
//       trade.chatId,
//       `Trade cancelled. Reason: ${reason || "User cancelled"}`
//     );

//     return trade;
//   } catch (error) {
//     logger.error("Error cancelling trade:", error);
//     throw error;
//   }
// };

export const cancelTrade = async (tradeId, userId, reason) => {
  try {
    const trade = await Trade.findOne({
      _id: tradeId,
      $or: [{ buyerId: userId }, { sellerId: userId }],
    });

    if (!trade) {
      throw new Error("Trade not found or unauthorized");
    }

    // Check if trade can be cancelled
    const cancellableStatuses = [
      TRADE_STATUS.INITIATED,
      TRADE_STATUS.PENDING_DEPOSIT,
      TRADE_STATUS.ESCROW_LOCKED,
      TRADE_STATUS.PENDING_SELLER_CONFIRMATION,
    ];

    if (!cancellableStatuses.includes(trade.status)) {
      throw new Error("Trade cannot be cancelled at this stage");
    }

    await trade.cancel(userId, reason);

    // ✅ Release reserved listing amount
    await listingService.releaseReservedAmount(
      trade.listingId,
      trade.cryptoAmount
    );

    // Restore instant seller balance if it was deducted
    if (trade.isInstantSeller && trade.sellerId) {
      const User = (await import("../models/User.model.js")).default;
      const seller = await User.findById(trade.sellerId);
      if (seller && seller.isInstantSeller) {
        await seller.addInstantSellerBalance(trade.sellerMustSend);
        logger.info("Instant seller balance restored after cancellation", {
          tradeId,
          sellerId: seller._id,
          restoredAmount: trade.sellerMustSend,
        });
      }
    }

    logger.info("Trade cancelled", { tradeId, userId, reason });

    // Log the audit event
    await auditService.logTradeAction(
      AUDIT_ACTION.TRADE_CANCEL,
      userId,
      trade.buyerId.toString() === userId.toString() ? "BUYER" : "SELLER",
      trade._id,
      { reason }
    );

    // Emit socket event
    socketEvents.emitOrderCancelled(trade, reason);

    // Send real-time notification (Toast + History)
    notificationService.notifyTradeCancelled(trade, reason);

    // Create system message
    await Message.createSystemMessage(
      trade.chatId,
      `Trade cancelled. Reason: ${reason || "User cancelled"}`
    );

    return trade;
  } catch (error) {
    logger.error("Error cancelling trade:", error);
    throw error;
  }
};

/**
 * Get active trades count for user
 */
export const getActiveTradesCount = async (userId) => {
  return await Trade.countDocuments({
    $or: [{ buyerId: userId }, { sellerId: userId }],
    status: {
      $in: [
        TRADE_STATUS.INITIATED,
        TRADE_STATUS.PENDING_DEPOSIT,
        TRADE_STATUS.ESCROW_LOCKED,
        TRADE_STATUS.PAYMENT_PROOF_UPLOADED,
        TRADE_STATUS.PENDING_CONFIRMATION,
      ],
    },
  });
};

/**
 * Get trade statistics for user
 */
export const getUserTradeStats = async (userId) => {
  const stats = await Trade.aggregate([
    {
      $match: {
        $or: [{ buyerId: userId }, { sellerId: userId }],
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalINRAmount" },
      },
    },
  ]);

  const formattedStats = {
    total: await Trade.countDocuments({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    }),
    completed: 0,
    cancelled: 0,
    disputed: 0,
    active: 0,
    totalVolume: 0,
  };

  stats.forEach((stat) => {
    if (stat._id === TRADE_STATUS.COMPLETED) {
      formattedStats.completed = stat.count;
      formattedStats.totalVolume = stat.totalAmount;
    } else if (stat._id === TRADE_STATUS.CANCELLED) {
      formattedStats.cancelled = stat.count;
    } else if (stat._id === TRADE_STATUS.DISPUTED) {
      formattedStats.disputed = stat.count;
    } else if (
      [
        TRADE_STATUS.INITIATED,
        TRADE_STATUS.PENDING_DEPOSIT,
        TRADE_STATUS.ESCROW_LOCKED,
        TRADE_STATUS.PAYMENT_PROOF_UPLOADED,
        TRADE_STATUS.PENDING_CONFIRMATION,
      ].includes(stat._id)
    ) {
      formattedStats.active += stat.count;
    }
  });

  return formattedStats;
};

/**
 * Get all trades (Admin)
 */
export const getAllTrades = async (filters = {}) => {
  const { page = 1, limit = 20, status, search } = filters;

  const query = {};

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  let trades, total;

  if (search) {
    // Search by trade number
    query.tradeNumber = { $regex: search, $options: "i" };
  }

  [trades, total] = await Promise.all([
    Trade.find(query)
      .populate("buyerId", "name email avatar")
      .populate("sellerId", "name email avatar")
      .populate("listingId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Trade.countDocuments(query),
  ]);

  return {
    trades,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Calculate order amount with live price and fees
 * @param {string} listingId - Listing ID
 * @param {number} cryptoAmount - USDT amount buyer wants (for regular) or available amount (for instant)
 * @returns {Object} Calculation breakdown
 */
export const calculateOrderAmount = async (listingId, cryptoAmount) => {
  try {
    const listing = await Listing.findById(listingId).populate("sellerId");
    if (!listing || listing.status !== "active") {
      throw new Error("Listing not available");
    }

    const isInstantSeller = listing.isInstantSeller || false;

    // For instant seller, crypto amount is FIXED (already deposited)
    // For regular seller, buyer specifies how much USDT they want
    let finalCryptoAmount = cryptoAmount;

    if (isInstantSeller) {
      // For instant seller, use the available amount in listing
      // Buyer gets USDT from the pre-deposited escrow
      finalCryptoAmount = Math.min(cryptoAmount, listing.availableAmount);
    } else {
      // For regular seller, verify requested amount is available
      if (cryptoAmount > listing.availableAmount) {
        throw new Error("Insufficient amount in listing");
      }
    }

    // Calculate seller's net INR (what seller receives)
    const sellerNetINR = finalCryptoAmount * listing.pricePerUnit;

    // Verify amount is within limits
    // if (sellerNetINR < listing.minTradeLimit || sellerNetINR > listing.maxTradeLimit) {
    //     throw new Error(`Amount must be between ₹${listing.minTradeLimit} and ₹${listing.maxTradeLimit}`);
    // }

    // Get live USDT price (for reference only)
    const liveUsdtPrice = await priceFeedService.getUsdtInrPrice();

    // Calculate fees using seller's price
    const fees = await feeCalculatorService.calculateTradeFees(
      finalCryptoAmount,
      listing.pricePerUnit
    );

    // Format response based on seller type
    const response = {
      cryptoAmount: finalCryptoAmount,
      sellerPricePerUnit: listing.pricePerUnit, // Seller's net price
      effectivePricePerUnit: fees.effectivePricePerUnit, // Buyer's actual price (including fees)
      liveUsdtPrice, // Market reference price

      // INR breakdown (what buyer pays)
      sellerNetINR: fees.sellerNetINR, // What seller receives
      platformFeeINR: fees.platformFeeINR, // Platform fee (5%)
      gasFeeINR: fees.gasFeeINR, // Gas fee (1%)
      totalINRBuyerPays: fees.totalINRBuyerPays, // Total buyer must pay

      // Crypto breakdown (what seller deposits - for regular seller)
      platformFeeUSDT: fees.platformFeeUSDT, // Platform fee in USDT (4%)
      sellerMustDepositUSDT: fees.sellerMustDepositUSDT, // Total USDT seller deposits

      buyerWillReceive: finalCryptoAmount,

      feeBreakdown: fees.feeBreakdown,

      sellerDetails: {
        name: listing.sellerId.name,
        bankDetails: listing.sellerId.bankDetails,
        paymentMethods: listing.paymentMethods,
        isInstantSeller: listing.isInstantSeller,
      },

      escrowWallet: process.env.ESCROW_WALLET_ADDRESS || "0x...",

      // Add calculation explanation
      calculationNote: isInstantSeller
        ? `Instant Seller: Crypto already deposited. You pay ₹${fees.totalINRBuyerPays} for ${finalCryptoAmount} USDT.`
        : `Regular Seller: Seller must deposit ${fees.sellerMustDepositUSDT} USDT to escrow. You pay ₹${fees.totalINRBuyerPays} for ${finalCryptoAmount} USDT.`,
    };

    return response;
  } catch (error) {
    logger.error("Error calculating order amount:", error);
    throw error;
  }
};
export const calculateUsdtToInr = async (listingId, cryptoAmount) => {
  try {
    const listing = await Listing.findById(listingId).populate("sellerId");
    if (!listing || listing.status !== "active") {
      throw new Error("Listing not available");
    }

    const isInstantSeller = listing.isInstantSeller || false;

    let finalCryptoAmount = cryptoAmount;

    if (isInstantSeller) {
      finalCryptoAmount = Math.min(cryptoAmount, listing.availableAmount);
    } else {
      if (cryptoAmount > listing.availableAmount) {
        throw new Error("Insufficient amount in listing");
      }
    }

    const liveUsdtPrice = await priceFeedService.getUsdtInrPrice();
    const fees = await feeCalculatorService.calculateTradeFees(
      finalCryptoAmount,
      listing.pricePerUnit
    );

    return {
      cryptoAmount: finalCryptoAmount,
      buyerWillReceive: finalCryptoAmount,
      sellerPricePerUnit: listing.pricePerUnit,
      effectivePricePerUnit: fees.effectivePricePerUnit,
      liveUsdtPrice,
      sellerNetINR: fees.sellerNetINR,
      platformFeeINR: fees.platformFeeINR,
      gasFeeINR: fees.gasFeeINR,
      totalINRBuyerPays: fees.totalINRBuyerPays,
      platformFeeUSDT: fees.platformFeeUSDT,
      sellerMustDepositUSDT: fees.sellerMustDepositUSDT,
      feeBreakdown: fees.feeBreakdown,
      sellerDetails: {
        name: listing.sellerId.name,
        bankDetails: listing.sellerId.bankDetails,
        paymentMethods: listing.paymentMethods,
        isInstantSeller,
      },
      escrowWallet: process.env.ESCROW_WALLET_ADDRESS || "0x...",
      calculationNote: isInstantSeller
        ? `Instant Seller: You pay ₹${fees.totalINRBuyerPays} for ${finalCryptoAmount} USDT.`
        : `Regular Seller: Seller deposits ${fees.sellerMustDepositUSDT} USDT to escrow. You pay ₹${fees.totalINRBuyerPays}.`,
    };
  } catch (error) {
    logger.error("Error calculating USDT → INR:", error);
    throw error;
  }
};

// ---------------- INR → USDT ----------------
export const calculateInrToUsdt = async (listingId, inrAmount) => {
  try {
    const listing = await Listing.findById(listingId).populate("sellerId");
    if (!listing || listing.status !== "active") {
      throw new Error("Listing not available");
    }

    const isInstantSeller = listing.isInstantSeller || false;

    let cryptoAmount = inrAmount / listing.pricePerUnit;

    if (cryptoAmount > listing.availableAmount) {
      if (isInstantSeller) {
        cryptoAmount = listing.availableAmount;
      } else {
        throw new Error("Insufficient amount in listing");
      }
    }

    const liveUsdtPrice = await priceFeedService.getUsdtInrPrice();
    const fees = await feeCalculatorService.calculateTradeFees(
      cryptoAmount,
      listing.pricePerUnit
    );

    return {
      inputAmount: inrAmount,
      inputCurrency: "INR",
      cryptoAmount,
      buyerWillReceive: cryptoAmount,
      sellerPricePerUnit: listing.pricePerUnit,
      effectivePricePerUnit: fees.effectivePricePerUnit,
      liveUsdtPrice,
      sellerNetINR: fees.sellerNetINR,
      platformFeeINR: fees.platformFeeINR,
      gasFeeINR: fees.gasFeeINR,
      totalINRBuyerPays: fees.totalINRBuyerPays,
      platformFeeUSDT: fees.platformFeeUSDT,
      sellerMustDepositUSDT: fees.sellerMustDepositUSDT,
      feeBreakdown: fees.feeBreakdown,
      sellerDetails: {
        name: listing.sellerId.name,
        bankDetails: listing.sellerId.bankDetails,
        paymentMethods: listing.paymentMethods,
        isInstantSeller,
      },
      escrowWallet: process.env.ESCROW_WALLET_ADDRESS || "0x...",
      calculationNote: isInstantSeller
        ? `Instant Seller: You pay ₹${fees.totalINRBuyerPays} for ${cryptoAmount} USDT.`
        : `Regular Seller: Seller deposits ${fees.sellerMustDepositUSDT} USDT to escrow. You pay ₹${fees.totalINRBuyerPays}.`,
    };
  } catch (error) {
    logger.error("Error calculating INR → USDT:", error);
    throw error;
  }
};
/**
 * Submit deposit hash (REGULAR SELLER submits blockchain tx hash)
 * NOTE: This is ONLY for REGULAR SELLERS.
 * For INSTANT SELLERS, use confirmInstantSellerTrade() instead.
 * @param {string} tradeId - Trade ID
 * @param {string} sellerId - Seller user ID
 * @param {string} transactionHash - Blockchain transaction hash
 * @returns {Object} Updated trade
 */
export const submitDepositHash = async (tradeId, sellerId, transactionHash) => {
  try {
    const trade = await Trade.findOne({ _id: tradeId, sellerId });

    if (!trade) {
      throw new Error("Trade not found or unauthorized");
    }

    if (trade.status !== TRADE_STATUS.PENDING_SELLER_DEPOSIT) {
      throw new Error(
        `Cannot submit deposit hash. Current status: ${trade.status}`
      );
    }

    if (trade.isExpired()) {
      trade.status = TRADE_STATUS.EXPIRED;
      await trade.save();
      throw new Error("Trade has expired");
    }

    // Update to DEPOSIT_SUBMITTED status
    trade.status = TRADE_STATUS.DEPOSIT_SUBMITTED;
    trade.escrowTransactionHash = transactionHash;
    // trade.escrowAddress already set in initiateTrade or can be refreshed
    
    trade.addTimelineEvent(
      "Deposit Hash Submitted",
      `Seller submitted tx hash: ${transactionHash}. Awaiting Platform B verification.`,
      sellerId
    );

    // Clear the deposit timer, set new expiry for verification (internal, 1 hour)
    trade.expiresAt = new Date(Date.now() + 60 * 60000);

    await trade.save();

    // ✅ Create EscrowTransaction record
    const escrowTx = new EscrowTransaction({
      tradeId: trade._id,
      userId: sellerId,
      transactionType: ESCROW_TRANSACTION_TYPE.DEPOSIT,
      cryptoType: trade.cryptoType || "USDT",
      network: trade.networkName,
      amount: trade.sellerMustDepositUSDT,
      fromAddress: trade.sellerWalletAddress || "0xManual", // From seller
      toAddress: trade.escrowAddress,
      txHash: transactionHash,
      status: ESCROW_TRANSACTION_STATUS.PENDING,
    });

    await escrowTx.save();

    // ✅ Add job to Escrow Monitor Queue
    await escrowMonitorQueue.add(
      "check_confirmations",
      {
        escrowId: escrowTx._id,
        type: "check_confirmations",
      },
      {
        attempts: 15, // Retry for ~15 minutes if needed
        backoff: {
          type: "fixed",
          delay: 60000, // Every 1 minute
        },
      }
    );

    // Log the audit event
    await auditService.logTradeAction(
      AUDIT_ACTION.ESCROW_DEPOSIT,
      sellerId,
      "SELLER",
      trade._id,
      { transactionHash, escrowAddress: trade.escrowAddress }
    );

    logger.info("Deposit hash submitted", { tradeId, transactionHash });

    // Emit socket event
    socketEvents.emitDepositSubmitted(trade);

    // Create system message
    await Message.createSystemMessage(
      trade.chatId,
      `Seller submitted deposit transaction. Awaiting Platform B verification.`
    );

    return trade;
  } catch (error) {
    logger.error("Error submitting deposit hash:", error);
    throw error;
  }
};

/**
 * Mark payment as NOT credited (Seller marks INR payment not received)
 * This creates a dispute
 * @param {string} tradeId - Trade ID
 * @param {string} sellerId - Seller user ID
 * @param {string} reason - Reason for dispute
 * @returns {Object} Updated trade with dispute
 */
export const markNotCredited = async (tradeId, sellerId, reason) => {
  try {
    const trade = await Trade.findOne({ _id: tradeId, sellerId });

    if (!trade) {
      throw new Error("Trade not found or unauthorized");
    }

    if (trade.status !== TRADE_STATUS.PAYMENT_PROOF_UPLOADED) {
      throw new Error(
        `Cannot mark as not credited. Current status: ${trade.status}`
      );
    }

    // Create dispute
    const dispute = new Dispute({
      tradeId: trade._id,
      createdBy: sellerId,
      reason: reason || "Seller did not receive INR payment",
      evidence: [],
      status: "open",
    });

    await dispute.save();

    // Update trade
    trade.status = TRADE_STATUS.DISPUTED;
    trade.hasDispute = true;
    trade.disputeId = dispute._id;
    trade.disputeCreatedAt = new Date();
    trade.sellerPaymentConfirmation = {
      confirmed: false,
      confirmedAt: new Date(),
      remarks: reason,
    };

    trade.addTimelineEvent(
      "Payment Disputed",
      `Seller marked payment as not received. Dispute created.`,
      sellerId
    );

    await trade.save();

    logger.info("Payment marked as not credited, dispute created", {
      tradeId,
      disputeId: dispute._id,
    });

    return {
      trade: await trade.populate("disputeId"),
      dispute,
    };
  } catch (error) {
    logger.error("Error marking payment as not credited:", error);
    throw error;
  }
};

/**
 * Appeal a trade (usually after a dispute or when payment is being processed)
 * @param {string} tradeId - Trade ID
 * @param {string} userId - User ID who is appealing
 * @param {string} reason - Reason for appeal
 * @returns {Object} Updated trade
 */
export const appealTrade = async (tradeId, userId, reason) => {
  try {
    const trade = await Trade.findById(tradeId);

    if (!trade) {
      throw new Error("Trade not found");
    }

    // Authorization: only buyer or seller can appeal
    if (
      trade.buyerId.toString() !== userId &&
      trade.sellerId.toString() !== userId
    ) {
      throw new Error("Unauthorized to appeal this trade");
    }

    // Business logic: when can a trade be appealed?
    // Often after a dispute is raised, or if they disagree with something.
    // Let's allow appealing if it's DISPUTED or in PAYMENT_PROOF_UPLOADED
    const allowedStatuses = [
      TRADE_STATUS.DISPUTED,
      TRADE_STATUS.PAYMENT_PROOF_UPLOADED,
    ];

    if (!allowedStatuses.includes(trade.status)) {
      throw new Error(`Cannot appeal trade in its current status: ${trade.status}`);
    }

    // Update trade status to APPEALED
    trade.status = TRADE_STATUS.APPEALED;
    trade.isAppealed = true;
    trade.appealReason = reason;
    trade.appealedBy = userId;
    trade.appealedAt = new Date();

    trade.addTimelineEvent(
      "Trade Appealed",
      `User appealed the trade. Reason: ${reason}`,
      userId
    );

    await trade.save();

    logger.info("Trade appealed", { tradeId, userId, reason });

    // Notify parties via socket
    socketEvents.emitOrderAppealed(trade);

    // Create notification
    await notificationService.notifyTradeAppealed(trade);

    return trade;
  } catch (error) {
    logger.error("Error appealing trade:", error);
    throw error;
  }
};

/**
 * Resolve an appeal (Admin action)
 * @param {string} tradeId - Trade ID
 * @param {string} adminId - Admin ID
 * @param {string} decision - 'approved' or 'rejected'
 * @param {string} remarks - Admin remarks
 * @returns {Object} Updated trade
 */
export const resolveAppeal = async (tradeId, adminId, decision, remarks) => {
  try {
    const trade = await Trade.findById(tradeId);

    if (!trade) {
      throw new Error("Trade not found");
    }

    if (trade.status !== TRADE_STATUS.APPEALED) {
      throw new Error("Trade is not in appealed status");
    }

    if (!["approved", "rejected"].includes(decision)) {
      throw new Error("Invalid decision. Must be 'approved' or 'rejected'");
    }

    trade.appealResolution = {
      status: decision,
      resolvedAt: new Date(),
      resolvedBy: adminId,
      remarks,
    };

    // If approved, we might want to move it back to a certain status or handle it specifically.
    // For now, let's keep it simple: if approved, maybe we move it back to DISPUTED or COMPLETED?
    // User requirement: "update the transaction status based on the admin's decision"

    // Logic: 
    // - If appeal is approved (e.g., buyer was right), we might COMPLETED the trade.
    // - If appeal is rejected, we might move it back to its previous state or CANCEL it.

    // Let's say: 
    // Approved -> Completed (Escrow released to buyer)
    // Rejected -> Cancelled (Escrow returned to seller - although this depends on the specific case)

    // Wait, the requirement says "update the transaction status based on the admin's decision".
    // I will set it to COMPLETED if approved, and CANCELLED if rejected for now, 
    // or maybe just keep it as is and let the admin handle it further?
    // Actually, usually an appeal resolution has a definitive outcome.

    if (decision === "approved") {
      trade.status = TRADE_STATUS.COMPLETED;
      trade.completedAt = new Date();
      trade.addTimelineEvent(
        "Appeal Approved",
        `Admin approved the appeal. Trade completed. Remarks: ${remarks}`,
        adminId
      );
    } else {
      trade.status = TRADE_STATUS.CANCELLED;
      trade.cancelledAt = new Date();
      trade.addTimelineEvent(
        "Appeal Rejected",
        `Admin rejected the appeal. Trade cancelled. Remarks: ${remarks}`,
        adminId
      );
    }

    await trade.save();

    logger.info(`Appeal ${decision} by admin`, { tradeId, adminId });

    // Notify parties
    if (trade.status === TRADE_STATUS.COMPLETED) {
      socketEvents.emitOrderCompleted(trade);
    } else if (trade.status === TRADE_STATUS.CANCELLED) {
      socketEvents.emitOrderCancelled(trade, `Appeal rejected: ${remarks}`);
    }

    // Create notification
    await notificationService.notifyAppealResolved(trade);

    return trade;
  } catch (error) {
    logger.error("Error resolving appeal:", error);
    throw error;
  }
};

/**
 * Confirm payment as CREDITED (Seller confirms INR received)
 * This triggers escrow release
 * @param {string} tradeId - Trade ID
 * @param {string} sellerId - Seller user ID
 * @param {string} remarks - Optional remarks
 * @returns {Object} Updated trade
 */
export const markCredited = async (tradeId, sellerId, remarks = "") => {
  try {
    const trade = await Trade.findOne({ _id: tradeId, sellerId });

    if (!trade) {
      throw new Error("Trade not found or unauthorized");
    }

    if (trade.status !== TRADE_STATUS.PAYMENT_PROOF_UPLOADED) {
      throw new Error(
        `Cannot confirm payment. Current status: ${trade.status}`
      );
    }

    // Update seller confirmation
    trade.sellerPaymentConfirmation = {
      confirmed: true,
      confirmedAt: new Date(),
      remarks,
    };

    trade.status = TRADE_STATUS.PENDING_SELLER_CONFIRMATION;
    trade.addTimelineEvent(
      "Payment Confirmed by Seller",
      `Seller confirmed INR payment received. ${remarks}`,
      sellerId
    );

    await trade.save();

    logger.info("Payment confirmed by seller", { tradeId, sellerId });

    // Emit socket event
    socketEvents.emitOrderPaymentConfirmed(trade);

    // Send real-time notification
    notificationService.notifyPaymentConfirmedBySeller(trade);

    // Create system message
    await Message.createSystemMessage(
      trade.chatId,
      `Seller confirmed payment received. Crypto will be released to buyer shortly.`
    );

    // ✅ AUTO-RELEASE if enabled (Instant Seller)
    if (trade.autoReleaseEnabled) {
      try {
        const escrowService = await import("./escrow.service.js");
        const releaseHash = `AUTO-RELEASE-${Date.now()}`;

        logger.info("Triggering auto-release for instant seller trade", { tradeId });

        // This will set status to COMPLETED and emit completion events
        const result = await escrowService.releaseEscrowToBuyer(
          trade._id,
          null, // system action, no admin ID
          releaseHash
        );

        return result.trade;
      } catch (err) {
        logger.error("Auto-release failed", err);
        // Continue returning the trade in PENDING_SELLER_CONFIRMATION state so it can be retried or admin handled
      }
    }

    return trade;
  } catch (error) {
    logger.error("Error confirming payment:", error);
    throw error;
  }
};

/**
 * Confirm Instant Seller Trade (Seller accepts the trade request)
 * This locks funds from seller's pre-deposited escrow balance
 * @param {string} tradeId - Trade ID
 * @param {string} sellerId - Seller user ID
 * @param {string} remarks - Optional remarks
 * @returns {Object} Updated trade
 */
export const confirmInstantSellerTrade = async (
  tradeId,
  sellerId,
  remarks = ""
) => {
  try {
    const trade = await Trade.findOne({ _id: tradeId, sellerId })
      .populate("listingId")
      .populate("sellerId");

    if (!trade) {
      throw new Error("Trade not found or unauthorized");
    }

    // Verify this is an instant seller trade
    if (!trade.isInstantSeller) {
      throw new Error("This is not an instant seller trade");
    }

    // Check status is PENDING_SELLER_CONFIRMATION
    if (trade.status !== TRADE_STATUS.PENDING_SELLER_CONFIRMATION) {
      throw new Error(`Cannot confirm trade. Current status: ${trade.status}`);
    }

    // Check if trade has expired
    if (trade.isExpired()) {
      trade.status = TRADE_STATUS.EXPIRED;
      await trade.save();
      throw new Error("Trade has expired");
    }

    // Get the seller user object
    const seller = trade.sellerId;

    // Verify seller has sufficient balance
    if (!seller.hasInstantSellerBalance(trade.sellerMustSend)) {
      throw new Error(
        `Insufficient instant seller balance. Required: ${trade.sellerMustSend} USDT, Available: ${seller.escrowDepositAmount} USDT`
      );
    }

    // Deduct balance from seller's escrow
    await seller.deductInstantSellerBalance(trade.sellerMustSend, trade._id);

    // Update trade status to ESCROW_CONFIRMED
    trade.status = TRADE_STATUS.ESCROW_CONFIRMED;

    // Add timeline event
    trade.addTimelineEvent(
      "Instant Seller Trade Confirmed",
      `Seller confirmed trade. Deducted ${trade.sellerMustSend} USDT from instant seller balance. Escrow locked. ${remarks}`,
      sellerId
    );

    // Update expiry for buyer payment (30 minutes)
    trade.expiresAt = new Date(Date.now() + 30 * 60000);

    await trade.save();

    logger.info("Instant seller trade confirmed", {
      tradeId: trade._id,
      sellerId,
      amount: trade.sellerMustSend,
      remainingBalance: seller.escrowDepositAmount,
    });

    // Emit socket event
    socketEvents.emitEscrowConfirmed(trade);

    // Send real-time notification
    notificationService.notifyEscrowConfirmed(trade);

    // Create system message
    await Message.createSystemMessage(
      trade.chatId,
      `Seller confirmed trade. Escrow locked. Buyer can now proceed with payment.`,
      {
        messageType: "action",
        actionType: "escrow-confirmed",
      }
    );

    return trade;
  } catch (error) {
    logger.error("Error confirming instant seller trade:", error);
    throw error;
  }
};

/**
 * Get all appealed trades (Admin)
 */
export const getAllAppealedTrades = async () => {
  try {
    const trades = await Trade.find({ status: TRADE_STATUS.APPEALED })
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .sort({ appealedAt: -1 });

    return trades;
  } catch (error) {
    logger.error("Error getting appealed trades:", error);
    throw error;
  }
};

export default {
  initiateTrade,
  getTradeById,
  getUserTrades,
  markEscrowDeposited,
  uploadPaymentProof,
  confirmPayment,
  completeTrade,
  cancelTrade,
  getActiveTradesCount,
  getUserTradeStats,
  getAllTrades,
  // New methods for Phase 1
  calculateOrderAmount,
  calculateUsdtToInr,
  calculateInrToUsdt,
  submitDepositHash,
  markNotCredited,
  markCredited,
  // Instant Seller Trade Confirmation
  confirmInstantSellerTrade,
  appealTrade,
  resolveAppeal,
  getAllAppealedTrades,
};
