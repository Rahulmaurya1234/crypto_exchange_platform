import axios from "axios";
import SummaryApi from "./SummaryApi";

const BASE_URL = import.meta.env.VITE_API_URL || "";

// Axios instance – cookie-based auth
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 🔥 send cookies on every request
});

// ---- Refresh Logic ----
let isRefreshing = false;
let failedQueue: { resolve: (v?: unknown) => void; reject: (e: any) => void }[] = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
}

// Helper function to clear auth and redirect to login
function clearAuthAndRedirect() {
  console.warn("🔒 Authentication failed - clearing session and redirecting to login");

  // Clear localStorage (this persists across page reloads)
  try {
    localStorage.removeItem("user");
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }

  // Check current path to avoid redirect loops
  const currentPath = window.location.pathname;
  const authPages = ["/login", "/register", "/verify-otp", "/forgot-password"];

  if (!authPages.includes(currentPath)) {
    // Use replace to prevent back button from returning to protected page
    // This will reload the app, automatically resetting Redux state
    window.location.replace("/login");
  } else {
    // Already on auth page, just clear Redux state manually
    import("../app/store").then((storeModule) => {
      import("../features/auth/authSlice").then((authModule) => {
        const store = storeModule.default;
        const { logout } = authModule;
        if (store && logout) {
          store.dispatch(logout());
        }
      });
    }).catch((err) => {
      console.error("Failed to clear auth state:", err);
    });
  }
}

// No Authorization header; cookies handle auth.
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as any;

    if (!error.response) return Promise.reject(error);

    const status = error.response.status;
    const errorMessage = error.response?.data?.message || error.message;

    // Handle 401 (Unauthorized) - Invalid or expired tokens
    if (status === 401 && !original._retry) {
      original._retry = true;

      // Don't try to refresh on login/register endpoints
      const isAuthEndpoint = original.url?.includes("/auth/login") ||
                            original.url?.includes("/auth/register") ||
                            original.url?.includes("/auth/refresh");

      if (isAuthEndpoint) {
        console.warn("Authentication failed:", errorMessage);
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(original))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Try to refresh the token (backend reads refreshToken from cookie)
        console.log("Token expired, attempting refresh...");
        await api.post(SummaryApi.refreshToken.url);

        console.log("Token refreshed successfully");
        processQueue(null, null);
        isRefreshing = false;

        // Retry the original request
        return api(original);
      } catch (refreshErr: any) {
        console.error("Token refresh failed:", refreshErr?.response?.data?.message || refreshErr.message);

        // Refresh failed - clear auth and redirect
        processQueue(refreshErr, null);
        isRefreshing = false;

        // Clear authentication and redirect to login
        clearAuthAndRedirect();

        return Promise.reject(refreshErr);
      }
    }

    // Handle 400 (Bad Request) - Could indicate invalid/malformed tokens
    if (status === 400) {
      const isBadAuthError = errorMessage?.toLowerCase().includes("token") ||
                            errorMessage?.toLowerCase().includes("authentication") ||
                            errorMessage?.toLowerCase().includes("unauthorized");

      if (isBadAuthError) {
        console.error("Authentication error (400):", errorMessage);
        clearAuthAndRedirect();
      }
    }

    // Handle 403 (Forbidden) - Valid token but insufficient permissions
    if (status === 403) {
      console.error("Access forbidden:", errorMessage);
      // Don't redirect, but user might want to handle this in components
    }

    return Promise.reject(error);
  }
);

export default api;
