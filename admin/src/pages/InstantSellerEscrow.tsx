// src/pages/InstantSellerEscrow.tsx
import React, { useState, useMemo } from "react";
import {
  Search,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Hash,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  useGetAllInstantSellerDepositsQuery,
  useApproveDepositMutation,
} from "../store/api/escrowApi";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { toast } from "react-toastify";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

interface InstantDeposit {
  _id: string;
  originalAmount: number;
  totalDepositAmount: number;
  platformFeeUSDT: number;
  gasFeeUSDT: number;
  totalFees: number;
  transactionHash: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  expiresAt: string;
  verificationNotes?: string;
  verifiedAt?: string;
  sellerId: {
    _id: string;
    name?: string;
    email: string;
  };
  listingId: {
    _id: string;
    pricePerUnit?: number;
    cryptoType?: string;
  } | null;
}

export const InstantSellerEscrow: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<InstantDeposit | null>(null);
  const [notes, setNotes] = useState("");

  const limit = 12;

  const { data, isLoading, refetch } = useGetAllInstantSellerDepositsQuery({
    page,
    limit,
  });
  const [verifyDeposit, { isLoading: verifying }] = useApproveDepositMutation();

  const deposits: InstantDeposit[] = useMemo(() => {
    if (!data?.data?.deposits) return [];
    return data.data.deposits.map((d: any) => ({
      ...d,
      listingId: d.listingId || null,
    }));
  }, [data]);

  const filteredDeposits = useMemo(() => {
    let filtered = deposits;

    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.sellerId.email.toLowerCase().includes(term) ||
          d.sellerId.name?.toLowerCase().includes(term) ||
          d.transactionHash.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [deposits, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const all = deposits.length;
    const pending = deposits.filter((d) => d.status === "pending").length;
    const approved = deposits.filter((d) => d.status === "approved").length;
    const rejected = deposits.filter((d) => d.status === "rejected").length;
    return { all, pending, approved, rejected };
  }, [deposits]);

  const handleVerify = async (approved: boolean) => {
    if (!selected?.listingId?._id) {
      toast.error("Listing ID not found");
      return;
    }

    if (!approved && !notes.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await verifyDeposit({
        id: selected.listingId._id,
        body: {
          verified: approved,
          notes: notes.trim() || undefined,
          rejectionReason: !approved ? notes.trim() : undefined,
          canResubmit: !approved ? true : undefined,
        },
      }).unwrap();

      toast.success(approved ? "✅ Approved!" : "❌ Rejected");
      setSelected(null);
      setNotes("");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || "Failed");
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading && deposits.length === 0) {
    return <LoadingSpinner text="Loading instant seller deposits..." />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold">Instant Seller Deposits</h1>
            <p className="text-emerald-100 text-lg mt-2">
              Manage and verify instant trading deposits
            </p>
          </div>
          <button
            onClick={refetch}
            className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition flex items-center gap-2"
          >
            <RefreshCw
              className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-emerald-100 text-sm">Total</p>
            <p className="text-2xl font-bold">{stats.all}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-yellow-200 text-sm">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-green-200 text-sm">Approved</p>
            <p className="text-2xl font-bold">{stats.approved}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-red-200 text-sm">Rejected</p>
            <p className="text-2xl font-bold">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-5 h-5 text-gray-500" />
            {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => {
                    setStatusFilter(f);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                    statusFilter === f
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {f}
                </button>
              )
            )}
          </div>

          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email, name or TX hash..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Deposits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDeposits.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <ShieldCheck className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No deposits found</p>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your search
              </p>
            )}
          </div>
        ) : (
          filteredDeposits.map((d) => (
            <div
              key={d._id}
              onClick={() => setSelected(d)}
              className="bg-white rounded-2xl shadow-md border-2 border-gray-100 hover:border-emerald-400 hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-lg">
                      {d.originalAmount.toLocaleString()} USDT
                    </p>
                    <p className="text-sm text-gray-500">
                      Total: {d.totalDepositAmount.toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                      d.status
                    )}`}
                  >
                    {d.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">Seller</p>
                  <p className="font-medium truncate">
                    {d.sellerId.name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {d.sellerId.email}
                  </p>
                </div>

                {d.listingId ? (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600">Price/Unit</p>
                    <p className="font-bold text-emerald-600">
                      ₹{d.listingId.pricePerUnit}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-700 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">No listing</p>
                        <p className="text-amber-600">Cannot verify</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                  <p className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {d.transactionHash.slice(0, 12)}...
                    {d.transactionHash.slice(-8)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            Page {page} of {data.data.pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(data.data.pagination.totalPages, p + 1))
            }
            disabled={page === data.data.pagination.totalPages}
            className="p-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold">Review Deposit</h2>
                  <p className="text-xl text-gray-600 mt-2">
                    {selected.originalAmount.toLocaleString()} USDT →{" "}
                    {selected.totalDepositAmount.toFixed(2)} USDT
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-3 hover:bg-gray-100 rounded-xl transition"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Warning if no listing */}
              {!selected.listingId && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-red-800">
                      Warning: No Listing Attached
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      This deposit has no associated listing. Cannot approve
                      without a valid listing ID.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
                  <h3 className="font-bold mb-3">Seller Information</h3>
                  <p className="font-medium">
                    {selected.sellerId.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selected.sellerId.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    ID: {selected.sellerId._id}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                  <h3 className="font-bold mb-3">Fee Breakdown</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      Platform Fee:{" "}
                      <strong>
                        {selected.platformFeeUSDT.toFixed(2)} USDT
                      </strong>
                    </p>
                    <p>
                      Gas Fee:{" "}
                      <strong>{selected.gasFeeUSDT.toFixed(2)} USDT</strong>
                    </p>
                    <p className="pt-2 border-t border-purple-300">
                      Total Fees:{" "}
                      <strong className="text-purple-700">
                        {selected.totalFees.toFixed(2)} USDT
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              {selected.listingId && (
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200 mb-6">
                  <h3 className="font-bold mb-2">Linked Listing</h3>
                  <div className="space-y-1">
                    <p>
                      Listing ID: <strong>{selected.listingId._id}</strong>
                    </p>
                    <p>
                      Price per USDT:{" "}
                      <strong className="text-blue-700">
                        ₹{selected.listingId.pricePerUnit}
                      </strong>
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">Transaction Hash</h3>
                  <a
                    href={`https://etherscan.io/tx/${selected.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    View on Etherscan
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="font-mono text-sm break-all bg-white p-3 rounded border">
                  {selected.transactionHash}
                </p>
              </div>

              {selected.status === "pending" && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Admin Notes{" "}
                      {!notes.trim() && (
                        <span className="text-red-600">
                          (Required for rejection)
                        </span>
                      )}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        "For Approval: Add verification notes (optional)\n" +
                        "For Rejection: Explain reason (REQUIRED)"
                      }
                      className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleVerify(false)}
                      disabled={verifying || !selected.listingId}
                      className="flex-1 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                    >
                      <XCircle className="w-5 h-5" />
                      {verifying ? "Rejecting..." : "Reject Deposit"}
                    </button>
                    <button
                      onClick={() => handleVerify(true)}
                      disabled={verifying || !selected.listingId}
                      className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {verifying ? "Approving..." : "Approve Deposit"}
                    </button>
                  </div>

                  {!selected.listingId && (
                    <p className="text-center text-sm text-red-600 mt-3 font-medium">
                      ⚠️ Cannot process this deposit without a listing
                    </p>
                  )}
                </>
              )}

              {selected.status !== "pending" && (
                <div className="bg-gray-100 rounded-xl p-6 text-center">
                  <p className="text-lg font-medium">
                    This deposit is already{" "}
                    <span className="capitalize font-bold">
                      {selected.status}
                    </span>
                  </p>
                  {selected.verificationNotes && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Notes:</strong> {selected.verificationNotes}
                    </p>
                  )}
                  {selected.verifiedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Verified at:{" "}
                      {new Date(selected.verifiedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
