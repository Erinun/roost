import { useState, useEffect, useCallback } from 'react';
import { stripeAdminService, StripeStats, WebhookLog } from '@/services/subscription';
import {
    RefreshCw,
    Users,
    CreditCard,
    AlertCircle,
    CheckCircle,
    XCircle,
    Trash2,
    ExternalLink,
} from 'lucide-react';

// Helper to format event type for display
function formatEventType(eventType: string): { label: string; color: string } {
    const map: Record<string, { label: string; color: string }> = {
        'checkout.session.completed': { label: 'Kassa', color: 'bg-success/15 text-surface-900 dark:bg-success/20 dark:text-success' },
        'customer.subscription.created': { label: 'Ny prenumeration', color: 'bg-success/15 text-surface-900 dark:bg-success/20 dark:text-success' },
        'customer.subscription.updated': { label: 'Uppdaterad', color: 'bg-info/15 text-surface-900 dark:bg-info/20 dark:text-info' },
        'customer.subscription.deleted': { label: 'Uppsagd', color: 'bg-warning/20 text-surface-900 dark:bg-warning/20 dark:text-warning' },
        'invoice.payment_succeeded': { label: 'Betalning OK', color: 'bg-success/15 text-surface-900 dark:bg-success/20 dark:text-success' },
        'invoice.payment_failed': { label: 'Betalning misslyckades', color: 'bg-error/15 text-surface-900 dark:bg-error/20 dark:text-error-soft' },
    };

    return map[eventType] || { label: eventType, color: 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300' };
}

// Webhook log item component
function WebhookLogItem({ webhook }: { webhook: WebhookLog }) {
    const { label, color } = formatEventType(webhook.event_type);

    return (
        <div
            className={`p-4 rounded-lg border ${
                webhook.processed
                    ? 'bg-success/10 dark:bg-success/15 border-success/40'
                    : 'bg-error/10 dark:bg-error/20 border-error/60'
            }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    {webhook.processed ? (
                        <CheckCircle className="w-5 h-5 text-surface-900 dark:text-success flex-shrink-0 mt-0.5" />
                    ) : (
                        <XCircle className="w-5 h-5 text-error-strong dark:text-error-soft flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                                {label}
                            </span>
                            {webhook.email && (
                                <span className="text-sm text-surface-600 dark:text-surface-400 truncate">
                                    {webhook.email}
                                </span>
                            )}
                        </div>
                        {webhook.error_message && (
                            <p className="text-xs text-error-strong dark:text-error-soft mt-1 truncate">
                                {webhook.error_message}
                            </p>
                        )}
                        {webhook.stripe_event_id && (
                            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1 font-mono truncate">
                                {webhook.stripe_event_id}
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">
                    {new Date(webhook.created_at).toLocaleString('sv-SE')}
                </div>
            </div>
        </div>
    );
}

export default function AdminSubscriptions() {
    const [stats, setStats] = useState<StripeStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCleaningUp, setIsCleaningUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setError(null);
            const data = await stripeAdminService.getStats();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Det gick inte att hämta statistik');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchStats();
    };

    const handleCleanup = async () => {
        if (!confirm('Detta avslutar uppsagda prenumerationer vars period har löpt ut och nedgraderar berörda användare. Vill du fortsätta?')) {
            return;
        }

        setIsCleaningUp(true);
        setCleanupMessage(null);
        try {
            const result = await stripeAdminService.runCleanup();
            setCleanupMessage(result.message);
            await fetchStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Rensningen misslyckades');
        } finally {
            setIsCleaningUp(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Prenumerationer</h1>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                        Hantera Stripe-prenumerationsbetalningar och se webhook-aktivitet
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href="https://dashboard.stripe.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Stripe Dashboard
                    </a>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Uppdatera
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-error/10 dark:bg-error/20 border border-error/60 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-error-strong dark:text-error-soft flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-surface-900 dark:text-error-soft">{error}</p>
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary-600 dark:text-primary-300" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.customers}</p>
                                <p className="text-xs text-surface-500 dark:text-surface-400">Kunder</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-success/15 dark:bg-success/20 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-surface-900 dark:text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.subscriptions.active}</p>
                                <p className="text-xs text-surface-500 dark:text-surface-400">Aktiva</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-warning/20 dark:bg-warning/20 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-surface-900 dark:text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.subscriptions.cancelled}</p>
                                <p className="text-xs text-surface-500 dark:text-surface-400">Uppsagda</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-purple rounded-lg flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.webhooks.total}</p>
                                <p className="text-xs text-surface-500 dark:text-surface-400">Webhooks ({stats.webhooks.failed} misslyckade)</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="card p-4">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">Åtgärder</h2>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleCleanup}
                        disabled={isCleaningUp}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-warning/20 dark:bg-warning/20 hover:bg-warning/30 dark:hover:bg-warning/30 text-surface-900 dark:text-warning rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Trash2 className={`w-4 h-4 ${isCleaningUp ? 'animate-spin' : ''}`} />
                        {isCleaningUp ? 'Kör...' : 'Rensa utgångna'}
                    </button>
                </div>
                {cleanupMessage && (
                    <p className="text-sm text-surface-900 dark:text-success mt-2">{cleanupMessage}</p>
                )}
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
                    Produkter och priser hanteras i{' '}
                    <a
                        href="https://dashboard.stripe.com/products"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-300 underline"
                    >
                        Stripe Dashboard
                    </a>.
                </p>
            </div>

            {/* Recent Webhooks */}
            {stats && stats.webhooks.recent.length > 0 && (
                <div className="card p-4">
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">Senaste webhooks</h2>
                    <div className="space-y-3">
                        {stats.webhooks.recent.map((webhook) => (
                            <WebhookLogItem key={webhook.id} webhook={webhook} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
