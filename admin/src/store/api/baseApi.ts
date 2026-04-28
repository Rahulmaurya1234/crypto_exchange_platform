// src/services/baseApi.ts
import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { logout, setUser } from '../slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  credentials: 'include', // This sends httpOnly cookies automatically
  prepareHeaders: (headers) => {
    // We don't manually set Authorization header
    // Backend reads accessToken from httpOnly cookie
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Wrapper around baseQuery that handles automatic token refresh on 401 errors
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401 error, try to refresh the token
  if (result.error && (result.error.status === 401 || result.error.status === 400) ) {
    // Don't try to refresh if we're already calling the refresh endpoint
    const url = typeof args === 'string' ? args : args.url;
    if (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register')) {
      return result;
    }

    console.log('Token expired, attempting refresh...');

    // Try to refresh the token
    const refreshResult = await baseQuery(
      {
        url: '/api/v1/platform-b/auth/refresh',
        method: 'POST',
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Refresh successful, update user in store
      const authResponse = refreshResult.data as { data: { user: any } };
      api.dispatch(setUser(authResponse.data.user));
      console.log('Token refreshed successfully');

      // Retry the original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed, logout user
      console.log('Token refresh failed, logging out...');
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Dashboard',
    'User',
    'KYC',
    'Dispute',
    'Escrow',
    'Ticket',
    'Analytics',
    'Trade',
    'Support',
    'Notifications',
  ],
  endpoints: () => ({}),
});