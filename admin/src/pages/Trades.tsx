// src/pages/Trades.tsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  ShieldAlert,
  Hash,
  User,
  DollarSign,
  Calendar,
  AlertTriangle,
  FileText,
  Banknote,
  Shield,
  Timer
} from 'lucide-react';
import {
  useGetAllTradesQuery,
  useGetTradeByIdQuery,
  useLazyGetSignedUrlQuery
} from '../store/api/tradeApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

interface BuyerSeller {
  _id: string;
  name?: string;
  email?: string;
  averageRating?: number;
  totalReviews?: number;
}

interface Trade {
  _id: string;
  tradeNumber: string;
  buyerId: BuyerSeller;
  sellerId: BuyerSeller;
  totalINRAmount: number;
  cryptoAmount: number;
  listingId: { cryptoType: string } | null;
  status: string;
  hasDispute: boolean;
  createdAt: string;
  escrowTransactionHash?: string;
  buyerWillReceive?: number;
  sellerMustSend?: number;
  isInstantSeller?: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  deposit_submitted: 'bg-blue-100 text-blue-700',
  escrow_deposited: 'bg-indigo-100 text-indigo-700',
  payment_made: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

// Helper: Extract S3 key
const extractKey = (url: string): string => {
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  } catch {
    return url;
  }
};

