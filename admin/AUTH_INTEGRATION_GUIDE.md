# Admin Panel - Authentication & API Integration Guide

## Overview
This document explains the complete authentication flow, API integration, and security implementation for the Cryptians P2P Cryptocurrency Marketplace Admin Panel (Platform B).

---

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Cookie-Based Security](#cookie-based-security)
3. [Auto-Refresh on Page Reload](#auto-refresh-on-page-reload)
4. [API Integration](#api-integration)
5. [Protected Routes](#protected-routes)
6. [Usage Examples](#usage-examples)
7. [Architecture](#architecture)

---

## Authentication Flow

### 1. Login Process
```
User enters credentials → Login API called → Backend sets httpOnly cookies → User data stored in Redux → Redirect to dashboard
```

**Implementation:**
- **File:** `src/pages/auth/Login.tsx`
- **API Endpoint:** `POST /api/v1/platform-b/auth/login`
- **Response:** Backend sets `accessToken` and `refreshToken` as httpOnly cookies
- **State Management:** User data stored in Redux via `setUser()` action

```typescript
// Login flow
const handleSubmit = async (values) => {
  const response = await login(values).unwrap();
  dispatch(setUser(response.data.user));
  navigate('/dashboard');
};
```

### 2. Page Reload / App Initialization
```
App mounts → Refresh API called → If valid cookies exist → User restored → If invalid → Redirect to login
```

**Implementation:**
- **File:** `src/App.tsx`
- **API Endpoint:** `POST /api/v1/platform-b/auth/refresh`
- **Trigger:** useEffect on app mount
- **Result:** User session restored automatically from httpOnly cookies

```typescript
// Auto-refresh on mount
useEffect(() => {
  const checkAuth = async () => {
    try {
      const response = await refresh().unwrap();
      dispatch(setUser(response.data.user));
    } catch {
      dispatch(setInitialized());
    }
  };
  checkAuth();
}, []);
```

### 3. Token Expiration Handling
```
API request fails with 401 → baseQueryWithReauth intercepts → Refresh token → Retry original request → If refresh fails → Logout
```

**Implementation:**
- **File:** `src/store/api/baseApi.ts`
- **Mechanism:** Automatic retry with token refresh
- **Fallback:** Auto-logout if refresh fails

```typescript
// Automatic token refresh on 401
if (result.error && result.error.status === 401) {
  const refreshResult = await baseQuery({
    url: '/api/v1/platform-b/auth/refresh',
    method: 'POST'
  });

  if (refreshResult.data) {
    // Retry original request
    result = await baseQuery(args, api, extraOptions);
  } else {
    api.dispatch(logout());
  }
}
```

### 4. Logout Process
```
User clicks logout → Logout API called → Backend clears cookies → Redux state cleared → Redirect to login
```

**Implementation:**
- **File:** `src/components/layout/Header.tsx`
- **API Endpoint:** `POST /api/v1/platform-b/auth/logout`
- **Cleanup:** Clears both Redux state and httpOnly cookies

---

## Cookie-Based Security

### Why httpOnly Cookies?
1. **XSS Protection:** JavaScript cannot access httpOnly cookies
2. **CSRF Protection:** Backend validates origin and CSRF tokens
3. **Automatic Management:** Browser handles cookie lifecycle
4. **No Local Storage:** Tokens never exposed to client-side code

### Cookie Configuration (Backend)
```javascript
// Backend should set cookies like this:
res.cookie('accessToken', token, {
  httpOnly: true,      // Cannot be accessed by JavaScript
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 15 * 60 * 1000  // 15 minutes
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

### Frontend Configuration
```typescript
// src/store/api/baseApi.ts
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: 'include',  // Sends cookies automatically
});
```

---

## Auto-Refresh on Page Reload

### How It Works
1. **App Component Mounts:** `App.tsx` useEffect runs
2. **Call Refresh API:** Sends request with httpOnly refresh cookie
3. **Backend Validates:** Checks refresh token from cookie
4. **New Tokens Issued:** Backend sets new access + refresh cookies
5. **User Restored:** Redux state updated with user data
6. **UI Updates:** ProtectedRoute allows access

### State Management
```typescript
// Auth Slice States
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;       // True during auth operations
  isInitialized: boolean;   // True after auth check completes
}
```

### Protected Route Loading State
```typescript
// Shows spinner until auth is checked
if (!isInitialized || isLoading) {
  return <LoadingSpinner text="Verifying authentication..." />;
}

if (!isAuthenticated) {
  return <Navigate to="/login" />;
}
```

---

## API Integration

### Base API Configuration
**File:** `src/store/api/baseApi.ts`

- **RTK Query:** Redux Toolkit Query for API calls
- **Base URL:** From environment variable `VITE_API_BASE_URL`
- **Credentials:** Always includes cookies
- **Auto-Refresh:** Built-in 401 error handling
- **Cache Tags:** Automatic cache invalidation

### Available API Slices

| Slice | File | Endpoints |
|-------|------|-----------|
| **Auth API** | `authApi.ts` | login, register, refresh, logout, getCurrentUser |
| **User API** | `userApi.ts` | getAllUsers, getUserById, suspendUser, banUser, approveInstantSeller |
| **KYC API** | `kycApi.ts` | getPendingKYCs, reviewKYC |
| **Dashboard API** | `adminApi.ts` | getDashboardStats |
| **Escrow API** | `escrowApi.ts` | getEscrowTransactions, releaseEscrow, refundEscrow |
| **Support API** | `supportApi.ts` | getTickets, assignTicket, resolveTicket |
| **Analytics API** | `analyticsApi.ts` | getOverview, getUserAnalytics, getTradeAnalytics |

### Example: Using RTK Query Hooks
```typescript
// In a component
import { useGetAllUsersQuery } from '../store/api/userApi';

function UsersPage() {
  const { data, isLoading, error, refetch } = useGetAllUsersQuery({
    page: 1,
    limit: 50,
    search: 'john@example.com'
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return <UserTable users={data.data.users} />;
}
```

### Example: Using Mutations
```typescript
import { useSuspendUserMutation } from '../store/api/userApi';

function UserActions({ userId }) {
  const [suspendUser, { isLoading }] = useSuspendUserMutation();

  const handleSuspend = async () => {
    try {
      await suspendUser({
        userId,
        reason: 'Suspicious activity'
      }).unwrap();
      toast.success('User suspended');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  return <Button onClick={handleSuspend} loading={isLoading}>Suspend</Button>;
}
```

---

## Protected Routes

### Route Structure
```typescript
// Public routes (no auth required)
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />

// Protected routes (auth required)
<Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/users" element={<Users />} />
  <Route path="/kyc" element={<KYC />} />
  // ... more routes
</Route>
```

### ProtectedRoute Component
**File:** `src/components/layout/ProtectedRoute.tsx`

**Features:**
- Shows loading spinner during auth check
- Redirects to login if not authenticated
- Only renders children when authenticated

---

## Usage Examples

### 1. Creating a New API Slice
```typescript
// src/store/api/exampleApi.ts
import { baseApi } from './baseApi';

export const exampleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query({
      query: () => '/api/v1/platform-b/items',
      providesTags: ['Item'],
    }),
    createItem: builder.mutation({
      query: (data) => ({
        url: '/api/v1/platform-b/items',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Item'],
    }),
  }),
});

export const { useGetItemsQuery, useCreateItemMutation } = exampleApi;
```

### 2. Role-Based Access Control
```typescript
import { useAuth } from '../hooks/useAuth';

function AdminOnlyButton() {
  const { isSuperAdmin, hasRole } = useAuth();

  if (!isSuperAdmin) return null;

  return <Button>Admin Action</Button>;
}

// Check multiple roles
function ModeratorButton() {
  const { hasRole } = useAuth();

  if (!hasRole(['Super_Admin', 'Admin', 'Support_Manager'])) {
    return null;
  }

  return <Button>Moderator Action</Button>;
}
```

### 3. Error Handling Best Practices
```typescript
const handleAction = async () => {
  try {
    const response = await apiMutation(data).unwrap();
    toast.success('Success!');
  } catch (err: any) {
    if (err?.status === 401) {
      toast.error('Session expired. Please login again.');
    } else if (err?.status === 403) {
      toast.error('You do not have permission for this action.');
    } else {
      toast.error(err?.data?.message || 'An error occurred');
    }
  }
};
```

---

## Architecture

### Authentication State Flow
```
┌─────────────────┐
│   App.tsx       │
│  (on mount)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Call refresh() API     │
│  with httpOnly cookies  │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Success   Fail
    │         │
    ▼         ▼
┌──────┐  ┌──────────┐
│setUser│  │setInit() │
└───┬──┘  └────┬─────┘
    │          │
    ▼          ▼
┌────────────────────┐
│  ProtectedRoute    │
│  checks auth state │
└────────┬───────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Authenticated  Not Auth
    │            │
    ▼            ▼
 Render       Redirect
 Children     to /login
```

### API Request Flow with Auto-Refresh
```
┌──────────────────┐
│  Component calls │
│  RTK Query hook  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│  baseQueryWithReauth │
│  makes API request   │
└────────┬─────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Success   401 Error
    │         │
    │         ▼
    │    ┌──────────────┐
    │    │ Call refresh │
    │    └──────┬───────┘
    │           │
    │      ┌────┴────┐
    │      │         │
    │      ▼         ▼
    │   Success    Fail
    │      │         │
    │      ▼         ▼
    │   ┌─────────┐ ┌────────┐
    │   │ Retry   │ │ Logout │
    │   │ Request │ │ User   │
    │   └────┬────┘ └────────┘
    │        │
    └────────┴──────────┐
                        │
                        ▼
                ┌───────────────┐
                │ Return result │
                │ to component  │
                └───────────────┘
```

---

## Environment Variables
Create a `.env` file in the `admin/project` directory:

```bash
# Backend API URL
VITE_API_BASE_URL=http://localhost:5000

# Or for production
VITE_API_BASE_URL=https://api.cryptians.com
```

---

## Security Checklist
- [x] Access tokens stored in httpOnly cookies
- [x] Refresh tokens stored in httpOnly cookies
- [x] Automatic token refresh on expiration
- [x] Protected routes with auth guards
- [x] Role-based access control
- [x] HTTPS in production (backend responsibility)
- [x] CSRF protection via sameSite cookies
- [x] No sensitive data in localStorage
- [x] Automatic logout on refresh failure
- [x] Error handling for all API calls

---

## Testing the Authentication Flow

### 1. Test Login
```bash
# Start the app
npm run dev

# Navigate to http://localhost:5173/login
# Enter credentials and submit
# Should redirect to /dashboard with user data
```

### 2. Test Page Reload
```bash
# After logging in, refresh the page (F5)
# Should show loading spinner briefly
# User should remain authenticated
# Should NOT redirect to login
```

### 3. Test Token Expiration
```bash
# Let the access token expire (15 minutes)
# Make any API call (navigate to Users page)
# Should automatically refresh token
# Request should succeed without logout
```

### 4. Test Refresh Token Expiration
```bash
# Clear cookies manually or wait 7 days
# Refresh the page
# Should redirect to login
```

### 5. Test Logout
```bash
# Click logout button in header
# Should clear cookies (check Network tab)
# Should redirect to login
# Trying to access /dashboard should redirect to login
```

---

## Troubleshooting

### Issue: Infinite redirect loop
**Cause:** Auth state not initialized
**Solution:** Check that `setInitialized()` is called in App.tsx catch block

### Issue: CORS errors
**Cause:** Backend not configured for credentials
**Solution:** Backend must set:
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Issue: Cookies not sent with requests
**Cause:** `credentials: 'include'` missing
**Solution:** Verify baseApi.ts has `credentials: 'include'`

### Issue: 401 errors not triggering refresh
**Cause:** baseQueryWithReauth not implemented
**Solution:** Check baseApi.ts has the wrapper function

---

## Next Steps
1. Connect to real backend API
2. Update `.env` with actual API URL
3. Test all authentication flows
4. Implement remaining pages (KYC, Disputes, Escrow, etc.)
5. Add role-specific UI restrictions
6. Set up error logging (Sentry, etc.)
7. Deploy to production

---

## Support
For issues or questions:
- Check browser console for errors
- Check Network tab for API responses
- Verify cookies are being set
- Check Redux DevTools for state changes

**Happy Coding!** 🚀
