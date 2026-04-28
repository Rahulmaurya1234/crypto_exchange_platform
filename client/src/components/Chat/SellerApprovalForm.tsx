// src/components/Chat/SellerApprovalForm.tsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, CheckCircle, Wallet } from "lucide-react";
import type { SellerApproval, BuyerRequest } from "../../types/chat.types";
import SummaryApi from "../../api/SummaryApi";
import api from "../../api/axios";

interface SellerApprovalFormProps {
  tradeId: string;
  buyerRequest: BuyerRequest;
  onApprove: (data: SellerApproval) => void;
  onReject: () => void;
}

type FormValues = {
  transferMethod: string;
  walletAddress?: string;
  txnHash?: string;
};

export default function SellerApprovalFormComponent({
  tradeId,
  buyerRequest,
  onApprove,
  onReject,
}: SellerApprovalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatData, setChatData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      transferMethod: "wallet",
      walletAddress: "",
      txnHash: "",
    },
  });

  console.log("SellerApprovalForm tradeId:", tradeId);

  // base values from buyer request (fallbacks)
  const usdtAmountFromBuyer = buyerRequest.usdtAmount;
  const inrAmountFromBuyer = buyerRequest.inrAmount;

  // ---- HIT API BEFORE SUBMIT ----
  useEffect(() => {
    if (!tradeId) {
      setIsChatLoading(false);
      setChatError("Missing tradeId, cannot fetch chat details.");
      return;
    }

    let cancelled = false;

    const fetchChatByTrade = async () => {
      try {
        setIsChatLoading(true);
        setChatError(null);

        const chatConfig = SummaryApi.getChatByTradeId(tradeId);
        const chatRes = await api({
          url: chatConfig.url,
          method: chatConfig.method,
        });

        const payload = chatRes.data?.data || chatRes.data;
        if (cancelled) return;

        console.log("getChatByTradeId response:", payload);
        setChatData(payload);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Failed to fetch chat by trade:", err);
        setChatError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch chat details"
        );
      } finally {
        if (!cancelled) setIsChatLoading(false);
      }
    };

    fetchChatByTrade();

    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  // ---- Extract trade + fee data safely from chatData ----
  const trade =
    chatData?.chat?.tradeId || // your logged shape
    chatData?.tradeId ||
    chatData?.trade ||
    null;

  const fee = trade?.feeBreakdown || {};
  const cryptoAmount = trade?.cryptoAmount ?? usdtAmountFromBuyer;
  const totalINRAmount = trade?.totalINRAmount ?? inrAmountFromBuyer;
  const paymentMethod = trade?.paymentMethod;
  const tradeNumber = trade?.tradeNumber;
  const sellerMustSend = trade?.sellerMustSend; // this is your "sellerpaidusdt"
  const gasEstimate = fee?.gasEstimate;
  const platformFeeAmount = fee?.platformFeeAmount;
  const platformFeePercent = fee?.platformFeePercent;
  const totalFees = fee?.totalFees;
  const escrowWalletAddress = trade?.escrowWalletAddress;

  // recompute fee logic using cryptoAmount (server value if present)
  const cryptiansFee = cryptoAmount * 0.04;
  const totalFee = cryptiansFee;
  const depositToEscrow = cryptoAmount + totalFee;

const onFormSubmit = async (formData: FormValues) => {
  // basic guard: you cannot deposit without a hash
  if (!formData.txnHash || !formData.txnHash.trim()) {
    // you can replace this with toast UI if you have one
    alert("Transaction hash is required before submitting.");
    return;
  }

  setIsSubmitting(true);

  try {
    // 1) Hit submitDepositeHash API
    const depositConfig = SummaryApi.submitDepositeHash(
      tradeId,
      formData.txnHash.trim()
    );

    await api({
      url: depositConfig.url,
      method: depositConfig.method,
      data: depositConfig.data, // important: send data from SummaryApi
    });

    // 2) Build approval object (for parent state / UI flow)
    const approval: SellerApproval = {
      approved: true,
      usdtToEscrow: depositToEscrow,
      walletAddress: formData.walletAddress,
      txnHash: formData.txnHash.trim(),
      feeDetails: {
        usdtAmount: cryptoAmount,
        cryptiansFee,
        totalFee,
      },
    };

    // 3) Notify parent that approval is done
    onApprove(approval);
  } catch (err: any) {
    console.error("Error submitting deposit hash:", err);
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to submit deposit. Please try again.";
    alert(msg);
  } finally {
    setIsSubmitting(false);
  }
};


  // Loading / error states
  if (isChatLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto my-4 border-2 border-green-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm text-gray-700">Loading trade details...</span>
      </div>
    );
  }

  if (chatError) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto my-4 border-2 border-red-500">
        <p className="text-red-700 text-sm mb-4">{chatError}</p>
        <button
          onClick={onReject}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto my-4 border-2 border-green-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Seller Approval Form
          </h3>
          <p className="text-sm text-gray-600">
            Review and approve buyer request
          </p>
        </div>
      </div>

      {/* Buyer Request Summary (using server values when available) */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Buyer Requested:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">USDT Amount:</span>
            <span className="font-semibold">{cryptoAmount} USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">INR You Receive:</span>
            <span className="font-semibold text-green-600">
              ₹{Number(totalINRAmount || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Mode:</span>
            <span className="font-semibold">
              {paymentMethod ||
                (buyerRequest.paymentMode?.length
                  ? buyerRequest.paymentMode.join(", ")
                  : "-")}
            </span>
          </div>
        </div>
      </div>

      {/* Trade Details from API */}
      {trade && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-3">
            Trade Details (from system)
          </h4>
          <div className="space-y-2 text-xs sm:text-sm">
            {tradeNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Trade Number:</span>
                <span className="font-semibold">{tradeNumber}</span>
              </div>
            )}
            {sellerMustSend != null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Seller Pays (USDT):</span>
                <span className="font-semibold">{sellerMustSend} USDT</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Gas Estimate:</span>
              <span className="font-semibold">{gasEstimate ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee %:</span>
              <span className="font-semibold">
                {platformFeePercent != null ? platformFeePercent + "%" : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee Amount:</span>
              <span className="font-semibold">
                {platformFeeAmount != null ? platformFeeAmount : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Fees:</span>
              <span className="font-semibold">{totalFees ?? 0}</span>
            </div>
            {escrowWalletAddress && (
              <div className="mt-2">
                <span className="text-gray-600 block mb-1">
                  Escrow Wallet Address:
                </span>
                <span className="font-mono text-xs break-all">
                  {escrowWalletAddress}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deposit Details */}
      <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
        <h4 className="font-semibold text-gray-900 mb-3">Deposit to Escrow:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">USDT Amount:</span>
            <span className="font-semibold">{cryptoAmount} USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cryptians Fee (4%):</span>
            <span className="font-semibold">
              {cryptiansFee.toFixed(2)} USDT
            </span>
          </div>
          <div className="border-t border-green-300 pt-2 mt-2 flex justify-between">
            <span className="font-bold text-gray-900">Total Deposit:</span>
            <span className="font-bold text-green-600 text-lg">
              {depositToEscrow.toFixed(2)} USDT
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-2 italic">
            *Exclusive of gas fee (paid separately)
          </p>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Transfer Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transfer Method *
          </label>
          <select
            {...register("transferMethod", { required: true })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="wallet">Transfer to Wallet</option>
            <option value="connect">Connect Wallet to Pay Directly</option>
          </select>
        </div>

        {/* Wallet Address + Txn Hash (if wallet transfer) */}
        {watch("transferMethod") === "wallet" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                {...register("walletAddress")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Hash
              </label>
              <input
                type="text"
                {...register("txnHash", {
                  required: watch("transferMethod") === "wallet",
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="TXN #" />
              {errors.txnHash && (
                <span className="text-red-600 text-sm">
                  Transaction hash is required
                </span>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 px-4 py-3 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200"
            disabled={isSubmitting}
          >
            Reject Request
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
{isSubmitting ? (
  <>
    <Loader2 className="w-5 h-5 animate-spin" />
    Processing...
  </>
) : (
  <>
    <Wallet className="w-5 h-5" />
    Crypto Transfer
  </>
)}

          </button>
        </div>
      </form>
    </div>
  );
}
