import { useSubscription } from '@/hooks/useSubscription';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

interface SubscriptionBadgeProps {
    showDetails?: boolean;
    className?: string;
}

export default function SubscriptionBadge({ showDetails = false, className = '' }: SubscriptionBadgeProps) {
    const { subscription, isLoading, isActive, inGracePeriod } = useSubscription();

    if (isLoading) {
        return (
            <div className={`skeleton rounded-lg h-10 w-32 ${className}`} />
        );
    }

    // No subscription
    if (!subscription?.hasSubscription) {
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300 rounded-lg ${className}`}>
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ingen prenumeration</span>
            </div>
        );
    }

    // Active subscription
    if (isActive && !inGracePeriod) {
        const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
        return (
            <div className={`${showDetails ? 'p-4 rounded-xl border' : 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg'} bg-success/10 border-success/40 dark:bg-success/15 ${className}`}>
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-surface-900 dark:text-success" />
                    <span className="text-sm font-medium text-surface-900 dark:text-surface-50">Aktiv</span>
                </div>
                {showDetails && periodEnd && (
                    <div className="mt-2 space-y-1">
                        <p className="text-xs text-surface-600 dark:text-surface-300">
                            {subscription.cancelAtPeriodEnd
                                ? `Avslutas: ${periodEnd.toLocaleDateString('sv-SE')}`
                                : `Förnyas: ${periodEnd.toLocaleDateString('sv-SE')}`}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Grace period — access lasts until the paid period ends
    if (inGracePeriod) {
        const endsAt = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
        const daysRemaining = endsAt
            ? Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

        return (
            <div className={`${showDetails ? 'p-4 rounded-xl border' : 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg'} bg-warning/10 border-warning/50 dark:bg-warning/15 ${className}`}>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-surface-900 dark:text-warning" />
                    <span className="text-sm font-medium text-surface-900 dark:text-surface-50">Respitperiod</span>
                    {daysRemaining !== null && !showDetails && (
                        <span className="text-sm text-surface-600 dark:text-surface-300">
                            - {daysRemaining} dag{daysRemaining !== 1 ? 'ar' : ''} kvar
                        </span>
                    )}
                </div>
                {showDetails && (
                    <div className="mt-2 space-y-1">
                        <p className="text-sm text-surface-900 dark:text-surface-50">
                            Din prenumeration har avslutats men du har fortfarande åtkomst.
                        </p>
                        {endsAt && (
                            <p className="text-xs text-surface-600 dark:text-surface-300">
                                Åtkomsten upphör: {endsAt.toLocaleDateString('sv-SE')}
                                {daysRemaining !== null && ` (${daysRemaining} dag${daysRemaining !== 1 ? 'ar' : ''} kvar)`}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Expired or other status
    const statusConfig: Record<string, { bg: string; border: string; text: string; icon: typeof AlertCircle; label: string }> = {
        expired: {
            bg: 'bg-error/10 dark:bg-error/20',
            border: 'border-error/60',
            text: 'text-surface-900 dark:text-error-soft',
            icon: XCircle,
            label: 'Utgången',
        },
        cancelled: {
            bg: 'bg-surface-100 dark:bg-surface-800',
            border: 'border-surface-200 dark:border-surface-700',
            text: 'text-surface-600 dark:text-surface-300',
            icon: XCircle,
            label: 'Avslutad',
        },
        failed_payment: {
            bg: 'bg-error/10 dark:bg-error/20',
            border: 'border-error/60',
            text: 'text-surface-900 dark:text-error-soft',
            icon: AlertCircle,
            label: 'Betalning misslyckades',
        },
        refunded: {
            bg: 'bg-surface-100 dark:bg-surface-800',
            border: 'border-surface-200 dark:border-surface-700',
            text: 'text-surface-600 dark:text-surface-300',
            icon: XCircle,
            label: 'Återbetald',
        },
    };

    const config = statusConfig[subscription.status || ''] || statusConfig.expired;
    const Icon = config.icon;

    return (
        <div className={`${showDetails ? 'p-4 rounded-xl border' : 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg'} ${config.bg} ${config.border} ${className}`}>
            <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${config.text}`} />
                <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
            </div>
            {showDetails && (
                <div className="mt-2">
                    <p className={`text-sm ${config.text}`}>
                        Din prenumeration är inte längre aktiv. Förnya för att fortsätta få åtkomst till communityt.
                    </p>
                </div>
            )}
        </div>
    );
}
