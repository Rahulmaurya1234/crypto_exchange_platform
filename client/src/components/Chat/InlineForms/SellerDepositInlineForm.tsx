// src/components/Chat/InlineForms/SellerDepositInlineForm.tsx
import { useState, useEffect, useMemo } from "react";
import { Wallet, Copy, CheckCircle, ShieldCheck, XCircle, Calendar } from "lucide-react";
import type { SellerApproval } from "../../../types/chat.types";
import api from "../../../api/axios";
import SummaryApi from "../../../api/SummaryApi";
import SecureImage from "../../SecureImage";

interface AadhaarDoc {
  frontImageUrl?: string;
  backImageUrl?: string;
  documentNumber?: string;
  uploadedAt?: string; // Add this
}

interface ListingData {
  _id?: string;
  id?: string;
  createdBy?: string;
  isInstantSeller?: boolean;
}

interface SellerData {
  _id?: string;
  id?: string;
  isInstantSeller?: boolean;
}

interface TradeData {
  cryptoAmount: number;
  escrowWalletAddress?: string;
  requiredDeposit?: number;
  buyerWillReceive?: number;
  totalINRAmount?: number;
  paymentMethod?: string;
  tradeNumber?: string;
  totalValue?: number;
  feeBreakdown?: {
    cryptoPlatformFeePercent?: number;
    gasFeePercent?: number;
    platformFeePercent?: number;
    platformFeeUSDT?: number;
  };
  buyerAadhaarDocument?: AadhaarDoc;
  buyerAadhaarProof?: AadhaarDoc;
  isInstantSeller?: boolean;
  network?: string;
  cryptoType?: string;
  listingId?: ListingData;
  sellerId?: SellerData;
}

interface SellerDepositInlineFormProps {
  tradeId: string;
  onApprove: (data: SellerApproval) => void;
  onReject?: (reason?: string) => void;
}

