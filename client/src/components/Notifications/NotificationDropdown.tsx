// NotificationDropdown.tsx - Premium UI Component
import { Bell, BellRing, CheckCheck, Trash2 } from 'lucide-react';
import NotificationItem from "./NotificationItem";

type ChatRequest = {
  chatId: string;
  listing?: any;
  buyer?: { name?: string };
  timestamp?: string | number | Date;
};

type GeneralNotification = {
  id: string;
  type: "deposit_approved" | "deposit_rejected" | "deposit_pending" | "default";
  title: string;
  message?: string;
  createdAt?: string | Date;
  isRead?: boolean;
};

type NotificationDropdownProps = {
  chatRequests?: ChatRequest[];
  notifications?: GeneralNotification[];
  unreadCount?: number;
  open: boolean;
  onClose?: () => void;
  onOpenChat?: (req: ChatRequest) => void;
  onDismiss?: (chatId: string) => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  onViewAll?: () => void;
};

export default function NotificationDropdown({
  chatRequests = [],
  notifications = [],
  unreadCount = 0,
  open,
  onClose,
  onOpenChat,
  onDismiss,
  onMarkAllRead,
  onClearAll,
  onViewAll,
}: NotificationDropdownProps) {
  const hasNotifications = chatRequests.length > 0 || notifications.length > 0;

  return (
    <>
      {/* Backdrop with smooth fade */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ease-in-out ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Dropdown Container with smooth entry/exit */}
      <div
        className={`absolute right-0 mt-3 w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] origin-top-right ${open
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
                  {unreadCount > 0 ? (
                    <BellRing className="w-5 h-5 text-white" />
                  ) : (
                    <Bell className="w-5 h-5 text-white" />
                  )}
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Notifications</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>

            {/* Actions */}
            {hasNotifications && (
              <div className="flex items-center gap-1">
                {onMarkAllRead && (
                  <button
                    onClick={onMarkAllRead}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                  </button>
                )}
                {onClearAll && (
                  <button
                    onClick={onClearAll}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500 dark:group-hover:text-red-400" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {hasNotifications ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Chat Requests */}
              {chatRequests.map((req) => (
                <NotificationItem
                  key={req.chatId}
                  id={req.chatId}
                  type="chat"
                  title={`${req.buyer?.name ?? "Buyer"} wants to chat`}
                  subtitle={`Regarding: ${req.listing?.cryptoType ?? "Listing"} • ${req.listing?.availableAmount ?? ''} USDT`}
                  time={typeof req.timestamp === 'number' ? new Date(req.timestamp) : req.timestamp}
                  onOpen={() => {
                    onOpenChat && onOpenChat(req);
                    onClose?.();
                  }}
                  onDismiss={() => onDismiss && onDismiss(req.chatId)}
                />
              ))}

              {/* General Notifications */}
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  id={notif.id}
                  type={notif.type}
                  title={notif.title}
                  subtitle={notif.message}
                  time={notif.createdAt}
                  isRead={notif.isRead}
                  onOpen={() => onClose?.()}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="py-12 px-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">All caught up!</h4>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No new notifications at the moment.
                <br />
                We'll notify you when something arrives.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {hasNotifications && (
          <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onViewAll?.();
                onClose?.();
              }}
              className="w-full py-2.5 text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
            >
              View all notifications
            </button>
          </div>
        )}
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        /* Dark mode scrollbar */
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #334155;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #475569;
          }
        }
      `}</style>
    </>
  );
}
