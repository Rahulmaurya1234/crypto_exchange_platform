// NotificationItem.tsx - Premium UI Component
import { MessageCircle, DollarSign, CheckCircle, XCircle, Clock, Bell, X, ArrowRight } from 'lucide-react';

type NotificationItemProps = {
  id: string;
  title: string;
  subtitle?: string;
  time?: string | Date;
  type?: "chat" | "deposit_approved" | "deposit_rejected" | "deposit_pending" | "default";
  isRead?: boolean;
  onOpen?: () => void;
  onDismiss?: () => void;
};

// Icon configuration based on type
const getTypeConfig = (type: string) => {
  switch (type) {
    case 'chat':
      return {
        icon: MessageCircle,
        bgColor: 'bg-gradient-to-br from-indigo-500 to-purple-600',
        borderColor: 'border-l-indigo-500',
        iconColor: 'text-white',
      };
    // deposit_approved handled below with escrow_confirmed
    // deposit_rejected handled below with kyc_rejected, trade_cancelled
    case 'deposit_pending':
    case 'kyc_submitted':
    case 'trade_initiated':
      return {
        icon: MessageCircle,
        bgColor: 'bg-gradient-to-br from-indigo-500 to-purple-600',
        borderColor: 'border-l-indigo-500',
        iconColor: 'text-white',
      };
    case 'deposit_approved':
    case 'escrow_confirmed':
      return {
        icon: CheckCircle,
        bgColor: 'bg-gradient-to-br from-emerald-500 to-green-600',
        borderColor: 'border-l-emerald-500',
        iconColor: 'text-white',
      };
    case 'payment_uploaded':
      return {
        icon: DollarSign,
        bgColor: 'bg-gradient-to-br from-blue-500 to-cyan-600',
        borderColor: 'border-l-blue-500',
        iconColor: 'text-white',
      };
    case 'trade_completed':
    case 'kyc_approved':
      return {
        icon: CheckCircle,
        bgColor: 'bg-gradient-to-br from-blue-600 to-indigo-700',
        borderColor: 'border-l-blue-600',
        iconColor: 'text-white',
      };
    case 'deposit_rejected':
    case 'kyc_rejected':
    case 'trade_cancelled':
      return {
        icon: XCircle,
        bgColor: 'bg-gradient-to-br from-red-500 to-rose-600',
        borderColor: 'border-l-red-500',
        iconColor: 'text-white',
      };
    case 'trade_appealed':
      return {
        icon: Clock,
        bgColor: 'bg-gradient-to-br from-orange-500 to-amber-600',
        borderColor: 'border-l-orange-500',
        iconColor: 'text-white',
      };
    default:
      return {
        icon: Bell,
        bgColor: 'bg-gradient-to-br from-slate-500 to-slate-600',
        borderColor: 'border-l-slate-500',
        iconColor: 'text-white',
      };
  }
};

// Format time to relative time
const formatTimeAgo = (time: string | Date | undefined): string => {
  if (!time) return '';

  const date = typeof time === 'string' ? new Date(time) : time;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationItem({
  id,
  title,
  subtitle,
  time,
  type = "default",
  isRead = false,
  onOpen,
  onDismiss,
}: NotificationItemProps) {
  const config = getTypeConfig(type);
  const IconComponent = config.icon;
  const timeText = formatTimeAgo(time);

  return (
    <div
      onClick={onOpen}
      className={`group relative p-4 transition-all duration-300 border-l-4 ${config.borderColor} ${!isRead ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''
        } ${onOpen ? 'cursor-pointer hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent dark:hover:from-slate-800/50 dark:hover:to-transparent' : ''}`}
    >
      {/* Unread indicator with glow */}
      {!isRead && (
        <div className="absolute top-4 right-4">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon with refined shadow */}
        <div className={`shrink-0 w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center shadow-lg shadow-slate-200 dark:shadow-slate-950/20 group-hover:scale-110 transition-transform duration-300`}>
          <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight line-clamp-2">
                {title}
              </p>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss?.();
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all duration-200"
              aria-label={`Dismiss notification ${id}`}
            >
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 transition-colors" />
            </button>
          </div>

          {/* Footer with time and action */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeText}
            </span>

            {onOpen && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] sm:text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-indigo-500/20 transition-all transform group-hover:-translate-y-0.5"
              >
                Open
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
