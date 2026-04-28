// src/services/escrowApi.ts
import { baseApi } from './baseApi';
import type { PaginatedResponse, PaginationParams } from '../../types';

export const escrowApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEscrowStats: builder.query<any, void>({
      query: () => '/api/v1/platform-b/escrow/stats',
      providesTags: ['Escrow'],
    }),
    getDepositedTrades: builder.query<{ data: any[] }, void>({
      query: () => '/api/v1/platform-b/trades/deposited',
      providesTags: ['Trade'],
    }),
    getPendingEscrowTransactions: builder.query<{ data: any[] }, void>({
      query: () => '/api/v1/platform-b/escrow/pending',
      providesTags: ['Escrow'],
    }),
    verifyDeposit: builder.mutation<void, { tradeId: string; isValid: boolean; remarks: string }>({
      query: ({ tradeId, isValid, remarks }) => ({
        url: `/api/v1/platform-b/escrow/${tradeId}/verify-deposit`,
        method: 'POST',
        body: { isValid, remarks },
      }),
      invalidatesTags: ['Escrow'],
    }),
    releaseToBuyer: builder.mutation<void, { tradeId: string; releaseHash: string }>({
      query: ({ tradeId, releaseHash }) => ({
        url: `/api/v1/platform-b/escrow/${tradeId}/release-to-buyer`,
        method: 'POST',
        body: { releaseHash },
      }),
      invalidatesTags: ['Escrow'],
    }),
    refundToSeller: builder.mutation<void, { tradeId: string; refundHash: string; reason: string }>({
      query: ({ tradeId, refundHash, reason }) => ({
        url: `/api/v1/platform-b/escrow/${tradeId}/refund-to-seller`,
        method: 'POST',
        body: { refundHash, reason },
      }),
      invalidatesTags: ['Escrow'],
    }),
    getAllEscrowTransactions: builder.query<{ data: { transactions: any[], pagination: any } }, PaginationParams>({
      query: (params) => ({
        url: '/api/v1/platform-b/escrow',
        params,
      }),
      providesTags: ['Escrow'],
    }),
    getEscrowTransactionByHash: builder.query<any, string>({
      query: (hash) => `/api/v1/platform-b/escrow/hash/${hash}`,
      providesTags: ['Escrow'],
    }),
    updateConfirmations: builder.mutation<void, { hash: string; confirmations: number; blockNumber: number }>({
      query: ({ hash, confirmations, blockNumber }) => ({
        url: `/api/v1/platform-b/escrow/hash/${hash}/confirmations`,
        method: 'POST',
        body: { confirmations, blockNumber },
      }),
      invalidatesTags: ['Escrow'],
    }),
    getUserEscrowTransactions: builder.query<any[], string>({
      query: (userId) => `/api/v1/platform-b/escrow/user/${userId}`,
      providesTags: ['Escrow'],
    }),
    getPendingDeposits: builder.query<any, void>({
      query: () => '/api/v1/platfrom-b/listings/admin/pending-deposits',
      providesTags: ['Escrow'],
    }),
    getDepositById: builder.query<any, string>({
      query: (id) => `/api/v1/platfrom-b/listings/admin/${id}/deposit`,
      providesTags: ['Escrow'],
    }),
    approveDeposit: builder.mutation<void, { id: string; body: { verified: boolean; notes?: string;canResubmit?: boolean; } }>({
      query: ({ id, body }) => ({
        url: `/api/v1/platfrom-b/listings/admin/${id}/approve-deposit`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Escrow'],
    }),
    getAllInstantSellerDeposits: builder.query<any, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => ({
        url: '/api/v1/platfrom-b/listings/admin/instant-seller/deposits',
        params: { page, limit },
      }),
      providesTags: ['Escrow'],
    }),
  }),
});

export const {
  useGetEscrowStatsQuery,
  useGetAllInstantSellerDepositsQuery,
  useGetDepositedTradesQuery,
  useGetPendingEscrowTransactionsQuery,
  useVerifyDepositMutation,
  useReleaseToBuyerMutation,
  useRefundToSellerMutation,
  useGetAllEscrowTransactionsQuery,
  useGetEscrowTransactionByHashQuery,
  useUpdateConfirmationsMutation,
  useGetUserEscrowTransactionsQuery,
  useGetPendingDepositsQuery,
  useGetDepositByIdQuery,
  useApproveDepositMutation,
} = escrowApi;