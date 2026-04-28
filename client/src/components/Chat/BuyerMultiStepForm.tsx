// src/components/Chat/BuyerMultiStepForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import type { BuyerRequest } from "../../types/chat.types";
import api from "../../api/axios";
import SummaryApi from "../../api/SummaryApi";

interface BuyerMultiStepFormProps {
  onComplete: (data: BuyerRequest) => void;
  onCancel: () => void;
  listingId?: string;
  listingDetails?: any;
}

type FormStep = 1 | 2 | 3;

interface FormData {
  // Step 1: Basic Details (Checkboxes)
  agreedToTerms: boolean;
  understoodRisks: boolean;
  kycCompleted: boolean;

  // Step 2: Escrow Event Details
  usdtAmount: number;
  escrowStartDate: string;
  escrowEndDate: string;

  // Step 3: Seller/Buyer Details & Documents
  sellerName: string;
  buyerName: string;
  buyerWalletAddress: string;
  paymentMethod: string;
  networkName: string;
  cryptoType: string;

  // Document acknowledgments
  vtrAccepted: boolean;
  ncndaAccepted: boolean;
  imfpaAccepted: boolean;
  tsaipAccepted: boolean;

  // New field for agreeToShareDocuments
  agreeToShareDocuments: boolean;
}

export default function BuyerMultiStepForm({
  onComplete,
  onCancel,
  listingId,
  listingDetails,
}: BuyerMultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcData, setCalcData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    defaultValues: {
      agreedToTerms: false,
      understoodRisks: false,
      kycCompleted: false,
      usdtAmount: 0,
      escrowStartDate: "",
      escrowEndDate: "",
      sellerName: "",
      buyerName: "",
      buyerWalletAddress: "",
      paymentMethod: "",
      networkName: "ethereum",
      cryptoType: "USDT",
      vtrAccepted: false,
      ncndaAccepted: false,
      imfpaAccepted: false,
      tsaipAccepted: false,
      agreeToShareDocuments: false, // Added default value
    },
  });

  const formValues = watch();

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["agreedToTerms", "understoodRisks", "kycCompleted"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["usdtAmount", "networkName", "cryptoType", "escrowStartDate", "escrowEndDate"];

      // Calculate fees when moving from step 2 to step 3
      if (listingId && formValues.usdtAmount > 0) {
        try {
          setIsCalculating(true);
          
          // Determine currency - based on the field name "usdtAmount", we'll use "USDT"
          const currency = "USDT"; // Since field is usdtAmount
          
          // FIX: Add currency as third parameter
          const config = SummaryApi.CalculateOrderAmount(
            listingId, 
            formValues.usdtAmount,
            currency
          );
          
          const res = await api({
            url: config.url,
            method: config.method,
          });
          const payload = res.data?.data || res.data || res;
          const calculation = payload.calculation || payload;
          setCalcData(calculation);
        } catch (err: any) {
          console.error("Calculation failed:", err);
          alert(err?.response?.data?.message || "Failed to calculate fees");
          return;
        } finally {
          setIsCalculating(false);
        }
      }
    } else if (currentStep === 3) {
      // Validate all required fields for step 3
      fieldsToValidate = [
        "sellerName", 
        "buyerName", 
        "buyerWalletAddress", 
        "paymentMethod",
        "vtrAccepted",
        "ncndaAccepted",
        "imfpaAccepted",
        "tsaipAccepted",
        "agreeToShareDocuments"
      ];
    }

    const isValid = await trigger(fieldsToValidate);

    if (isValid && currentStep < 3) {
      setCurrentStep((currentStep + 1) as FormStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FormStep);
    }
  };

  const onFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const buyerRequest: BuyerRequest = {
        usdtAmount: calcData?.buyerWillReceive || data.usdtAmount,
        inrAmount: calcData?.totalINRBuyerPays || 0,
        rate: calcData?.effectivePricePerUnit || listingDetails?.pricePerUnit || 0,
        paymentMode: [data.paymentMethod],
        feeDetails: {
          currentRate: calcData?.sellerNetINR || 0,
          cryptiansFee: calcData?.platformFeeINR || 0,
          gasFee: calcData?.gasFeeINR || 0,
          total: calcData?.totalINRBuyerPays || 0,
        },
        buyerWalletAddress: data.buyerWalletAddress,
        listingId: listingId || "",
        networkName: data.networkName,
        cryptoType: data.cryptoType,
        agreeToShareDocuments: data.agreeToShareDocuments, // Added this field
        // Additional metadata for documents
        metadata: {
          escrowStartDate: data.escrowStartDate,
          escrowEndDate: data.escrowEndDate,
          buyerName: data.buyerName,
          sellerName: data.sellerName,
          documents: {
            vtr: data.vtrAccepted,
            ncnda: data.ncndaAccepted,
            imfpa: data.imfpaAccepted,
            tsaip: data.tsaipAccepted,
          },
        },
      };

      await onComplete(buyerRequest);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-3xl mx-auto my-4 border-2 border-blue-500">
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of 3
          </span>
          <span className="text-sm text-gray-500">
            {currentStep === 1 && "Basic Information"}
            {currentStep === 2 && "Escrow Event Details"}
            {currentStep === 3 && "Documents & Confirmation"}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* STEP 1: Basic Checkboxes */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Form 1: Ready to Transfer
            </h3>

            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
              <input
                type="checkbox"
                {...register("agreedToTerms", {
                  required: "You must agree to terms and conditions",
                })}
                className="w-5 h-5 text-blue-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-gray-900">
                  I agree to the Terms and Conditions
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  By checking this, you acknowledge that you have read and agree to
                  our terms of service
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
              <input
                type="checkbox"
                {...register("understoodRisks", {
                  required: "You must acknowledge the risks",
                })}
                className="w-5 h-5 text-blue-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-gray-900">
                  I understand the risks involved
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  Cryptocurrency trading involves risks. Make sure you understand
                  them before proceeding.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
              <input
                type="checkbox"
                {...register("kycCompleted", {
                  required: "KYC verification is required",
                })}
                className="w-5 h-5 text-blue-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-gray-900">
                  My KYC is completed
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  Ensure your KYC verification is complete before initiating a trade
                </p>
              </div>
            </label>

            {(errors.agreedToTerms || errors.understoodRisks || errors.kycCompleted) && (
              <p className="text-red-600 text-sm mt-2">
                Please complete all required checkboxes
              </p>
            )}
          </div>
        )}

        {/* STEP 2: Escrow Event Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Form 2: Escrow Event Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                USDT Amount *
              </label>
              <input
                type="number"
                step="0.01"
                {...register("usdtAmount", {
                  required: "USDT amount is required",
                  min: { value: 0.01, message: "Amount must be greater than 0" },
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter USDT amount"
              />
              {errors.usdtAmount && (
                <span className="text-red-600 text-sm">{errors.usdtAmount.message}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crypto Type *
                </label>
                <select
                  {...register("cryptoType", { required: "Crypto type is required" })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Network *
                </label>
                <select
                  {...register("networkName", { required: "Network is required" })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ethereum">Ethereum (ERC20)</option>
                  <option value="bsc">Binance Smart Chain (BEP20)</option>
                  <option value="tron">Tron (TRC20)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escrow Start Date *
                </label>
                <input
                  type="date"
                  {...register("escrowStartDate", {
                    required: "Start date is required",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.escrowStartDate && (
                  <span className="text-red-600 text-sm">
                    {errors.escrowStartDate.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escrow End Date *
                </label>
                <input
                  type="date"
                  {...register("escrowEndDate", {
                    required: "End date is required",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.escrowEndDate && (
                  <span className="text-red-600 text-sm">
                    {errors.escrowEndDate.message}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The escrow period is the time during which your
                funds will be held securely. Make sure to complete the payment within
                this timeframe.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Seller/Buyer Details & Documents */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Form 3: Seller/Buyer Details & Documents
            </h3>

            {/* Calculation Summary */}
            {calcData && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Fee Calculation</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>You will receive:</span>
                    <span className="font-bold text-green-600">
                      {calcData.buyerWillReceive?.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total to pay:</span>
                    <span className="font-bold">
                      ₹{calcData.totalINRBuyerPays?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee:</span>
                    <span>₹{calcData.platformFeeINR?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gas Fee:</span>
                    <span>₹{calcData.gasFeeINR?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seller Name *
                </label>
                <input
                  type="text"
                  {...register("sellerName", {
                    required: "Seller name is required",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter seller name"
                  defaultValue={calcData?.sellerDetails?.name || ""}
                />
                {errors.sellerName && (
                  <span className="text-red-600 text-sm">{errors.sellerName.message}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Name (You) *
                </label>
                <input
                  type="text"
                  {...register("buyerName", {
                    required: "Buyer name is required",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                />
                {errors.buyerName && (
                  <span className="text-red-600 text-sm">{errors.buyerName.message}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your USDT Wallet Address *
              </label>
              <input
                type="text"
                {...register("buyerWalletAddress", {
                  required: "Wallet address is required",
                  pattern: {
                    value: /^0x[a-fA-F0-9]{40}$/,
                    message: "Please enter a valid Ethereum wallet address",
                  },
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="0x..."
              />
              {errors.buyerWalletAddress && (
                <span className="text-red-600 text-sm">
                  {errors.buyerWalletAddress.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                {...register("paymentMethod", {
                  required: "Payment method is required",
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select payment method</option>
                {calcData?.sellerDetails?.paymentMethods?.map((method: string) => (
                  <option key={method} value={method}>
                    {method.split("_").map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(" ")}
                  </option>
                ))}
              </select>
              {errors.paymentMethod && (
                <span className="text-red-600 text-sm">
                  {errors.paymentMethod.message}
                </span>
              )}
            </div>

            {/* Document Acknowledgments */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Required Documents (Please review and accept)
              </h4>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    {...register("vtrAccepted", {
                      required: "VTR acceptance is required",
                    })}
                    className="w-5 h-5 text-blue-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-sm">VTR (Verifiable Trade Receipt)</span>
                    <p className="text-xs text-gray-600">
                      Statement of security for the transaction
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    {...register("ncndaAccepted", {
                      required: "NCNDA acceptance is required",
                    })}
                    className="w-5 h-5 text-blue-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-sm">
                      NCNDA (Non-Circumvention Non-Disclosure Agreement)
                    </span>
                    <p className="text-xs text-gray-600">
                      Protects both parties' confidential information
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    {...register("imfpaAccepted", {
                      required: "IMFPA acceptance is required",
                    })}
                    className="w-5 h-5 text-blue-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-sm">
                      IMFPA (Irrevocable Master Fee Protection Agreement)
                    </span>
                    <p className="text-xs text-gray-600">
                      Fee protection for all involved parties
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    {...register("tsaipAccepted", {
                      required: "TSA/IP acceptance is required",
                    })}
                    className="w-5 h-5 text-blue-600 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-sm">TSA/IP</span>
                    <p className="text-xs text-gray-600">Trade Security Agreement</p>
                  </div>
                </label>
              </div>

              {/* Add agreeToShareDocuments checkbox */}
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 mt-4">
                <input
                  type="checkbox"
                  {...register("agreeToShareDocuments", {
                    required: "You must agree to share documents",
                  })}
                  className="w-5 h-5 text-blue-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-sm">
                    I agree to share necessary documents for verification
                  </span>
                  <p className="text-xs text-gray-600">
                    By checking this, you agree to share required documents with the seller and platform for verification purposes.
                  </p>
                </div>
              </label>

              {(errors.vtrAccepted || errors.ncndaAccepted || errors.imfpaAccepted || errors.tsaipAccepted || errors.agreeToShareDocuments) && (
                <p className="text-red-600 text-sm mt-2">
                  Please accept all required documents and agreements
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={currentStep === 1 ? onCancel : handleBack}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            disabled={isSubmitting || isCalculating}
          >
            <ArrowLeft className="w-5 h-5" />
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isCalculating}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}