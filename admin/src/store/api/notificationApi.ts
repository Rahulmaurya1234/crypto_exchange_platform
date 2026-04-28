// src/store/api/notificationApi.ts
import { baseApi } from './baseApi';
import { AdminNotification } from '../slices/notificationSlice';

interface NotificationsResponse {
    success: boolean;
    statusCode: number;
    data: {
        notifications: AdminNotification[];
        total: number;
        page: number;
        totalPages: number;
    };
    message: string;
}

interface UnreadCountResponse {
    success: boolean;
    statusCode: number;
    data: {
        count: number;
    };
    message: string;
}

interface MarkAsReadResponse {
    success: boolean;
    statusCode: number;
    data: {
        notification: AdminNotification;
    };
    message: string;
}

export const notificationApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get admin notifications
        getNotifications: builder.query<NotificationsResponse, { page?: number; limit?: number; status?: string }>({
            query: ({ page = 1, limit = 20, status }) => ({
                url: '/platform-b/admin/notifications',
                params: { page, limit, status },
            }),
        }),

        // Get unread count
        getUnreadCount: builder.query<UnreadCountResponse, void>({
            query: () => '/platform-b/admin/notifications/unread-count',
        }),

        // Mark notification as read
        markAsRead: builder.mutation<MarkAsReadResponse, string>({
            query: (id) => ({
                url: `/platform-b/admin/notifications/${id}/read`,
                method: 'POST',
            }),
        }),

        // Mark all notifications as read
        markAllAsRead: builder.mutation<{ success: boolean }, void>({
            query: () => ({
                url: '/platform-b/admin/notifications/read-all',
                method: 'POST',
            }),
        }),
    }),
});

export const {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
} = notificationApi;
