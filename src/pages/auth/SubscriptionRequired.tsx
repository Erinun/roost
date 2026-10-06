import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService, SubscriptionStatus } from '@/services/subscription';
import { CreditCard, LogOut, Clock, AlertCircle, RefreshCw, Loader2, Settings } from 'lucide-react';

export default function SubscriptionRequired() {
    const { isAuthenticated, signOut, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch subscription status
    const fetchSubscription = async () => {
        try {
            const status = await subscriptionService.getStatus();
            setSubscription(status);

            // If subscription is now active, redirect to home
            if (status.isActive) {
                navigate('/', { replace: true });
            }
        } catch (err) {
            console.error('Error fetching subscription:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                navigate('/login', { replace: true });
            } else {
                fetchSubscription();
            }
        }
    }, [isAuthenticated, authLoading, navigate]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchSubscription();
    };

    const handleCheckout = async () => {
        setIsCheckoutLoading(true);
        setError(null);
        try {
            const url = await subscriptionService.createCheckoutSession();
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Det gick inte att starta betalningen');
            setIsCheckoutLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setIsPortalLoading(true);
        setError(null);
        try {
            const url = await subscriptionService.createPortalSession();
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Det gick inte att öppna prenumerationshanteringen');
            setIsPortalLoading(false);
        }
    };

    // Format date nicely
    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('sv-SE', {
            dateStyle: 'long',
        }).format(new Date(dateString));
    };

    // Calculate time remaining for grace period
    const getTimeRemaining = (endsAt: string) => {
        const now = new Date();
        const end = new Date(endsAt);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) return 'Utgången';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days} ${days > 1 ? 'dagar' : 'dag'} kvar`;
        if (hours > 0) return `${hours} ${hours > 1 ? 'timmar' : 'timme'} kvar`;
        return 'Mindre än en timme kvar';
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
                <p className="text-surface-500 dark:text-surface-400">Laddar...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
                            <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Prenumeration krävs</h1>
                        <p className="text-primary-100 mt-2">Åtkomst till communityt kräver en aktiv prenumeration</p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Grace Period Notice */}
                        {subscription?.inGracePeriod && subscription.currentPeriodEnd && (
                            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Respitperiod aktiv</p>
                                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                            Din prenumeration har avslutats, men du har fortfarande åtkomst fram till{' '}
                                            <strong>{formatDate(subscription.currentPeriodEnd)}</strong>.
                                        </p>
                                        <p className="text-sm text-amber-600 dark:text-amber-500 mt-1 font-medium">
                                            {getTimeRemaining(subscription.currentPeriodEnd)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Subscription Notice */}
                        {!subscription?.hasSubscription && (
                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-surface-400 dark:text-surface-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Ingen aktiv prenumeration</p>
                                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                            Du har ingen aktiv prenumeration. Köp ett medlemskap för att få åtkomst till communityt.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Expired Subscription */}
                        {subscription?.status === 'expired' && (
                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Prenumerationen har gått ut</p>
                                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                            Din prenumeration har gått ut. Förnya för att fortsätta ha åtkomst till communityt.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Failed Payment */}
                        {subscription?.status === 'failed_payment' && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800 dark:text-red-300">Betalningen misslyckades</p>
                                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                            Det uppstod ett problem när din betalning behandlades. Uppdatera din betalningsmetod.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {/* Purchase/Renew Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={isCheckoutLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isCheckoutLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Omdirigerar...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4" />
                                        {subscription?.hasSubscription ? 'Förnya prenumeration' : 'Skaffa medlemskap'}
                                    </>
                                )}
                            </button>

                            {/* Manage Subscription (for existing customers) */}
                            {subscription?.hasSubscription && (
                                <button
                                    onClick={handleManageSubscription}
                                    disabled={isPortalLoading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {isPortalLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Öppnar...
                                        </>
                                    ) : (
                                        <>
                                            <Settings className="w-4 h-4" />
                                            Hantera prenumeration
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Refresh Status */}
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? 'Kontrollerar...' : 'Kontrollera prenumerationsstatus'}
                            </button>
                        </div>

                        {/* Help text */}
                        <p className="text-sm text-surface-500 dark:text-surface-400 text-center">
                            Har du redan köpt? Klicka på "Kontrollera prenumerationsstatus" för att uppdatera.
                            Om du fortfarande har problem, kontakta supporten.
                        </p>

                        {/* Divider */}
                        <div className="border-t border-surface-200 dark:border-surface-700" />

                        {/* Sign out button */}
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg font-medium transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logga ut
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
