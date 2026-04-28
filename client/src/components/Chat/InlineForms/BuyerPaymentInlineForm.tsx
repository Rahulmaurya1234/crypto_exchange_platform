// src/components/Chat/InlineForms/BuyerPaymentInlineForm.tsx
import { useState, useEffect } from 'react';
import { Upload, FileText, Clock } from 'lucide-react';
import type { PaymentDetails } from '../../../types/chat.types';
import api from '../../../api/axios';
import SummaryApi from '../../../api/SummaryApi';

interface BuyerPaymentInlineFormProps {
  tradeId: string;
  tradeData?: {
    inrAmount: number;
    usdtAmount: number;
    rate: number;
  };
  sellerPaymentDetails: {
    upiId?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    accountHolder?: string;
  };
  timeLimit?: number; // in minutes
  onSubmit: (data: PaymentDetails) => void;
}

export default function BuyerPaymentInlineForm({
  tradeId,
  tradeData,
  sellerPaymentDetails,
  timeLimit = 30,
  onSubmit,
}: BuyerPaymentInlineFormProps) {

  const [file, setFile] = useState<File | null>(null);
  const [refId, setRefId] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const [submitting, setSubmitting] = useState(false);

  // extra user inputs for backend payload
  const [customAmount, setCustomAmount] = useState<string>(
    tradeData?.inrAmount ? String(tradeData.inrAmount) : ''
  );
  const [bankNameInput, setBankNameInput] = useState<string>(
    sellerPaymentDetails?.bankName || ''
  );

  // trade numeric data (INR, USDT, rate)
  const [currentTradeData, setCurrentTradeData] = useState<{
    inrAmount: number;
    usdtAmount: number;
    rate: number;
  }>(() => ({
    inrAmount: tradeData?.inrAmount ?? 0,
    usdtAmount: tradeData?.usdtAmount ?? 0,
    rate: tradeData?.rate ?? 0,
  }));

  // extra meta data (for display)
  const [tradeMeta, setTradeMeta] = useState<{
    totalINRAmount: number;
    tradeNumber: string;
    paymentMethod: string | null;
  }>({
    totalINRAmount: tradeData?.inrAmount ?? 0,
    tradeNumber: '',
    paymentMethod: null,
  });

  const [currentSellerPaymentDetails, setCurrentSellerPaymentDetails] =
    useState<{
      upiId?: string;
      bankName?: string;
      accountNumber?: string;
      ifsc?: string;
      ifscCode?: string;
      accountHolder?: string;
      accountHolderName?: string;
      branch?: string;
    }>(() => ({
      upiId: sellerPaymentDetails?.upiId || '',
      bankName: sellerPaymentDetails?.bankName || '',
      accountNumber: sellerPaymentDetails?.accountNumber || '',
      ifsc: sellerPaymentDetails?.ifsc || '',
      accountHolder: sellerPaymentDetails?.accountHolder || '',
    }));

  const [uploading, setUploading] = useState(false);

  // countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // fetch trade details on mount / when tradeId changes
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

        console.log('[BuyerPaymentInlineForm] Fetched trade:', trade);
        if (!trade) return;

        const totalINRAmount = Number(trade.totalINRAmount) || 0;
        const usdtAmount =
          Number(trade.usdtAmount) ||
          Number(trade.cryptoAmount) ||
          0;
        const rate =
          Number(trade.rate) ||
          Number(trade.effectivePricePerUnit) ||
          0;
        const tradeNumber = trade.tradeNumber || '';
        const paymentMethod = trade.paymentMethod || null;

        setCurrentTradeData({
          inrAmount: totalINRAmount,
          usdtAmount,
          rate,
        });

        setTradeMeta({
          totalINRAmount,
          tradeNumber,
          paymentMethod,
        });

        // Get real seller bank details from trade.sellerBankDetails
        const sellerBankDetails = trade.sellerBankDetails || {};
        const sellerPaymentDetailsFromApi = trade.sellerPaymentDetails || {};

        const realSellerDetails = {
          // Bank details from sellerBankDetails object
          bankName: sellerBankDetails.bankName || '',
          accountNumber: sellerBankDetails.accountNumber || '',
          ifsc: sellerBankDetails.ifscCode || sellerBankDetails.ifsc || '',
          ifscCode: sellerBankDetails.ifscCode || '',
          accountHolder: sellerBankDetails.accountHolderName || sellerBankDetails.accountHolder || '',
          accountHolderName: sellerBankDetails.accountHolderName || '',
          branch: sellerBankDetails.branch || '',

          // UPI from sellerPaymentDetails if available
          upiId: sellerPaymentDetailsFromApi.upiId || '',
        };

        setCurrentSellerPaymentDetails(realSellerDetails);

        // Default the input fields if empty
        if (!bankNameInput && realSellerDetails.bankName) {
          setBankNameInput(realSellerDetails.bankName);
        }
        if (!customAmount && totalINRAmount) {
          setCustomAmount(String(totalINRAmount));
        }
      } catch (err) {
        console.error('[BuyerPaymentInlineForm] Failed to fetch trade:', err);
      }
    };

    fetchTrade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeId]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const uploadFileToS3 = async (file: File, presignedData: any): Promise<string> => {
    const method = presignedData.method || "POST";

    if (method === "PUT") {
      // R2 / PUT Upload: Send file directly
      const response = await fetch(presignedData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!response.ok) {
        console.error("PUT upload failed:", await response.text());
        throw new Error("Image upload failed");
      }
      return presignedData.fileUrl;
    } else {
      // S3 / POST Upload: Use FormData
      const formData = new FormData();
      if (presignedData.fields) {
        Object.keys(presignedData.fields).forEach((key) => {
          formData.append(key, presignedData.fields[key]);
        });
      }
      formData.append("file", file);

      const response = await fetch(presignedData.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("POST upload failed:", await response.text());
        throw new Error("Image upload failed");
      }
      return presignedData.fileUrl;
    }
  };

  const effectiveInrAmount =
    currentTradeData?.inrAmount ??
    tradeData?.inrAmount ??
    0;

  const effectiveUsdtAmount =
    currentTradeData?.usdtAmount ??
    tradeData?.usdtAmount ??
    0;

  const effectiveRate =
    currentTradeData?.rate ??
    tradeData?.rate ??
    0;

  // Upload payment proof screenshot to S3
  const uploadPaymentProof = async (file: File): Promise<string> => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPG, PNG, WEBP allowed');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File must be < 10MB');
    }

    setUploading(true);
    try {
      const config = SummaryApi.paymentProofUpload();
      const res = await api({
        url: config.url,
        method: config.method,
        data: {
          fileName: file.name,
          fileType: file.type,
          documentType: 'payment_proof',
          tradeId: tradeId
        },
      });

      const presignedData = res.data?.data || res.data;
      const fileUrl = await uploadFileToS3(file, presignedData);
      return fileUrl;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const amountToSend =
      customAmount !== '' ? Number(customAmount) : effectiveInrAmount;

    if (!file || !refId || !bankNameInput || !amountToSend) {
      alert('Please upload payment proof and enter UTR, amount, and bank name');
      return;
    }

    setSubmitting(true);

    try {
      // Upload file to S3 and get the URL
      const uploadedFileUrl = await uploadPaymentProof(file);

      const remarks = `Payment of ₹${amountToSend} submitted via ${currentSellerPaymentDetails.upiId ? 'UPI' : 'Bank Transfer'
        }`;

      const paymentData: PaymentDetails = {
        // core trade info
        usdtAmount: effectiveUsdtAmount,
        inrAmount: amountToSend,
        rate: effectiveRate,

        // buyer proof with S3 URL
        utrNumber: refId,
        screenshot: uploadedFileUrl,

        // stored in trade.buyerPaymentProof
        amountPaid: amountToSend,
        remarks,

        // /upload-payment API payload
        transactionId: refId,
        amount: amountToSend,
        bank: bankNameInput,
        proofUrl: uploadedFileUrl,

        // seller account info
        ...currentSellerPaymentDetails,
      };

      onSubmit(paymentData);
    } catch (error: any) {
      alert(error.message || 'Failed to submit payment proof');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-start mb-4 sm:mb-6 px-2 sm:px-0">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl sm:rounded-3xl p-4 sm:p-7 w-full max-w-2xl shadow-xl">
        {/* Header + Timer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-5 sm:mb-7">
          <div className="flex items-center gap-3 sm:gap-4">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Send INR Payment</h3>
          </div>
          <div
            className={`px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm self-start sm:self-auto ${timeLeft < 300
                ? 'bg-red-100 dark:bg-red-600/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/40'
                : 'bg-yellow-100 dark:bg-yellow-600/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/40'
              }`}
          >
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Trade Meta Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-5 sm:mb-7 border border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-3">
          {tradeMeta.tradeNumber && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Trade No:</span>
              <span className="font-mono font-bold text-base sm:text-lg break-all text-gray-900 dark:text-white">
                {tradeMeta.tradeNumber}
              </span>
            </div>
          )}
          {tradeMeta.paymentMethod && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Payment Method:</span>
              <span className="uppercase font-semibold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                {tradeMeta.paymentMethod.replace(/_/g, ' ')}
              </span>
            </div>
          )}
          {tradeMeta.totalINRAmount > 0 && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total INR Amount:</span>
              <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{tradeMeta.totalINRAmount.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>

        {/* Amount to Send */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl sm:rounded-3xl p-5 sm:p-7 mb-5 sm:mb-7 border border-emerald-200 dark:border-emerald-500/40">
          <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-lg mb-2 sm:mb-3">Send exactly:</div>
          <div className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 break-all">
            ₹{effectiveInrAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            (~{effectiveUsdtAmount} USDT @ ₹{effectiveRate}/USDT)
          </div>

          {/* Payment Methods */}
          <div className="mt-5 sm:mt-6 space-y-3 sm:space-y-4">
            {currentSellerPaymentDetails.upiId && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl sm:rounded-3xl border border-purple-200 dark:border-purple-500/40 p-4 sm:p-5">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">💳</span>
                  <span className="font-semibold">UPI ID:</span>
                </div>
                <div className="font-mono text-base sm:text-lg font-bold text-purple-600 dark:text-purple-300 break-all">
                  {currentSellerPaymentDetails.upiId}
                </div>
              </div>
            )}

            {(currentSellerPaymentDetails.bankName ||
              currentSellerPaymentDetails.accountNumber ||
              currentSellerPaymentDetails.ifsc ||
              currentSellerPaymentDetails.accountHolder) && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl sm:rounded-3xl border border-blue-200 dark:border-blue-500/40 p-4 sm:p-5">
                  <div className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                    <span className="text-xl sm:text-2xl">🏦</span>
                    Bank Transfer Details:
                  </div>
                  <div className="space-y-2 sm:space-y-3 text-gray-700 dark:text-gray-300">
                    {currentSellerPaymentDetails.bankName && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Bank:</span>
                        <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                          {currentSellerPaymentDetails.bankName}
                        </span>
                      </div>
                    )}
                    {currentSellerPaymentDetails.accountNumber && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Account:</span>
                        <span className="font-mono font-semibold text-sm sm:text-base break-all text-gray-900 dark:text-white">
                          {currentSellerPaymentDetails.accountNumber}
                        </span>
                      </div>
                    )}
                    {currentSellerPaymentDetails.ifsc && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">IFSC:</span>
                        <span className="font-mono font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                          {currentSellerPaymentDetails.ifsc}
                        </span>
                      </div>
                    )}
                    {currentSellerPaymentDetails.accountHolder && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Name:</span>
                        <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                          {currentSellerPaymentDetails.accountHolder}
                        </span>
                      </div>
                    )}
                    {currentSellerPaymentDetails.branch && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Branch:</span>
                        <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                          {currentSellerPaymentDetails.branch}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4 sm:space-y-5">
          <input
            type="text"
            placeholder="Payment Reference / UTR Number"
            className="w-full px-4 sm:px-6 py-4 sm:py-5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl sm:rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-4 focus:ring-emerald-500/40 focus:border-transparent transition-all font-mono text-sm sm:text-base"
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
          />

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center hover:border-emerald-500 dark:hover:border-emerald-500/60 transition-all bg-gray-50 dark:bg-gray-800">
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4 text-gray-400 dark:text-gray-500" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="upload-proof"
            />
            <label htmlFor="upload-proof" className="cursor-pointer">
              {file ? (
                <span className="text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-2">
                  <span className="text-xl sm:text-2xl">✓</span>
                  <span className="break-all">{file.name}</span>
                </span>
              ) : (
                <span className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors">
                  Upload Payment Screenshot
                </span>
              )}
            </label>
          </div>

          {/* Extra fields for backend payload */}
          <input
            type="number"
            placeholder="Amount you sent (INR)"
            className="w-full px-4 sm:px-6 py-4 sm:py-5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl sm:rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-4 focus:ring-emerald-500/40 focus:border-transparent transition-all text-sm sm:text-base"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            min={0}
          />

          <input
            type="text"
            placeholder="Bank Name"
            className="w-full px-4 sm:px-6 py-4 sm:py-5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl sm:rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-4 focus:ring-emerald-500/40 focus:border-transparent transition-all text-sm sm:text-base"
            value={bankNameInput}
            onChange={(e) => setBankNameInput(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            disabled={submitting || uploading || !file || !refId}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 text-white font-bold py-4 sm:py-5 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-emerald-500/50 dark:hover:shadow-emerald-600/60 transition-all text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3"
          >
            {uploading ? (
              <>Uploading Screenshot...</>
            ) : submitting ? (
              <>Submitting Payment...</>
            ) : (
              <>
                <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                Submit Payment Proof
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}