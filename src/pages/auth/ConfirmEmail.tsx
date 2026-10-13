import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { APP_CONFIG } from '@/config/app';

export default function ConfirmEmail() {
    const { user, isEmailConfirmed, signOut, isLoading } = useAuth();
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // If not logged in, redirect to login
    if (!isLoading && !user) {
        return <Navigate to="/login" replace />;
    }

    // If email is confirmed, redirect to home
    if (!isLoading && isEmailConfirmed) {
        return <Navigate to="/" replace />;
    }

    const handleResendEmail = async () => {
        if (!user?.email) return;

        setResendStatus('sending');
        setErrorMessage('');

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
            });

            if (error) {
                throw error;
            }

            setResendStatus('sent');
        } catch (error) {
            console.error('Error resending confirmation email:', error);
            setResendStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Det gick inte att skicka e-postmeddelandet igen');
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
            <div className="max-w-md w-full">
                <div className="card p-8 text-center animate-fade-in">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-surface-900" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl text-surface-900 dark:text-surface-50 mb-2">
                        Bekräfta din e-post
                    </h1>

                    {/* Description */}
                    <p className="text-surface-600 dark:text-surface-300 text-sm mb-6">
                        Vi har skickat en bekräftelselänk till:
                    </p>

                    {/* Email display */}
                    <div className="bg-surface-100 dark:bg-surface-800 rounded-lg px-4 py-3 mb-6">
                        <p className="font-bold text-surface-900 dark:text-surface-50 text-sm break-all">
                            {user?.email}
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="text-left bg-surface-50 dark:bg-surface-800/50 rounded-lg p-4 mb-6 border border-surface-200 dark:border-surface-700">
                        <p className="text-sm text-surface-600 dark:text-surface-300 mb-3">
                            Kolla din inkorg och:
                        </p>
                        <ol className="text-sm text-surface-600 dark:text-surface-300 space-y-2 list-decimal list-inside">
                            <li>Öppna e-postmeddelandet från {APP_CONFIG.name}</li>
                            <li>Klicka på bekräftelselänken</li>
                            <li>Kom tillbaka hit och ladda om sidan</li>
                        </ol>
                    </div>

                    {/* Resend status messages */}
                    {resendStatus === 'sent' && (
                        <div className="flex items-center justify-center gap-2 bg-success/15 dark:bg-success/20 text-surface-900 dark:text-success rounded-lg p-3 mb-4">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-semibold">Bekräftelsemejl skickat!</span>
                        </div>
                    )}

                    {resendStatus === 'error' && (
                        <div className="alert-error mb-4 text-left">
                            {errorMessage || 'Det gick inte att skicka e-postmeddelandet igen. Försök igen.'}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleResendEmail}
                            disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                            className="btn-primary w-full"
                        >
                            {resendStatus === 'sending' ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Skickar...
                                </>
                            ) : resendStatus === 'sent' ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    E-post skickad
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Skicka bekräftelsemejl igen
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="btn-secondary w-full"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Jag har bekräftat – ladda om
                        </button>

                        <button
                            onClick={handleSignOut}
                            className="btn-ghost w-full"
                        >
                            <LogOut className="w-4 h-4" />
                            Logga ut
                        </button>
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-6">
                        Fick du inget mejl? Kolla din skräppost eller försök skicka igen.
                    </p>
                </div>
            </div>
        </div>
    );
}
