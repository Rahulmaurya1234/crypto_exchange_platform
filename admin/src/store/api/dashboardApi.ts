import { baseApi } from './baseApi';
import type { DashboardStats } from '../../types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<{ data: DashboardStats }, void>({
      query: () => '/api/v1/platform-b/admin/stats',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