export const Trades: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cryptoFilter, setCryptoFilter] = useState('all');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetAllTradesQuery({
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: 1,
    limit: 100,
  });

  const { data: tradeDetailData, isFetching: fetchingTrade } = useGetTradeByIdQuery(selectedTradeId!, {
    skip: !selectedTradeId,
  });

  const tradeDetail = tradeDetailData?.data?.trade;
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [triggerGetSignedUrl] = useLazyGetSignedUrlQuery();

  // Fetch signed URLs when trade detail loads
  React.useEffect(() => {
    const fetchImages = async () => {
      if (!tradeDetail?.buyerAadhaarProof) return;

      const { frontImageUrl, backImageUrl } = tradeDetail.buyerAadhaarProof;
      const urlMap: Record<string, string> = {};

      const fetchUrl = async (url: string) => {
        if (!url || signedUrls[url]) return;
        try {
          const key = extractKey(url);
          console.log("🔍 Fetching signed URL for:", { originalUrl: url, extractedKey: key });
          const result = await triggerGetSignedUrl(key).unwrap();
          console.log("✅ Signed URL received:", result);
          urlMap[url] = result.url;
        } catch (error) {
          console.error("❌ Failed to fetch signed URL:", { url, key: extractKey(url), error });
        }
      };

      await Promise.all([
        frontImageUrl ? fetchUrl(frontImageUrl) : Promise.resolve(),
        backImageUrl ? fetchUrl(backImageUrl) : Promise.resolve(),
      ]);


      if (Object.keys(urlMap).length > 0) {
        console.log("📦 Updating signedUrls state with:", urlMap);
        setSignedUrls((prev) => {
          const updated = { ...prev, ...urlMap };
          console.log("📦 New signedUrls state:", updated);
          return updated;
        });
      } else {
        console.log("⚠️ No signed URLs to update");
      }
    };

    fetchImages();
  }, [tradeDetail]);

  // Debug: Log signedUrls whenever it changes
  React.useEffect(() => {
    console.log("🔄 signedUrls state changed:", signedUrls);
  }, [signedUrls]);

  const trades: Trade[] = useMemo(() => {
    if (!data?.data?.trades) return [];
    return data.data.trades.map((t: any) => ({
      ...t,
      listingId: t.listingId || null,
    }));
  }, [data]);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const search = searchTerm.toLowerCase();
      const crypto = trade.listingId?.cryptoType || 'USDT';

      const matchesSearch =
        trade.tradeNumber?.toLowerCase().includes(search) ||
        trade.buyerId?.name?.toLowerCase().includes(search) ||
        trade.buyerId?.email?.toLowerCase().includes(search) ||
        trade.sellerId?.name?.toLowerCase().includes(search) ||
        trade.sellerId?.email?.toLowerCase().includes(search);

      const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;
      const matchesCrypto = cryptoFilter === 'all' || crypto === cryptoFilter;

      return matchesSearch && matchesStatus && matchesCrypto;
    });
  }, [trades, searchTerm, statusFilter, cryptoFilter]);

  const stats = useMemo(() => {
    const total = trades.length;
    const pending = trades.filter(t => ['pending', 'deposit_submitted'].includes(t.status)).length;
    const active = trades.filter(t => ['escrow_deposited', 'payment_made'].includes(t.status)).length;
    const completed = trades.filter(t => t.status === 'completed').length;
    const disputed = trades.filter(t => t.hasDispute).length;
    return { total, pending, active, completed, disputed };
  }, [trades]);

  if (isLoading) return <LoadingSpinner text="Loading trades..." />;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold">Trades Management</h1>
            <p className="text-indigo-100 text-lg mt-2">Monitor all P2P trades in real-time</p>
          </div>
          <button
            onClick={refetch}
            className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-indigo-100 text-sm">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-yellow-200 text-sm">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-blue-200 text-sm">Active</p>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-green-200 text-sm">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-red-200 text-sm">Disputed</p>
            <p className="text-2xl font-bold">{stats.disputed}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Trade ID, buyer, seller..."
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="deposit_submitted">Deposit Submitted</option>
            <option value="escrow_deposited">Escrow Deposited</option>
            <option value="payment_made">Payment Made</option>
            <option value="completed">Completed</option>
            <option value="disputed">Disputed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={cryptoFilter}
            onChange={(e) => setCryptoFilter(e.target.value)}
            className="px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Crypto</option>
            <option value="USDT">USDT</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No trades found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Trade ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Buyer → Seller</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Crypto</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Created</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTrades.map((trade) => (
                  <tr key={trade._id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedTradeId(trade._id)}>
                    <td className="py-4 px-6">
                      <p className="font-mono font-bold text-indigo-600">#{trade.tradeNumber}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{trade?.buyerId?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{trade?.buyerId?.email}</p>
                        </div>
                        <span className="text-gray-400">→</span>
                        <div>
                          <p className="font-medium">{trade.sellerId.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{trade.sellerId.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold">₹{trade.totalINRAmount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        {trade.cryptoAmount} {trade.listingId?.cryptoType || 'USDT'}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[trade.status] || 'bg-gray-100 text-gray-700'}`}>
                          {trade.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        {trade.hasDispute && (
                          <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            DISPUTED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                        {trade.listingId?.cryptoType || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(trade.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTradeId(trade._id); }}
                        className="p-2 hover:bg-indigo-100 rounded-lg transition"
                      >
                        <Eye className="w-5 h-5 text-indigo-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade Details Modal */}
      {selectedTradeId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTradeId(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {fetchingTrade ? (
              <div className="p-20 text-center">
                <LoadingSpinner text="Loading trade details..." />
              </div>
            ) : !tradeDetail ? (
              <div className="p-20 text-center text-gray-500">Trade not found</div>
            ) : (
              <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-6">
                  <div>
                    <h2 className="text-3xl font-bold">Trade Details</h2>
                    <p className="text-2xl font-mono text-indigo-600 mt-2">#{tradeDetail.tradeNumber}</p>
                  </div>
                  <button onClick={() => setSelectedTradeId(null)} className="p-3 hover:bg-gray-100 rounded-xl">
                    <XCircle className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Buyer & Seller */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                      <User className="w-6 h-6" /> Buyer
                    </h3>
                    <p className="font-semibold text-lg">{tradeDetail.buyerId.name || 'N/A'}</p>
                    <p className="text-gray-600">{tradeDetail.buyerId.email}</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                      <User className="w-6 h-6" /> Seller
                    </h3>
                    <p className="font-semibold text-lg">{tradeDetail.sellerId.name || 'N/A'}</p>
                    <p className="text-gray-600">{tradeDetail.sellerId.email}</p>
                  </div>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-xl p-5 text-center">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">INR Amount</p>
                    <p className="text-2xl font-bold">₹{tradeDetail.totalINRAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 text-center">
                    <Shield className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Crypto Amount</p>
                    <p className="text-2xl font-bold">{tradeDetail.cryptoAmount} USDT</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 text-center">
                    <Timer className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`text-lg font-bold ${statusColors[tradeDetail.status] || 'text-gray-700'}`}>
                      {tradeDetail.status.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 text-center">
                    <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-lg font-medium">
                      {new Date(tradeDetail.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Escrow TX */}
                {tradeDetail.escrowTransactionHash && (
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Hash className="w-5 h-5" /> Escrow Transaction Hash
                    </h3>
                    <p className="font-mono text-sm break-all bg-white p-4 rounded-lg border">
                      {tradeDetail.escrowTransactionHash}
                    </p>
                  </div>
                )}

                {/* Aadhaar Proof */}
                {tradeDetail.buyerAadhaarProof && (
                  <div className="bg-yellow-50 rounded-2xl p-6 border-2 border-yellow-300">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Buyer Aadhaar Proof
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium mb-2">Front</p>
                        <img
                          src={signedUrls[tradeDetail.buyerAadhaarProof.frontImageUrl] || tradeDetail.buyerAadhaarProof.frontImageUrl}
                          alt="Aadhaar Front"
                          className="rounded-lg shadow-md w-full"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Back</p>
                        <img
                          src={signedUrls[tradeDetail.buyerAadhaarProof.backImageUrl] || tradeDetail.buyerAadhaarProof.backImageUrl}
                          alt="Aadhaar Back"
                          className="rounded-lg shadow-md w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Seller Bank Details */}
                {tradeDetail.sellerBankDetails && (
                  <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-300">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Banknote className="w-5 h-5" /> Seller Bank Details
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Account Holder</p>
                        <p className="font-medium">{tradeDetail.sellerBankDetails.accountHolderName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Bank Name</p>
                        <p className="font-medium">{tradeDetail.sellerBankDetails.bankName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Account Number</p>
                        <p className="font-mono text-xs">{tradeDetail.sellerBankDetails.accountNumber.slice(-12)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">IFSC Code</p>
                        <p className="font-mono">{tradeDetail.sellerBankDetails.ifscCode}</p>
                      </div>
                    </div>
                  </div>
                )}

                {tradeDetail.hasDispute && (
                  <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-6 text-red-800">
                    <h3 className="font-bold text-2xl flex items-center gap-3">
                      <ShieldAlert className="w-8 h-8" />
                      This Trade is Under Dispute
                    </h3>
                    <p className="mt-3 text-lg">Admin intervention required.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};