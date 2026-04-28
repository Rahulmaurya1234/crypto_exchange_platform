// admin/src/pages/KYC.tsx - BUG FIXES APPLIED
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Filter,
  Calendar,
  User,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  useGetPendingKYCsQuery,
  useGetAllKYCsQuery,
  useReviewKYCMutation,
} from "../store/api/kycApi";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { toast } from "react-toastify";
import { useS3Image } from "../hooks/useS3Image";

interface KYCSubmission {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  documents: Array<{
    documentType: string;
    frontImageUrl: string;
    backImageUrl?: string;
    documentNumber?: string;
  }>;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch: string;
    accountHolderName: string;
    bankProofUrl?: string;
  };
  status: "pending" | "approved" | "rejected" | "submitted";
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  reason?: string;
  fullName?: string;
}

type FilterType = "all" | "pending" | "approved" | "rejected";

// Reusable S3 Image Component
const S3Image: React.FC<{
  src: string | undefined;
  alt: string;
  className?: string;
  showLabel?: boolean;
}> = ({ src, alt, className = "", showLabel = false }) => {
  const { url, loading, error } = useS3Image(src);

  if (loading) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
      >
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4 ${className}`}
      >
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-2" />
        <p className="text-sm text-gray-700">Cannot load image</p>
      </div>
    );
  }

  return (
    <div className={showLabel ? "bg-gray-50 rounded-xl p-2" : ""}>
      <img
        src={url}
        alt={alt}
        className={`rounded-lg shadow-md object-contain ${className}`}
        loading="lazy"
      />
      {showLabel && (
        <p className="text-center text-sm text-gray-600 mt-2 font-medium">
          {alt}
        </p>
      )}
    </div>
  );
};

// Grid thumbnail component
const GridImage: React.FC<{ src: string | undefined; alt: string }> = ({
  src,
  alt,
}) => {
  const { url, loading, error } = useS3Image(src);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <AlertTriangle className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );
};

export const KYC: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKyc, setSelectedKyc] = useState<KYCSubmission | null>(null);
  const [filter, setFilter] = useState<FilterType>("pending");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    action: "approve" | "reject";
    kyc: KYCSubmission | null;
    reason?: string;
    remarks?: string;
  }>({
    open: false,
    action: "approve",
    kyc: null,
    reason: "",
    remarks: "",
  });

  // FIX 1: Skip pending query when filter is not "pending"
  const {
    data: pendingResponse,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useGetPendingKYCsQuery(undefined, { skip: filter !== "pending" });

  const {
    data: allResponse,
    isLoading: allLoading,
    refetch: refetchAll,
  } = useGetAllKYCsQuery({ page, limit }, { skip: filter === "pending" });

  const [reviewKYC, { isLoading: reviewLoading }] = useReviewKYCMutation();
  const isLoading = filter === "pending" ? pendingLoading : allLoading;

  // FIX 2: Reset page to 1 when switching between filters
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const allKYCs: KYCSubmission[] = useMemo(() => {
    const response = filter === "pending" ? pendingResponse : allResponse;
    if (!response?.data) return [];
    const rawData = response.data.kycs || response.data;
    if (!Array.isArray(rawData)) return [];

    return rawData.map((item: any) => ({
      ...item,
      userId: item.userId || {
        _id: item.user?._id || item.userId?._id || "unknown",
        name:
          item.fullName ||
          item.user?.name ||
          item.userId?.name ||
          "Unknown User",
        email: item.user?.email || item.userId?.email || "N/A",
      },
      documents: item.documents || [],
    }));
  }, [pendingResponse, allResponse, filter]);

  const totalPages = useMemo(() => {
    if (filter === "pending") return 1;
    return allResponse?.data?.pagination?.totalPages || 1;
  }, [allResponse, filter]);

  const filteredKYCs = useMemo(() => {
    let filtered = allKYCs;

    // FIX 3: Proper filtering - "all" shows everything, specific status filters
    // Also handle "submitted" status as "pending"
    if (filter === "pending") {
      filtered = filtered.filter((kyc) => kyc.status === "pending" || kyc.status === "submitted");
    } else if (filter !== "all") {
      filtered = filtered.filter((kyc) => kyc.status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (kyc) =>
          (kyc.userId?.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (kyc.userId?.email || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (kyc.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [allKYCs, filter, searchTerm]);

  // FIX 4: Calculate stats from all KYCs, not filtered
  const stats = useMemo(() => {
    // Get all KYCs regardless of current filter
    let allData: KYCSubmission[] = [];
    
    if (pendingResponse?.data) {
      const rawPending = pendingResponse.data.kycs || pendingResponse.data;
      if (Array.isArray(rawPending)) {
        allData = [...rawPending];
      }
    }
    
    if (allResponse?.data && filter !== "pending") {
      const rawAll = allResponse.data.kycs || allResponse.data;
      if (Array.isArray(rawAll)) {
        allData = rawAll;
      }
    }

    const pending = allData.filter((k) => k.status === "pending" || k.status === "submitted").length;
    const approved = allData.filter((k) => k.status === "approved").length;
    const rejected = allData.filter((k) => k.status === "rejected").length;
    return { pending, approved, rejected, total: allData.length };
  }, [pendingResponse, allResponse, filter]);

const handleReview = async () => {
  if (!actionModal.kyc) return;

  if (actionModal.action === "reject" && !actionModal.reason?.trim()) {
    toast.error("Please provide a reason for rejection");
    return;
  }

  try {
    const payload =
      actionModal.action === "approve"
        ? {
            userId: actionModal.kyc._id,
            action: "approve" as const,
            level: "level_2",
            remarks: actionModal.remarks || "Documents verified successfully",
          }
        : {
            userId: actionModal.kyc._id,
            action: "reject" as const,
            
            reason: actionModal.reason || "Unclear or invalid documents",
          };

    await reviewKYC(payload).unwrap();

    toast.success(
      `KYC ${
        actionModal.action === "approve" ? "approved" : "rejected"
      } successfully`
    );

    setActionModal({
      open: false,
      action: "approve",
      kyc: null,
      reason: "",
      remarks: "",
    });

    setSelectedKyc(null);

    filter === "pending" ? refetchPending() : refetchAll();
  } catch (err: any) {
    toast.error(err?.data?.message || "KYC review failed");
  }
};


  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
    setSearchTerm(""); // FIX 7: Clear search when changing filters
  };

  const handleRefresh = () => {
    if (filter === "pending") {
      refetchPending();
    } else {
      refetchAll();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-300";
      case "pending":
      case "submitted":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (isLoading && filteredKYCs.length === 0) {
    return <LoadingSpinner text="Loading KYC submissions..." />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-10 h-10" />
              <h1 className="text-4xl font-bold">KYC Verification</h1>
            </div>
            <p className="text-indigo-100 text-lg">
              Review and verify user identity documents
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition flex items-center gap-2 text-white font-medium"
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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-indigo-100 text-sm">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <p className="text-indigo-100 text-sm">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <p className="text-indigo-100 text-sm">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <XCircle className="w-5 h-5 text-red-300" />
              </div>
              <div>
                <p className="text-indigo-100 text-sm">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-500" />
            {(["all", "pending", "approved", "rejected"] as FilterType[]).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                    filter === f
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {f}
                </button>
              )
            )}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      {/* KYC Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredKYCs.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <ShieldCheck className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No KYC submissions found</p>
            <p className="text-gray-400 mt-2">
              Try adjusting your filters or search
            </p>
          </div>
        ) : (
          filteredKYCs.map((kyc) => {
            const aadhaarDoc = kyc.documents.find(
              (d) => d.documentType === "aadhaar"
            );
            const panDoc = kyc.documents.find((d) => d.documentType === "pan");

            return (
              <div
                key={kyc._id}
                className="bg-white rounded-2xl shadow-md border-2 border-gray-100 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                onClick={() => setSelectedKyc(kyc)}
              >
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <div className="grid grid-cols-2 h-full">
                    <GridImage src={aadhaarDoc?.frontImageUrl} alt="Aadhaar" />
                    <GridImage src={panDoc?.frontImageUrl} alt="PAN" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {kyc.userId?.name || kyc.fullName || "Unknown User"}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {kyc.userId?.email || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(kyc.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(
                        kyc.status
                      )}`}
                    >
                      {kyc.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filter !== "pending" && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedKyc && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedKyc(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-3xl font-bold text-gray-900">
                      KYC Review
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="font-semibold">
                      {selectedKyc.userId?.name ||
                        selectedKyc.fullName ||
                        "Unknown"}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{selectedKyc.userId?.email || "N/A"}</span>
                    <span className="text-gray-400">•</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(
                        selectedKyc.status
                      )}`}
                    >
                      {selectedKyc.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedKyc(null)}
                  className="p-3 hover:bg-gray-100 rounded-xl transition"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-xl text-gray-900">
                      Aadhaar Card
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <S3Image
                      src={
                        selectedKyc.documents.find(
                          (d) => d.documentType === "aadhaar"
                        )?.frontImageUrl
                      }
                      alt="Aadhaar Front"
                      className="w-full h-auto max-h-[400px]"
                      showLabel
                    />
                    {selectedKyc.documents.find(
                      (d) => d.documentType === "aadhaar"
                    )?.backImageUrl && (
                      <S3Image
                        src={
                          selectedKyc.documents.find(
                            (d) => d.documentType === "aadhaar"
                          )?.backImageUrl
                        }
                        alt="Aadhaar Back"
                        className="w-full h-auto max-h-[400px]"
                        showLabel
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-xl text-gray-900">
                      PAN Card & Selfie
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <S3Image
                      src={
                        selectedKyc.documents.find(
                          (d) => d.documentType === "pan"
                        )?.frontImageUrl
                      }
                      alt="PAN Card"
                      className="w-full h-auto max-h-[400px]"
                      showLabel
                    />
                    <S3Image
                      src={
                        selectedKyc.documents.find(
                          (d) => d.documentType === "selfie"
                        )?.frontImageUrl
                      }
                      alt="Selfie Verification"
                      className="w-full h-auto max-h-[400px]"
                      showLabel
                    />
                  </div>
                </div>
              </div>

              {/* Submission Details */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-lg mb-4 text-gray-900">
                  Submission Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Submitted On</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedKyc.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedKyc.reviewedAt && (
                    <div>
                      <p className="text-gray-500">Reviewed On</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedKyc.reviewedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedKyc.reviewNotes && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Remarks</p>
                      <p className="font-semibold text-gray-900">
                        {selectedKyc.reviewNotes}
                      </p>
                    </div>
                  )}
                  {selectedKyc.reason && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Rejection Reason</p>
                      <p className="font-semibold text-gray-900">
                        {selectedKyc.reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Numbers & Bank Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Document Numbers */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h4 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Document Numbers
                  </h4>
                  <div className="space-y-3">
                    {selectedKyc.documents.map((doc) => 
                      doc.documentNumber && (
                        <div key={doc.documentType} className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-500 uppercase mb-1">
                            {doc.documentType}
                          </p>
                          <p className="font-mono font-semibold text-gray-900">
                            {doc.documentNumber}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Bank Details */}
                {selectedKyc.bankDetails && (
                  <div className="bg-green-50 rounded-xl p-6">
                    <h4 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      Bank Details
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Account Holder</p>
                        <p className="font-semibold text-gray-900">
                          {selectedKyc.bankDetails.accountHolderName}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                        <p className="font-semibold text-gray-900 uppercase">
                          {selectedKyc.bankDetails.bankName}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">IFSC Code</p>
                        <p className="font-mono font-semibold text-gray-900">
                          {selectedKyc.bankDetails.ifscCode}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Branch</p>
                        <p className="font-semibold text-gray-900">
                          {selectedKyc.bankDetails.branch}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Account Number</p>
                        <p className="font-mono text-sm text-gray-900 break-all">
                          {selectedKyc.bankDetails.accountNumber}
                        </p>
                      </div>
                      {selectedKyc.bankDetails.bankProofUrl && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-2">Bank Proof</p>
                          <S3Image
                            src={selectedKyc.bankDetails.bankProofUrl}
                            alt="Bank Proof"
                            className="w-full h-auto max-h-[300px]"
                            showLabel={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(selectedKyc.status === "pending" || selectedKyc.status === "submitted") && (
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setActionModal({
                        open: true,
                        action: "reject",
                        kyc: selectedKyc,
                        reason: "",
                        remarks: "",
                      })
                    }
                    className="flex-1 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <XCircle className="w-6 h-6" />
                    Reject KYC
                  </button>
                  <button
                    onClick={() =>
                      setActionModal({
                        open: true,
                        action: "approve",
                        kyc: selectedKyc,
                        reason: "",
                        remarks: "",
                      })
                    }
                    className="flex-1 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    Approve KYC
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {actionModal.open && actionModal.kyc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
            <div className="text-center mb-6">
              {actionModal.action === "approve" ? (
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              )}
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {actionModal.action === "approve"
                  ? "Approve KYC"
                  : "Reject KYC"}
              </h3>
              <p className="text-gray-600">
                Are you sure you want to {actionModal.action} this submission
                for <strong>{actionModal.kyc.userId?.name || "User"}</strong>?
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {actionModal.action === "approve"
                  ? "Remarks (Optional)"
                  : "Rejection Reason *"}
              </label>
              <textarea
                value={
                  actionModal.action === "approve"
                    ? actionModal.remarks || ""
                    : actionModal.reason || ""
                }
                onChange={(e) =>
                  setActionModal((prev) => ({
                    ...prev,
                    [actionModal.action === "approve" ? "remarks" : "reason"]:
                      e.target.value,
                  }))
                }
                placeholder={
                  actionModal.action === "approve"
                    ? "Add any remarks about the approval..."
                    : "Please specify why you are rejecting this KYC..."
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() =>
                  setActionModal({ 
                    open: false, 
                    action: "approve", 
                    kyc: null,
                    reason: "",
                    remarks: ""
                  })
                }
                disabled={reviewLoading}
                className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewLoading}
                className={`flex-1 py-3 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                  actionModal.action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {reviewLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm{" "}
                    {actionModal.action === "approve"
                      ? "Approval"
                      : "Rejection"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};