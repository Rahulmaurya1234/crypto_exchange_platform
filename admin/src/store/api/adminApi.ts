// src/services/adminApi.ts
import { baseApi } from './baseApi';
import type { DashboardStats, PaginatedResponse, PaginationParams, PlatformOverview, AdminNotification, AuditLog } from '../../types';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/api/v1/platform-b/admin/stats',
      providesTags: ['Dashboard'],
    }),
    getPlatformOverview: builder.query<{ data: { overview: PlatformOverview } }, void>({
      query: () => '/api/v1/platform-b/analytics/overview',
      providesTags: ['Dashboard'],
    }),
    getAnalyticsDashboardStats: builder.query<any, { range?: string }>({
      query: (params) => ({
        url: '/api/v1/platform-b/analytics/dashboard-stats',
        params,
      }),
      providesTags: ['Dashboard'],
    }),
    getAdminNotifications: builder.query<PaginatedResponse<AdminNotification>, PaginationParams>({
      query: (params) => ({
        url: '/api/v1/platform-b/admin/notifications',
        params,
      }),
      providesTags: ['Notifications'],
    }),
    getAllTrades: builder.query<PaginatedResponse<any>, PaginationParams>({
      query: (params) => ({
        url: '/api/v1/platform-b/admin/trades',
        params,
      }),
      providesTags: ['Dashboard'],
    }),
    changeAdminPassword: builder.mutation<any, any>({
      query: (data) => ({
        url: '/api/v1/platform-b/admin/me/change-password',
        method: 'POST',
        body: data,
      }),
    }),
    updateAdminProfile: builder.mutation<any, any>({
      query: (data) => ({
        url: '/api/v1/platform-b/admin/me/profile',
        method: 'PUT',
        body: data,
      }),
    }),
    getAuditLogs: builder.query<{ data: { logs: AuditLog[], pagination: any } }, { page?: number, limit?: number, type?: string, action?: string }>({
      query: (params) => ({
        url: '/api/v1/platform-b/admin/logs',
        params,
      }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { 
  useGetDashboardStatsQuery, 
  useGetPlatformOverviewQuery,
  useGetAnalyticsDashboardStatsQuery, 
  useGetAdminNotificationsQuery,
  useGetAllTradesQuery,
  useChangeAdminPasswordMutation,
  useUpdateAdminProfileMutation,
  useGetAuditLogsQuery,
} = adminApi;