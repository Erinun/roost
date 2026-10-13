import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';

const API_URL = APP_CONFIG.apiUrl;

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

    // Password requirements
    const passwordRequirements = [
        { label: 'Minst 8 tecken', test: (p: string) => p.length >= 8 },
        { label: 'Innehåller en siffra', test: (p: string) => /\d/.test(p) },
        { label: 'Innehåller en bokstav', test: (p: string) => /[a-zA-Z]/.test(p) },
    ];

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsValidToken(false);
                setIsValidating(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/auth/validate-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();
                setIsValidToken(data.valid === true);
            } catch (err) {
                console.error('Error validating token:', err);
                setIsValidToken(false);
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Lösenorden matchar inte');
            return;
        }

        // Validate password requirements
        const allRequirementsMet = passwordRequirements.every((req) =>
            req.test(password)
        );
        if (!allRequirementsMet) {
            setError('Lösenordet uppfyller inte alla krav');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Det gick inte att återställa lösenordet');
            }

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Det gick inte att återställa lösenordet');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state while validating token
    if (isValidating) {
        return (
            <div className="card p-8 animate-fade-in text-center max-w-md w-full mx-auto">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-300 mx-auto mb-4" />
                <p className="text-surface-600 dark:text-surface-300">Verifierar återställningslänken...</p>
            </div>
        );
    }

    // Invalid or expired token
    if (isValidToken === false) {
        return (
            <div className="card p-8 animate-fade-in text-center max-w-md w-full mx-auto">
                <div className="w-16 h-16 bg-error/10 dark:bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-error-strong dark:text-error-soft" />
                </div>
                <h1 className="text-2xl text-surface-900 dark:text-surface-50 mb-2">Ogiltig eller utgången länk</h1>
                <p className="text-surface-600 dark:text-surface-300 text-sm mb-6">
                    Den här återställningslänken är ogiltig eller har gått ut. Begär en ny.
                </p>
                <Link to="/forgot-password" className="btn-primary w-full">
                    Begär ny länk
                </Link>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="card p-8 animate-fade-in text-center max-w-md w-full mx-auto">
                <div className="w-16 h-16 bg-success/15 dark:bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-surface-900 dark:text-success" />
                </div>
                <h1 className="text-2xl text-surface-900 dark:text-surface-50 mb-2">Lösenordet är återställt!</h1>
                <p className="text-surface-600 dark:text-surface-300 text-sm mb-6">
                    Ditt lösenord har återställts. Du skickas vidare till inloggningssidan...
                </p>
                <Link to="/login" className="btn-primary w-full">
                    Gå till inloggning
                </Link>
            </div>
        );
    }

    return (
        <div className="card p-8 animate-fade-in max-w-md w-full mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-primary-600 dark:text-primary-300" />
                </div>
                <h1 className="text-2xl text-surface-900 dark:text-surface-50">Återställ lösenord</h1>
                <p className="text-surface-600 dark:text-surface-300 mt-2 text-sm">Ange ditt nya lösenord nedan</p>
            </div>

            {/* Error message */}
            {error && (
                <div className="alert-error mb-6">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Reset form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password field */}
                <div>
                    <label htmlFor="password" className="label">
                        Nytt lösenord
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 dark:text-surface-400" />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ange nytt lösenord"
                            required
                            className="input pl-10 pr-10"
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

                    {/* Password requirements */}
                    <div className="mt-2 space-y-1">
                        {passwordRequirements.map((req, index) => {
                            const isMet = req.test(password);
                            return (
                                <div
                                    key={index}
                                    className={`flex items-center gap-2 text-xs ${isMet ? 'text-surface-700 dark:text-surface-200' : 'text-surface-500 dark:text-surface-400'
                                        }`}
                                >
                                    <div
                                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isMet ? 'bg-success border-success' : 'border-surface-300 dark:border-surface-600'
                                            }`}
                                    >
                                        {isMet && <Check className="w-2.5 h-2.5 text-surface-900" />}
                                    </div>
                                    <span>{req.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Confirm Password field */}
                <div>
                    <label htmlFor="confirmPassword" className="label">
                        Bekräfta nytt lösenord
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 dark:text-surface-400" />
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Bekräfta nytt lösenord"
                            required
                            className="input pl-10"
                            disabled={isLoading}
                        />
                    </div>
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
                            <span>Återställer...</span>
                        </>
                    ) : (
                        <span>Återställ lösenord</span>
                    )}
                </button>
            </form>
        </div>
    );
}
