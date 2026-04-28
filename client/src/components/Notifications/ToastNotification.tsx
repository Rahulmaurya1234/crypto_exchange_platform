// src/components/Notifications/ToastNotification.tsx - Premium Toast Notifications
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react';
import socketService from '../../services/socket.service';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
}

let toastIdCounter = 0;

export function useToastNotifications() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${toastIdCounter++}`;
        setToasts(prev => [...prev, { ...toast, id }]);

        // Auto remove after duration
        const duration = toast.duration || 6000;
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Track seen notification IDs to prevent duplicates (especially from multiple server processes)
    const [seenNotificationIds] = useState(new Set<string>());

    // Listen for socket notifications
    useEffect(() => {
        const handleNotification = (data: any) => {
            console.log('🔔 Toast notification received:', data);

            // Deduplicate using ID if present
            if (data.id) {
                if (seenNotificationIds.has(data.id)) {
                    console.log('🚫 Duplicate notification ignored:', data.id);
                    return;
                }
                seenNotificationIds.add(data.id);
                // Clean up old IDs after some time to manage memory
                setTimeout(() => seenNotificationIds.delete(data.id), 30000);
            }

            let type: Toast['type'] = 'info';
            if (data.type?.includes('approved') || data.type?.includes('success')) {
                type = 'success';
            } else if (data.type?.includes('rejected') || data.type?.includes('failed') || data.type?.includes('error')) {
                type = 'error';
            } else if (data.type?.includes('pending') || data.type?.includes('warning')) {
                type = 'warning';
            }

            addToast({
                type,
                title: data.title || 'Notification',
                message: data.message || '',
                duration: 8000,
            });
        };

        socketService.onNotification(handleNotification);

        return () => {
            socketService.offNotification();
        };
    }, [addToast, seenNotificationIds]);

    return { toasts, addToast, removeToast };
}

// Icon and style configurations
const toastConfig = {
    success: {
        icon: CheckCircle,
        gradient: 'from-emerald-500 to-green-600',
        bgGradient: 'from-emerald-50 to-green-50',
        borderColor: 'border-emerald-200',
        iconBg: 'bg-emerald-500',
        titleColor: 'text-emerald-900',
        messageColor: 'text-emerald-700',
    },
    error: {
        icon: XCircle,
        gradient: 'from-red-500 to-rose-600',
        bgGradient: 'from-red-50 to-rose-50',
        borderColor: 'border-red-200',
        iconBg: 'bg-red-500',
        titleColor: 'text-red-900',
        messageColor: 'text-red-700',
    },
    warning: {
        icon: AlertTriangle,
        gradient: 'from-amber-500 to-orange-600',
        bgGradient: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-200',
        iconBg: 'bg-amber-500',
        titleColor: 'text-amber-900',
        messageColor: 'text-amber-700',
    },
    info: {
        icon: Info,
        gradient: 'from-blue-500 to-indigo-600',
        bgGradient: 'from-blue-50 to-indigo-50',
        borderColor: 'border-blue-200',
        iconBg: 'bg-blue-500',
        titleColor: 'text-blue-900',
        messageColor: 'text-blue-700',
    },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const config = toastConfig[toast.type];
    const IconComponent = config.icon;
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onRemove, 300);
    };

    return (
        <div
            className={`
                relative overflow-hidden
                w-full max-w-sm
                bg-gradient-to-br ${config.bgGradient}
                border ${config.borderColor}
                rounded-2xl shadow-2xl shadow-slate-200/50
                backdrop-blur-xl
                ${isExiting ? 'animate-slide-out' : 'animate-slide-in'}
            `}
        >
            {/* Gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />

            {/* Sparkle decoration for success */}
            {toast.type === 'success' && (
                <div className="absolute top-3 right-12 opacity-30">
                    <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
                </div>
            )}

            <div className="p-4 flex items-start gap-3">
                {/* Icon */}
                <div className={`shrink-0 w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center shadow-lg`}>
                    <IconComponent className="w-5 h-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`font-bold text-sm ${config.titleColor}`}>
                        {toast.title}
                    </p>
                    {toast.message && (
                        <p className={`text-xs mt-1 ${config.messageColor} line-clamp-2`}>
                            {toast.message}
                        </p>
                    )}
                </div>

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-white/50 transition-colors group"
                >
                    <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/30 overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${config.gradient} animate-progress`}
                    style={{ animationDuration: `${toast.duration || 6000}ms` }}
                />
            </div>
        </div>
    );
}

export function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <>
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm">
                {toasts.map(toast => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onRemove={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {/* Animations */}
            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
                
                @keyframes slideOut {
                    from {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%) scale(0.95);
                    }
                }
                
                @keyframes progress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                
                .animate-slide-in {
                    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                
                .animate-slide-out {
                    animation: slideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                
                .animate-progress {
                    animation: progress linear forwards;
                }
            `}</style>
        </>
    );
}

export default ToastContainer;
