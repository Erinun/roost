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
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4 py-8">
            <div className="max-w-md w-full">
                <div className="card p-8 animate-fade-in">
                    {/* Header – premiumgult med mörk ikon */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-8 h-8 text-surface-900" />
                        </div>
                        <h1 className="text-2xl text-surface-900 dark:text-surface-50">Prenumeration krävs</h1>
                        <p className="text-surface-600 dark:text-surface-300 mt-2 text-sm">Åtkomst till communityt kräver en aktiv prenumeration</p>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {/* Grace Period Notice */}
                        {subscription?.inGracePeriod && subscription.currentPeriodEnd && (
                            <div className="alert-warning">
                                <Clock className="w-5 h-5 text-surface-700 dark:text-warning mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">Respitperiod aktiv</p>
                                    <p className="text-sm mt-1">
                                        Din prenumeration har avslutats, men du har fortfarande åtkomst fram till{' '}
                                        <strong>{formatDate(subscription.currentPeriodEnd)}</strong>.
                                    </p>
                                    <p className="text-sm mt-1 font-semibold">
                                        {getTimeRemaining(subscription.currentPeriodEnd)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* No Subscription Notice */}
                        {!subscription?.hasSubscription && (
                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-surface-500 dark:text-surface-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-surface-700 dark:text-surface-200">Ingen aktiv prenumeration</p>
                                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
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
                                    <AlertCircle className="w-5 h-5 text-error-strong dark:text-error-soft mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-surface-700 dark:text-surface-200">Prenumerationen har gått ut</p>
                                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                                            Din prenumeration har gått ut. Förnya för att fortsätta ha åtkomst till communityt.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Failed Payment */}
                        {subscription?.status === 'failed_payment' && (
                            <div className="alert-error">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">Betalningen misslyckades</p>
                                    <p className="text-sm mt-1">
                                        Det uppstod ett problem när din betalning behandlades. Uppdatera din betalningsmetod.
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="alert-error">
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {/* Purchase/Renew Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={isCheckoutLoading}
                                className="btn-primary w-full"
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
                                    className="btn-secondary w-full"
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
                                className="btn-secondary w-full"
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
                            className="btn-ghost w-full"
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
