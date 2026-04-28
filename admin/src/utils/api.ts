// src/react-app/utils/api.js
import axios from "axios";

// Base URL of your backend API
// For Vite: define VITE_API_URL in .env (e.g. http://localhost:5000/api)
const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// In-memory access token (fast) + localStorage (persist)
let accessToken = null;

// ----- Token helpers -----
export const setAccessToken = (token) => {
    accessToken = token || null;

    if (token) {
        localStorage.setItem("accessToken", token);
    } else {
        localStorage.removeItem("accessToken");
    }
};

export const loadAccessTokenFromStorage = () => {
    const token = localStorage.getItem("accessToken");
    accessToken = token || null;
    return accessToken;
};

export const clearAuth = () => {
    accessToken = null;
    localStorage.removeItem("accessToken");
};

// ----- Axios instance -----
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // IMPORTANT → sends refresh_token cookie
});

// ----- Request interceptor -----
api.interceptors.request.use(
    (config) => {
        // lazy-load token from storage if memory is empty
        if (!accessToken) {
            const stored = localStorage.getItem("accessToken");
            if (stored) accessToken = stored;
        }

        if (accessToken) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ----- Response interceptor with refresh logic -----
let isRefreshing = false;
let pendingRequests = [];

const processQueue = (error, newToken = null) => {
    pendingRequests.forEach((p) => {
        if (error) {
            p.reject(error);
        } else {
            p.resolve(newToken);
        }
    });
    pendingRequests = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response) {
            // network error / CORS / whatever
            return Promise.reject(error);
        }

        const { status } = error.response;

        // Only handle 401 for "normal" requests, not auth endpoints themselves
        if (
            status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/auth/login") &&
            !originalRequest.url.includes("/auth/register") &&
            !originalRequest.url.includes("/auth/refresh")
        ) {
            originalRequest._retry = true;

            // If a refresh is already in progress → queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingRequests.push({
                        resolve: (token) => {
                            if (token) {
                                originalRequest.headers = originalRequest.headers || {};
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                            }
                            resolve(api(originalRequest));
                        },
                        reject,
                    });
                });
            }

            isRefreshing = true;

            try {
                // Call refresh endpoint → uses refresh_token cookie
                const refreshResponse = await api.post("/auth/refresh");

                // { statusCode, data: { accessToken }, message, success }
                const newAccessToken =
                    refreshResponse.data?.data?.accessToken ||
                    refreshResponse.data?.accessToken;

                if (!newAccessToken) {
                    throw new Error("No access token returned from /auth/refresh");
                }

                setAccessToken(newAccessToken);
                processQueue(null, newAccessToken);

                // Retry original request with new token
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                clearAuth(); // user is effectively logged out
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        // Non-401 or already retried → just pass error
        return Promise.reject(error);
    }
);

// ----- High-level auth helpers for components -----
export const authApi = {
    register: (payload) => api.post("/auth/register", payload),

    login: async (payload) => {
        const res = await api.post("/auth/login", payload);

        // Handle ApiResponse or bare token
        const token =
            res.data?.data?.accessToken || res.data?.accessToken || null;

        if (token) {
            setAccessToken(token);
        } else {
            console.warn("login: no accessToken in response");
        }

        return res;
    },

    logout: async () => {
        try {
            await api.post("/auth/logout");
        } catch (e) {
            // even if backend fails, clear client-side token
            console.error("logout error (ignored):", e?.message);
        }
        clearAuth();
    },

    me: () => api.get("/auth/me"),
};

// ----- KYC API -----
export const kycApi = {
    submit: (formData) =>
        api.post("/auth/kyc", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),

    getQueue: () => api.get("/auth/admin/kyc-queue"),

    approve: (userId) => api.post(`/auth/admin/kyc/${userId}/approve`),

    reject: (userId, reason) =>
        api.post(`/auth/admin/kyc/${userId}/reject`, { reason }),
};

// ----- Ads API -----
export const adsApi = {
    // USER: create ad
    create: (formData) =>
        api.post("/ads", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),

    // PUBLIC / USER: browse ads (with optional filters/pagination)
    // maps to GET /api/ads
    browse: (params) => api.get("/ads", { params }),

    // PUBLIC / USER: get single ad detail
    // maps to GET /api/ads/:id
    getById: (id) => api.get(`/ads/${id}`),

    // ADMIN: list all ads with filters/pagination
    // maps to GET /api/ads/admin/ads
    getAll: (params) => api.get("/ads/admin/ads", { params }),

    // ADMIN: update ad status
    // maps to PATCH /api/ads/admin/ads/:id/status
    updateStatus: (id, status, reason) =>
        api.patch(`/ads/admin/ads/${id}/status`, { status, reason }),
};

// ----- Users API -----
export const usersApi = {
    getAll: () => api.get("/auth/admin/users"),
    updateStatus: (id, status) =>
        api.patch(`/auth/admin/users/${id}/status`, { status }),
};

// ----- Logs API -----
export const logsApi = {
    getAll: (params) => api.get("/logs/admin/mod-logs", { params }),
};

// admin/src/utils/api.js - Add these exports
export const uploadsApi = {
  // Get signed URL for S3 object
  getSignedUrl: (key) => api.get(`/uploads/${encodeURIComponent(key)}`),
  
  // KYC specific endpoints
  getKYCUploadUrl: (data) => api.post('/upload/kyc/presigned-url', data),
  
  // Trade documents
  getTradeDocumentUploadUrl: (data) => api.post('/upload/trade/presigned-url', data),
  
  // Payment proof
  getPaymentProofUploadUrl: (data) => api.post('/upload/payment-proof/presigned-url', data)
};


export default api;
