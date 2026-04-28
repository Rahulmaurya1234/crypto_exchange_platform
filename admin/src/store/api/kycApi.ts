// src/services/kycApi.ts
import { baseApi } from './baseApi';
import type { KYCSubmission, PaginatedResponse, PaginationParams } from '../../types';

export const kycApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPendingKYCs: builder.query<KYCSubmission[], void>({
      query: () => '/api/v1/platform-b/admin/kyc/pending',
      providesTags: ['KYC'],
    }),
    getAllKYCs: builder.query<PaginatedResponse<KYCSubmission>, PaginationParams>({
      query: (params) => ({
        url: '/api/v1/platform-b/admin/kyc',
        params,
      }),
      providesTags: ['KYC'],
    }),
    reviewKYC: builder.mutation<void, { userId: string; action: 'approve' | 'reject'; remarks?: string; reason?: string }>({
      query: ({ userId, ...data }) => ({
        url: `/api/v1/platform-b/admin/kyc/${userId}/review`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['KYC'],
    }),
  }),
});

export const { useGetPendingKYCsQuery, useGetAllKYCsQuery, useReviewKYCMutation } = kycApi;