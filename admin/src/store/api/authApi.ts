// src/services/authApi.ts
import { baseApi } from './baseApi';
import type { AuthResponse } from '../../types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Register new admin user (Super_Admin only)
    register: builder.mutation<AuthResponse, {
      email: string;
      password: string;
      name: string;
      role?: 'Super_Admin' | 'Admin' | 'Support_Manager' | 'Support';
    }>({
      query: (data) => ({
        url: '/api/v1/platform-b/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    // Login admin user
    login: builder.mutation<AuthResponse, {
      email: string;
      password: string;
    }>({
      query: (credentials) => ({
        url: '/api/v1/platform-b/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Refresh access token using httpOnly refresh token cookie
    refresh: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: '/api/v1/platform-b/auth/refresh',
        method: 'POST',
      }),
    }),

    // Logout admin user (clears httpOnly cookies)
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/api/v1/platform-b/auth/logout',
        method: 'POST',
      }),
    }),

    // Get current authenticated user (verify session)
    getCurrentUser: builder.query<AuthResponse, void>({
      query: () => ({
        url: '/api/v1/platform-b/auth/me',
        method: 'GET',
      }),
    }),

    // Get Extract s3 object key from full S3 URL
    // Example: "https://bucket.s3.region.amazonaws.com/trades/123/payment.jpg"
    // Returns: "trades/123/payment.jpg"
    extractS3Key: builder.mutation<string | null, { s3Url: string, key: string }>({
      query: ({ s3Url , key}) => ({
        url: `/api/v1/upload/${encodeURIComponent(key)}`,
        method: 'POST', 
        body: { url: s3Url },
      }),
    }),
        // Get signed URL for S3 object
    getSignedUrl: builder.query<{ success: boolean; url: string; expiresIn: number }, string>({
      query: (key) => ({
        url: `/api/v1/upload/${encodeURIComponent(key)}`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useLazyGetSignedUrlQuery,
  useExtractS3KeyMutation
} = authApi;