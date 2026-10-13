import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Ban, LogOut, Clock, AlertCircle } from 'lucide-react';

export default function Banned() {
    const { isAuthenticated, isBanned, banInfo, signOut, isLoading } = useAuth();
    const navigate = useNavigate();

    // Redirect if not authenticated or not banned
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                navigate('/login', { replace: true });
            } else if (!isBanned) {
                navigate('/', { replace: true });
            }
        }
    }, [isAuthenticated, isBanned, isLoading, navigate]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    // Format expiration date
    const formatExpirationDate = (date: Date) => {
        return new Intl.DateTimeFormat('sv-SE', {
            dateStyle: 'full',
            timeStyle: 'short',
        }).format(date);
    };

    // Calculate time remaining
    const getTimeRemaining = (expiresAt: Date) => {
        const now = new Date();
        const diff = expiresAt.getTime() - now.getTime();

        if (diff <= 0) return 'Utgången';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days} ${days > 1 ? 'dagar' : 'dag'}, ${hours} ${hours > 1 ? 'timmar' : 'timme'}`;
        if (hours > 0) return `${hours} ${hours > 1 ? 'timmar' : 'timme'}, ${minutes} ${minutes > 1 ? 'minuter' : 'minut'}`;
        return `${minutes} ${minutes > 1 ? 'minuter' : 'minut'}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
                <p className="text-surface-500 dark:text-surface-400">Laddar...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
            <div className="max-w-md w-full">
                <div className="card p-8 animate-fade-in">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-error/10 dark:bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ban className="w-8 h-8 text-error-strong dark:text-error-soft" />
                        </div>
                        <h1 className="text-2xl text-surface-900 dark:text-surface-50">Kontot är avstängt</h1>
                        <p className="text-surface-600 dark:text-surface-300 mt-2 text-sm">Din åtkomst till communityt har begränsats</p>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {/* Reason */}
                        {banInfo?.reason && (
                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-surface-500 dark:text-surface-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-surface-700 dark:text-surface-200">Anledning</p>
                                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">{banInfo.reason}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Duration */}
                        <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-surface-500 dark:text-surface-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-surface-700 dark:text-surface-200">Varaktighet</p>
                                    {banInfo?.isPermanent ? (
                                        <p className="text-sm text-error-strong dark:text-error-soft mt-1 font-semibold">
                                            Den här avstängningen är permanent
                                        </p>
                                    ) : banInfo?.expiresAt ? (
                                        <div className="mt-1 space-y-1">
                                            <p className="text-sm text-surface-600 dark:text-surface-300">
                                                Upphör: {formatExpirationDate(banInfo.expiresAt)}
                                            </p>
                                            <p className="text-sm text-primary-600 dark:text-primary-300 font-semibold">
                                                Tid kvar: {getTimeRemaining(banInfo.expiresAt)}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* Help text */}
                        <p className="text-sm text-surface-500 dark:text-surface-400 text-center">
                            Om du tror att detta är ett misstag, kontakta supporten för hjälp.
                        </p>

                        {/* Sign out button */}
                        <button
                            onClick={handleSignOut}
                            className="btn-secondary w-full"
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
