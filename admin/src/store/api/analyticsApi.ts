// src/services/analyticsApi.ts
import { baseApi } from './baseApi';
import type { PaginationParams } from '../../types';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformOverview: builder.query<any, void>({
      query: () => '/api/v1/platform-b/analytics/overview',
      providesTags: ['Analytics'],
    }),
    getUserAnalytics: builder.query<any, PaginationParams>({
      query: (params) => ({
        url: '/api/v1/platform-b/analytics/users',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getTradeAnalytics: builder.query<any, PaginationParams>({
      query: (params) => ({
        url: '/api/v1/platform-b/analytics/trades',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getRevenueAnalytics: builder.query<any, PaginationParams>({
      query: (params) => ({
        url: '/api/v1/platform-b/analytics/revenue',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getListingAnalytics: builder.query<any, void>({
      query: () => '/api/v1/platform-b/analytics/listings',
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetPlatformOverviewQuery,
  useGetUserAnalyticsQuery,
  useGetTradeAnalyticsQuery,
  useGetRevenueAnalyticsQuery,
  useGetListingAnalyticsQuery,
} = analyticsApi;