export default function SellerDepositInlineForm({
  tradeId,
  onApprove,
  onReject,
}: SellerDepositInlineFormProps) {
  const [tradeData, setTradeData] = useState<TradeData | null>(null);
  const [loadingTrade, setLoadingTrade] = useState(true);
  const [txHash, setTxHash] = useState("");
  const [copying, setCopying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Memoize image URLs to prevent reloading (must be before early returns)
  const aadhaarImages = useMemo(
    () => ({
      frontKYC: tradeData?.buyerAadhaarDocument?.frontImageUrl,
      backKYC: tradeData?.buyerAadhaarDocument?.backImageUrl,
      frontProof: tradeData?.buyerAadhaarProof?.frontImageUrl,
      backProof: tradeData?.buyerAadhaarProof?.backImageUrl,
    }),
    [
      tradeData?.buyerAadhaarDocument?.frontImageUrl,
      tradeData?.buyerAadhaarDocument?.backImageUrl,
      tradeData?.buyerAadhaarProof?.frontImageUrl,
      tradeData?.buyerAadhaarProof?.backImageUrl,
    ]
  );

  // Determine if this is truly an instant seller (must be before early returns)
  const isInstantSellerDeposit = useMemo(() => {
    if (!tradeData) return false;
    const sellerIsInstant =
      tradeData.isInstantSeller || tradeData.sellerId?.isInstantSeller;
    const listingCreatedByInstant =
      tradeData.listingId?.createdBy === "InstantSeller";
    return sellerIsInstant && listingCreatedByInstant;
  }, [tradeData]);

  // Format date function
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (!tradeId) return;

    const fetchTrade = async () => {
      try {
        setLoadingTrade(true);
        const config = SummaryApi.getTradeById(tradeId);
        const res = await api({ url: config.url, method: config.method });
        const trade = res.data?.data?.trade || res.data?.trade || res.data;
        console.log("102 Fetched trade data:", trade._id);
        const normalized: TradeData = {
          cryptoAmount: trade.cryptoAmount || 0,
          escrowWalletAddress: trade.escrowWallet || trade.escrowWalletAddress,
          requiredDeposit:
            trade.sellerMustDepositUSDT ||
            trade.requiredDeposit ||
            trade.sellerMustSend,
          buyerWillReceive: trade.buyerWillReceive,
          totalINRAmount: trade.totalINRAmount,
          paymentMethod: trade.paymentMethod,
          tradeNumber: trade.tradeNumber,
          totalValue: trade.totalValue,
          feeBreakdown: trade.feeBreakdown,
          buyerAadhaarDocument: trade.buyerAadhaarDocument,
          buyerAadhaarProof: trade.buyerAadhaarProof,
          isInstantSeller: trade.isInstantSeller,
          network: trade.networkName || trade.network,
          cryptoType: trade.cryptoType,
          listingId: trade.listingId,
          sellerId: trade.sellerId,
        };

        setTradeData(normalized);
      } catch (err: any) {
        alert(err?.response?.data?.message || "Failed to load trade");
      } finally {
        setLoadingTrade(false);
      }
    };

    fetchTrade();
  }, [tradeId]);

  if (loadingTrade) {
    return (
      <div className="flex justify-start mb-4 sm:mb-6 px-2 sm:px-0">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-lg">
          <div className="animate-pulse space-y-4 sm:space-y-5">
            <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-700 rounded-xl sm:rounded-2xl w-3/4" />
            <div className="space-y-3 sm:space-y-4">
              <div className="h-16 sm:h-20 bg-gray-200 dark:bg-gray-800 rounded-xl sm:rounded-2xl" />
              <div className="h-16 sm:h-20 bg-gray-200 dark:bg-gray-800 rounded-xl sm:rounded-2xl" />
              <div className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-800 rounded-xl sm:rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tradeData) return null;

  const cryptiansFee = tradeData.cryptoAmount * 0.04;
  const gasFee = 2.45;
  const depositToEscrow =
    tradeData.requiredDeposit || tradeData.cryptoAmount + cryptiansFee + gasFee;

  const copyAddress = () => {
    if (tradeData.escrowWalletAddress) {
      navigator.clipboard.writeText(tradeData.escrowWalletAddress);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    }
  };

  const handleSubmit = async () => {
    if (!txHash.trim()) {
      alert("Please enter transaction hash");
      return;
    }

    setSubmitting(true);
    try {
      const config = SummaryApi.submitDepositeHash(tradeId, txHash.trim());
      await api({ url: config.url, method: config.method, data: config.data });

      onApprove({
        approved: true,
        usdtToEscrow: depositToEscrow,
        txnHash: txHash.trim(),
        feeDetails: {
          usdtAmount: tradeData.cryptoAmount,
          cryptiansFee,
          totalFee: cryptiansFee + gasFee,
        },
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Deposit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeposit = async () => {
    setSubmitting(true);
    try {
      // Call backend API to confirm instant seller trade
      const config = SummaryApi.confirmInstantSellerTrade(tradeId);
      await api({
        url: config.url,
        method: config.method,
        data: { remarks: "" }, // ✅ Send empty body to avoid undefined req.body
      });

      // After successful API call, notify parent component
      onApprove({
        approved: true,
        usdtToEscrow: depositToEscrow,
        txnHash: "instant-seller-confirmed",
        feeDetails: {
          usdtAmount: tradeData.cryptoAmount,
          cryptiansFee,
          totalFee: cryptiansFee + gasFee,
        },
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Confirmation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectDeposit = async () => {
    if (!onReject) return;

    const reason = prompt("Please provide a reason for rejection (optional):");
    setRejecting(true);
    try {
      onReject(reason || "Seller declined to deposit");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Rejection failed");
    } finally {
      setRejecting(false);
    }
  };

  const fee = tradeData.feeBreakdown || {};

  return (
    <div className="flex justify-start mb-4 sm:mb-6 px-2 sm:px-0">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-7 w-full max-w-2xl lg:max-w-3xl shadow-lg">
        {/* Header - More compact */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-5 lg:mb-7">
          <Wallet className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-500 dark:text-orange-400 flex-shrink-0" />
          <h3 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
            Deposit USDT to Escrow
          </h3>
        </div>

        {/* Deposit Amount Card - Reduced padding */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border border-orange-200 dark:border-orange-700 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-7 mb-4 sm:mb-5 lg:mb-7">
          <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm lg:text-base mb-1 sm:mb-2 lg:mb-3">
            You must deposit:
          </p>
          <p className="text-xl sm:text-2xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 lg:mb-6 break-all">
            {depositToEscrow.toFixed(4)} {tradeData.cryptoType || "USDT"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 text-gray-800 dark:text-gray-200">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Trade Amount</p>
              <p className="text-base sm:text-lg lg:text-2xl font-bold">
                {tradeData.cryptoAmount} {tradeData.cryptoType || "USDT"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Network</p>
              <p className="text-base sm:text-lg lg:text-2xl font-bold capitalize">
                {tradeData.network || "Ethereum"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                Crypto Fee
              </p>
              <p className="text-base sm:text-lg lg:text-2xl font-bold">
                {(cryptiansFee + gasFee).toFixed(4)} {tradeData.cryptoType || "USDT"}
              </p>
            </div>
          </div>
        </div>

        {/* Trade Summary - More compact */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 border border-gray-200 dark:border-gray-700 mb-4 sm:mb-5 lg:mb-7 space-y-2 sm:space-y-3 lg:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Trade #</p>
              <p className="font-mono text-xs sm:text-sm lg:text-base break-all text-gray-900 dark:text-white">
                {tradeData.tradeNumber || "—"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Payment Method</p>
              <p className="font-medium text-xs sm:text-sm lg:text-base text-gray-900 dark:text-white">
                {tradeData.paymentMethod?.replace(/_/g, " ").toUpperCase() ||
                  "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 pt-2 sm:pt-3 lg:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Buyer receives</p>
              <p className="text-base sm:text-lg lg:text-2xl font-bold text-green-600 dark:text-green-400">
                {tradeData.buyerWillReceive?.toFixed(4) || "—"} {tradeData.cryptoType || "USDT"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">You receive</p>
              <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                ₹
                {(tradeData.totalINRAmount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Fee Breakdown - More compact */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 border border-gray-200 dark:border-gray-700 space-y-1 sm:space-y-2 lg:space-y-3 text-xs mb-4 sm:mb-5 lg:mb-7">
          <h4 className="font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 lg:mb-3 text-sm">
            Fee Breakdown
          </h4>
          <div className="space-y-1 sm:space-y-2 text-gray-700 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Platform Fee %</span>
              <span className="font-mono">
                {fee.platformFeePercent ?? "-"}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Gas Fee %</span>
              <span className="font-mono">{fee.gasFeePercent ?? "-"}%</span>
            </div>
            <div className="flex justify-between">
              <span>Crypto Platform Fee %</span>
              <span className="font-mono">
                {fee.cryptoPlatformFeePercent ?? "-"}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee (USDT)</span>
              <span className="font-mono">
                {fee.platformFeeUSDT?.toFixed(4) ?? "-"} USDT
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Value</span>
              <span className="font-mono text-gray-900 dark:text-white">{tradeData.totalINRAmount ?? "-"}</span>
            </div>
          </div>
        </div>

        {/* Aadhaar Images - Now with upload dates */}
        {(tradeData.buyerAadhaarDocument || tradeData.buyerAadhaarProof) && (
          <div className="my-4 sm:my-5 lg:my-7">
            <h4 className="text-gray-900 dark:text-white font-bold text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 lg:mb-5 flex items-center gap-1 sm:gap-2 lg:gap-3">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
              Buyer Identity Documents
            </h4>


{/* KYC Document Section */}
{tradeData.buyerAadhaarDocument && (
  <div className="mb-4 sm:mb-5 lg:mb-6">
    <div className="flex items-center gap-2 mb-3 sm:mb-4">
      <h5 className="text-gray-900 dark:text-white font-medium text-sm sm:text-base">
        KYC Document
      </h5>
      {tradeData.buyerAadhaarDocument.uploadedAt && (
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
          <Calendar className="w-3 h-3" />
          <span>Uploaded: {formatDate(tradeData.buyerAadhaarDocument.uploadedAt)}</span>
        </div>
      )}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
      {aadhaarImages.frontKYC && (
        <div
          key={`kyc-front-${aadhaarImages.frontKYC}`}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-4 border border-gray-200 dark:border-gray-700"
        >
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 sm:mb-2 lg:mb-3">
            Aadhaar Front (KYC)
          </p>
          <SecureImage
            src={aadhaarImages.frontKYC}
            alt="Aadhaar Front"
            className="w-full rounded-md sm:rounded-lg lg:rounded-xl border border-gray-300 dark:border-gray-600"
            loading="lazy"
            // fallbackComponent={
            //   <div className="w-full h-24 sm:h-32 lg:h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md sm:rounded-lg lg:rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs">
            //     Image not available
            //   </div>
            // }
          />
        </div>
      )}
      {aadhaarImages.backKYC && (
        <div
          key={`kyc-back-${aadhaarImages.backKYC}`}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-4 border border-gray-200 dark:border-gray-700"
        >
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 sm:mb-2 lg:mb-3">
            Aadhaar Back (KYC)
          </p>
          <SecureImage
            src={aadhaarImages.backKYC}
            alt="Aadhaar Back"
            className="w-full rounded-md sm:rounded-lg lg:rounded-xl border border-gray-300 dark:border-gray-600"
            loading="lazy"
            // fallbackComponent={
            //   <div className="w-full h-24 sm:h-32 lg:h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md sm:rounded-lg lg:rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs">
            //     Image not available
            //   </div>
            // }
          />
        </div>
      )}
    </div>

    {tradeData.buyerAadhaarDocument.documentNumber && (
      <div className="mt-3 sm:mt-4 space-y-2">
        <p className="text-gray-500 dark:text-gray-400 text-xs">
          Document Number:{" "}
          <span className="font-mono text-gray-900 dark:text-white break-all">
            {tradeData.buyerAadhaarDocument.documentNumber}
          </span>
        </p>
      </div>
    )}
  </div>
)}
          </div>
        )}


{/* Trade-Level Aadhaar Proof - Now with upload date */}
{tradeData.buyerAadhaarProof && (
  <div className="my-4 sm:my-5 lg:my-7 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 border border-purple-200 dark:border-purple-700">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-3 lg:mb-4">
      <h4 className="text-gray-900 dark:text-white font-bold text-sm sm:text-base lg:text-lg">
        Additional Proof (This Trade)
      </h4>
      {tradeData.buyerAadhaarProof.uploadedAt && (
        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs bg-white/50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
          <Calendar className="w-3 h-3" />
          <span>Uploaded: {formatDate(tradeData.buyerAadhaarProof.uploadedAt)}</span>
        </div>
      )}
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
      {aadhaarImages.frontProof && (
        <div className="relative">
          <SecureImage
            src={aadhaarImages.frontProof}
            alt="Proof Front"
            className="w-full rounded-md sm:rounded-lg lg:rounded-xl border border-gray-300 dark:border-gray-500"
            loading="lazy"
            // fallbackComponent={
            //   <div className="w-full h-24 sm:h-32 lg:h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md sm:rounded-lg lg:rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs">
            //     Image not available
            //   </div>
            // }
          />
        </div>
      )}
      {aadhaarImages.backProof && (
        <div className="relative">
          <SecureImage
            src={aadhaarImages.backProof}
            alt="Proof Back"
            className="w-full rounded-md sm:rounded-lg lg:rounded-xl border border-gray-300 dark:border-gray-500"
            loading="lazy"
            // fallbackComponent={
            //   <div className="w-full h-24 sm:h-32 lg:h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md sm:rounded-lg lg:rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs">
            //     Image not available
            //   </div>
            // }
          />
        </div>
      )}
    </div>
  </div>
)}

        {/* Escrow Address - More compact */}
        {tradeData.escrowWalletAddress && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 border border-gray-200 dark:border-gray-700 mb-4 sm:mb-5 lg:mb-7 relative">
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-2 sm:mb-3 lg:mb-4">
              Send USDT to this escrow wallet:
            </p>
            <div className="font-mono text-xs sm:text-sm lg:text-base break-all pr-0 sm:pr-20 lg:pr-24 mb-3 sm:mb-4 lg:mb-0 text-gray-900 dark:text-white">
              {tradeData.escrowWalletAddress}
            </div>
            <button
              onClick={copyAddress}
              className="w-full sm:w-auto sm:absolute sm:top-3 sm:right-3 lg:top-5 lg:right-5 px-3 sm:px-4 lg:px-5 py-2 sm:py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg sm:rounded-xl lg:rounded-2xl text-gray-900 dark:text-white font-medium transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base"
            >
              {copying ? (
                <>
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  Copy Address
                </>
              )}
            </button>
          </div>
        )}

        {/* Transaction Hash Input OR Instant Seller Buttons - More compact */}
        {isInstantSellerDeposit ? (
          <div className="space-y-3 sm:space-y-4 lg:space-y-5">
            <div className="text-center py-3 sm:py-4 lg:py-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl lg:rounded-3xl mb-3 sm:mb-4 lg:mb-5 border border-blue-200 dark:border-blue-700">
              <h4 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Instant Seller Mode
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-xs px-2 sm:px-4">
                Review the deposit details and confirm or reject
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
              <button
                onClick={handleConfirmDeposit}
                disabled={submitting || rejecting}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 text-white font-bold py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-md hover:shadow-green-500/50 dark:hover:shadow-green-600/60 transition-all text-sm sm:text-base lg:text-lg flex items-center justify-center gap-1 sm:gap-2 lg:gap-3"
              >
                {submitting ? (
                  <>Confirming...</>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    Confirm
                  </>
                )}
              </button>

              <button
                onClick={handleRejectDeposit}
                disabled={submitting || rejecting || !onReject}
                className="
    bg-gradient-to-r from-orange-500 to-amber-500
    hover:from-orange-600 hover:to-amber-600
    disabled:from-gray-300 disabled:to-gray-400
    dark:disabled:from-gray-700 dark:disabled:to-gray-800
    text-white font-bold
    py-3 sm:py-4 lg:py-5
    rounded-xl sm:rounded-2xl lg:rounded-3xl
    shadow-md hover:shadow-orange-500/50 dark:hover:shadow-orange-600/60
    transition-all
    text-sm sm:text-base lg:text-lg
    flex items-center justify-center gap-1 sm:gap-2 lg:gap-3
  "
              >
                {rejecting ? (
                  <>Submitting Appeal...</>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    Appeal
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 lg:space-y-5">
            <input
              type="text"
              placeholder="Enter transaction hash (txid)"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl lg:rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/40 focus:border-transparent transition-all font-mono text-xs sm:text-sm lg:text-base"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !txHash.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 text-white font-bold py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-md hover:shadow-red-500/50 dark:hover:shadow-red-600/60 transition-all text-sm sm:text-base lg:text-lg flex items-center justify-center gap-1 sm:gap-2 lg:gap-3"
            >
              {submitting ? (
                <>Confirming Deposit...</>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  Confirm Deposit
                </>
              )}
            </button>
            <p className="text-center text-gray-500 dark:text-gray-400 text-xs">
              Network: <span className="capitalize">{tradeData.network || "Ethereum"}</span> • Expected confirmations: 12 blocks
            </p>
          </div>
        )}
      </div>
    </div>
  );
}