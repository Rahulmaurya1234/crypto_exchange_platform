// src/store/api/supportApi.ts
import { baseApi } from './baseApi';
import type { PaginatedResponse, PaginationParams } from '../../types';

export const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSupportStats: builder.query<any, void>({
      query: () => '/api/v1/platform-b/support/stats',
      providesTags: ['Support'],
    }),
    
    getAllSupportTickets: builder.query<PaginatedResponse<any>, PaginationParams>({
      query: (params) => ({
        url: '/api/v1/platform-b/support/tickets',
        params,
      }),
      providesTags: ['Support'],
    }),
    
    getMyTickets: builder.query<PaginatedResponse<any>, PaginationParams>({
      query: (params) => ({
        url: '/api/v1/platform-b/support/my-tickets',
        params,
      }),
      providesTags: ['Support'],
    }),
    
    joinSupportChat: builder.mutation<any, string>({
      query: (chatId) => ({
        url: `/api/v1/platform-b/support/chat/${chatId}/join`,
        method: 'POST',
      }),
      // Invalidates 'Support' tag to refetch tickets which might now belong to the user
      invalidatesTags: ['Support'], 
    }),
  }),
});

export const {
  useGetSupportStatsQuery,
  useGetAllSupportTicketsQuery,
  useGetMyTicketsQuery,
  useJoinSupportChatMutation,
} = supportApi;