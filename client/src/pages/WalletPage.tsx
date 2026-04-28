// src/pages/WalletPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Wallet as WalletIcon,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import api from "../api/axios";
import { useAppSelector } from "../app/hooks";

// Import SummaryApi
import * as SummaryApi from "../api/SummaryApi";
import SummaryApiDefault from "../api/SummaryApi";
// Import the DepositModal
import DepositModal from "../components/wallet/DepositModal"; // Update this path according to your project structure

type WalletOverview = {
  totalBalance: number;
  availableBalance: number;
  inEscrow: number;
  currency: string;
};

type WalletTransaction = {
  id: string;
  type: "deposit" | "withdraw" | "trade" | "fee" | string;
  direction?: "in" | "out";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | string;
  createdAt: string;
  txId?: string;
};

type Deposit = {
  _id: string;
  originalAmount: number;
  platformFeeUSDT: number;
  gasFeeUSDT: number;
  totalDepositAmount: number;
  totalFees: number;
  transactionHash: string;
  blockchainNetwork: string;
  status: "pending" | "approved" | "rejected" | string;
  depositVerified: boolean;
  createdAt: string;
  updatedAt: string;
  verificationNotes?: string;
  verifiedAt?: string;
  isExpired: boolean;
  expiresAt: string;
  listingId?: {
    _id: string;
    availableAmount: number;
    status: string;
  } | null;
};

type WalletInfo = {
  _id?: string;
  userId?: string;
  address?: string;
  currency?: string;
  balance?: number;
  availableBalance?: number;
  escrowBalance?: number;
  totalBalance?: number;
  inEscrow?: number;
  [key: string]: any;
};

// Type for platform wallet address response
type PlatformWalletAddress = {
  currency: string;
  depositAddress: string;
};

