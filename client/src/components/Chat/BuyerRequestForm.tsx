// src/components/Chat/BuyerRequestForm.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { 
  Loader2, 
  FileText, 
  DollarSign, 
  User, 
  CreditCard, 
  Info, 
  Wallet, 
  ArrowLeftRight,
  Zap,
  ClipboardList,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import type { BuyerRequest } from "../../types/chat.types";
import api from "../../api/axios";

interface BuyerRequestFormProps {
  onSubmit: (data: BuyerRequest) => void | Promise<void>;
  onCancel: () => void;
  minLimit?: number;
  maxLimit?: number;
  pricePerUnit?: number;
  listingId?: string;
  chatId?: string;
  listingCurrency?: string;
}

interface ApiFeeDetails {
  sellerPricePerUnit?: number;
  liveUsdtPrice?: number;
  sellerDetails?: {
    name: string;
    isInstantSeller: boolean;
    paymentMethods: string[];
  };
  effectivePricePerUnit?: number;
  sellerNetINR?: number;
  totalINRBuyerPays?: number;
  sellerMustDepositUSDT?: number;
  buyerWillReceive?: number;
  calculationNote?: string;
  platformFeeINR?: number;
  gasFeeINR?: number;
  cryptoPlatformFeePercent?: number;
  cryptoAmount?: number;
  feeBreakdown?: {
    platformFeePercent: number;
    platformFeeINR: number;
    platformFeeUSDT: number;
    gasFeePercent: number;
    gasFeeINR: number;
    cryptoPlatformFeePercent: number;
  };
  escrowWallet?: string;
  listingId?: string;
}

type FormValues = {
  amount: number;
  buyerWalletAddress: string;
  networkName: string;
  cryptoType: string;
  agreeToShareDocuments: boolean;
};

