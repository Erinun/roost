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
            <div className={`animate-pulse bg-surface-200 rounded-lg h-10 w-32 ${className}`} />
        );
    }

    // No subscription
    if (!subscription?.hasSubscription) {
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-surface-100 text-surface-600 rounded-lg ${className}`}>
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ingen prenumeration</span>
            </div>
        );
    }

    // Active subscription
    if (isActive && !inGracePeriod) {
        return (
            <div className={`${showDetails ? 'p-4 rounded-xl border' : 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg'} bg-green-50 border-green-200 ${className}`}>
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Aktiv</span>
                    {subscription.productName && !showDetails && (
                        <span className="text-sm text-green-600">- {subscription.variantName || subscription.productName}</span>
                    )}
                </div>
                {showDetails && subscription.productName && (
                    <div className="mt-2 space-y-1">
                        <p className="text-sm text-green-700">
                            <strong>{subscription.productName}</strong>
                            {subscription.variantName && ` (${subscription.variantName})`}
                        </p>
                        {subscription.billingCycle && (
                            <p className="text-xs text-green-600 capitalize">
                                Fakturering: {subscription.billingCycle}
                            </p>
                        )}
                        {subscription.startedAt && (
                            <p className="text-xs text-green-600">
                                Medlem sedan: {new Date(subscription.startedAt).toLocaleDateString('sv-SE')}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Grace period
    if (inGracePeriod) {
        const endsAt = subscription.endsAt ? new Date(subscription.endsAt) : null;
        const daysRemaining = endsAt
            ? Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

        return (
            <div className={`${showDetails ? 'p-4 rounded-xl border' : 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg'} bg-amber-50 border-amber-200 ${className}`}>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">Respitperiod</span>
                    {daysRemaining !== null && !showDetails && (
                        <span className="text-sm text-amber-600">
                            - {daysRemaining} dag{daysRemaining !== 1 ? 'ar' : ''} kvar
                        </span>
                    )}
                </div>
                {showDetails && (
                    <div className="mt-2 space-y-1">
                        <p className="text-sm text-amber-700">
                            Din prenumeration har avslutats men du har fortfarande åtkomst.
                        </p>
                        {endsAt && (
                            <p className="text-xs text-amber-600">
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
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-700',
            icon: XCircle,
            label: 'Utgången',
        },
        cancelled: {
            bg: 'bg-surface-100',
            border: 'border-surface-200',
            text: 'text-surface-600',
            icon: XCircle,
            label: 'Avslutad',
        },
        failed_payment: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-700',
            icon: AlertCircle,
            label: 'Betalning misslyckades',
        },
        refunded: {
            bg: 'bg-surface-100',
            border: 'border-surface-200',
            text: 'text-surface-600',
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
