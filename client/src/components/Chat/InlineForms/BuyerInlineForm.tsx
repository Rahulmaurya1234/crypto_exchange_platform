// src/components/Chat/InlineForms/BuyerInlineForm.tsx
import { useState } from "react";
import {
  CheckCircle,
  FileText,
  Wallet,
  ArrowLeftRight,
} from "lucide-react";
import type { BuyerRequest } from "../../../types/chat.types";
import api from "../../../api/axios";
import SummaryApi from "../../../api/SummaryApi";

const uploadFileToS3 = async (
  file: File,
  presignedData: any
): Promise<string> => {
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

interface BuyerInlineFormProps {
  listingId: string;
  listingDetails: any;
  onSubmit: (data: BuyerRequest) => void;
}

export default function BuyerInlineForm({
  listingId,
  listingDetails,
  onSubmit,
}: BuyerInlineFormProps) {
  const [step, setStep] = useState<"initial" | "calculate" | "details">(
    "initial"
  );

  // Currency toggle state
  const [currency, setCurrency] = useState<"USDT" | "INR">("USDT");
  const [inputAmount, setInputAmount] = useState("");

  const [walletAddress, setWalletAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [calcData, setCalcData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [networkName, setNetworkName] = useState("bsc");
  const [cryptoType, setCryptoType] = useState("USDT");
  const [agreeDocs, setAgreeDocs] = useState(false);

  const [doc1Uploading, setDoc1Uploading] = useState(false);
  const [doc2Uploading, setDoc2Uploading] = useState(false);
  const [doc1Url, setDoc1Url] = useState<string | null>(null);
  const [doc2Url, setDoc2Url] = useState<string | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!inputAmount || Number(inputAmount) <= 0) return;
    setLoading(true);
    try {
      const config = SummaryApi.CalculateOrderAmount(
        listingId,
        Number(inputAmount),
        currency
      );
      const res = await api({ url: config.url, method: config.method });
      const calculation =
        res.data?.data?.calculation || res.data?.calculation || res.data?.data || res.data;
      setCalcData(calculation);
      setStep("calculate");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to calculate");
    } finally {
      setLoading(false);
    }
  };

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === "USDT" ? "INR" : "USDT"));
    setInputAmount(""); // Clear input when toggling
  };

  const handleDocUpload = async (
    file: File | undefined,
    slot: "doc1" | "doc2"
  ) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setDocUploadError("Only JPG, PNG, WEBP allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setDocUploadError("File must be < 10MB");
      return;
    }

    setDocUploadError(null);
    const setUploading = slot === "doc1" ? setDoc1Uploading : setDoc2Uploading;
    const setUrl = slot === "doc1" ? setDoc1Url : setDoc2Url;
    const documentType = slot === "doc1" ? "aadhaar_front" : "aadhaar_back";

    setUploading(true);
    try {
      const config = SummaryApi.docUploadatChat();
      const res = await api({
        url: config.url,
        method: config.method,
        data: {
          fileName: file.name,
          fileType: file.type,
          documentType,
          tradeId: null,
        },
      });

      const presignedData = res.data?.data || res.data;
      const fileUrl = await uploadFileToS3(file, presignedData);
      setUrl(fileUrl);
    } catch (err: any) {
      setDocUploadError(err?.response?.data?.message || "Upload failed");
      setUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (
      !walletAddress ||
      !paymentMethod ||
      !agreeDocs ||
      !doc1Url ||
      !doc2Url
    ) {
      alert("Please complete all required fields");
      return;
    }

    const buyerRequest: BuyerRequest = {
      usdtAmount: calcData?.cryptoAmount || calcData?.buyerWillReceive || 0,
      inrAmount: calcData?.totalINRBuyerPays || 0,
      rate:
        calcData?.effectivePricePerUnit || listingDetails?.pricePerUnit || 0,
      paymentMode: [paymentMethod],
      buyerWalletAddress: walletAddress,
      listingId,
      networkName,
      cryptoType,
      feeDetails: {
        currentRate: calcData?.sellerNetINR || 0,
        cryptiansFee: calcData?.platformFeeINR || 0,
        gasFee: calcData?.gasFeeINR || 0,
        total: calcData?.totalINRBuyerPays || 0,
      },
      metadata: {
        documents: {
          aadhaarFrontUrl: doc1Url,
          aadhaarBackUrl: doc2Url,
        },
        buyerWillReceive: calcData?.buyerWillReceive,
        sellerMustDeposit: calcData?.sellerMustDepositUSDT,
        agreeToShareDocuments: agreeDocs,
      },
      agreeToShareDocuments: agreeDocs,
      isShareDocument: true,
      aadhaarFrontUrl: doc1Url,
      aadhaarBackUrl: doc2Url,
    } as any;

    onSubmit(buyerRequest);
  };

  // Initial Step
  if (step === "initial") {
    return (
      <div className="flex justify-start mb-4 sm:mb-6 px-2 sm:px-0">
        <div className="bg-white dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <h3 className="text-slate-900 dark:text-white text-lg sm:text-xl font-bold">
              Buy USDT
            </h3>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-medium text-slate-600 dark:text-white/80">
                  {currency === "USDT" ? "USDT Amount" : "INR Amount"}
                </label>
                <button
                  onClick={toggleCurrency}
                  className="flex items-center gap-1 text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                >
                  <ArrowLeftRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  Switch to {currency === "USDT" ? "INR" : "USDT"}
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-xl sm:rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 focus:ring-4 focus:ring-indigo-500/40 focus:border-transparent transition-all text-sm sm:text-base pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-semibold text-slate-600 dark:text-white/70">
                  {currency}
                </span>
              </div>
              {listingDetails && currency === "USDT" && (
                <p className="text-xs text-slate-500 dark:text-white/60 mt-2">
                  Min: {listingDetails.minTradeLimit} - Max:{" "}
                  {listingDetails.maxTradeLimit} USDT
                </p>
              )}
              {currency === "INR" && (
                <p className="text-xs text-slate-500 dark:text-white/60 mt-2">
                  Enter the INR amount you want to pay
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-white/80 mb-1">
                  Crypto Type *
                </label>
                <select
                  value={cryptoType}
                  onChange={(e) => setCryptoType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/40 outline-none"
                >
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-white/80 mb-1">
                  Network *
                </label>
                <select
                  value={networkName}
                  onChange={(e) => setNetworkName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/40 outline-none"
                >
                  <option value="ethereum">Ethereum (ERC20)</option>
                  <option value="bsc">Binance Smart Chain (BEP20)</option>
                  <option value="tron">Tron (TRC20)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={loading || !inputAmount || Number(inputAmount) <= 0}
              className="w-full bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 disabled:bg-slate-300 dark:disabled:bg-white/10 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base disabled:cursor-not-allowed"
            >
              {loading ? (
                <>Calculating...</>
              ) : (
                <>
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  Calculate {currency === "USDT" ? "INR Amount" : "USDT Amount"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Step
  if (step === "calculate" && calcData) {
    return (
      <div className="flex justify-start mb-4 sm:mb-6 px-2 sm:px-0">
        <div className="bg-white dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Amount Summary
            </h3>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10">
            <div className="space-y-3 text-slate-900 dark:text-white">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-slate-600 dark:text-white/70 text-sm sm:text-base">
                  You will receive
                </span>
                <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {calcData.buyerWillReceive?.toFixed(2)} USDT
                </span>
              </div>

              <div className="border-t border-slate-200 dark:border-white/10 pt-3 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600 dark:text-white/70">
                  <span>Seller Price</span>
                  <span>₹{calcData.sellerPricePerUnit?.toFixed(2)}/USDT</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-white/70">
                  <span>Live Market Price</span>
                  <span>₹{calcData.liveUsdtPrice?.toFixed(2)}/USDT</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-white/70">
                  <span>Platform Fee (5%)</span>
                  <span>₹{(calcData.platformFeeINR || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-white/70">
                  <span>Gas Fee (1%)</span>
                  <span>₹{(calcData.gasFeeINR || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t-2 border-indigo-500/50 pt-3 sm:pt-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="text-slate-700 dark:text-white/80 text-base sm:text-lg font-semibold">
                    Total to Pay
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    ₹{calcData.totalINRBuyerPays?.toFixed(2)}
                  </span>
                </div>
              </div>

              {calcData.calculationNote && (
                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    {calcData.calculationNote}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-5 sm:mt-6">
            <button
              onClick={() => setStep("initial")}
              className="flex-1 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base"
            >
              Back
            </button>
            <button
              onClick={() => setStep("details")}
              className="flex-1 bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Details Step (Final Step)
  if (step === "details") {
    return (
      <div className="flex justify-start mb-4 sm:mb-6 px-2 sm:px-0">
        <div className="bg-white dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Payment Details
            </h3>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 dark:text-white/80 mb-1">
                USDT Wallet Address *
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-xl sm:rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 focus:ring-4 focus:ring-indigo-500/40 focus:border-transparent transition-all font-mono text-xs sm:text-sm break-all"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 dark:text-white/80 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-xl sm:rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/40 text-sm sm:text-base"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  Select method
                </option>
                {calcData?.sellerDetails?.paymentMethods?.map((m: string) => (
                  <option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {m.replace(/_/g, " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreeDocs}
                onChange={(e) => setAgreeDocs(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 rounded mt-0.5 sm:mt-1 flex-shrink-0 bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20"
              />
              <label className="text-xs sm:text-sm text-slate-600 dark:text-white/80">
                I agree to share my documents with the seller *
              </label>
            </div>

            {/* Document Uploads */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-600 dark:text-white/80 mb-1">
                  Aadhaar Front *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleDocUpload(e.target.files?.[0], "doc1")}
                  className="block w-full text-xs sm:text-sm text-slate-600 dark:text-white/70 file:mr-3 sm:file:mr-4 file:py-2 sm:file:py-3 file:px-4 sm:file:px-5 file:rounded-xl sm:file:rounded-2xl file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-slate-100 dark:file:bg-white/10 file:text-slate-700 dark:file:text-white hover:file:bg-slate-200 dark:hover:file:bg-white/20 cursor-pointer"
                />
                {doc1Uploading && (
                  <p className="text-xs text-slate-500 dark:text-white/60 mt-2">Uploading...</p>
                )}
                {doc1Url && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ Uploaded</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-600 dark:text-white/80 mb-1">
                  Aadhaar Back *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleDocUpload(e.target.files?.[0], "doc2")}
                  className="block w-full text-xs sm:text-sm text-slate-600 dark:text-white/70 file:mr-3 sm:file:mr-4 file:py-2 sm:file:py-3 file:px-4 sm:file:px-5 file:rounded-xl sm:file:rounded-2xl file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-slate-100 dark:file:bg-white/10 file:text-slate-700 dark:file:text-white hover:file:bg-slate-200 dark:hover:file:bg-white/20 cursor-pointer"
                />
                {doc2Uploading && (
                  <p className="text-xs text-slate-500 dark:text-white/60 mt-2">Uploading...</p>
                )}
                {doc2Url && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ Uploaded</p>
                )}
              </div>

              {docUploadError && (
                <p className="text-xs text-red-500 dark:text-red-400">{docUploadError}</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={
                !walletAddress ||
                !paymentMethod ||
                !agreeDocs ||
                !doc1Url ||
                !doc2Url
              }
              className="w-full bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 disabled:bg-slate-300 dark:disabled:bg-white/10 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Submit Trade Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}