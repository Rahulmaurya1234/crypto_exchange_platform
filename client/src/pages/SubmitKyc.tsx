import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, UserCheck, FileText, CreditCard, AlertCircle } from "lucide-react";
import axios from "axios";

import api from "../api/axios";
import { useAppSelector } from "../app/hooks";

type PresignedResponse = {
  uploadUrl: string;
  fields: Record<string, string>;
  fileUrl: string;
  key: string;
  expiresIn: number;
  method?: string;
};

type FormErrors = {
  global: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branch?: string;
  accountHolderName?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  panFront?: string;
  panBack?: string;
  selfie?: string;
  bankProof?: string;
};

type UploadStatus = {
  aadhaarFront: boolean;
  aadhaarBack: boolean;
  panFront: boolean;
  panBack: boolean;
  selfie: boolean;
  bankProof: boolean;
};

export default function KycUploadPage() {
  const navigate = useNavigate();
  const auth = useAppSelector((s) => s.auth);
  const user = auth.user;

  // Form states
  const [fullName, setFullName] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [nationality, setNationality] = useState<string>("Indian");

  // Document numbers
  const [aadhaarNumber, setAadhaarNumber] = useState<string>("");
  const [panNumber, setPanNumber] = useState<string>("");

  // Bank details
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [branch, setBranch] = useState<string>("");
  const [accountHolderName, setAccountHolderName] = useState<string>("");

  // File previews (local URLs for display)
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null);
  const [panFrontPreview, setPanFrontPreview] = useState<string | null>(null);
  const [panBackPreview, setPanBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [bankProofPreview, setBankProofPreview] = useState<string | null>(null);

  // S3 URLs after upload
  const [aadhaarFrontS3Url, setAadhaarFrontS3Url] = useState<string | null>(null);
  const [aadhaarBackS3Url, setAadhaarBackS3Url] = useState<string | null>(null);
  const [panFrontS3Url, setPanFrontS3Url] = useState<string | null>(null);
  const [panBackS3Url, setPanBackS3Url] = useState<string | null>(null);
  const [selfieS3Url, setSelfieS3Url] = useState<string | null>(null);
  const [bankProofS3Url, setBankProofS3Url] = useState<string | null>(null);

  // Upload statuses
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    aadhaarFront: false,
    aadhaarBack: false,
    panFront: false,
    panBack: false,
    selfie: false,
    bankProof: false,
  });

  // Errors
  const [errors, setErrors] = useState<FormErrors>({ global: "" });

  // Global states
  const [saving, setSaving] = useState<boolean>(false);

  // Redirect if not authenticated (cookie-based auth - check user in store)
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  console.log("User:", user);
  // Function to get pre-signed URL
  const getPresignedUrl = async (
    fileName: string,
    fileType: string,
    documentType: string
  ): Promise<PresignedResponse> => {
    try {
      const res = await api.post("/api/v1/upload/kyc/presigned-url", {
        fileName,
        fileType,
        documentType,
      });
      return res.data.data;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message ?? "Failed to get upload URL");
    }
  };

  // Function to upload file to S3 using presigned POST
  const uploadToS3 = async (
    uploadUrl: string,
    fields: Record<string, string>,
    file: File,
    method: string = "POST"
  ): Promise<void> => {
    try {
      if (method === "PUT") {
        await axios.put(uploadUrl, file, {
          headers: { "Content-Type": file.type },
        });
      } else {
        const formData = new FormData();

        // Add all the fields from presigned POST
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });

        // File must be added LAST
        formData.append("file", file);

        await axios.post(uploadUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    } catch (err: any) {
      throw new Error("Failed to upload file to storage");
    }
  };

  // Generic file change handler
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [docType]: "File size exceeds 2MB limit" }));
      return;
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, [docType]: "Only JPEG or PNG images are allowed" }));
      return;
    }

    // Clear error
    setErrors((prev) => ({ ...prev, [docType]: undefined }));

    // Set preview
    const reader = new FileReader();
    reader.onload = () => {
      switch (docType) {
        case "aadhaarFront":
          setAadhaarFrontPreview(reader.result as string);
          break;
        case "aadhaarBack":
          setAadhaarBackPreview(reader.result as string);
          break;
        case "panFront":
          setPanFrontPreview(reader.result as string);
          break;
        case "panBack":
          setPanBackPreview(reader.result as string);
          break;
        case "selfie":
          setSelfiePreview(reader.result as string);
          break;
        case "bankProof":
          setBankProofPreview(reader.result as string);
          break;
      }
    };
    reader.readAsDataURL(file);

    // Upload
    setUploadStatus((prev) => ({ ...prev, [docType]: true }));
    try {
      const documentTypeMap: { [key: string]: string } = {
        aadhaarFront: "aadhaar_front",
        aadhaarBack: "aadhaar_back",
        panFront: "pan_card",
        panBack: "pan_card",
        selfie: "selfie",
        bankProof: "bank_proof",
      };
      const { uploadUrl, fields, fileUrl, method } = await getPresignedUrl(file.name, file.type, documentTypeMap[docType]);
      await uploadToS3(uploadUrl, fields, file, method);

      // Set S3 URL
      switch (docType) {
        case "aadhaarFront":
          setAadhaarFrontS3Url(fileUrl);
          break;
        case "aadhaarBack":
          setAadhaarBackS3Url(fileUrl);
          break;
        case "panFront":
          setPanFrontS3Url(fileUrl);
          break;
        case "panBack":
          setPanBackS3Url(fileUrl);
          break;
        case "selfie":
          setSelfieS3Url(fileUrl);
          break;
        case "bankProof":
          setBankProofS3Url(fileUrl);
          break;
      }
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [docType]: err.message }));
    } finally {
      setUploadStatus((prev) => ({ ...prev, [docType]: false }));
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    let valid = true;
    const newErrors: FormErrors = { global: "" };

    // Required text fields
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
      valid = false;
    }
    if (!dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
      valid = false;
    }
    if (!nationality.trim()) {
      newErrors.nationality = "Nationality is required";
      valid = false;
    }
    if (!aadhaarNumber.trim()) {
      newErrors.aadhaarNumber = "Aadhaar number is required";
      valid = false;
    } else if (!/^\d{4}[ -]?\d{4}[ -]?\d{4}$/.test(aadhaarNumber)) {
      newErrors.aadhaarNumber = "Aadhaar number must be 12 digits (e.g., 1234-5678-9012)";
      valid = false;
    }
    if (!panNumber.trim()) {
      newErrors.panNumber = "PAN number is required";
      valid = false;
    } else if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(panNumber)) {
      newErrors.panNumber = "PAN number must be in format ABCDE1234F";
      valid = false;
    }
    if (!accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
      valid = false;
    }
    if (!ifscCode.trim()) {
      newErrors.ifscCode = "IFSC code is required";
      valid = false;
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      newErrors.ifscCode = "Invalid IFSC code format (e.g., SBIN0001234)";
      valid = false;
    }
    if (!bankName.trim()) {
      newErrors.bankName = "Bank name is required";
      valid = false;
    }
    if (!branch.trim()) {
      newErrors.branch = "Branch is required";
      valid = false;
    }
    if (!accountHolderName.trim()) {
      newErrors.accountHolderName = "Account holder name is required";
      valid = false;
    }

    // Required documents
    if (!aadhaarFrontS3Url) {
      newErrors.aadhaarFront = "Aadhaar front image is required";
      valid = false;
    }
    if (!aadhaarBackS3Url) {
      newErrors.aadhaarBack = "Aadhaar back image is required";
      valid = false;
    }
    if (!panFrontS3Url) {
      newErrors.panFront = "PAN front image is required";
      valid = false;
    }
    if (!panBackS3Url) {
      newErrors.panBack = "PAN back image is required";
      valid = false;
    }
    if (!selfieS3Url) {
      newErrors.selfie = "Selfie image is required";
      valid = false;
    }
    if (!bankProofS3Url) {
      newErrors.bankProof = "Bank proof image is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Submit handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({ global: "" });

    if (!validateForm()) {
      setErrors((prev) => ({ ...prev, global: "Please fix the errors above" }));
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        fullName,
        dateOfBirth,
        nationality,
        bankDetails: {
          accountNumber,
          ifscCode,
          bankName,
          branch,
          accountHolderName,
          bankProofUrl: bankProofS3Url,
        },
        documents: [
          {
            documentType: "aadhaar",
            documentNumber: aadhaarNumber.replace(/[- ]/g, ""),
            frontImageUrl: aadhaarFrontS3Url,
            backImageUrl: aadhaarBackS3Url,
          },
          {
            documentType: "pan",
            documentNumber: panNumber,
            frontImageUrl: panFrontS3Url,
            backImageUrl: panBackS3Url,
          },
          {
            documentType: "selfie",
            frontImageUrl: selfieS3Url,
          },
        ],
      };

      await api.post("/api/v1/platform-a/kyc/submit", submitData);
      navigate("/profile");
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        global: err?.response?.data?.message ?? "Failed to submit KYC. Please try again.",
      }));
    } finally {
      setSaving(false);
    }
  };

  // Don't render form if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-indigo-600" />
            Submit KYC
          </h2>

          {errors.global && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {errors.global}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-12" noValidate>
            {/* Personal Details Section */}
            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-200 mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.fullName && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.dateOfBirth && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Nationality *</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.nationality && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.nationality}</p>}
                </div>
              </div>
            </section>

            {/* Documents Section */}
            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                Documents
              </h3>
              <div className="space-y-8">
                {/* Aadhaar */}
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-800/50">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-slate-200 mb-4">Aadhaar Card *</h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Aadhaar Number *</label>
                    <input
                      type="text"
                      placeholder="1234-5678-9012"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {errors.aadhaarNumber && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.aadhaarNumber}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Front Image *</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => handleFileChange(e, "aadhaarFront")}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                      />
                      {errors.aadhaarFront && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.aadhaarFront}</p>}
                      {uploadStatus.aadhaarFront && <p className="text-indigo-600 dark:text-indigo-400 text-sm mt-1 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</p>}
                      {aadhaarFrontPreview && (
                        <img src={aadhaarFrontPreview} alt="Aadhaar Front" className="mt-2 w-full h-32 object-contain rounded-lg border border-gray-200 dark:border-slate-600" />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Back Image *</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => handleFileChange(e, "aadhaarBack")}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                      />
                      {errors.aadhaarBack && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.aadhaarBack}</p>}
                      {uploadStatus.aadhaarBack && <p className="text-indigo-600 dark:text-indigo-400 text-sm mt-1 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</p>}
                      {aadhaarBackPreview && (
                        <img src={aadhaarBackPreview} alt="Aadhaar Back" className="mt-2 w-full h-32 object-contain rounded-lg border border-gray-200 dark:border-slate-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* PAN */}
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-800/50">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-slate-200 mb-4">PAN Card *</h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">PAN Number *</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {errors.panNumber && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.panNumber}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Front Image *</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => handleFileChange(e, "panFront")}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                      />
                      {errors.panFront && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.panFront}</p>}
                      {uploadStatus.panFront && <p className="text-indigo-600 dark:text-indigo-400 text-sm mt-1 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</p>}
                      {panFrontPreview && (
                        <img src={panFrontPreview} alt="PAN Front" className="mt-2 w-full h-32 object-contain rounded-lg border border-gray-200 dark:border-slate-600" />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Back Image *</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => handleFileChange(e, "panBack")}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                      />
                      {errors.panBack && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.panBack}</p>}
                      {uploadStatus.panBack && <p className="text-indigo-600 dark:text-indigo-400 text-sm mt-1 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</p>}
                      {panBackPreview && (
                        <img src={panBackPreview} alt="PAN Back" className="mt-2 w-full h-32 object-contain rounded-lg border border-gray-200 dark:border-slate-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Selfie */}
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-800/50">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-slate-200 mb-4">Selfie *</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Upload Selfie *</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => handleFileChange(e, "selfie")}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                    />
                    {errors.selfie && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.selfie}</p>}
                    {uploadStatus.selfie && <p className="text-indigo-600 dark:text-indigo-400 text-sm mt-1 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</p>}
                    {selfiePreview && (
                      <img src={selfiePreview} alt="Selfie" className="mt-2 w-full h-32 object-contain rounded-lg border border-gray-200 dark:border-slate-600" />
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Bank Details Section */}
            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-indigo-600" />
                Bank Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Account Number *</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter account number"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.accountNumber && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.accountNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">IFSC Code *</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="SBIN0001234"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.ifscCode && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.ifscCode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Bank Name *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="State Bank of India"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.bankName && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.bankName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Branch *</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="Main Branch"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.branch && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.branch}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Account Holder Name *</label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="As per bank records"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.accountHolderName && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.accountHolderName}</p>}
                </div>

                <div className="md:col-span-2 border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-800/50">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Bank Proof (e.g., Passbook/Cheque) *</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => handleFileChange(e, "bankProof")}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                  />
                  {errors.bankProof && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.bankProof}</p>}
                  {uploadStatus.bankProof && <p className="text-indigo-600 dark:text-indigo-400 text-sm mt-1 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</p>}
                  {bankProofPreview && (
                    <img src={bankProofPreview} alt="Bank Proof" className="mt-2 w-full h-32 object-contain rounded-lg border border-gray-200 dark:border-slate-600" />
                  )}
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={saving || Object.values(uploadStatus).some((s) => s)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </span>
              ) : (
                "Submit KYC"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
