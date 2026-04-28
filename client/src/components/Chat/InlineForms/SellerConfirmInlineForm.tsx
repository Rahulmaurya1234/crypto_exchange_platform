// src/components/Chat/InlineForms/SellerConfirmInlineForm.tsx
import { useState, useEffect, useMemo } from "react";
import { CheckCircle, AlertTriangle, Eye, ShieldAlert, XCircle } from "lucide-react";
import type {
  PaymentConfirmation,
  PaymentDetails,
} from "../../../types/chat.types";
import api from "../../../api/axios";
import SummaryApi from "../../../api/SummaryApi";
import SecureImage from "../../SecureImage";

interface SellerConfirmInlineFormProps {
  tradeId: string; // we need this to call mark-credited + fetch trade
  paymentData: PaymentDetails;
  onConfirm: (data: PaymentConfirmation) => void;
  onReject: (reason: string) => void;
}

type TradeInfoState = {
  totalINRAmount: number;
  tradeNumber: string;
  paymentMethod?: string | null;
  buyerPaymentProof?: string;
  buyerPaymentUTR?: string;
  buyerPaymentBank?: string;
  buyerPaymentRemarks?: string;
  buyerPaidAmount?: number;
} | null;

export default function SellerConfirmInlineForm({
  tradeId,
  paymentData,
  onConfirm,
  onReject,
}: SellerConfirmInlineFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // extra backend trade info
  const [tradeInfo, setTradeInfo] = useState<TradeInfoState>(null);

  // 🔁 fetch trade details on mount / when tradeId changes
  useEffect(() => {
    const fetchTrade = async () => {
      try {
        if (!tradeId) return;

        const config = SummaryApi.getTradeById(tradeId);
        const res = await api(config);

        const trade =
          res.data?.data?.trade ||
          res.data?.trade ||
          res.data;

        console.log("[SellerConfirmInlineForm] Fetched trade:", trade);
        if (!trade) return;

        const totalINRAmount = Number(trade.totalINRAmount) || 0;
        const tradeNumber = trade.tradeNumber || "";
        const paymentMethod = trade.paymentMethod || null;

        // Safely read buyer payment details from backend
        const buyerPaymentDetails = trade.buyerPaymentDetails || {};

        const buyerPaymentProof =
          buyerPaymentDetails.proofUrl ||
          buyerPaymentDetails.screenshot ||
          "";

        const buyerPaymentUTR =
          buyerPaymentDetails.transactionId ||
          buyerPaymentDetails.utrNumber ||
          "";

        const buyerPaymentBank =
          buyerPaymentDetails.bank ||
          buyerPaymentDetails.bankName ||
          "";

        const buyerPaymentRemarks =
          buyerPaymentDetails.remarks || "";

        const buyerPaidAmount =
          Number(buyerPaymentDetails.amount) ||
          Number(buyerPaymentDetails.amountPaid) ||
          totalINRAmount ||
          0;

        setTradeInfo({
          totalINRAmount,
          tradeNumber,
          paymentMethod,
          buyerPaymentProof,
          buyerPaymentUTR,
          buyerPaymentBank,
          buyerPaymentRemarks,
          buyerPaidAmount,
        });
      } catch (err) {
        console.error("[SellerConfirmInlineForm] Failed to fetch trade:", err);
      }
    };

    fetchTrade();
  }, [tradeId]);

  const handleConfirmClick = () => {
    // Show confirmation modal instead of directly confirming
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = async () => {
    if (!tradeId) {
      alert("Missing tradeId, cannot confirm payment.");
      return;
    }

    try {
      setSubmitting(true);
      setShowConfirmModal(false);

      // 🔥 CALL BACKEND: mark payment as credited
      const cfg = SummaryApi.markPaymentCreated(tradeId);
      await api({
        url: cfg.url,
        method: cfg.method,
        data: {
          remarks: "Payment received successfully",
        },
      });

      // ✅ Then notify chat flow
      onConfirm({
        confirmed: true,
        utrNumber:
          tradeInfo?.buyerPaymentUTR || paymentData.utrNumber || "",
      });
    } catch (err: any) {
      console.error("Failed to mark payment as credited:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to mark payment as credited"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispute = () => {
    const reason = prompt("Please explain why you are raising a dispute:");
    if (reason && reason.trim()) {
      onReject(reason.trim());
    }
  };

  // prefer backend-paid amount, then amountPaid from paymentData, then inrAmount, then backend total
  const displayAmount =
    Number(tradeInfo?.buyerPaidAmount) ||
    Number(paymentData.amountPaid ?? paymentData.inrAmount) ||
    tradeInfo?.totalINRAmount ||
    0;

  // bank: prefer backend, then what buyer sent in paymentData
  const bankLabel =
    tradeInfo?.buyerPaymentBank ||
    paymentData.bank ||
    paymentData.bankName ||
    "";

  const utrLabel =
    tradeInfo?.buyerPaymentUTR || paymentData.utrNumber || "";

  const remarksLabel =
    tradeInfo?.buyerPaymentRemarks || paymentData.remarks || "";

  const proofUrl =
    tradeInfo?.buyerPaymentProof ||
    paymentData.screenshot ||
    paymentData.proofUrl ||
    "";

  // Memoize proof URL to prevent reloading
  const paymentProofUrl = useMemo(() => proofUrl, [proofUrl]);

  return (
<div className="flex justify-start mb-4 sm:mb-6 px-2 sm:px-0">
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl sm:rounded-3xl p-4 sm:p-7 w-full max-w-2xl shadow-xl relative">
    {/* Header */}
    <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-7">
      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Confirm Payment Receipt</h3>
    </div>

    {/* Trade Meta Info */}
    {(tradeInfo?.tradeNumber || tradeInfo?.paymentMethod) && (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-5 sm:mb-7 border border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-3">
        {tradeInfo.tradeNumber && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
            <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Trade No:</span>
            <span className="font-mono font-bold text-base sm:text-lg break-all text-gray-900 dark:text-white">
              {tradeInfo.tradeNumber}
            </span>
          </div>
        )}
        {tradeInfo.paymentMethod && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
            <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Payment Method:</span>
            <span className="uppercase font-semibold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
              {tradeInfo.paymentMethod.replace(/_/g, ' ')}
            </span>
          </div>
        )}
        {tradeInfo.totalINRAmount > 0 && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
            <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total INR Amount:</span>
            <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              ₹{tradeInfo.totalINRAmount.toLocaleString("en-IN")}
            </span>
          </div>
        )}
      </div>
    )}

    {/* Payment Amount Card */}
    <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl sm:rounded-3xl p-5 sm:p-7 mb-5 sm:mb-7 border border-emerald-200 dark:border-emerald-500/40">
      <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-lg mb-2 sm:mb-3">Have you received:</p>
      <div className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-2 break-all">
        ₹{displayAmount.toLocaleString("en-IN")}
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">in your bank account?</p>
    </div>

    {/* Payment Details */}
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-5 sm:mb-7 border border-gray-200 dark:border-gray-700">
      <div className="font-bold text-gray-900 dark:text-white text-base sm:text-lg mb-3 sm:mb-4">Payment Details:</div>

      <div className="space-y-3 sm:space-y-4 text-gray-700 dark:text-gray-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">UTR Number:</span>
          <span className="font-mono font-semibold text-sm sm:text-lg break-all text-gray-900 dark:text-white">
            {utrLabel || '—'}
          </span>
        </div>

        {bankLabel && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
            <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Bank:</span>
            <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{bankLabel}</span>
          </div>
        )}

        {remarksLabel && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
            <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Remarks:</span>
            <span className="italic text-gray-600 dark:text-gray-400 text-sm sm:text-base">{remarksLabel}</span>
          </div>
        )}
      </div>
    </div>

    {/* Payment Proof Image */}
    {paymentProofUrl && (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-5 sm:mb-7 border border-gray-200 dark:border-gray-700">
        <div className="font-bold text-gray-900 dark:text-white text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 dark:text-blue-400 flex-shrink-0" />
          Payment Proof Screenshot
        </div>
        <div className="relative group">
          <SecureImage
            key={paymentProofUrl}
            src={paymentProofUrl}
            alt="Payment Proof"
            className="w-full rounded-xl sm:rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-lg"
            loading="lazy"
            fallbackComponent={
              <div className="w-full h-32 sm:h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                Image failed to load
              </div>
            }
          />
          <a
            href={paymentProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 sm:top-4 sm:right-4 px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600/90 dark:hover:bg-blue-700 rounded-xl sm:rounded-2xl text-white font-medium transition-all flex items-center gap-1 sm:gap-2 text-xs sm:text-sm opacity-0 group-hover:opacity-100"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Open Full Size</span>
            <span className="sm:hidden">View</span>
          </a>
        </div>
      </div>
    )}

    {/* Warning Notice */}
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-5 sm:mb-7 border border-yellow-200 dark:border-yellow-500/40">
      <div className="flex items-start gap-3 sm:gap-4">
        <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5 sm:mt-1" />
        <div>
          <h4 className="text-gray-900 dark:text-white font-bold text-base sm:text-lg mb-2">⚠️ Important Warning</h4>
          <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
            Only confirm if the money is <span className="font-bold text-yellow-600 dark:text-yellow-300">physically in your bank account</span>.
            Once confirmed, the crypto will be <span className="font-bold text-red-600 dark:text-red-300">irreversibly released</span> from
            the escrow wallet to the buyer.
          </p>
        </div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="space-y-3 sm:space-y-4">
      <button
        onClick={handleConfirmClick}
        disabled={submitting}
        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 text-white font-bold py-4 sm:py-5 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-emerald-500/50 dark:hover:shadow-emerald-600/60 transition-all text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3"
      >
        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        {submitting ? "Confirming..." : "Yes, I Received the Payment"}
      </button>

      <button
        onClick={handleDispute}
        disabled={submitting}
        className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 text-white font-bold py-4 sm:py-5 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-red-500/50 dark:hover:shadow-red-600/60 transition-all text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3"
      >
        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
        Appeal
      </button>

      <p className="text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
        Double-check your bank account before confirming
      </p>
    </div>

    {/* Confirmation Modal */}
    {showConfirmModal && (
      <div className="fixed inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 border-2 border-red-400 dark:border-red-500/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-600/30 rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-7 h-7 sm:w-10 sm:h-10 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Final Confirmation</h3>
          </div>

          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6">
            <p className="text-gray-900 dark:text-white text-sm sm:text-base leading-relaxed mb-3 sm:mb-4">
              <span className="font-bold text-red-600 dark:text-red-300">⚠️ WARNING:</span> Please double-check that you have <span className="font-bold">really received</span> the money in your bank account.
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3">
              Once you click "Confirm", the crypto will be <span className="font-bold text-yellow-600 dark:text-yellow-300">immediately released</span> from the escrow wallet to the buyer.
            </p>
            <p className="text-red-600 dark:text-red-300 font-bold text-xs sm:text-sm">
              This action is IRREVERSIBLE!
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-5 sm:mb-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-2">Confirming payment of:</p>
            <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400 break-all">
              ₹{displayAmount.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
              className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl text-gray-900 dark:text-white font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
            >
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Cancel
            </button>
            <button
              onClick={handleFinalConfirm}
              disabled={submitting}
              className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-xl sm:rounded-2xl text-white font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
            >
              {submitting ? (
                <>Confirming...</>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Confirm
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
  );
}