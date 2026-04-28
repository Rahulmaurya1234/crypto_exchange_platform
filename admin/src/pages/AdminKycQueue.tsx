import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import {
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Phone,
  X,
  Calendar,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import { kycApi, uploadsApi } from "../utils/api";

interface KycSubmission {
  _id: string;
  name: string;
  email?: string;
  mobileNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  kyc: {
    aadharNumber: string | null;
    aadharImageUrl: string | null;
    panNumber: string | null;
    panImageUrl: string | null;
    reference1Name: string | null;
    reference1Mobile: string | null;
    reference2Name: string | null;
    reference2Mobile: string | null;
  };
  kycSubmittedAt: string | null;
}

export default function AdminKycQueue() {
  const { user, initializing } = useAuth();
  const { profile, isLoading } = useProfile();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<KycSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<KycSubmission | null>(null);
  const [processing, setProcessing] = useState(false);
  // Map of original S3 keys to signed URLs
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});



  // Fetch signed URLs for all document keys when submissions change
  // Helper to extract the S3 object key from a full URL
  const extractKey = (url: string): string => {
    try {
      const parsed = new URL(url);
      // Remove leading slash(es) and decode any encoded characters
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    } catch {
      // If parsing fails, assume the input is already a key
      return url;
    }
  };

  // Fetch signed URLs for all document keys when submissions change
  useEffect(() => {
    const fetchSigned = async () => {
      const urlMap: Record<string, string> = {};
      for (const sub of submissions) {
        const { aadharImageUrl, panImageUrl } = sub.kyc;
        if (aadharImageUrl) {
          try {
            const key = extractKey(aadharImageUrl);
            const { data } = await uploadsApi.getSignedUrl(key);
            urlMap[aadharImageUrl] = data.url;
          } catch (e) {
            console.error('Failed to get signed URL for Aadhar', e);
          }
        }
        if (panImageUrl) {
          try {
            const key = extractKey(panImageUrl);
            const { data } = await uploadsApi.getSignedUrl(key);
            urlMap[panImageUrl] = data.url;
          } catch (e) {
            console.error('Failed to get signed URL for PAN', e);
          }
        }
      }
      setSignedUrls((prev) => ({ ...prev, ...urlMap }));
    };
    if (submissions.length) fetchSigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions]);

  useEffect(() => {
    if (!initializing && !user) {
      navigate("/");
    }
  }, [user, initializing, navigate]);

  useEffect(() => {
    if (profile && profile.role !== "admin") {
      navigate("/profile");
    }
  }, [profile, navigate]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await kycApi.getQueue();
      setSubmissions(response.data?.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to fetch submissions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === "admin") {
      fetchSubmissions();
    }
  }, [profile]);

  const handleApprove = async (submission: KycSubmission) => {
    if (!confirm(`Approve KYC for ${submission.name}?`)) return;

    setProcessing(true);
    try {
      await kycApi.approve(submission._id);
      await fetchSubmissions();
      setViewingSubmission(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to approve KYC");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      await kycApi.reject(selectedSubmission._id, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedSubmission(null);
      setViewingSubmission(null);
      await fetchSubmissions();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reject KYC");
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (submission: KycSubmission) => {
    setSelectedSubmission(submission);
    setShowRejectModal(true);
    setRejectionReason("");
  };

  if (initializing || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            KYC Review Queue
          </h1>
          <p className="text-gray-600">
            Review and approve pending KYC submissions
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Pending Submissions
            </h3>
            <p className="text-gray-600">
              There are no KYC submissions awaiting review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((submission) => (
              <div
                key={submission._id}
                onClick={() => setViewingSubmission(submission)}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-indigo-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Pending
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                  {submission.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                  {submission.email}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-4">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Submitted:{" "}
                    {submission.kycSubmittedAt
                      ? new Date(submission.kycSubmittedAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {viewingSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setViewingSubmission(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-black/5 rounded-full transition-colors z-10"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>

              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="text-white">
                    <h2 className="text-2xl font-bold">
                      {viewingSubmission.name}
                    </h2>
                    <p className="text-indigo-100 opacity-90">
                      {viewingSubmission.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Contact Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Mobile</p>
                        <p className="font-medium text-gray-900">
                          {viewingSubmission.mobileNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Address</p>
                        <p className="font-medium text-gray-900">
                          {[
                            viewingSubmission.address,
                            viewingSubmission.city,
                            viewingSubmission.state,
                            viewingSubmission.pincode,
                          ]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Identity Info */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Identity Proofs
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Aadhar Number
                        </p>
                        <p className="font-medium text-gray-900">
                          {viewingSubmission.kyc.aadharNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">PAN Number</p>
                        <p className="font-medium text-gray-900">
                          {viewingSubmission.kyc.panNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* References */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                    References
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">Reference 1</p>
                      <p className="font-semibold text-gray-900">
                        {viewingSubmission.kyc.reference1Name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {viewingSubmission.kyc.reference1Mobile}
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">Reference 2</p>
                      <p className="font-semibold text-gray-900">
                        {viewingSubmission.kyc.reference2Name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {viewingSubmission.kyc.reference2Mobile}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                    Documents
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {viewingSubmission.kyc.aadharImageUrl && (
                      <a
                        href={
                          signedUrls[viewingSubmission.kyc.aadharImageUrl] ||
                          viewingSubmission.kyc.aadharImageUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                      >
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Aadhar Card
                          </p>
                          <p className="text-xs text-gray-500">Click to view</p>
                        </div>
                      </a>
                    )}
                    {viewingSubmission.kyc.panImageUrl && (
                      <a
                        href={
                          signedUrls[viewingSubmission.kyc.panImageUrl] ||
                          viewingSubmission.kyc.panImageUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group"
                      >
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            PAN Card
                          </p>
                          <p className="text-xs text-gray-500">Click to view</p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(viewingSubmission)}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 shadow-lg shadow-green-200"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve KYC
                  </button>
                  <button
                    onClick={() => openRejectModal(viewingSubmission)}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg shadow-red-200"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject KYC
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Reject KYC Submission
              </h3>
              <p className="text-gray-600 mb-4">
                Provide a detailed reason for rejecting{" "}
                <strong>{selectedSubmission.name}</strong>'s KYC submission.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason (minimum 10 characters)"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedSubmission(null);
                    setRejectionReason("");
                  }}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || rejectionReason.length < 10}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
