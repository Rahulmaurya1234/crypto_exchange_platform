import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Upload, CreditCard } from "lucide-react";
import type { PaymentDetails } from "../../types/chat.types";

interface PaymentFormProps {
  sellerBankDetails: {
    bankName?: string;
    accountNumber?: string;
    upiId?: string;
  };
  tradeDetails: {
    usdtAmount: number;
    inrAmount: number;
    rate: number;
  };
  onSubmit: (data: PaymentDetails) => void;
  onCancel: () => void;
}

export default function PaymentFormComponent({
  sellerBankDetails,
  tradeDetails,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onFormSubmit = async (formData: any) => {
    setIsSubmitting(true);

    const paymentData: PaymentDetails = {
      usdtAmount: tradeDetails.usdtAmount,
      inrAmount: tradeDetails.inrAmount,
      rate: tradeDetails.rate,
      utrNumber: formData.utrNumber,
      screenshot: screenshot ? URL.createObjectURL(screenshot) : "", // Default to empty string
      ...sellerBankDetails,
    };

    await onSubmit(paymentData);
    setIsSubmitting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto my-4 border-2 border-orange-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Payment Transfer</h3>
          <p className="text-sm text-gray-600">
            Please transfer to seller's account
          </p>
        </div>
      </div>

      {/* Amount Details */}
      <div className="bg-orange-50 rounded-lg p-4 mb-4 border border-orange-200">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount to Transfer:</span>
            <span className="font-bold text-orange-600 text-lg">
              ₹{tradeDetails.inrAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>{tradeDetails.usdtAmount} USDT</span>
            <span>1 USDT = ₹{tradeDetails.rate}</span>
          </div>
        </div>
      </div>

      {/* Seller Bank Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">
          Seller Bank Details:
        </h4>
        <div className="space-y-2 text-sm">
          {sellerBankDetails.bankName && (
            <div className="flex justify-between">
              <span className="text-gray-600">Bank Name:</span>
              <span className="font-semibold">
                {sellerBankDetails.bankName}
              </span>
            </div>
          )}
          {sellerBankDetails.accountNumber && (
            <div className="flex justify-between">
              <span className="text-gray-600">Account Number:</span>
              <span className="font-semibold font-mono">
                {sellerBankDetails.accountNumber}
              </span>
            </div>
          )}
          {sellerBankDetails.upiId && (
            <div className="flex justify-between">
              <span className="text-gray-600">UPI ID:</span>
              <span className="font-semibold">{sellerBankDetails.upiId}</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* UTR Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UTR / Transaction Reference Number *
          </label>
          <input
            type="text"
            {...register("utrNumber", { required: true, minLength: 5 })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            placeholder="Enter UTR number"
          />
          {errors.utrNumber && (
            <span className="text-red-600 text-sm">
              UTR number is required (min 5 characters)
            </span>
          )}
        </div>

        {/* Payment Screenshot */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Screenshot *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="screenshot-upload"
              required
            />
            <label htmlFor="screenshot-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              {screenshot ? (
                <p className="text-sm text-green-600 font-semibold">
                  {screenshot.name}
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Click to upload payment screenshot
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Important:</strong> Make sure to transfer the exact
            amount and upload a clear screenshot. The seller will verify the
            payment before releasing crypto.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Request Crypto Release"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
