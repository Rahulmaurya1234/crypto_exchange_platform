// src/components/notifications/NotificationDropdown.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Check, CheckCheck, UserPlus, UserMinus, UserX, Shield, FileCheck, FileX, AlertTriangle, Clock } from 'lucide-react';
import { RootState } from '../../store';
import { toast } from 'react-toastify';
import {
    addNotification,
    markAsRead,
    markAllAsRead,
    setNotifications,
    setUnreadCount,
    AdminNotification
} from '../../store/slices/notificationSlice';
import { useGetNotificationsQuery, useGetUnreadCountQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from '../../store/api/notificationApi';
import socketService from '../../services/socket.service';
import { Wallet, DollarSign } from 'lucide-react';

// Notification type icons
const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'user_registered':
            return <UserPlus className="w-5 h-5 text-green-500" />;
        case 'user_suspended':
            return <UserMinus className="w-5 h-5 text-orange-500" />;
        case 'user_unsuspended':
            return <UserPlus className="w-5 h-5 text-blue-500" />;
        case 'user_banned':
            return <UserX className="w-5 h-5 text-red-500" />;
        case 'user_email_approved':
            return <Shield className="w-5 h-5 text-green-500" />;
        case 'instant_seller_approved':
            return <Shield className="w-5 h-5 text-purple-500" />;
        case 'kyc_submitted':
            return <FileCheck className="w-5 h-5 text-blue-500" />;
        case 'kyc_approved':
            return <FileCheck className="w-5 h-5 text-green-500" />;
        case 'kyc_rejected':
            return <FileX className="w-5 h-5 text-red-500" />;
        case 'trade_disputed':
        case 'trade_appealed':
            return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        case 'deposit_pending':
            return <Wallet className="w-5 h-5 text-amber-500" />;
        case 'deposit_approved':
            return <DollarSign className="w-5 h-5 text-green-500" />;
        case 'deposit_rejected':
            return <DollarSign className="w-5 h-5 text-red-500" />;
        default:
            return <Bell className="w-5 h-5 text-gray-500" />;
    }
};

// Notification type colors
const getNotificationBgColor = (type: string) => {
    switch (type) {
        case 'user_registered':
        case 'user_email_approved':
        case 'kyc_approved':
        case 'deposit_approved':
            return 'bg-green-50 border-green-200';
        case 'user_suspended':
            return 'bg-orange-50 border-orange-200';
        case 'user_unsuspended':
        case 'kyc_submitted':
            return 'bg-blue-50 border-blue-200';
        case 'user_banned':
        case 'kyc_rejected':
        case 'deposit_rejected':
            return 'bg-red-50 border-red-200';
        case 'instant_seller_approved':
            return 'bg-purple-50 border-purple-200';
        case 'trade_disputed':
        case 'trade_appealed':
            return 'bg-yellow-50 border-yellow-200';
        case 'deposit_pending':
            return 'bg-amber-50 border-amber-200';
        default:
            return 'bg-gray-50 border-gray-200';
    }
};

export const NotificationDropdown: React.FC = () => {
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { items: notifications, unreadCount } = useSelector((state: RootState) => state.notifications);

    // API hooks
    const { data: notificationsData, refetch: refetchNotifications } = useGetNotificationsQuery({ page: 1, limit: 20 });
    const { data: unreadCountData, refetch: refetchUnreadCount } = useGetUnreadCountQuery();
    const [markAsReadMutation] = useMarkAsReadMutation();
    const [markAllAsReadMutation] = useMarkAllAsReadMutation();

    // Initialize socket connection and listen for notifications
    useEffect(() => {
        // Connect socket
        socketService.connect();

        // Set up notification listener
        socketService.onNotification((notification) => {
            dispatch(addNotification(notification));

            // Show toast notification
            toast.info(notification.message, {
                title: notification.title,
                icon: getNotificationIcon(notification.type)
            } as any);

            // Show browser notification if supported
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico'
                });
            }
        });

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            socketService.offNotification();
        };
    }, [dispatch]);

    // Load initial notifications from API
    useEffect(() => {
        if (notificationsData?.data?.notifications) {
            dispatch(setNotifications(notificationsData.data.notifications));
        }
    }, [notificationsData, dispatch]);

    // Load initial unread count
    useEffect(() => {
        if (unreadCountData?.data?.count !== undefined) {
            dispatch(setUnreadCount(unreadCountData.data.count));
        }
    }, [unreadCountData, dispatch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markAsReadMutation(notificationId).unwrap();
            dispatch(markAsRead(notificationId));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsReadMutation().unwrap();
            dispatch(markAllAsRead());
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const handleNotificationClick = (notification: AdminNotification) => {
        if (notification.status === 'unread') {
            handleMarkAsRead(notification._id);
        }
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
        setIsOpen(false);
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInMs = now.getTime() - date.getTime();
            const diffInMinutes = Math.floor(diffInMs / 60000);
            const diffInHours = Math.floor(diffInMinutes / 60);
            const diffInDays = Math.floor(diffInHours / 24);

            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
            if (diffInHours < 24) return `${diffInHours}h ago`;
            if (diffInDays < 7) return `${diffInDays}d ago`;
            return date.toLocaleDateString();
        } catch {
            return 'Unknown';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 group"
                title="Notifications"
            >
                <Bell className="w-5 h-5 group-hover:animate-pulse" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden transform transition-all duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            <h3 className="font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Bell className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-sm font-medium">No notifications</p>
                                <p className="text-xs">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.slice(0, 20).map((notification) => (
                                <div
                                    key={notification._id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`relative flex items-start gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${notification.status === 'unread' ? 'bg-indigo-50/50' : ''
                                        }`}
                                >
                                    {/* Unread indicator */}
                                    {notification.status === 'unread' && (
                                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                    )}

                                    {/* Icon */}
                                    <div className={`flex-shrink-0 p-2 rounded-lg border ${getNotificationBgColor(notification.type)}`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${notification.status === 'unread' ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs text-gray-400">
                                                {formatTime(notification.createdAt)}
                                            </span>
                                            {notification.performedByName && (
                                                <span className="text-xs text-gray-400">
                                                    by {notification.performedByName}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mark as read button */}
                                    {notification.status === 'unread' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsRead(notification._id);
                                            }}
                                            className="flex-shrink-0 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // Navigate to full notifications page if you have one
                                }}
                                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
