// src/services/tradeApi.ts
import { baseApi } from './baseApi';

export const tradeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTrades: builder.query<any, any>({
      query: (params) => ({
        url: '/api/v1/platform-b/admin/trades',
        params,
      }),
      providesTags: ['Trade'],
    }),
    getTradeById: builder.query<any, string>({
      query: (tradeId) => `/api/v1/platform-b/admin/trades/${tradeId}`,
      providesTags: ['Trade'],
    }),
    getSignedUrl: builder.query<{ url: string }, string>({
      query: (key) => `/api/v1/upload/${encodeURIComponent(key)}`,
      transformResponse: (response: { success: boolean; url: string }) => ({ url: response.url }),
    }),
  }),
});

export const { useGetAllTradesQuery, useGetTradeByIdQuery, useLazyGetSignedUrlQuery } = tradeApi;