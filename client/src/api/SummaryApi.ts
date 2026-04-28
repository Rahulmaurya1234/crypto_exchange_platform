
export const baseURL = import.meta.env.VITE_API_URL;

export interface ApiConfig {
  url: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
}

const SummaryApi = {
  // -----------------------------
  // PLATFORM-A (Client Side)
  // -----------------------------

  // AUTH
  register: {
    url: "/api/v1/platform-a/auth/register",
    method: "post",
  },
  sendRegistrationOTP: {
    url: "/api/v1/platform-a/auth/send-registration-otp",
    method: "POST"
  },
  sendLoginOTP: {
    url: "/api/v1/platform-a/auth/login/send-otp",
    method: "POST",
  },
  verifyLoginOTP: {
    url: "/api/v1/platform-a/auth/login/verify-otp",
    method: "POST",
  },
  verifyOtp: {
    url: "/api/v1/platform-a/auth/verify-otp",
    method: "post",
  },
  resendOtp: {
    url: "/api/v1/platform-a/auth/resend-otp",
    method: "post",
  },
  login: {
    url: "/api/v1/platform-a/auth/login",
    method: "post",
  },
  refreshToken: {
    url: "/api/v1/platform-a/auth/refresh", // FIXED
    method: "post",
  },
  logout: {
    url: "/api/v1/platform-a/auth/logout",
    method: "post",
  },
  forgotPassword: {
    url: "/api/v1/platform-a/auth/forgot-password",
    method: "POST",
  },
  resetPassword: {
    url: "/api/v1/platform-a/auth/reset-password",
    method: "POST",
  },
  // WALLET 
  getWalletInfo: {
    url: "/api/v1/platform-a/wallet",
    method: "get" as const,
  },
  walletOverview: {
    url: "/api/v1/platform-a/wallet/overview",
    method: "get" as const,
  },

  walletTransactions: {
    url: "/api/v1/platform-a/wallet/transactions",
    method: "get" as const,
  },
  getPlatformWalletAddress: {
    url: "/api/v1/platform-a/wallet/platform/deposit-address/USDT",
    method: "get" as const,
  },
  // LISTINGS
  getAllListings: {
    url: "/api/v1/platform-a/listings",
    method: "get",
  },
  createListing: {
    url: "/api/v1/platform-a/listings",
    method: "post",
  },
  // Instant seller listing
  createInstantSellerListing: {
    url: "/api/v1/platform-a/listings/instant-seller",
    method: "POST",
  },
  getListingById: (id: string) => ({
    url: `/api/v1/platform-a/listings/${id}`,
    method: "get",
  }),
  getMyListings: {
    url: "/api/v1/platform-a/listings/my-listings",
    method: "get",
  },
  getAllTrades: {
    url: "/api/v1/platform-a/trades",
    method: "GET",
  },

  getTradeStats: {
    url: "/api/v1/platform-a/trades/stats",
    method: "GET",
  },

  getUserTradesById: (userId: string) => ({
    url: `/api/v1/platform-a/trades/${userId}`,
    method: "GET",
  }),
  // USER PROFILE
  updateProfile: {
    url: "/api/v1/platform-a/users/profile",
    method: "put",
  },
  getProfile: (id: string) => ({
    url: `/api/v1/platform-a/users/${id}`,
    method: "get",
  }),
  userStats: (id: string) => ({
    url: `/api/v1/platform-a/users/${id}/stats`,
    method: "get",
  }),
  getOwnProfile: {
    url: "/api/v1/platform-a/profile",
    method: "get",
  },

  // KYC
  submitKyc: {
    url: "/api/v1/platform-a/kyc/submit",
    method: "post",
  },
  getKycStatus: {
    url: "/api/v1/platform-a/kyc/status",
    method: "get",
  },
  // INSTANT SELLER LISTING AND TRADES
  instantSellerDepositeCalculate: (amount: number) => ({
    url: `/api/v1/platform-a/listings/instant-seller/calculate-deposit?amount=${amount}&network=ethereum`,
    method: "GET",
  }),
  instantSellerListing: {
    url: `/api/v1/platform-a/listings/instant-seller`,
    method: "post",
  },
  // TRADES
  createTrade: {
    url: "/api/v1/platform-a/trades",
    method: "post",
  },
  cancelTrade: (tradeId: string) => ({
    url: `/api/v1/platform-a/trades/${tradeId}/cancel`,
    method: "post",
  }),
  docUploadatChat: (): ApiConfig => ({
    url: '/api/v1/upload/trade/presigned-url',
    method: 'post',
  }),

  paymentProofUpload: (): ApiConfig => ({
    url: `/api/v1/upload/payment-proof/presigned-url`,
    method: 'post',
  }),
  // CalculateOrderAmount: (listingId: string, cryptoAmount: number) => ({
  //   url: `/api/v1/platform-a/trades/calculate?listingId=${listingId}&cryptoAmount=${cryptoAmount}`,
  //   method: "get",
  // }),
  getEscrowTransection: (userId: string,) => ({
    url: `/api/v1/platform-a/wallet/${userId}/transactions`,
    method: "get",
  }),
  CalculateOrderAmount: (
    listingId: string,
    amount: number,
    currency?: "INR" | "USDT" // Make currency optional
  ) => ({
    url: `/api/v1/platform-a/trades/calculate?listingId=${listingId}&amount=${amount}${currency ? `&currency=${currency}` : ''}`,
    method: "get",
  }),
  submitDepositeHash: (tradeId: string, transactionHash: string) => ({
    url: `/api/v1/platform-a/trades/${tradeId}/submit-deposit`,
    method: "post",
    data: { transactionHash },
  }),
  confirmInstantSellerTrade: (tradeId: string) => ({
    url: `/api/v1/platform-a/trades/${tradeId}/confirm-instant-seller`,
    method: "post",
  }),
  uploadPayment: (tradeId: string) => ({
    url: `/api/v1/platform-a/trades/${tradeId}/upload-payment`,
    method: "post",
  }),
  markPaymentCreated: (tradeId: string) => ({
    url: `/api/v1/platform-a/trades/${tradeId}/mark-credited`,
    method: "post",
  }),
  // CHAT
  openChatWithListing: (listingId: string) => ({
    url: `/api/v1/platform-a/chat/listing/${listingId}/chat`,
    method: "post",
  }),
  openOrGetDirectChat: {
    url: "/api/v1/platform-a/chat/open",
    method: "post",
  },
  joinChat: (chatId: string) => ({
    url: `/api/v1/platform-a/chat/${chatId}/join`,
    method: "post",
  }),

  getAllChats: {
    url: "/api/v1/platform-a/chat",
    method: "get",
  },
  getChatById: (chatId: string) => ({
    url: `/api/v1/platform-a/chat/${chatId}`,
    method: "get",
  }),
  getChatByTradeId: (tradeId: string) => ({
    url: `/api/v1/platform-a/chat/trade/${tradeId}`,
    method: "get",
  }),
  uploadPaymentProof: (tradeId: string) => ({
    url: `/api/v1/platform-a/trades/${tradeId}/upload-payment`,
    method: "post",
  }),
  getTradeById: (tradeId: string) => ({
    url: `/api/v1/platform-a/trades/${tradeId}`,
    method: "get",
  }),
  getMessages: (chatId: string) => ({
    url: `/api/v1/platform-a/chat/${chatId}/messages`,
    method: "get",
  }),
  sendMessage: (chatId: string) => ({
    url: `/api/v1/platform-a/chat/${chatId}/messages`,
    method: "post",
  }),
  markChatRead: (chatId: string) => ({
    url: `/api/v1/platform-a/chat/${chatId}/read`,
    method: "post",
  }),
  unreadMessageCount: {
    url: "/api/v1/platform-a/chat/unread/count",
    method: "get",
  },
  postSubmitReviewCompleteTrade: (tradeId: string) => ({
    url: `${baseURL}/api/v1/platform-a/reviews/trade/${tradeId}`,
    method: "POST",
  }),
  getCanReviewTrade: (tradeId: string) => ({
    url: `/api/v1/platform-a/reviews/trade/${tradeId}/can-review`,
    method: "get",
  }),
  // NOTIFICATIONS
  getNotifications: {
    url: "/api/v1/platform-a/notifications",
    method: "get",
  },
  markNotificationRead: (id: string) => ({
    url: `/api/v1/platform-a/notifications/${id}/read`,
    method: "patch",
  }),
  markAllNotificationsRead: {
    url: "/api/v1/platform-a/notifications/read-all",
    method: "patch",
  },
  // -----------------------------
  // PLATFORM-B (Admin Side)
  // -----------------------------

  superAdminRegister: {
    url: "/api/v1/platform-b/auth/register",
    method: "post",
  },
  supportRegister: {
    url: "/api/v1/platform-b/auth/register",
    method: "post",
  },

  superAdminLogin: {
    url: "/api/v1/platform-b/auth/login",
    method: "post",
  },
  supportLogin: {
    url: "/api/v1/platform-b/auth/login",
    method: "post",
  },

  // ADMIN KYC
  adminGetPendingKyc: {
    url: "/api/v1/platform-b/admin/kyc/pending",
    method: "get",
  },
  adminReviewKyc: (kycId: string) => ({
    url: `/api/v1/platform-b/admin/kyc/${kycId}/review`,
    method: "post",
  }),
  // RATINGS AND REVIEWS
  submitRating: (tradeId: string) => ({
    url: `/api/v1/trades/${tradeId}/rating`,
    method: "post" as const,
  }),
  appealTrade: (tradeId: string) => ({
    url: `/api/v1/platform-a/trades/${tradeId}/appeal`,
    method: "post" as const,
  }),
  resolveAppeal: (tradeId: string) => ({
    url: `/api/v1/platform-b/disputes/${tradeId}/resolve-appeal`,
    method: "post" as const,
  }),
};

export default SummaryApi;
