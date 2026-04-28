// src/components/wallet/DepositModal.tsx
import React, { useState } from "react";
import { X, Copy, AlertCircle, Check } from "lucide-react";
import api from "../../api/axios";

// Define props type for the modal
type DepositModalProps = {
  isOpen: boolean;
  onClose: () => void;
  platformWalletAddress: {
    currency: string;
    depositAddress: string;
  } | null;
  loadingWalletAddress: boolean;
  walletAddressError: string | null;
};

// Type for form data
type DepositFormData = {
  transactionHash: string;
  network: string;
  amount: number | "";
  notes?: string;
};

// Type for API response
type DepositResponse = {
  success: boolean;
  message: string;
  data?: any;
};

const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  platformWalletAddress,
  loadingWalletAddress,
  walletAddressError,
}) => {
  const [formData, setFormData] = useState<DepositFormData>({
    transactionHash: "",
    network: "ETH",
    amount: "",
    notes: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "amount") {
      const numValue = value === "" ? "" : parseFloat(value);
      if (numValue === "" || (typeof numValue === "number" && numValue >= 0)) {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Copy wallet address to clipboard
  const copyToClipboard = () => {
    if (platformWalletAddress?.depositAddress) {
      navigator.clipboard.writeText(platformWalletAddress.depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.transactionHash.trim()) {
      setSubmitError("Please enter a transaction hash");
      return;
    }
    
    if (!formData.amount || formData.amount <= 0) {
      setSubmitError("Please enter a valid amount");
      return;
    }
    
    if (!platformWalletAddress?.depositAddress) {
      setSubmitError("Wallet address is not available. Please try refreshing.");
      return;
    }

    setLoading(true);
    setSubmitError(null);
    
    try {
      // Prepare payload
      const payload = {
        transactionHash: formData.transactionHash.trim(),
        network: formData.network,
        amount: formData.amount,
        depositAddress: platformWalletAddress.depositAddress,
        notes: formData.notes?.trim() || undefined,
        currency: platformWalletAddress.currency || "USDT",
      };
      
      console.log("Submitting deposit:", payload);
      
      // Make API call
      const response = await api.post<DepositResponse>(
        "/api/v1/platform-a/listings/instant-seller/deposits",
        payload
      );
      
      console.log("Deposit response:", response.data);
      
      if (response.data.success) {
        setSubmitSuccess(true);
        // Reset form
        setFormData({
          transactionHash: "",
          network: "ETH",
          amount: "",
          notes: "",
        });
        
        // Close modal after success
        setTimeout(() => {
          setSubmitSuccess(false);
          onClose();
        }, 3000);
      } else {
        throw new Error(response.data.message || "Deposit submission failed");
      }
    } catch (error: any) {
      console.error("Deposit submission error:", error);
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        "Failed to submit deposit. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!loading) {
      setFormData({
        transactionHash: "",
        network: "ETH",
        amount: "",
        notes: "",
      });
      setSubmitError(null);
      setSubmitSuccess(false);
      onClose();
    }
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Deposit Funds
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              type="button"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <div className="m-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-medium text-emerald-700 dark:text-emerald-300">
                    Deposit Submitted Successfully!
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    Your deposit is being processed. You can track it in the deposit history.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Platform Wallet Address Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Deposit to Platform Wallet
              </h4>
              
              {loadingWalletAddress ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              ) : walletAddressError ? (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {walletAddressError}
                  </p>
                </div>
              ) : platformWalletAddress ? (
                <div className="space-y-3">
                  {/* Wallet Address Display */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Platform Wallet Address ({platformWalletAddress.currency})
                      </span>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        type="button"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono text-slate-900 dark:text-slate-100 break-all">
                        {platformWalletAddress.depositAddress}
                      </code>
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">Important:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Send only {platformWalletAddress.currency} to this address</li>
                          <li>Use appropriate network for the token</li>
                          <li>Minimum deposit amount may apply</li>
                          <li>Transaction may take a few minutes to confirm</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Unable to load wallet address
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  Submit Deposit Details
                </span>
              </div>
            </div>

            {/* Deposit Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Network Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Network
                </label>
                <select
                  name="network"
                  value={formData.network}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="ETH">Ethereum (ERC-20)</option>
                  <option value="BSC">Binance Smart Chain (BEP-20)</option>
                  <option value="POLYGON">Polygon (Matic)</option>
                  <option value="ARBITRUM">Arbitrum</option>
                  <option value="OPTIMISM">Optimism</option>
                  <option value="BASE">Base</option>
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Amount ({platformWalletAddress?.currency || "USDT"})
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0"
                  step="0.01"
                  placeholder="Enter deposit amount"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Transaction Hash Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Transaction Hash
                </label>
                <input
                  type="text"
                  name="transactionHash"
                  value={formData.transactionHash}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Enter transaction hash from your wallet"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Add any additional notes about this deposit"
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {submitError}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || loadingWalletAddress || !platformWalletAddress}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    "Submit Deposit"
                  )}
                </button>
              </div>
            </form>

            {/* Additional Information */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <p>
                  After sending funds to the platform address, please submit your transaction hash here. 
                  Your deposit will be verified and credited to your account shortly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
