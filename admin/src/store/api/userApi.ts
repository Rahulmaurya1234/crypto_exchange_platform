// src/services/userApi.ts
import { baseApi } from './baseApi';
import type { User, PaginatedResponse, PaginationParams } from '../../types';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOwnRole: builder.query<User, void>({
      query: () => '/api/v1/platform-b/admin/me/role',
      providesTags: ['User'],
    }),
    getAllUsers: builder.query<PaginatedResponse<User>, PaginationParams>({
      query: (params) => ({
        url: '/api/v1/platform-b/admin/users',
        params,
      }),
      providesTags: ['User'],
    }),
    getUserById: builder.query<User, string>({
      query: (userId) => `/api/v1/platform-b/admin/users/${userId}`,
      providesTags: ['User'],
    }),
    suspendUser: builder.mutation<void, { userId: string; reason: string }>({
      query: ({ userId, reason }) => ({
        url: `/api/v1/platform-b/admin/users/${userId}/suspend`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['User'],
    }),
    unsuspendUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/api/v1/platform-b/admin/users/${userId}/unsuspend`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    banUser: builder.mutation<void, { userId: string; reason: string }>({
      query: ({ userId, reason }) => ({
        url: `/api/v1/platform-b/admin/users/${userId}/ban`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['User'],
    }),
    approveInstantSeller: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/api/v1/platform-b/admin/users/${userId}/approve-instant-seller`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    approveUserEmail: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/api/v1/platform-b/admin/users/${userId}/approve-email`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useSuspendUserMutation,
  useUnsuspendUserMutation,
  useBanUserMutation,
  useApproveInstantSellerMutation,
  useApproveUserEmailMutation,
  useGetOwnRoleQuery
} = userApi;