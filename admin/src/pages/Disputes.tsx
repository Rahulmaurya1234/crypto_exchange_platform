// src/pages/Disputes.tsx
import React, { useState, useMemo } from "react";
import {
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Shield,
  RefreshCw,
} from "lucide-react";
import {
  useGetAllDisputesQuery,
  useResolveDisputeMutation,
} from "../store/api/disputesApi";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { toast } from "react-toastify";

interface Dispute {
  _id: string;
  reason: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  tradeId: {
    _id: string;
    tradeNumber: string;
    buyerId?: { name?: string; email?: string };
    sellerId?: { name?: string; email?: string };
  } | null;
}

export const Disputes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionModal, setResolutionModal] = useState<{
    open: boolean;
    resolution: "buyer_favor" | "seller_favor";
    remarks: string;
  }>({
    open: false,
    resolution: "buyer_favor",
    remarks: "",
  });

  const { data, isLoading, refetch } = useGetAllDisputesQuery({
    search: searchTerm || undefined,
    page: 1,
    limit: 50,
  });

  const [resolveDispute] = useResolveDisputeMutation();

  // Extract disputes safely
  const disputes: Dispute[] = useMemo(() => {
    if (!data?.data?.disputes) return [];
    return Array.isArray(data.data.disputes) ? data.data.disputes : [];
  }, [data]);
  console.log("Fetched disputes:", disputes);
  const filteredDisputes = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return disputes.filter((dispute) => {
      const disputeId = dispute?._id?.toLowerCase() || "";

      const tradeNumber = dispute?.tradeId?.tradeNumber?.toLowerCase() || "";

      const buyerName = dispute?.tradeId?.buyerId?.name?.toLowerCase() || "";

      const buyerEmail = dispute?.tradeId?.buyerId?.email?.toLowerCase() || "";

      const sellerName = dispute?.tradeId?.sellerId?.name?.toLowerCase() || "";

      const sellerEmail =
        dispute?.tradeId?.sellerId?.email?.toLowerCase() || "";

      return (
        disputeId.includes(search) ||
        tradeNumber.includes(search) ||
        buyerName.includes(search) ||
        buyerEmail.includes(search) ||
        sellerName.includes(search) ||
        sellerEmail.includes(search)
      );
    });
  }, [disputes, searchTerm]);

  const handleResolve = async () => {
    if (!selectedDispute) return;

    try {
      await resolveDispute({
        id: selectedDispute._id,
        resolution: resolutionModal.resolution,
        remarks: resolutionModal.remarks || "Resolved by admin",
      }).unwrap();

      toast.success(
        `Dispute resolved in ${
          resolutionModal.resolution === "buyer_favor" ? "buyer" : "seller"
        }'s favor`
      );
      setResolutionModal({
        open: false,
        resolution: "buyer_favor",
        remarks: "",
      });
      setSelectedDispute(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to resolve dispute");
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading disputes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Disputes Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Resolve conflicts fairly and quickly
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-6 py-3 bg-red-100 text-red-800 rounded-xl font-bold text-lg border-2 border-red-300">
            {disputes.length} Active
          </span>
          <button
            onClick={refetch}
            className="px-5 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Dispute ID, Trade ID, or user..."
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition"
          />
        </div>
      </div>

      {/* Disputes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDisputes.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <Shield className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No active disputes</p>
          </div>
        ) : (
          filteredDisputes.map((dispute) => (
            <div
              key={dispute._id}
              onClick={() => setSelectedDispute(dispute)}
              className="bg-white rounded-2xl shadow-lg border-2 border-red-200 hover:border-red-400 transition-all duration-300 cursor-pointer p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                  <div>
                    <p className="font-mono font-bold text-red-600">
                      #{dispute._id.slice(-8)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Trade #{dispute?.tradeId?.tradeNumber || "N/A"}
                    </p>
                    {!dispute.tradeId && (
                      <p className="text-xs text-red-500 font-bold mt-1">
                        <AlertCircle size={15}/> Trade deleted / missing
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    dispute.status === "open"
                      ? "bg-red-100 text-red-700"
                      : dispute.status === "in_progress"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {dispute.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Buyer</p>
                  <p className="font-medium">
                    {dispute?.tradeId?.buyerId?.name || "Unknown Buyer"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {dispute?.tradeId?.buyerId?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Seller</p>
                  <p className="font-medium">
                    {dispute?.tradeId?.sellerId?.name || "Unknown Seller"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {dispute?.tradeId?.sellerId?.email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Reason</p>
                <p className="font-medium text-gray-900 text-sm line-clamp-2">
                  {dispute.reason}
                </p>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                {new Date(dispute.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDispute(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Resolve Dispute
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Dispute ID:{" "}
                    <strong>#{selectedDispute._id.slice(-8)}</strong> • Trade:{" "}
                    <strong>
                      #{selectedDispute.tradeId?.tradeNumber || "Deleted Trade"}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="p-3 hover:bg-gray-100 rounded-xl transition"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="font-bold text-lg mb-3">Buyer</h3>
                  <p className="font-medium">
                    {selectedDispute.tradeId?.buyerId?.name || "Unknown Buyer"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedDispute.tradeId?.buyerId?.email || "N/A"}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                  <h3 className="font-bold text-lg mb-3">Seller</h3>
                  <p className="font-medium">
                    {selectedDispute.tradeId?.sellerId?.name ||
                      "Unknown Seller"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedDispute.tradeId?.sellerId?.email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <h3 className="font-bold text-lg mb-4">Dispute Reason</h3>
                <p className="text-gray-700">{selectedDispute.reason}</p>
              </div>

              {/* Resolution Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() =>
                    setResolutionModal({
                      open: true,
                      resolution: "buyer_favor",
                      remarks: "",
                    })
                  }
                  className="flex-1 py-5 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-7 h-7" />
                  Resolve in Buyer's Favor
                </button>
                <button
                  onClick={() =>
                    setResolutionModal({
                      open: true,
                      resolution: "seller_favor",
                      remarks: "",
                    })
                  }
                  className="flex-1 py-5 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-7 h-7" />
                  Resolve in Seller's Favor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Resolution Modal */}
      {resolutionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900">
                Final Decision
              </h3>
              <p className="text-gray-600 mt-2">
                This will release escrow and cannot be undone.
              </p>
            </div>
            <textarea
              value={resolutionModal.remarks}
              onChange={(e) =>
                setResolutionModal({
                  ...resolutionModal,
                  remarks: e.target.value,
                })
              }
              placeholder="Add remarks (optional)"
              className="w-full p-4 border border-gray-300 rounded-xl mb-6 focus:ring-4 focus:ring-indigo-100"
              rows={4}
            />
            <div className="flex gap-4">
              <button
                onClick={() =>
                  setResolutionModal({
                    open: false,
                    resolution: "buyer_favor",
                    remarks: "",
                  })
                }
                className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
