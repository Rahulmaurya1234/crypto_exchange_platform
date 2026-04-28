import z from "zod";

export const UserProfileSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  mobileNumber: z.string(),
  altMobileNumber: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  role: z.enum(["user", "admin"]),
  accountStatus: z.enum(["active", "suspended", "deleted"]),
  kycStatus: z.enum(["not_submitted", "submitted", "approved", "rejected"]),
  kyc: z.object({
    aadharNumber: z.string().optional(),
    aadharImageUrl: z.string().optional(),
    panNumber: z.string().optional(),
    panImageUrl: z.string().optional(),
    reference1Name: z.string().optional(),
    reference1Mobile: z.string().optional(),
    reference2Name: z.string().optional(),
    reference2Mobile: z.string().optional(),
  }).optional(),
  kycSubmittedAt: z.string().optional(),
  kycReviewedAt: z.string().optional(),
  kycReviewedBy: z.string().optional(),
  kycRejectionReason: z.string().optional(),
  lastLoginAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ModerationLogSchema = z.object({
  id: z.number(),
  admin_id: z.string(),
  target_type: z.enum(['user', 'ad']),
  target_id: z.string(),
  action: z.string(),
  reason: z.string().nullable(),
  created_at: z.string(),
});

export type ModerationLog = z.infer<typeof ModerationLogSchema>;

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const CreateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").optional().or(z.literal('')),
  mobile_number: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits").optional().or(z.literal('')),
  alt_mobile_number: z.string().regex(/^\d{10}$/, "Alternate mobile number must be 10 digits").optional().or(z.literal('')),
  gender: z.enum(['Male', 'Female', 'Other', '']).optional(),
});

export const UpdateProfileSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").optional().or(z.literal('')),
  alt_mobile_number: z.string().regex(/^\d{10}$/, "Alternate mobile number must be 10 digits").optional().or(z.literal('')),
});

export const SubmitKycSchema = z.object({
  aadhar_number: z.string().min(12, "Aadhar number must be at least 12 digits"),
  pan_number: z.string().min(10, "PAN number must be at least 10 characters"),
  reference_1_name: z.string().min(1, "Reference 1 name is required"),
  reference_1_mobile: z.string().regex(/^\d{10}$/, "Reference 1 mobile must be 10 digits"),
  reference_2_name: z.string().min(1, "Reference 2 name is required"),
  reference_2_mobile: z.string().regex(/^\d{10}$/, "Reference 2 mobile must be 10 digits"),
});

export const RejectKycSchema = z.object({
  rejection_reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
});

export const AdSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  title: z.string(),
  token_name: z.string(),
  direction: z.string(),
  price_per_unit: z.number(),
  min_qty: z.number(),
  max_qty: z.number(),
  quantity_available: z.number(),
  location_city: z.string(),
  location_state: z.string(),
  payment_terms: z.string(),
  image_key: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Ad = z.infer<typeof AdSchema>;

export const CreateAdSchema = z.object({
  title: z.string().min(1, "Title is required"),
  token_name: z.string().min(1, "Token name is required"),
  direction: z.enum(['buy', 'sell']),
  price_per_unit: z.number().positive("Price must be positive"),
  min_qty: z.number().positive("Min quantity must be positive"),
  max_qty: z.number().positive("Max quantity must be positive"),
  quantity_available: z.number().positive("Quantity available must be positive"),
  location_city: z.string().min(1, "City is required"),
  location_state: z.string().min(1, "State is required"),
  payment_terms: z.string().min(1, "Payment terms are required"),
}).refine((data) => data.max_qty >= data.min_qty, {
  message: "Max quantity must be greater than or equal to min quantity",
  path: ["max_qty"],
});

export const UpdateAdStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'removed']),
  reason: z.string().optional(),
});

export const UpdateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'deleted']),
  reason: z.string().optional(),
});
