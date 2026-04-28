import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
  Eye,
  Calendar,
  TrendingUp,
  DollarSign,
  User,
  MessageSquare,
  ChevronRight,
  BarChart3,
  FileText,
  ShieldAlert,
} from "lucide-react";
import api from "../api/axios";
import SummaryApi from "../api/SummaryApi";

interface FeeBreakdown {
  platformFeePercent: number;
  platformFeeINR: number;
  platformFeeUSDT: number;
  gasFeePercent: number;
  gasFeeINR: number;
  cryptoPlatformFeePercent: number;
  _id: string;
}

interface TimelineEvent {
  event: string;
  description: string;
  timestamp: string;
  actor?: string;
  _id: string;
}

interface BuyerAadhaarProof {
  frontImageUrl: string;
  backImageUrl: string;
  uploadedAt: string;
}

interface BuyerPaymentDetails {
  transactionId: string;
  amount: number;
  bank: string;
  proofUrl: string;
  uploadedAt: string;
}

interface SellerPaymentConfirmation {
  confirmed: boolean;
  confirmedAt?: string;
  remarks?: string;
}

interface ListingId {
  _id: string;
  cryptoType: string;
  pricePerUnit: number;
  totalValue: number | null;
  isExpired: boolean;
  id: string;
}

interface UserId {
  _id: string;
  averageRating: number;
  name: string;
  isInstantSeller?: boolean;
  id: string;
}

interface Trade {
  _id: string;
  id: string;
  listingId: ListingId;
  buyerId: UserId;
  sellerId: UserId;
  cryptoAmount: number;
  pricePerUnit: number;
  totalINRAmount: number;
  feeBreakdown: FeeBreakdown;
  sellerNetINR: number;
  platformFeeINR: number;
  gasFeeINR: number;
  effectivePricePerUnit: number;
  platformFeeUSDT: number;
  sellerMustDepositUSDT: number;
  sellerMustSend: number;
  buyerWillReceive: number;
  status: string;
  paymentMethod: string;
  buyerWalletAddress: string;
  isShareDocument: boolean;
  expiresAt: string;
  paymentTimeLimit: number;
  chatId: string;
  hasDispute: boolean;
  buyerReviewed: boolean;
  sellerReviewed: boolean;
  isInstantSeller: boolean;
  autoReleaseEnabled: boolean;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
  tradeNumber: string;
  __v: number;
  buyerAadhaarProof?: BuyerAadhaarProof;
  buyerPaymentDetails?: BuyerPaymentDetails;
  sellerPaymentConfirmation?: SellerPaymentConfirmation;
  escrowAddress?: string;
  escrowTransactionHash?: string;
  escrowDepositedAt?: string;
  escrowReleaseHash?: string;
  escrowReleasedAt?: string;
  completedAt?: string;
  disputeCreatedAt?: string;
  disputeId?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string | null;
}

interface TradeStats {
  total: number;
  completed: number;
  cancelled: number;
  disputed: number;
  active: number;
  totalVolume: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    trades: Trade[];
    pagination: Pagination;
  };
  timestamp: string;
}

interface StatsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    stats: TradeStats;
  };
  timestamp: string;
}

