// src/store/slices/notificationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  relatedModel?: string;
  relatedId?: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserEmail?: string;
  performedBy?: string;
  performedByName?: string;
  metadata?: any;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

interface NotificationState {
  items: AdminNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Set all notifications
    setNotifications: (state, action: PayloadAction<AdminNotification[]>) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter(n => n.status === 'unread').length;
    },

    // Add new notification (from socket)
    addNotification: (state, action: PayloadAction<AdminNotification>) => {
      // Add to beginning of list
      state.items.unshift(action.payload);
      // Keep only latest 50 notifications in state
      if (state.items.length > 50) {
        state.items = state.items.slice(0, 50);
      }
      if (action.payload.status === 'unread') {
        state.unreadCount += 1;
      }
    },

    // Mark notification as read
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(n => n._id === action.payload);
      if (notification && notification.status === 'unread') {
        notification.status = 'read';
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    // Mark all as read
    markAllAsRead: (state) => {
      state.items.forEach(n => {
        if (n.status === 'unread') {
          n.status = 'read';
          n.readAt = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
    },

    // Set unread count
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },

    // Clear all notifications
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  setUnreadCount,
  clearNotifications,
  setLoading,
  setError,
} = notificationSlice.actions;

export default notificationSlice.reducer;