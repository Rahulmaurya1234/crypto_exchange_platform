import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  ShieldAlert,
} from 'lucide-react';
import type { PaymentConfirmation, PaymentDetails } from '../../types/chat.types';

interface PaymentConfirmationFormProps {
  paymentDetails: PaymentDetails;
  onConfirm: (data: PaymentConfirmation) => void;
  onReject: (reason: string) => void;
}

export default function PaymentConfirmationFormComponent({
  paymentDetails,
  onConfirm,
  onReject
}: PaymentConfirmationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false); // checkbox in form
  const [showReleaseConfirmModal, setShowReleaseConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      status: '',
      remark: '',
    }
  });

  const status = watch('status');

  const onFormSubmit = async (formData: any) => {
    // For safety – button is already disabled but guard anyway
    if (formData.status === 'credited' && !isConfirmed) {
      return;
    }

    // If credited, don't immediately release. Show custom confirm modal.
    if (formData.status === 'credited') {
      setPendingFormData(formData);
      setShowReleaseConfirmModal(true);
      return;
    }

    // Not credited -> immediate reject flow (no modal)
    setIsSubmitting(true);
    try {
      await onReject(formData.remark || 'Payment not credited');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRelease = async () => {
    if (!pendingFormData) {
      setShowReleaseConfirmModal(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const confirmation: PaymentConfirmation = {
        confirmed: true,
        utrNumber: paymentDetails.utrNumber,
      };
      await onConfirm(confirmation);
      setShowReleaseConfirmModal(false);
      setPendingFormData(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReleaseModal = () => {
    setShowReleaseConfirmModal(false);
    setPendingFormData(null);
  };

  const handleDownloadScreenshot = () => {
    if (paymentDetails.screenshot) {
      window.open(paymentDetails.screenshot, '_blank');
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto my-4 border-2 border-purple-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Crypto Release Confirmation</h3>
            <p className="text-sm text-gray-600">Verify payment received from buyer</p>
          </div>
        </div>

        {/* Payment Details Review */}
        <div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
          <h4 className="font-semibold text-gray-900 mb-3">Payment Details:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">₹{paymentDetails.inrAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">USDT:</span>
              <span className="font-semibold">{paymentDetails.usdtAmount} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate:</span>
              <span className="font-semibold">1 USDT = ₹{paymentDetails.rate}</span>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Seller Bank Details:</h4>
          <div className="space-y-2 text-sm">
            {paymentDetails.bankName && (
              <div className="flex justify-between">
                <span className="text-gray-600">Bank Name:</span>
                <span className="font-semibold">{paymentDetails.bankName}</span>
              </div>
            )}
            {paymentDetails.accountNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Account Number:</span>
                <span className="font-semibold font-mono">{paymentDetails.accountNumber}</span>
              </div>
            )}
            {paymentDetails.upiId && (
              <div className="flex justify-between">
                <span className="text-gray-600">UPI ID:</span>
                <span className="font-semibold">{paymentDetails.upiId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">UTR Number:</span>
              <span className="font-semibold font-mono text-purple-600">
                {paymentDetails.utrNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Screenshot */}
        {paymentDetails.screenshot && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleDownloadScreenshot}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200"
            >
              <Download className="w-5 h-5" />
              Download Payment Screenshot
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Confirmation Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Status *
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-green-50 transition-colors border-gray-200 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                <input
                  type="radio"
                  value="credited"
                  {...register('status', { required: true })}
                  className="w-5 h-5 text-green-600"
                />
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900">Payment Credited</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-red-50 transition-colors border-gray-200 has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                <input
                  type="radio"
                  value="not-credited"
                  {...register('status', { required: true })}
                  className="w-5 h-5 text-red-600"
                />
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-gray-900">Payment Not Credited</span>
                </div>
              </label>
            </div>
            {errors.status && (
              <span className="text-red-600 text-sm">Please select payment status</span>
            )}
          </div>

          {/* Remark (if not credited) */}
          {status === 'not-credited' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remark / Reason *
              </label>
              <textarea
                {...register('remark', {
                  required: status === 'not-credited',
                  minLength: 10,
                })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Please explain why payment was not credited..."
              />
              {errors.remark && (
                <span className="text-red-600 text-sm">
                  Remark is required (min 10 characters)
                </span>
              )}
            </div>
          )}

          {/* Confirm Again (if credited) */}
          {status === 'credited' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="w-5 h-5 text-green-600 mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    I confirm that ₹{paymentDetails.inrAmount.toFixed(2)} has been credited to my account
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    By checking this box, I authorize the release of {paymentDetails.usdtAmount} USDT to the buyer.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                (status === 'credited' && !isConfirmed)
              }
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : status === 'credited' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Release Crypto to Buyer
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Report Issue
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Custom double-confirm modal for "Release Crypto to Buyer" */}
      {showReleaseConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  Confirm Crypto Release
                </h4>
                <p className="text-xs text-gray-600">
                  Once you release the crypto, this action cannot be reversed.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
              <p className="text-gray-800 mb-2">
                You are about to release{' '}
                <span className="font-semibold">{paymentDetails.usdtAmount} USDT</span>{' '}
                to the buyer against payment of{' '}
                <span className="font-semibold">
                  ₹{paymentDetails.inrAmount.toFixed(2)}
                </span>
                .
              </p>
              <p className="text-xs text-gray-600">
                Make sure you have verified the credit in your bank account using
                your official bank statement / mobile banking app. Do not rely only
                on SMS or screenshots.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelReleaseModal}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRelease}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Releasing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Yes, Release Crypto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