export default function Trades() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<ApiResponse>(SummaryApi.getAllTrades.url);
      const data = response.data?.data?.trades ?? [];
      console.log("Fetched trades:", data);
      setTrades(data);
    } catch (err: any) {
      console.error("Failed to fetch trades:", err);
      setError(err?.response?.data?.message ?? "Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  const fetchTradeStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);

      const response = await api.get<StatsResponse>(
        SummaryApi.getTradeStats.url
      );
      setStats(response.data?.data?.stats ?? null);
    } catch (err: any) {
      console.error("Failed to fetch trade stats:", err);
      setStatsError(
        err?.response?.data?.message ?? "Failed to load trade statistics"
      );
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    fetchTradeStats();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          text: "Completed",
          color:
            "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
          icon: CheckCircle,
          bgColor: "bg-green-50 dark:bg-green-900/20",
        };
      case "cancelled":
        return {
          text: "Cancelled",
          color:
            "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
          icon: XCircle,
          bgColor: "bg-red-50 dark:bg-red-900/20",
        };
      case "disputed":
        return {
          text: "Disputed",
          color:
            "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
          icon: AlertTriangle,
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
        };
      case "pending_seller_deposit":
        return {
          text: "Awaiting Deposit",
          color:
            "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
          icon: Clock,
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
        };
      case "escrow_confirmed":
        return {
          text: "Escrow Confirmed",
          color:
            "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
          icon: ShieldAlert,
          bgColor: "bg-purple-50 dark:bg-purple-900/20",
        };
      case "payment_proof_uploaded":
        return {
          text: "Payment Proof Uploaded",
          color:
            "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800",
          icon: FileText,
          bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
        };
      case "pending_seller_confirmation":
        return {
          text: "Awaiting Seller Confirmation",
          color:
            "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800",
          icon: Clock,
          bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
        };
      default:
        return {
          text: status.replace(/_/g, " "),
          color:
            "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600",
          icon: Clock,
          bgColor: "bg-slate-50 dark:bg-slate-800",
        };
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "upi":
        return "UPI";
      case "imps":
        return "IMPS";
      default:
        return method.toUpperCase();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFilteredTrades = () => {
    if (filter === "all") return trades;
    return trades.filter((trade) => trade.status === filter);
  };

  const handleViewDetails = (trade: Trade) => {
    setSelectedTrade(trade);
  };

  const handleCloseDetails = () => {
    setSelectedTrade(null);
  };

  const handleOpenChat = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const filteredTrades = getFilteredTrades();

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading trades...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3">
              <Package className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              My Trades
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              Track and manage all your cryptocurrency trades
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchTrades();
                fetchTradeStats();
              }}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Total Trades
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats?.total || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Completed
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats?.completed || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Cancelled
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats?.cancelled || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Disputed
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats?.disputed || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Volume Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-800 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100 dark:text-blue-200">
                Total Trade Volume
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(stats?.totalVolume || 0)}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-white/80" />
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-r-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                {error}
              </p>
            </div>
            <button
              onClick={fetchTrades}
              className="mt-2 text-sm text-red-700 dark:text-red-400 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {statsError && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-600 rounded-r-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                {statsError}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Filter by Status
              </span>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {filteredTrades.length} trades
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              All Trades
            </button>
            {[
              "completed",
              "cancelled",
              "disputed",
              "pending_seller_deposit",
              "escrow_confirmed",
              "payment_proof_uploaded",
              "pending_seller_confirmation",
            ].map((status) => {
              const config = getStatusConfig(status);
              const Icon = config.icon;
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    filter === status
                      ? config.color
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {config.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Trades List */}
        {filteredTrades.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <Package className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No trades found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filter === "all"
                ? "You haven't made any trades yet"
                : `No ${filter.replace(/_/g, " ")} trades found`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTrades.map((trade) => {
              const statusConfig = getStatusConfig(trade.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedTrade === trade._id;

              return (
                <div
                  key={trade._id}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  {/* Trade Summary */}
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.text}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {trade.tradeNumber}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {trade.cryptoAmount.toLocaleString()}{" "}
                            {trade.listingId.cryptoType}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {trade.listingId.cryptoType} @{" "}
                            {formatCurrency(trade.pricePerUnit)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">
                              {trade?.buyerId?.name} → {trade?.sellerId?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">
                              {formatDate(trade.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                              {formatCurrency(trade.totalINRAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Section */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenChat(trade.chatId)}
                          className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chat
                        </button>
                        <button
                          onClick={() => handleViewDetails(trade)}
                          className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() =>
                            setExpandedTrade(isExpanded ? null : trade._id)
                          }
                          className={`p-2 rounded-lg transition-all ${
                            isExpanded
                              ? "bg-slate-100 dark:bg-slate-700 rotate-90"
                              : "hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Trade Details */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            Trade Details
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Trade Number:
                              </span>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {trade.tradeNumber}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Payment Method:
                              </span>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {getPaymentMethodText(trade.paymentMethod)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Effective Price:
                              </span>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {formatCurrency(trade.effectivePricePerUnit)}{" "}
                                per {trade.listingId.cryptoType}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Buyer Wallet:
                              </span>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 font-mono">
                                {trade.buyerWalletAddress.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Financial Breakdown */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            Financial Breakdown
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Total Amount:
                              </span>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {formatCurrency(trade.totalINRAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Platform Fee:
                              </span>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {formatCurrency(trade.platformFeeINR)} (
                                {trade.feeBreakdown.platformFeePercent}%)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Gas Fee:
                              </span>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {formatCurrency(trade.gasFeeINR)} (
                                {trade.feeBreakdown.gasFeePercent}%)
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                Seller Receives:
                              </span>
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(trade.sellerNetINR)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Preview */}
                      {trade.timeline && trade.timeline.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                              Recent Activity
                            </h4>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {trade.timeline.length} events
                            </span>
                          </div>
                          <div className="space-y-2">
                            {trade.timeline.slice(0, 3).map((event) => (
                              <div
                                key={event._id}
                                className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                              >
                                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {event.event}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {formatTime(event.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                    {event.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Trade Details Modal */}
        {selectedTrade && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      Trade Details
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {selectedTrade.tradeNumber}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseDetails}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <XCircle className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto p-6 space-y-6 max-h-[calc(90vh-80px)]">
                {/* Status Banner */}
                <div
                  className={`p-4 rounded-lg ${
                    getStatusConfig(selectedTrade.status).bgColor
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const StatusIcon = getStatusConfig(selectedTrade.status).icon;
                        return <StatusIcon className="w-6 h-6" />;
                      })()}
                      <div>
                        <h3 className="font-bold text-lg">
                          {getStatusConfig(selectedTrade.status).text}
                        </h3>
                        <p className="text-sm opacity-80">
                          Created: {formatDate(selectedTrade.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenChat(selectedTrade.chatId)}
                      className="px-4 py-2 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open Chat
                    </button>
                  </div>
                </div>

                {/* Trade Parties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Buyer
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Name:
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {selectedTrade.buyerId.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Rating:
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {selectedTrade.buyerId.averageRating} ⭐
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Wallet Address:
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 font-mono truncate max-w-[200px]">
                          {selectedTrade.buyerWalletAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Seller
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Name:
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {selectedTrade.sellerId.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Rating:
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {selectedTrade.sellerId.averageRating} ⭐
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Type:
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {selectedTrade.isInstantSeller
                            ? "Instant Seller"
                            : "Regular Seller"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    Financial Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Crypto Amount:
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {selectedTrade.cryptoAmount.toLocaleString()}{" "}
                          {selectedTrade.listingId.cryptoType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Price per Unit:
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(selectedTrade.pricePerUnit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Effective Price:
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(selectedTrade.effectivePricePerUnit)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Total Amount:
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(selectedTrade.totalINRAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Platform Fee:
                        </span>
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(selectedTrade.platformFeeINR)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Seller Receives:
                        </span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(selectedTrade.sellerNetINR)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                {selectedTrade.timeline &&
                  selectedTrade.timeline.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                        Trade Timeline
                      </h4>
                      <div className="space-y-3">
                        {selectedTrade.timeline.map((event, index) => (
                          <div
                            key={event._id}
                            className="flex items-start gap-4 p-4 bg-white dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600"
                          >
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  index === 0 ? "bg-green-500" : "bg-blue-500"
                                }`}
                              ></div>
                              {index < selectedTrade.timeline.length - 1 && (
                                <div className="w-0.5 h-full bg-slate-300 dark:bg-slate-600 mt-1"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium text-slate-900 dark:text-slate-100">
                                    {event.event}
                                  </h5>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {event.description}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatDate(event.timestamp)}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatTime(event.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      Additional Information
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Payment Method:
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {getPaymentMethodText(selectedTrade.paymentMethod)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Payment Time Limit:
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {selectedTrade.paymentTimeLimit} minutes
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Auto Release:
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {selectedTrade.autoReleaseEnabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Share Document:
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {selectedTrade.isShareDocument ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Escrow Info */}
                  {(selectedTrade.escrowAddress ||
                    selectedTrade.escrowTransactionHash) && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        Escrow Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        {selectedTrade.escrowAddress && (
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">
                              Escrow Address:
                            </span>
                            <span className="font-medium text-slate-900 dark:text-slate-100 font-mono text-xs truncate max-w-[150px]">
                              {selectedTrade.escrowAddress}
                            </span>
                          </div>
                        )}
                        {selectedTrade.escrowTransactionHash && (
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">
                              Deposit TX:
                            </span>
                            <span className="font-medium text-slate-900 dark:text-slate-100 font-mono text-xs truncate max-w-[150px]">
                              {selectedTrade.escrowTransactionHash}
                            </span>
                          </div>
                        )}
                        {selectedTrade.escrowReleaseHash && (
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">
                              Release TX:
                            </span>
                            <span className="font-medium text-slate-900 dark:text-slate-100 font-mono text-xs truncate max-w-[150px]">
                              {selectedTrade.escrowReleaseHash}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  onClick={handleCloseDetails}
                  className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => handleOpenChat(selectedTrade.chatId)}
                  className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Open Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
