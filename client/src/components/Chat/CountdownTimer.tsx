import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface CountdownTimerProps {
    expiryTime: Date;
    onExpire?: () => void;
    warningThreshold?: number; // minutes before showing warning
}

export default function CountdownTimer({
    expiryTime,
    onExpire,
    warningThreshold = 5
}: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isWarning, setIsWarning] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiryTime).getTime();
            const difference = expiry - now;

            if (difference <= 0) {
                setTimeLeft('Expired');
                setIsExpired(true);
                if (onExpire) onExpire();
                return;
            }

            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft(`${minutes}m ${seconds}s`);
            setIsWarning(minutes < warningThreshold);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [expiryTime, onExpire, warningThreshold]);

    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs shadow-lg ${isExpired
                ? 'bg-red-600 text-white border-2 border-red-800'
                : isWarning
                    ? 'bg-orange-500 text-white border-2 border-orange-700 animate-pulse'
                    : 'bg-white text-gray-900 border-2 border-white/30'
                }`}
        >
            {isExpired ? (
                <AlertCircle className="w-4 h-4" />
            ) : (
                <Clock className="w-4 h-4" />
            )}
            <span className="font-mono">{isExpired ? 'EXPIRED' : timeLeft}</span>
        </div>
    );
}
