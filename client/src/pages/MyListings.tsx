import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  Eye,
  Calendar,
  RefreshCw
} from "lucide-react";
import api from "../api/axios";
import SummaryApi from "../api/SummaryApi";

interface Listing {
  _id: string;
  id: string;
  sellerId: string;
  cryptoType: string;
  networkName: string;
  availableAmount: number;
  originalAmount: number;
  pricePerUnit: number;
  currency: string;
  priceType: string;
  minTradeLimit: number;
  maxTradeLimit: number;
  paymentMethods: string[];
  timeLimit: number;
  isInstantSeller: boolean;
  createdBy: string;
  escrowTransactionHash?: string;
  depositAmount?: number;
  originalDepositAmount?: number;
  platformFeeUSDT?: number;
  gasFeeUSDT?: number;
  depositVerified: boolean;
  status: string;
  terms: string;
  instructions?: string;
  isAvailable: boolean;
  viewsCount: number;
  tradesCount: number;
  completedTradesCount: number;
  completionRate: number;
  totalValue: number;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MyListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(SummaryApi.getMyListings.url);
      const data = response.data?.data?.listings ?? [];

      setListings(data);
    } catch (err: any) {
      console.error("Failed to fetch my listings:", err);
      setError(err?.response?.data?.message ?? "Failed to load your listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return {
        text: "Active",
        color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
        icon: CheckCircle,
      };
    } else if (status === "pending") {
      return {
        text: "Pending Approval",
        color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
        icon: Clock,
      };
    } else {
      return {
        text: status,
        color: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600",
        icon: AlertCircle,
      };
    }
  };

  const getSellerTypeBadge = (listing: Listing) => {
    const isInstant = listing.createdBy === "InstantSeller" && listing.isInstantSeller === true;

    if (isInstant) {
      return {
        text: "Instant Seller",
        color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
        icon: Zap,
      };
    } else {
      return {
        text: "Regular Seller",
        color: "bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600",
        icon: Package,
      };
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

  const formatPaymentMethods = (methods: string[]) => {
    return methods.map((m) => m.toUpperCase().replace(/_/g, " ")).join(", ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading your listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3">
              <Package className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              My Listings
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              Manage and track your active and pending listings
            </p>
          </div>
          <button
            onClick={() => navigate("/market/create")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Listing
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Listings</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {listings.filter((l) => l.status === "active").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pending Approval</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {listings.filter((l) => l.status === "pending").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Instant Seller</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {listings.filter((l) => l.createdBy === "InstantSeller" && l.isInstantSeller).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-r-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
            <button
              onClick={fetchMyListings}
              className="mt-2 text-sm text-red-700 dark:text-red-400 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Listings Grid */}
        {listings.length === 0 && !loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <Package className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No listings yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create your first listing to start selling crypto on the marketplace
            </p>
            <button
              onClick={() => navigate("/market/create")}
              className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {listings.map((listing) => {
              const statusBadge = getStatusBadge(listing.status);
              const sellerTypeBadge = getSellerTypeBadge(listing);
              const StatusIcon = statusBadge.icon;
              const SellerTypeIcon = sellerTypeBadge.icon;

              return (
                <div
                  key={listing._id}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {listing.cryptoType}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusBadge.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold uppercase">
                          {listing.networkName}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sellerTypeBadge.color}`}>
                          <SellerTypeIcon className="w-3 h-3" />
                          {sellerTypeBadge.text}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        ₹{listing.pricePerUnit.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">per {listing.cryptoType}</div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Available:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {listing.availableAmount.toLocaleString()} {listing.cryptoType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Total Value:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        ₹{listing.totalValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Limits:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        ₹{listing.minTradeLimit.toLocaleString()} - ₹{listing.maxTradeLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Payment Methods:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-right">
                        {formatPaymentMethods(listing.paymentMethods)}
                      </span>
                    </div>
                  </div>

                  {/* Instant Seller Details */}
                  {listing.createdBy === "InstantSeller" && listing.depositAmount && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-4 border border-purple-200 dark:border-purple-800">
                      <div className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Instant Seller Deposit
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Deposit Amount:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {listing.depositAmount.toFixed(2)} USDT
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Platform Fee:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {listing.platformFeeUSDT} USDT
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Gas Fee:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {listing.gasFeeUSDT?.toFixed(2)} USDT
                          </span>
                        </div>
                        {listing.status === "pending" && (
                          <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                            <p className="text-amber-700 dark:text-amber-400 font-medium">
                              ⏳ Awaiting admin verification of deposit
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {listing.viewsCount} views
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {listing.tradesCount} trades
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(listing.createdAt)}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Terms:</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{listing.terms}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/marketplace/listings/${listing._id}`)}
                      className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all"
                    >
                      View Details
                    </button>
                    <button
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
