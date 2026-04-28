// src/services/disputeApi.ts
import { baseApi } from './baseApi';

export const disputeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllDisputes: builder.query<any, any>({
      query: (params) => ({
        url: '/api/v1/platform-b/disputes',
        params,
      }),
      providesTags: ['Dispute'],
    }),
    resolveDispute: builder.mutation<void, { id: string; resolution: string; remarks: string }>({
      query: ({ id, ...body }) => ({
        url: `/api/v1/platform-b/disputes/${id}/resolve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Dispute'],
    }),
    resolveAppeal: builder.mutation<void, { id: string; decision: string; remarks: string }>({
      query: ({ id, ...body }) => ({
        url: `/api/v1/platform-b/disputes/${id}/resolve-appeal`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Dispute', 'Trade' as any],
    }),
  }),
});

export const {
  useGetAllDisputesQuery,
  useResolveDisputeMutation,
  useResolveAppealMutation
} = disputeApi;