import React, { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Tag, Info } from "lucide-react";
import api from "../../api/axios";
import SummaryApi from "../../api/SummaryApi";
import { useAppSelector } from "../../app/hooks";

type PriceType = "fixed" | "floating";

const CreateListing: React.FC = () => {
  const navigate = useNavigate();

  const auth = useAppSelector((s) => s.auth);
  const user = (auth.user as any) || null;
  const authReady = auth.checked && !auth.loading;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [cryptoType, setCryptoType] = useState("USDT");
  const [networkName, setNetworkName] = useState("Ethereum");
  const [availableAmount, setAvailableAmount] = useState<number | "">("");
  const [pricePerUnit, setPricePerUnit] = useState<number | "">("");
  const [priceType, setPriceType] = useState<PriceType>("fixed");
  const [minTradeLimit, setMinTradeLimit] = useState<number | "">("");
  const [maxTradeLimit, setMaxTradeLimit] = useState<number | "">("");
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState<number | "">("");
  const [terms, setTerms] = useState("");

  const [formError, setFormError] = useState<string | null>(null);

  // Instant seller
  const [showInstantSellerModal, setShowInstantSellerModal] = useState(false);
  const [instantSellerSelected, setInstantSellerSelected] = useState(false);

  const [platformWallet, setPlatformWallet] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);

  const [transactionHash, setTransactionHash] = useState("");
  const [instructions, setInstructions] = useState("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authReady) return;
    if (!user) navigate("/login");
  }, [authReady, user, navigate]);

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  const validateForm = () => {
    if (!networkName) return "Select a network.";
    if (!availableAmount || Number(availableAmount) <= 0)
      return "Enter a valid Available Amount.";
    if (!pricePerUnit || Number(pricePerUnit) <= 0)
      return "Enter a valid Price per Unit.";
    if (!minTradeLimit || Number(minTradeLimit) <= 0)
      return "Enter a valid minimum trade limit.";
    if (!maxTradeLimit || Number(maxTradeLimit) <= 0)
      return "Enter a valid maximum trade limit.";
    if (Number(minTradeLimit) > Number(maxTradeLimit))
      return "Min trade limit cannot be greater than max trade limit.";
    if (!paymentMethods.length) return "Select at least one payment method.";
    if (!timeLimit || Number(timeLimit) <= 0)
      return "Enter a valid time limit.";
    if (!terms.trim()) return "Enter your trade terms.";
    return null;
  };

  const fetchPlatformWallet = async () => {
    setWalletError(null);
    try {
      const res = await api(SummaryApi.getPlatformWalletAddress);
      const address =
        res?.data?.depositAddress || res?.data?.data?.depositAddress;

      if (!address) throw new Error("Wallet not found");
      setPlatformWallet(address);
    } catch (err: any) {
      setWalletError(
        err?.response?.data?.message || "Failed to load platform wallet address"
      );
    }
  };

  const handleConfirmInstantSeller = () => {
    if (!platformWallet) {
      setWalletError("Platform wallet not loaded.");
      return;
    }

    if (!transactionHash.trim()) {
      setWalletError("Transaction hash is required.");
      return;
    }

    setInstantSellerSelected(true);
    setShowInstantSellerModal(false);
  };

  // const handleSubmit = async (e: FormEvent) => {
  //   e.preventDefault();
  //   setFormError(null);

  //   const error = validateForm();
  //   if (error) {
  //     setFormError(error);
  //     return;
  //   }

  //   try {
  //     setIsSubmitting(true);

  //     const payload = {
  //       cryptoType,
  //       availableAmount: Number(availableAmount),
  //       pricePerUnit: Number(pricePerUnit),
  //       priceType,
  //       minTradeLimit: Number(minTradeLimit),
  //       maxTradeLimit: Number(maxTradeLimit),
  //       paymentMethods,
  //       timeLimit: Number(timeLimit),
  //       terms,
  //       instantSeller: instantSellerSelected,
  //       transactionHash: instantSellerSelected ? transactionHash : undefined,
  //       instructions: instantSellerSelected ? instructions : undefined,
  //     };

  //     await api({
  //       ...SummaryApi.createListing,
  //       data: payload,
  //     });

  //     if (instantSellerSelected) {
  //       setShowSuccessModal(true);
  //     } else {
  //       navigate("/marketplace/my-listings");
  //     }
  //   } catch (err: any) {
  //     const errorMessage =
  //       err?.response?.data?.message ||
  //       "Failed to create listing. Please try again.";

  //     // Check if it's a KYC error
  //     if (
  //       errorMessage.includes("KYC verification required") ||
  //       errorMessage.includes("KYC status must be approved")
  //     ) {
  //       setFormError("KYC verification required to create listings");
  //     } else {
  //       setFormError(errorMessage);
  //     }
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    try {
      setIsSubmitting(true);

      if (instantSellerSelected) {
        // 🚀 INSTANT SELLER - Only send transaction hash
        const payload = {
          // Listing data
          cryptoType,
          networkName,
          availableAmount: Number(availableAmount),
          pricePerUnit: Number(pricePerUnit),
          priceType,
          minTradeLimit: Number(minTradeLimit),
          maxTradeLimit: Number(maxTradeLimit),
          paymentMethods,
          timeLimit: Number(timeLimit),
          terms,
          instructions,

          // ✅ Only transaction hash needed
          transactionHash,
        };

        await api({
          ...SummaryApi.createInstantSellerListing,
          data: payload,
        });

        setShowSuccessModal(true);
      } else {
        // 📝 REGULAR LISTING
        const payload = {
          cryptoType,
          networkName,
          availableAmount: Number(availableAmount),
          pricePerUnit: Number(pricePerUnit),
          priceType,
          minTradeLimit: Number(minTradeLimit),
          maxTradeLimit: Number(maxTradeLimit),
          paymentMethods,
          timeLimit: Number(timeLimit),
          terms,
        };

        await api({
          ...SummaryApi.createListing,
          data: payload,
        });

        navigate("/marketplace/my-listings");
      }
    } catch (err: any) {
      // ... error handling
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Tag className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl font-semibold">Create New Listing</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 space-y-5"
        >
          {formError && <div className="text-red-500 text-xs">{formError}</div>}

          {/* Row 1: Crypto + Available Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Crypto Type
              </label>
              <select
                value={cryptoType}
                onChange={(e) => setCryptoType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
              >
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Network
              </label>
              <select
                value={networkName}
                onChange={(e) => setNetworkName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
              >
                <option value="Ethereum">Ethereum (ERC20)</option>
                <option value="BSC">Binance Smart Chain (BEP20)</option>
                <option value="Polygon">Polygon</option>
                <option value="TRON">TRON (TRC20)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Available Amount
              </label>
              <input
                type="number"
                min={0}
                value={availableAmount}
                onChange={(e) =>
                  setAvailableAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g. 10000"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                This is the total amount you want to sell.
              </p>
            </div>
          </div>

          {/* Row 2: Price Type + Price Per Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Price Type
              </label>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPriceType("fixed")}
                  className={`flex-1 px-2 py-1 rounded-md ${
                    priceType === "fixed"
                      ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Fixed
                </button>
                <button
                  type="button"
                  onClick={() => setPriceType("floating")}
                  className={`flex-1 px-2 py-1 rounded-md ${
                    priceType === "floating"
                      ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Floating
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Price per Unit (INR)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={pricePerUnit}
                onChange={(e) =>
                  setPricePerUnit(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g. 94.50"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 3: Min / Max trade limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Trade Limit (INR)
              </label>
              <input
                type="number"
                min={0}
                value={minTradeLimit}
                onChange={(e) =>
                  setMinTradeLimit(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g. 500"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maximum Trade Limit (INR)
              </label>
              <input
                type="number"
                min={0}
                value={maxTradeLimit}
                onChange={(e) =>
                  setMaxTradeLimit(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g. 10000"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 4: Payment methods + Time limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Methods
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { key: "upi", label: "UPI" },
                  { key: "imps", label: "IMPS" },
                  { key: "bank_transfer", label: "Bank Transfer" },
                ].map((pm) => (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => togglePaymentMethod(pm.key)}
                    className={`px-3 py-1 rounded-full border text-xs ${
                      paymentMethods.includes(pm.key)
                        ? "bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white"
                        : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Time Limit (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={timeLimit}
                onChange={(e) =>
                  setTimeLimit(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g. 20"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Buyer must complete the payment within this time.
              </p>
            </div>
          </div>

          {/* Terms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Terms of Trade
            </label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={4}
              placeholder="Payment must be made within 60 minutes..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
            />
          </div>

          {/* Instant Seller */}
          <div className="rounded-xl border p-3 bg-slate-50 dark:bg-slate-800">
            <div className="flex gap-2">
              <Info className="w-4 h-4 mt-1 text-indigo-600" />
              <p className="text-xs">
                Enable Instant Seller by depositing USDT to platform escrow.
              </p>
            </div>

            {instantSellerSelected && (
              <p className="text-xs text-green-600 mt-2">
                Instant Seller Enabled (Pending Admin Approval)
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setShowInstantSellerModal(true);
                fetchPlatformWallet();
              }}
              className="mt-2 px-4 py-2 text-xs bg-indigo-600 text-white rounded-lg"
            >
              Become Instant Seller
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs"
            >
              {isSubmitting && (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              )}
              Publish Listing
            </button>
          </div>
        </form>
      </div>

      {/* Instant Seller Modal */}
      {showInstantSellerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 w-full max-w-md space-y-3">
            <h2 className="text-sm font-semibold">Instant Seller Deposit</h2>

            <div className="text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded">
              <p className="mb-1">Deposit USDT to this wallet:</p>
              {walletError ? (
                <p className="text-red-500">{walletError}</p>
              ) : (
                <p className="font-mono break-all">
                  {platformWallet || "Loading..."}
                </p>
              )}
            </div>

            <input
              type="text"
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
              placeholder="Transaction Hash"
              className="w-full border rounded px-3 py-2 text-xs"
            />

            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Optional instructions"
              className="w-full border rounded px-3 py-2 text-xs"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowInstantSellerModal(false)}
                className="px-3 py-2 text-xs border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmInstantSeller}
                className="px-3 py-2 text-xs bg-indigo-600 text-white rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
{showSuccessModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center shadow-2xl max-w-md w-full mx-4">
      {/* Success Icon */}
      <div className="mb-4 flex justify-center">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Listing Submitted!</h2>
      
      {/* ✅ HIGHLIGHTED WARNING BOX */}
      <div className="my-5 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl animate-pulse">
        <p className="text-base font-bold text-yellow-800 dark:text-yellow-300 flex items-center justify-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Pending Admin Approval</span>
        </p>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Your instant seller listing has been submitted and is awaiting verification. You'll be notified once it's approved.
      </p>

      <button
        onClick={() => navigate("/market/my-listings")}
        className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
      >
        View My Listings
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default CreateListing;