export default function WalletPage() {
  const navigate = useNavigate();
  const auth = useAppSelector((s) => s.auth);
  const user = auth.user as any;
  const isLoggedIn = !!user && auth.checked;
  const userId = user?._id || user?.id;

  // Rest of your existing state
  const [overview, setOverview] = useState<WalletOverview | null>(null);
  const [txs, setTxs] = useState<WalletTransaction[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loadingTx, setLoadingTx] = useState(true);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [loadingWalletInfo, setLoadingWalletInfo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // New state for deposit modal and platform wallet address
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [platformWalletAddress, setPlatformWalletAddress] = useState<PlatformWalletAddress | null>(null);
  const [loadingWalletAddress, setLoadingWalletAddress] = useState(false);
  const [walletAddressError, setWalletAddressError] = useState<string | null>(null);

  // Helper function to get API configs
  const getApiConfigs = () => {
    let walletInfoConfig: any;
    let escrowTransactionsConfig: any;

    // Method 1: Check named exports
    if ((SummaryApi as any).getWalletInfo) {
      walletInfoConfig = (SummaryApi as any).getWalletInfo;
    }
    
    if ((SummaryApi as any).getEscrowTransection) {
      escrowTransactionsConfig = (SummaryApi as any).getEscrowTransection;
    } else if ((SummaryApi as any).getEscrowTransaction) {
      escrowTransactionsConfig = (SummaryApi as any).getEscrowTransaction;
    }
    
    // Method 2: Check if it's a default export object
    if (!walletInfoConfig && SummaryApiDefault && (SummaryApiDefault as any).getWalletInfo) {
      walletInfoConfig = (SummaryApiDefault as any).getWalletInfo;
    }
    
    if (!escrowTransactionsConfig && SummaryApiDefault && (SummaryApiDefault as any).getEscrowTransection) {
      escrowTransactionsConfig = (SummaryApiDefault as any).getEscrowTransection;
    } else if (!escrowTransactionsConfig && SummaryApiDefault && (SummaryApiDefault as any).getEscrowTransaction) {
      escrowTransactionsConfig = (SummaryApiDefault as any).getEscrowTransaction;
    }

    // Method 3: Fallback to direct object definition
    if (!walletInfoConfig) {
      walletInfoConfig = {
        url: "/api/v1/platform-a/wallet",
        method: "get" as const,
      };
    }

    if (!escrowTransactionsConfig) {
      escrowTransactionsConfig = (userId: string) => ({
        url: `/api/v1/platform-a/wallet/${userId}/transactions`,
        method: "get" as const,
      });
    }

    return { walletInfoConfig, escrowTransactionsConfig };
  };

  // Function to fetch platform wallet address
  const fetchPlatformWalletAddress = async () => {
    setLoadingWalletAddress(true);
    setWalletAddressError(null);
    
    try {
      const config = {
        url: "/api/v1/platform-a/wallet/platform/deposit-address/USDT",
        method: "get" as const,
      };
      
      const res = await api(config);
      console.log("Platform wallet address response:", res.data);
      
      if (res.data?.success && res.data?.data) {
        setPlatformWalletAddress(res.data.data);
      } else {
        throw new Error(res.data?.message || "Failed to fetch wallet address");
      }
    } catch (e: any) {
      console.error("Error fetching platform wallet address:", e);
      setWalletAddressError(
        e.response?.data?.message || 
        e.message || 
        "Failed to load deposit address. Please try again."
      );
    } finally {
      setLoadingWalletAddress(false);
    }
  };

  // Open deposit modal and fetch wallet address
  const handleOpenDepositModal = async () => {
    setIsDepositModalOpen(true);
    await fetchPlatformWalletAddress();
  };

  // Close deposit modal
  const handleCloseDepositModal = () => {
    setIsDepositModalOpen(false);
    setPlatformWalletAddress(null);
    setWalletAddressError(null);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Early return if not logged in
  if (!isLoggedIn) {
    return null;
  }

  const loadWalletInfo = async () => {
    setLoadingWalletInfo(true);
    
    try {
      const { walletInfoConfig } = getApiConfigs();
      const res = await api(walletInfoConfig);
      
      console.log("=== WALLET INFO API RESPONSE ===");
      console.log("Full response:", res);
      console.log("Response data:", res.data);
      console.log("Response data.data:", res.data?.data);
      console.log("Response status:", res.status);
      console.log("=== END WALLET INFO ===");
      
      const payload = res.data?.data ?? res.data;
      
      setWalletInfo(payload || {});
      
      if (payload) {
        const walletOverview: WalletOverview = {
          totalBalance: Number(payload.balance ?? payload.totalBalance ?? 0),
          availableBalance: Number(payload.availableBalance ?? 0),
          inEscrow: Number(payload.escrowBalance ?? payload.inEscrow ?? 0),
          currency: payload.currency ?? "USDT",
        };
        setOverview(walletOverview);
      }
      
    } catch (e: any) {
      console.error("Wallet info error:", e);
      console.error("Error details:", e.response?.data);
      setError("Failed to load wallet information");
    } finally {
      setLoadingWalletInfo(false);
    }
  };

  const loadTransactions = async () => {
    if (!userId) {
      console.error("User ID not available for loading transactions");
      setLoadingTx(false);
      return;
    }

    try {
      const { escrowTransactionsConfig } = getApiConfigs();
      const config = typeof escrowTransactionsConfig === 'function' 
        ? escrowTransactionsConfig(userId)
        : escrowTransactionsConfig;
      
      const res = await api(config);
      const payload = res.data?.data ?? res.data;

      let transactions = [];
      if (Array.isArray(payload)) {
        transactions = payload;
      } else if (payload && Array.isArray(payload.transactions)) {
        transactions = payload.transactions;
      } else if (payload && Array.isArray(payload.items)) {
        transactions = payload.items;
      } else {
        const possibleKeys = ['transactions', 'items', 'history', 'records'];
        for (const key of possibleKeys) {
          if (payload && Array.isArray(payload[key])) {
            transactions = payload[key];
            break;
          }
        }
      }

      const normalized: WalletTransaction[] = transactions.map((t: any) => ({
        id: t._id ?? t.id ?? t.transactionId ?? String(Math.random()),
        type: t.type ?? t.transactionType ?? "trade",
        direction: t.direction ?? (t.amount > 0 ? "in" : "out"),
        amount: Math.abs(Number(t.amount ?? t.value ?? 0)),
        currency: t.currency ?? t.token ?? "USDT",
        status: t.status ?? t.transactionStatus ?? "completed",
        createdAt: t.createdAt ?? t.timestamp ?? t.date ?? new Date().toISOString(),
        txId: t.txId ?? t.transactionHash ?? t.hash ?? t.transactionId ?? undefined,
      }));

      setTxs(normalized);
    } catch (e: any) {
      console.error("Transactions error:", e);
      console.error("Error details:", e.response?.data);
      setTxs([]);
    } finally {
      setLoadingTx(false);
    }
  };

  const loadDeposits = async () => {
    const url = "/api/v1/platform-a/listings/instant-seller/deposits";

    try {
      const res = await api.get(url);
      const payload = res.data?.data ?? res.data;
      const depositsList = payload?.deposits ?? [];

      setDeposits(depositsList);
    } catch (e) {
      console.error("Deposits error:", e);
    } finally {
      setLoadingDeposits(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setLoadingTx(true);
    setLoadingDeposits(true);
    setLoadingWalletInfo(true);
    setError(null);
    
    await Promise.all([
      loadWalletInfo(),
      loadTransactions(),
      loadDeposits(),
    ]);
    
    setRefreshing(false);
  };

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadWalletInfo(),
        loadTransactions(),
        loadDeposits(),
      ]);
    };
    loadAllData();
  }, [userId]);

  const formatAmount = (amount: number, currency = "USDT") =>
    `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${currency}`;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? "Invalid date"
      : d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const showDebugInfo = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
              <WalletIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              My Wallet
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage your funds, view escrow, and track transactions
            </p>
            
            {walletInfo?.address && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Wallet Address:{" "}
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {walletInfo.address}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Deposit Button */}
            <button
              onClick={handleOpenDepositModal}
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
            >
              <PlusCircle className="w-5 h-5" />
              Deposit
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              type="button"
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh wallet data"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-300 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
            <button 
              onClick={handleRefresh} 
              type="button"
              className="text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {showDebugInfo && walletInfo && (
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                Wallet Info Debug (Development Only)
              </summary>
              <pre className="mt-2 text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-auto max-h-60">
                {JSON.stringify(walletInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {loadingWalletInfo ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-700" />
              ))}
            </>
          ) : (
            <>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <p className="text-indigo-100 text-sm font-medium">Total Balance</p>
                <p className="text-3xl font-bold mt-2">
                  {overview ? formatAmount(overview.totalBalance, overview.currency) : "0.00 USDT"}
                </p>
                <p className="text-indigo-200 text-xs mt-2">Available + In Escrow</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Available Balance</p>
                  <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full">
                    Ready to use
                  </span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {overview ? formatAmount(overview.availableBalance, overview.currency) : "0.00"}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">In Escrow</p>
                  <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full">
                    Locked in trades
                  </span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {overview ? formatAmount(overview.inEscrow, overview.currency) : "0.00"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Transaction History</h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{txs.length} transactions</span>
          </div>

          {loadingTx ? (
            <div className="p-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-lg mb-3 animate-pulse" />
              ))}
            </div>
          ) : txs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <History className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400">No transactions yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Your deposits, withdrawals, and trades will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {txs.map((tx) => {
                    const isIn = tx.direction === "in";
                    const statusColor =
                      tx.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : tx.status === "pending"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {isIn ? (
                              <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ArrowUpCircle className="w-5 h-5 text-rose-600" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                                {tx.type}
                              </div>
                              {tx.txId && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                  {tx.txId}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {isIn ? "+" : "−"} {formatAmount(tx.amount, tx.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Deposit History Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowDownCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Deposit History</h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{deposits.length} deposits</span>
          </div>

          {loadingDeposits ? (
            <div className="p-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700 rounded-lg mb-3 animate-pulse" />
              ))}
            </div>
          ) : deposits.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <ArrowDownCircle className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400">No deposits yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Your deposit history will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Transaction Hash
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Fees
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Deposited
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Network
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {deposits.map((deposit) => {
                    const statusColor =
                      deposit.status === "approved"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : deposit.status === "pending"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";

                    return (
                      <tr key={deposit._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-xs">
                            {deposit.transactionHash}
                          </div>
                          {deposit.isExpired && (
                            <span className="inline-flex mt-1 px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatAmount(deposit.originalAmount)}
                          </div>
                          {deposit.listingId && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Listing: {deposit.listingId.availableAmount} USDT
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900 dark:text-slate-100">
                            {formatAmount(deposit.totalFees)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Platform: {formatAmount(deposit.platformFeeUSDT)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Gas: {formatAmount(deposit.gasFeeUSDT)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatAmount(deposit.totalDepositAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 capitalize">
                            {deposit.blockchainNetwork}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor} capitalize`}>
                              {deposit.status}
                            </span>
                            {deposit.depositVerified && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {formatDate(deposit.createdAt)}
                          </div>
                          {deposit.verifiedAt && (
                            <div className="text-xs text-slate-500 dark:text-slate-500">
                              Verified: {formatDate(deposit.verifiedAt)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Deposit Modal */}
        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={handleCloseDepositModal}
          platformWalletAddress={platformWalletAddress}
          loadingWalletAddress={loadingWalletAddress}
          walletAddressError={walletAddressError}
        />
      </main>
    </div>
  );
}
