// src/features/auth/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";
import SummaryApi from "../../api/SummaryApi";

interface User {
  _id: string | null;
  id: string | null;
  name: string;
  email: string;
  avatarUrl?: string | null;
  unreadNotifications?: number;
  phoneVerified?: boolean;
  kycStatus?: string | null;
  kycLevel?: string | null;
  role?: string | null;
  raw?: any;
}

interface AuthState {
  user: User | null;
  token: string | null; // compatibility only, not used
  refreshToken: string | null; // compatibility only
  loading: boolean;
  checked: boolean;
  error: string | null;
}

// ---- hydrate from localStorage with unwrap protection ----
function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // handle old shape: { user: {...} }
    const maybeUser = parsed && parsed.user ? parsed.user : parsed;

    if (!maybeUser || typeof maybeUser !== "object") return null;

    return {
      _id: maybeUser._id ?? maybeUser.id ?? null,
      id: maybeUser.id ?? maybeUser._id ?? null,
      name: maybeUser.name ?? "",
      email: maybeUser.email ?? "",
      avatarUrl: maybeUser.avatarUrl ?? null,
      unreadNotifications: maybeUser.unreadNotifications ?? 0,
      phoneVerified: maybeUser.phoneVerified ?? false,
      kycStatus: maybeUser.kycStatus ?? null,
      kycLevel: maybeUser.kycLevel ?? null,
      role: maybeUser.role ?? null,
      raw: maybeUser,
    } as User;
  } catch {
    return null;
  }
}

const initialState: AuthState = {
  user: getStoredUser(),
  token: null,
  refreshToken: null,
  loading: false,
  checked: false,
  error: null,
};

// Normalize any API response into a bare User object
function normalizeUserResponse(data: any): User {
  const payload = data?.user ?? data; // unwrap { user: {...} } if present

  return {
    _id: payload._id ?? payload.id ?? null,
    id: payload.id ?? payload._id ?? null,
    name: payload.name ?? "",
    email: payload.email ?? "",
    avatarUrl: payload.avatarUrl ?? null,
    unreadNotifications: payload.unreadNotifications ?? 0,
    phoneVerified: payload.phoneVerified ?? false,
    kycStatus: payload.kycStatus ?? null,
    kycLevel: payload.kycLevel ?? null,
    role: payload.role ?? null,
    raw: payload,
  };
}

// ---- Thunks ----

// Validate session via cookies (called from AuthInit / App root)
export const fetchCurrentUser = createAsyncThunk<
  User,
  void,
  { rejectValue: any }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get(SummaryApi.getOwnProfile.url);
    const data = res.data?.data ?? res.data;
    const user = normalizeUserResponse(data);
    return user;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data || "Failed to fetch user");
  }
});

// Login (backend sets cookies; we just store user)
export const loginUser = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: any }
>("auth/loginUser", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post(SummaryApi.login.url, payload);

    // typical shape: { data: { user, ... } }
    const data = res.data?.data ?? res.data;
    const user = normalizeUserResponse(data.user ?? data);

    localStorage.setItem("user", JSON.stringify(user));

    return user;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data || "Login failed");
  }
});

export const loginWithOTP = createAsyncThunk<
  User,
  { identifier: string; otp: string },
  { rejectValue: any }
>("auth/loginWithOTP", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post(SummaryApi.verifyLoginOTP.url, payload);

    const data = res.data?.data ?? res.data;
    const user = normalizeUserResponse(data.user ?? data);

    localStorage.setItem("user", JSON.stringify(user));
    return user;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data || "OTP login failed");
  }
});



const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.error = null;
      state.checked = true;
      state.token = null;
      state.refreshToken = null;

      try {
        localStorage.removeItem("user");
      } catch {
        // ignore
      }
      // cookies cleared by backend /logout, if you add it
    },

    // kept for backwards compatibility
    setUserFromToken(
      state,
      action: PayloadAction<{ user: User; token?: string | null }>
    ) {
      const { user } = action.payload;
      state.user = normalizeUserResponse(user);
      state.error = null;
      state.checked = true;

      try {
        localStorage.setItem("user", JSON.stringify(state.user));
      } catch {
        // ignore
      }
    },

    markChecked(state) {
      state.checked = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---- fetchCurrentUser ----
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.checked = true;
        state.error = null;

        try {
          localStorage.setItem("user", JSON.stringify(action.payload));
        } catch {
          // ignore
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.checked = true;
        state.error =
          (action.payload as any)?.message || "Failed to validate session";

        try {
          localStorage.removeItem("user");
        } catch {
          // ignore
        }
      })

      // ---- loginUser ----
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.checked = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message || "Login failed. Try again.";
      })
      .addCase(loginWithOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.checked = true;
      })
      .addCase(loginWithOTP.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message || "OTP login failed";
      });

  },
});

export const { logout, markChecked, setUserFromToken } = authSlice.actions;
export default authSlice.reducer;
