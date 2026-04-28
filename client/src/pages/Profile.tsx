// src/pages/Profile.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  UserCheck,
} from "lucide-react";

import api from "../api/axios";
import SummaryApi from "../api/SummaryApi";
import { useAppSelector } from "../app/hooks";

/* -------------------- types -------------------- */

type ProfileShape = {
  _id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  mobileNumber?: string;
  altMobileNumber?: string;
  gender?: string;
  kyc_status?: string;
  kycStatus?: string;
  rejection_reason?: string;
  kycRejectionReason?: string;
  cryptoWalletAddress?: string;
};

type FormData = {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  mobileNumber: string;
  altMobileNumber: string;
  gender: string;
  cryptoWalletAddress: string;
};

type KYCStatus = {
  status: string;
  level?: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  documents?: Array<{
    documentType: string;
    documentNumber?: string;
    frontImageUrl: string;
    backImageUrl?: string;
    uploadedAt: string;
  }>;
  submittedAt?: string;
  approvedAt?: string;
  expiresAt?: string;
  reviewedBy?: {
    email: string;
  };
  isDocumentVerified?: boolean;
  isFaceVerified?: boolean;
  isAddressVerified?: boolean;
};

/* -------------------- component -------------------- */

export default function ProfilePage() {
  const navigate = useNavigate();
  const auth = useAppSelector((s) => s.auth);
  const userFromStore = auth.user as ProfileShape | null;
  console.log("User from store:", userFromStore?.kycStatus);
  
  const [profile, setProfile] = useState<ProfileShape | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingKyc, setIsLoadingKyc] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    mobileNumber: "",
    altMobileNumber: "",
    gender: "",
    cryptoWalletAddress: "",
  });

  const PROFILE_URL =
    SummaryApi.getOwnProfile?.url || "/api/v1/users/profile";
  
  const KYC_STATUS_URL =
    SummaryApi.getKycStatus?.url || "/api/v1/platform-a/kyc/status";

  /* -------------------- load profile -------------------- */
  
  useEffect(() => {
    // For cookie-based auth, we check if user exists in store
    // If not, redirect to login (axios interceptor will handle cookie validation)
    if (!userFromStore) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        // Load profile data
        const profileRes = await api.get(PROFILE_URL);
        const fetched = profileRes.data?.data?.user ?? profileRes.data?.user ?? profileRes.data;
        console.log("Fetched profile:", fetched);
        setProfile(fetched);
        setFormData({
          name: fetched?.name || "",
          address: fetched?.address || "",
          city: fetched?.city || "",
          state: fetched?.state || "",
          pincode: fetched?.pincode || "",
          mobileNumber: fetched?.mobileNumber || "",
          altMobileNumber: fetched?.altMobileNumber || "",
          gender: fetched?.gender || "",
          cryptoWalletAddress: fetched?.cryptoWalletAddress || "",
        });

        // Load KYC status
        const kycRes = await api.get(KYC_STATUS_URL);
        const kycData = kycRes.data?.data?.kyc;
        
        if (kycData) {
          setKycStatus({
            status: kycData.status,
            level: kycData.level,
            fullName: kycData.fullName,
            dateOfBirth: kycData.dateOfBirth,
            nationality: kycData.nationality,
            documents: kycData.documents,
            submittedAt: kycData.submittedAt,
            approvedAt: kycData.approvedAt,
            expiresAt: kycData.expiresAt,
            reviewedBy: kycData.reviewedBy,
            isDocumentVerified: kycData.isDocumentVerified,
            isFaceVerified: kycData.isFaceVerified,
            isAddressVerified: kycData.isAddressVerified,
          });
        }
        
      } catch (err: any) {
        // Axios interceptor will handle 401/403 and redirect to login
        // We only handle other errors here
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          setError("Failed to load profile data");
        }
      } finally {
        setIsLoading(false);
        setIsLoadingKyc(false);
      }
    };

    loadData();
  }, [userFromStore, PROFILE_URL, KYC_STATUS_URL, navigate]);

  /* -------------------- helpers -------------------- */

  // Use detailed KYC status if available, otherwise fall back to profile status
  const currentKycStatus = kycStatus?.status?.toLowerCase() || 
                          (profile?.kycStatus || profile?.kyc_status || "not_submitted").toLowerCase();

  const rejectionReason =
    profile?.rejection_reason || profile?.kycRejectionReason || "";

  const getKycBadge = () => {
    if (currentKycStatus === "approved" || currentKycStatus === "verified")
      return {
        icon: CheckCircle2,
        label: "Verified",
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        description: "Your KYC has been approved and verified",
      };
    if (currentKycStatus === "submitted" || currentKycStatus === "pending")
      return {
        icon: Clock,
        label: "Pending",
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        description: "Your KYC is under review",
      };
    if (currentKycStatus === "rejected")
      return {
        icon: XCircle,
        label: "Rejected",
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-900/30",
        description: "Your KYC was rejected",
      };
    return {
      icon: ShieldCheck,
      label: "Not Submitted",
      color: "text-gray-600 dark:text-slate-400",
      bg: "bg-gray-100 dark:bg-slate-700",
      description: "Complete KYC verification to unlock all features",
    };
  };

  const kyc = getKycBadge();

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      aadhaar: "Aadhaar Card",
      pan: "PAN Card",
      selfie: "Selfie",
      passport: "Passport",
      "driving-license": "Driving License",
      "voter-id": "Voter ID",
    };
    return labels[type] || type.replace("_", " ").toUpperCase();
  };

  /* -------------------- save -------------------- */

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await api.put(PROFILE_URL, {
        ...formData,
      });
      const updated = res.data?.data?.user ?? res.data?.user ?? res.data;
      setProfile(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  /* -------------------- loading -------------------- */

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  /* -------------------- UI -------------------- */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm mb-6">

          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
              {profile?.name || userFromStore?.name}
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              {profile?.email || userFromStore?.email}
            </p>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div className="flex items-center gap-2">
                <kyc.icon className={`w-5 h-5 ${kyc.color}`} />
                <span className={`px-3 py-1 text-sm rounded-full ${kyc.bg} ${kyc.color} font-medium`}>
                  KYC: {kyc?.label}
                </span>
              </div>
              
              {kycStatus?.level && (
                <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                  Level: {kycStatus.level.replace("_", " ").toUpperCase()}
                </span>
              )}
              
              {(currentKycStatus === "not_submitted" || currentKycStatus === "rejected") && (
                <button
                  onClick={() => navigate("/kyc-submit")}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  {currentKycStatus === "rejected" ? "Re-submit KYC" : "Submit KYC"}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">
              {kyc.description}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isEditing ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Profile Details</h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>

                <div className="space-y-4">
                  <Info label="Mobile Number" value={profile?.mobileNumber} />
                  <Info label="Alternate Mobile" value={profile?.altMobileNumber} />
                  <Info label="Gender" value={profile?.gender} />
                  <Info
                    label="Address"
                    value={[
                      profile?.address,
                      profile?.city,
                      profile?.state,
                      profile?.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <Info
  label="Crypto Wallet Address"
  value={profile?.cryptoWalletAddress}
/>

                </div>
              </>
            ) : (
              <form onSubmit={handleSave} className="space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Edit Profile</h2>

                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <Input 
                  label="Full Name *" 
                  value={formData.name} 
                  onChange={(v: string) => setFormData({ ...formData, name: v })} 
                />
                <Input 
                  label="Mobile Number" 
                  value={formData.mobileNumber} 
                  onChange={(v: string) => setFormData({ ...formData, mobileNumber: v.replace(/\D/g, "") })} 
                  placeholder="10-digit mobile number"
                />
                <Select 
                  label="Gender" 
                  value={formData.gender} 
                  onChange={(v: string) => setFormData({ ...formData, gender: v })} 
                />
                <Input
  label="Crypto Wallet Address"
  value={formData.cryptoWalletAddress}
  onChange={(v: string) =>
    setFormData({ ...formData, cryptoWalletAddress: v })
  }
  placeholder="0x... / BTC / TRX wallet address"
/>

                <Input 
                  label="Address" 
                  value={formData.address} 
                  onChange={(v: string) => setFormData({ ...formData, address: v })} 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="City" 
                    value={formData.city} 
                    onChange={(v: string) => setFormData({ ...formData, city: v })} 
                  />
                  <Input 
                    label="State" 
                    value={formData.state} 
                    onChange={(v: string) => setFormData({ ...formData, state: v })} 
                  />
                </div>
                <Input 
                  label="Pincode" 
                  value={formData.pincode} 
                  onChange={(v: string) => setFormData({ ...formData, pincode: v.replace(/\D/g, "") })} 
                  placeholder="6-digit pincode"
                />

                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setError("");
                    }}
                    className="px-6 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {currentKycStatus === "rejected" && rejectionReason && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                  KYC Rejection Reason:
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {rejectionReason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* KYC Details Section - Only show if KYC data is available */}
        {!isLoadingKyc && kycStatus && currentKycStatus !== "not_submitted" && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                KYC Verification Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                Detailed information about your KYC submission
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* KYC Status Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Verification Status
                  </h3>
                  <div className="space-y-3">
                    <InfoCompact label="Full Name" value={kycStatus.fullName} />
                    <InfoCompact label="Date of Birth" value={formatDate(kycStatus.dateOfBirth)} />
                    <InfoCompact label="Nationality" value={kycStatus.nationality} />
                    <InfoCompact label="Submitted On" value={formatDate(kycStatus.submittedAt)} />
                    {kycStatus.approvedAt && (
                      <InfoCompact label="Approved On" value={formatDate(kycStatus.approvedAt)} />
                    )}
                    {kycStatus.expiresAt && (
                      <InfoCompact label="Expires On" value={formatDate(kycStatus.expiresAt)} />
                    )}
                    {kycStatus.reviewedBy?.email && (
                      <InfoCompact label="Reviewed By" value={kycStatus.reviewedBy.email} />
                    )}
                  </div>
                </div>

                {/* Document Verification */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Document Verification
                  </h3>
                  <div className="space-y-3">
                    <VerificationStatus 
                      label="Document Verified" 
                      verified={kycStatus.isDocumentVerified} 
                    />
                    <VerificationStatus 
                      label="Face Verified" 
                      verified={kycStatus.isFaceVerified} 
                    />
                    <VerificationStatus 
                      label="Address Verified" 
                      verified={kycStatus.isAddressVerified} 
                    />
                  </div>
                  
                  {/* Uploaded Documents */}
                  {kycStatus.documents && kycStatus.documents.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                        Uploaded Documents
                      </h4>
                      <div className="space-y-2">
                        {kycStatus.documents.map((doc, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium text-gray-900 dark:text-slate-100">
                              {getDocumentTypeLabel(doc.documentType)}
                            </span>
                            {doc.documentNumber && (
                              <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                Uploaded: {formatDate(doc.uploadedAt)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* KYC Benefits */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    KYC Benefits
                  </h3>
                  <div className="space-y-3">
                    <BenefitItem 
                      text="Higher transaction limits" 
                      available={currentKycStatus === "approved" || currentKycStatus === "verified"} 
                    />
                    <BenefitItem 
                      text="Faster withdrawals" 
                      available={currentKycStatus === "approved" || currentKycStatus === "verified"} 
                    />
                    <BenefitItem 
                      text="Access to all features" 
                      available={currentKycStatus === "approved" || currentKycStatus === "verified"} 
                    />
                    <BenefitItem 
                      text="Priority support" 
                      available={currentKycStatus === "approved" || currentKycStatus === "verified"} 
                    />
                  </div>
                  
                  {currentKycStatus === "approved" || currentKycStatus === "verified" ? (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                        Your KYC is fully verified!
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                        You have access to all platform features.
                      </p>
                    </div>
                  ) : currentKycStatus === "submitted" || currentKycStatus === "pending" ? (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                        KYC under review
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        Your documents are being verified. This usually takes 1-2 business days.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------- small components -------------------- */

function Info({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="pb-4 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="font-medium text-gray-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function InfoCompact({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "N/A") return null;
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function VerificationStatus({ label, verified }: { label: string; verified?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-900 dark:text-slate-100">{label}</span>
      {verified ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-gray-400" />
      )}
    </div>
  );
}

function BenefitItem({ text, available }: { text: string; available: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {available ? (
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
      )}
      <span className={`text-sm ${available ? "text-gray-900 dark:text-slate-100" : "text-gray-400 dark:text-slate-500"}`}>
        {text}
      </span>
    </div>
  );
}

function Input({ 
  label, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      />
    </div>
  );
}

function Select({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      >
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
}
