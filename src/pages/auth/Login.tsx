import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { APP_CONFIG } from '@/config/app';
import { Mail, Loader2, Eye, EyeOff, Shield, Key, CheckCircle, RefreshCw } from 'lucide-react';

type LoginStep = 'credentials' | '2fa' | 'email-not-confirmed';

export default function Login() {
    const navigate = useNavigate();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [useBackupCode, setUseBackupCode] = useState(false);
    const [backupCode, setBackupCode] = useState('');

    // UI state
    const [step, setStep] = useState<LoginStep>('credentials');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [unconfirmedEmail, setUnconfirmedEmail] = useState<string>('');

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const apiUrl = APP_CONFIG.apiUrl;
            const response = await fetch(`${apiUrl}/api/2fa/check-required`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Check if email is not confirmed
                if (data.code === 'EMAIL_NOT_CONFIRMED') {
                    setUnconfirmedEmail(data.email || email);
                    setStep('email-not-confirmed');
                    return;
                }
                throw new Error(data.error || 'Fel e-postadress eller lösenord');
            }

            if (data.requires2FA) {
                // User has 2FA enabled, show 2FA step
                setStep('2fa');
            } else {
                // No 2FA, set the session and navigate
                if (data.session) {
                    await supabase.auth.setSession({
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token,
                    });
                    navigate('/');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Det gick inte att logga in');
        } finally {
            setIsLoading(false);
        }
    };

    const handle2FASubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const apiUrl = APP_CONFIG.apiUrl;
            const endpoint = useBackupCode ? '/api/2fa/verify-login-backup' : '/api/2fa/verify-login';
            const code = useBackupCode ? backupCode : twoFactorCode;

            const response = await fetch(`${apiUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ogiltig verifieringskod');
            }

            // Set the session and navigate
            if (data.session) {
                await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                });
                navigate('/');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Det gick inte att verifiera koden');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToCredentials = () => {
        setStep('credentials');
        setTwoFactorCode('');
        setBackupCode('');
        setUseBackupCode(false);
        setError(null);
        setResendStatus('idle');
    };

    const handleResendConfirmation = async () => {
        if (!unconfirmedEmail) return;

        setResendStatus('sending');
        setError(null);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: unconfirmedEmail,
            });

            if (error) {
                throw error;
            }

            setResendStatus('sent');
        } catch (err) {
            console.error('Error resending confirmation email:', err);
            setResendStatus('error');
            setError(err instanceof Error ? err.message : 'Det gick inte att skicka bekräftelsemejlet igen');
        }
    };

    // Tab toggle component
    const TabToggle = ({ active }: { active: 'login' | 'signup' }) => (
        <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 mb-8">
            <Link
                to="/login"
                className={`flex-1 flex items-center justify-center min-h-11 text-center text-sm font-semibold rounded-lg transition-all duration-200 ${
                    active === 'login'
                        ? 'bg-white dark:bg-surface-700 text-primary-700 dark:text-surface-50 border border-surface-200 dark:border-surface-600'
                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                }`}
            >
                Logga in
            </Link>
            <Link
                to="/signup"
                className={`flex-1 flex items-center justify-center min-h-11 text-center text-sm font-semibold rounded-lg transition-all duration-200 ${
                    active === 'signup'
                        ? 'bg-white dark:bg-surface-700 text-primary-700 dark:text-surface-50 border border-surface-200 dark:border-surface-600'
                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                }`}
            >
                Skapa konto
            </Link>
        </div>
    );

    // Email not confirmed step
    if (step === 'email-not-confirmed') {
        return (
            <div className="animate-fade-in">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-surface-900" />
                    </div>
                    <h1 className="text-2xl text-surface-900 dark:text-surface-50">
                        E-postadressen är inte bekräftad
                    </h1>
                    <p className="text-surface-600 dark:text-surface-300 mt-2 text-sm">
                        Bekräfta din e-postadress för att fortsätta
                    </p>
                </div>

                {/* Email display */}
                <div className="bg-surface-100 dark:bg-surface-800 rounded-lg px-4 py-3 mb-6 text-center">
                    <p className="font-bold text-surface-900 dark:text-surface-50 text-sm">
                        {unconfirmedEmail}
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-surface-50 dark:bg-surface-800/50 rounded-lg p-4 mb-6 border border-surface-200 dark:border-surface-700">
                    <p className="text-sm text-surface-600 dark:text-surface-300 mb-3">
                        Vi har skickat en bekräftelselänk till din e-post. Gör så här:
                    </p>
                    <ol className="text-sm text-surface-600 dark:text-surface-300 space-y-2 list-decimal list-inside">
                        <li>Kolla din inkorg (och skräpposten)</li>
                        <li>Klicka på bekräftelselänken</li>
                        <li>Kom tillbaka hit och försök logga in igen</li>
                    </ol>
                </div>

                {/* Resend status messages */}
                {resendStatus === 'sent' && (
                    <div className="flex items-center justify-center gap-2 bg-success/15 dark:bg-success/20 text-surface-900 dark:text-success rounded-lg p-3 mb-4">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-semibold">Bekräftelsemejl skickat!</span>
                    </div>
                )}

                {error && resendStatus === 'error' && (
                    <div className="alert-error mb-4">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleResendConfirmation}
                        disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                        className="btn-primary w-full"
                    >
                        {resendStatus === 'sending' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
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
                        onClick={handleBackToCredentials}
                        className="btn-secondary w-full"
                    >
                        Tillbaka till inloggning
                    </button>
                </div>

                {/* Help text */}
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-6 text-center">
                    Fick du inget mejl? Kolla din skräppost eller försök skicka igen.
                </p>
            </div>
        );
    }

    // Credentials step
    if (step === 'credentials') {
        return (
            <div className="animate-fade-in">
                {/* Tab Toggle */}
                <TabToggle active="login" />

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl text-surface-900 dark:text-surface-50">Välkommen tillbaka</h1>
                    <p className="text-surface-600 dark:text-surface-300 mt-1 text-sm">Logga in på ditt konto för att fortsätta</p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="alert-error mb-6">
                        {error}
                    </div>
                )}

                {/* Login form */}
                <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                    {/* Email field */}
                    <div>
                        <label htmlFor="email" className="label">
                            E-post
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="du@exempel.se"
                            required
                            className="input w-full"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password field */}
                    <div>
                        <label htmlFor="password" className="label">
                            Lösenord
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ange ditt lösenord"
                                required
                                className="input w-full pr-10"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Forgot password link */}
                    <div className="flex justify-end">
                        <Link
                            to="/forgot-password"
                            className="link text-sm"
                        >
                            Glömt lösenordet?
                        </Link>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Loggar in...</span>
                            </>
                        ) : (
                            <span>Logga in</span>
                        )}
                    </button>
                </form>
            </div>
        );
    }

    // 2FA step
    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary-600 dark:text-primary-300" />
                </div>
                <h1 className="text-2xl text-surface-900 dark:text-surface-50">
                    Tvåfaktorsautentisering
                </h1>
                <p className="text-surface-600 dark:text-surface-300 mt-2 text-sm">
                    {useBackupCode
                        ? 'Ange en av dina reservkoder'
                        : 'Ange den 6-siffriga koden från din autentiseringsapp'
                    }
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 p-3 bg-error/10 dark:bg-error/20 border border-error/60 text-surface-900 dark:text-error-soft rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* 2FA form */}
            <form onSubmit={handle2FASubmit} className="space-y-5">
                {useBackupCode ? (
                    <div>
                        <label htmlFor="backupCode" className="label">
                            Reservkod
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 dark:text-surface-400" />
                            <input
                                id="backupCode"
                                type="text"
                                value={backupCode}
                                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                                placeholder="XXXX-XXXX"
                                required
                                className="input w-full pl-10 font-mono tracking-wider"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="twoFactorCode" className="label">
                            Verifieringskod
                        </label>
                        <input
                            id="twoFactorCode"
                            type="text"
                            value={twoFactorCode}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setTwoFactorCode(value);
                            }}
                            placeholder="000000"
                            required
                            maxLength={6}
                            className="input w-full text-center text-2xl tracking-widest font-mono"
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isLoading || (useBackupCode ? !backupCode : twoFactorCode.length !== 6)}
                    className="btn-primary w-full"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifierar...</span>
                        </>
                    ) : (
                        <span>Verifiera och logga in</span>
                    )}
                </button>
            </form>

            {/* Toggle backup code / authenticator */}
            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={() => {
                        setUseBackupCode(!useBackupCode);
                        setError(null);
                        setTwoFactorCode('');
                        setBackupCode('');
                    }}
                    className="link text-sm"
                >
                    {useBackupCode
                        ? 'Använd autentiseringsapp istället'
                        : 'Använd en reservkod istället'
                    }
                </button>
            </div>

            {/* Back to login */}
            <div className="mt-6 text-center">
                <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="text-sm font-semibold text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-50 transition-colors"
                >
                    &larr; Tillbaka till inloggning
                </button>
            </div>
        </div>
    );
}
