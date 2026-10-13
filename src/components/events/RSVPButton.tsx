import { useState } from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
import type { RSVPStatus } from '../../types/database';

interface RSVPButtonProps {
    eventId: string;
    currentStatus: RSVPStatus | null;
    onRSVP: (status: RSVPStatus) => Promise<void>;
    attendeeCounts?: {
        going: number;
        maybe: number;
        not_going: number;
    };
    disabled?: boolean;
}

export default function RSVPButton({
    currentStatus,
    onRSVP,
    attendeeCounts,
    disabled = false,
}: RSVPButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleRSVP = async (status: RSVPStatus) => {
        if (loading || disabled) return;

        try {
            setLoading(true);
            await onRSVP(status);
        } catch (err) {
            console.error('RSVP error:', err);
        } finally {
            setLoading(false);
        }
    };

    const buttons = [
        {
            status: 'going' as RSVPStatus,
            icon: Check,
            label: 'Deltar',
            color: 'green',
            count: attendeeCounts?.going || 0,
        },
        {
            status: 'maybe' as RSVPStatus,
            icon: HelpCircle,
            label: 'Kanske',
            color: 'yellow',
            count: attendeeCounts?.maybe || 0,
        },
        {
            status: 'not_going' as RSVPStatus,
            icon: X,
            label: 'Kan inte delta',
            color: 'red',
            count: attendeeCounts?.not_going || 0,
        },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {buttons.map(({ status, icon: Icon, label, color, count }) => {
                const isActive = currentStatus === status;
                // Statusfärger enligt profilen: tonad yta + mörk text i ljust läge,
                // tonad yta + accentfärg i mörkt läge (fel använder error-soft).
                // Teal/orange/röd används aldrig som liten textfärg på ljus botten.
                const colorClasses = {
                    green: isActive
                        ? 'bg-success/15 text-surface-900 border-success dark:bg-success/20 dark:text-success'
                        : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 border-surface-300 dark:border-surface-600 hover:bg-success/10 dark:hover:bg-success/15',
                    yellow: isActive
                        ? 'bg-warning/20 text-surface-900 border-warning dark:bg-warning/20 dark:text-warning'
                        : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 border-surface-300 dark:border-surface-600 hover:bg-warning/10 dark:hover:bg-warning/15',
                    red: isActive
                        ? 'bg-error/15 text-surface-900 border-error dark:bg-error/20 dark:text-error-soft'
                        : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 border-surface-300 dark:border-surface-600 hover:bg-error/10 dark:hover:bg-error/15',
                };

                return (
                    <button
                        key={status}
                        onClick={() => handleRSVP(status)}
                        disabled={loading || disabled}
                        className={`
                            inline-flex items-center gap-2 px-4 py-2 min-h-11 border rounded-lg text-sm font-semibold
                            transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900
                            ${colorClasses[color as keyof typeof colorClasses]}
                        `}
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                        {count > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-surface-900/10 dark:bg-white/10 rounded-full text-xs font-semibold">
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