export default function BuyerRequestFormComponent({
  onSubmit,
  onCancel,
  minLimit,
  maxLimit,
  pricePerUnit,
  listingId,
  chatId: _chatId, // Prefix with underscore to indicate unused
  listingCurrency,
}: BuyerRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcMessage, setCalcMessage] = useState<string | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  
  const [apiFeeDetails, setApiFeeDetails] = useState<ApiFeeDetails | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  
  // Initialize currency state with proper type
  const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USDT">(() => {
    // If listing currency is USDT, user inputs USDT and gets INR
    // If listing currency is INR (or undefined/null), user inputs INR and gets USDT
    return listingCurrency?.toUpperCase() === "USDT" ? "USDT" : "INR";
  });

  // Update currency if listingCurrency prop changes
  useEffect(() => {
    const newCurrency = listingCurrency?.toUpperCase() === "USDT" ? "USDT" : "INR";
    setSelectedCurrency(newCurrency);
  }, [listingCurrency]);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      amount: 0,
      buyerWalletAddress: "",
      networkName: "bsc",
      cryptoType: "USDT",
      agreeToShareDocuments: false,
    },
  });

  const amount = watch("amount") || 0;
  const buyerWalletAddress = watch("buyerWalletAddress") || "";
  const agreeToShareDocuments = watch("agreeToShareDocuments") || false;

  const onFormSubmit = async (formData: FormValues) => {
    try {
      setIsSubmitting(true);

      const buyerRequest: BuyerRequest = {
        usdtAmount: apiFeeDetails?.cryptoAmount || apiFeeDetails?.buyerWillReceive || Number(formData.amount),
        inrAmount: apiFeeDetails?.totalINRBuyerPays || 0,
        rate: apiFeeDetails?.effectivePricePerUnit || apiFeeDetails?.sellerPricePerUnit || pricePerUnit || 0,
        paymentMode: selectedPaymentMethod ? [selectedPaymentMethod] : [],
        feeDetails: {
          currentRate: apiFeeDetails?.sellerNetINR || 0,
          cryptiansFee: apiFeeDetails?.platformFeeINR || 0,
          gasFee: apiFeeDetails?.gasFeeINR || 0,
          total: apiFeeDetails?.totalINRBuyerPays || 0,
        },
        buyerWalletAddress: formData.buyerWalletAddress,
        networkName: formData.networkName,
        cryptoType: formData.cryptoType,
        listingId: listingId || "",
        agreeToShareDocuments: formData.agreeToShareDocuments,
      };

      console.log("Submitting buyer request:", buyerRequest);
      await onSubmit(buyerRequest);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCalculateFromApi = async () => {
    setCalcMessage(null);
    setCalcError(null);
    setApiFeeDetails(null);
    setSelectedPaymentMethod("");

    if (!listingId) {
      setCalcError("Listing id is missing. Please refresh the page.");
      return;
    }
    
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setCalcError(`Please enter a valid ${selectedCurrency} amount.`);
      return;
    }

    // Validate INR limits
    if (selectedCurrency === "INR" && minLimit && maxLimit) {
      if (numericAmount < minLimit) {
        setCalcError(`Amount must be at least ₹${minLimit}`);
        return;
      }
      if (numericAmount > maxLimit) {
        setCalcError(`Amount cannot exceed ₹${maxLimit}`);
        return;
      }
    }

    try {
      setIsCalculating(true);
      
      console.log("=== CURRENCY DEBUG ===");
      console.log("selectedCurrency:", selectedCurrency);
      console.log("typeof selectedCurrency:", typeof selectedCurrency);
      console.log("listingCurrency:", listingCurrency);
      console.log("======================");
      
      // Explicitly ensure currency is one of the allowed values
      const currencyParam: "INR" | "USDT" = selectedCurrency === "USDT" ? "USDT" : "INR";
      
      console.log("Calling calculate API with:", {
        listingId,
        amount: numericAmount,
        currency: currencyParam
      });
      
      const apiUrl = `/api/v1/platform-a/trades/calculate?listingId=${encodeURIComponent(listingId)}&amount=${encodeURIComponent(numericAmount)}&currency=${encodeURIComponent(currencyParam)}`;
      
      console.log("API URL:", apiUrl);
      
      const res = await api({
        url: apiUrl,
        method: "get",
      });

      const payload = res.data?.data || res.data || res;
      console.log("Calculate API Response:", payload);

      const calculation = payload.calculation || payload;
      
      if (calculation.error || calculation.message?.toLowerCase().includes("limit")) {
        throw new Error(calculation.error || calculation.message);
      }

      const feeDetails: ApiFeeDetails = {
        sellerPricePerUnit: calculation.sellerPricePerUnit,
        liveUsdtPrice: calculation.liveUsdtPrice,
        sellerDetails: calculation.sellerDetails,
        effectivePricePerUnit: calculation.effectivePricePerUnit,
        sellerNetINR: calculation.sellerNetINR,
        totalINRBuyerPays: calculation.totalINRBuyerPays,
        sellerMustDepositUSDT: calculation.sellerMustDepositUSDT,
        buyerWillReceive: calculation.buyerWillReceive,
        calculationNote: calculation.calculationNote,
        platformFeeINR: calculation.platformFeeINR,
        gasFeeINR: calculation.gasFeeINR,
        cryptoPlatformFeePercent: calculation.feeBreakdown?.cryptoPlatformFeePercent || calculation.feeBreakdown?.platformFeePercent,
        cryptoAmount: calculation.cryptoAmount,
        feeBreakdown: calculation.feeBreakdown,
        escrowWallet: calculation.escrowWallet,
        listingId: calculation.listingId,
      };

      setApiFeeDetails(feeDetails);

      if (feeDetails?.sellerDetails?.paymentMethods?.length ?? 0 > 0) {
        setSelectedPaymentMethod(feeDetails.sellerDetails?.paymentMethods?.[0] || "");
      }

      const conversionText = selectedCurrency === "INR" 
        ? `₹${numericAmount} → ${feeDetails.buyerWillReceive?.toFixed(2)} USDT`
        : `${numericAmount} USDT → ₹${feeDetails.totalINRBuyerPays?.toFixed(2)}`;
      
      setCalcMessage(`Calculation complete! ${conversionText}`);
      
    } catch (err: any) {
      console.error("Failed to calculate order amount:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to calculate order amount. Please try again.";
      setCalcError(msg);
      setApiFeeDetails(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const toggleCurrency = () => {
    setSelectedCurrency(prev => prev === "INR" ? "USDT" : "INR");
    setValue("amount", 0);
    setApiFeeDetails(null);
    setCalcMessage(null);
    setCalcError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto my-4 border-2 border-blue-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Buyer Request Form</h3>
          <p className="text-sm text-gray-600">Submit your trade request</p>
          {apiFeeDetails && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Ready to submit request
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Step 1: Enter Amount
          </label>

          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Input Currency:</span>
            <button
              type="button"
              onClick={toggleCurrency}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-blue-600"
            >
              <span>{selectedCurrency}</span>
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500">
              {selectedCurrency === "INR" ? "Will calculate USDT" : "Will calculate INR"}
            </span>
          </div>

          {minLimit && maxLimit && selectedCurrency === "INR" && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Trade Limits: ₹{minLimit} - ₹{maxLimit}
              </p>
            </div>
          )}

          <div className="flex items-start gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                step={selectedCurrency === "INR" ? "1" : "0.01"}
                {...register("amount", {
                  required: `${selectedCurrency} amount is required`,
                  min: { value: selectedCurrency === "INR" ? 1 : 0.01, message: "Amount must be greater than 0" },
                })}
                className="w-full px-4 py-3 pl-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                disabled={isCalculating}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-sm">
                {selectedCurrency === "INR" ? "₹" : "USDT"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculateFromApi}
              disabled={isCalculating || !amount || !!errors.amount}
              className="px-4 py-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating
                </>
              ) : (
                "Calculate"
              )}
            </button>
          </div>

          {errors.amount && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-600 text-sm font-medium">
                {errors.amount.message}
              </span>
            </div>
          )}
          
          {calcError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-600 text-sm font-medium">{calcError}</p>
            </div>
          )}
          
          {calcMessage && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-green-600 text-sm font-medium">{calcMessage}</p>
            </div>
          )}
        </div>

        {apiFeeDetails && (
          <>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                Seller Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Seller Name:</span>
                  <span className="font-semibold">{apiFeeDetails.sellerDetails?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seller Type:</span>
                  <span className={`font-semibold flex items-center gap-1 ${apiFeeDetails.sellerDetails?.isInstantSeller ? 'text-green-600' : 'text-blue-600'}`}>
                    {apiFeeDetails.sellerDetails?.isInstantSeller ? (
                      <>
                        <Zap className="w-4 h-4" />
                        Instant Seller
                      </>
                    ) : (
                      <>
                        <ClipboardList className="w-4 h-4" />
                        Regular Seller
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Rate Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Seller Price/Unit:</span>
                  <span className="font-semibold">₹{apiFeeDetails.sellerPricePerUnit?.toFixed(2) || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Live Market Price:</span>
                  <span className="font-semibold">₹{apiFeeDetails.liveUsdtPrice?.toFixed(2) || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Effective Rate:</span>
                  <span className="font-semibold text-blue-600">₹{apiFeeDetails.effectivePricePerUnit?.toFixed(2) || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-yellow-600" />
                Calculation Summary
              </h4>
              <div className="space-y-3 text-sm">
                {apiFeeDetails.calculationNote && (
                  <div className="mb-3 p-3 bg-white rounded border border-yellow-300 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-yellow-800 font-medium">{apiFeeDetails.calculationNote}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">You Will Receive:</span>
                    <span className="font-semibold text-green-600">{apiFeeDetails.buyerWillReceive?.toFixed(2) || "N/A"} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seller Deposit to Escrow:</span>
                    <span className="font-semibold">{apiFeeDetails.sellerMustDepositUSDT?.toFixed(2) || "N/A"} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seller Net Amount:</span>
                    <span className="font-semibold">₹{apiFeeDetails.sellerNetINR?.toFixed(2) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee:</span>
                    <span className="font-semibold">{apiFeeDetails.cryptoPlatformFeePercent?.toFixed(1) || apiFeeDetails.feeBreakdown?.platformFeePercent?.toFixed(1) || "5"}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Payment Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-semibold">
                    ₹{apiFeeDetails.sellerNetINR?.toFixed(2) || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee:</span>
                  <span className="font-semibold">
                    ₹{apiFeeDetails.platformFeeINR?.toFixed(2) || apiFeeDetails.feeBreakdown?.platformFeeINR?.toFixed(2) || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gas Fee:</span>
                  <span className="font-semibold">
                    ₹{apiFeeDetails.gasFeeINR?.toFixed(2) || apiFeeDetails.feeBreakdown?.gasFeeINR?.toFixed(2) || "N/A"}
                  </span>
                </div>
                <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between">
                  <span className="font-bold text-gray-900 text-base">Total to Pay:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    ₹{apiFeeDetails.totalINRBuyerPays?.toFixed(2) || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Step 2: Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                {apiFeeDetails.sellerDetails?.paymentMethods?.map((method) => {
                  const displayName = method
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                  
                  return (
                    <label
                      key={method}
                      className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-all ${
                        selectedPaymentMethod === method
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={selectedPaymentMethod === method}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">{displayName}</span>
                    </label>
                  );
                })}
              </div>
              {!selectedPaymentMethod && apiFeeDetails && (
                <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Please select a payment method
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Step 3: Enter Your USDT Wallet Address
              </label>
              <input
                type="text"
                {...register("buyerWalletAddress", {
                  required: "Wallet address is required",
                  minLength: { value: 26, message: "Wallet address is too short" },
                  maxLength: { value: 42, message: "Wallet address is too long" },
                  pattern: {
                    value: /^0x[a-fA-F0-9]{40}$/,
                    message: "Please enter a valid Ethereum wallet address"
                  }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="0x..."
              />
              {errors.buyerWalletAddress && (
                <span className="text-red-600 text-sm flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.buyerWalletAddress.message}
                </span>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter your ERC-20 compatible USDT wallet address
              </p>
            </div>
          </>
        )}

        {/* Agree to Share Documents Checkbox */}
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("agreeToShareDocuments", {
                required: "You must agree to share documents",
              })}
              className="w-5 h-5 text-blue-600 mt-0.5"
            />
            <div>
              <span className="font-semibold text-gray-900">
                I agree to share necessary documents for verification
              </span>
              <p className="text-sm text-gray-600 mt-1">
                By checking this box, you confirm that you agree to share required 
                documents (such as Aadhaar, PAN, or Passport) with the seller and 
                platform for verification purposes. This is mandatory to proceed 
                with the trade.
              </p>
              {errors.agreeToShareDocuments && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.agreeToShareDocuments.message}
                </p>
              )}
            </div>
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || 
              !apiFeeDetails || 
              !selectedPaymentMethod || 
              !buyerWalletAddress ||
              !agreeToShareDocuments ||
              !!errors.buyerWalletAddress ||
              !!errors.amount
            }
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Request Seller Approval"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}