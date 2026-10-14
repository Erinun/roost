import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, Loader2, XCircle, AlertCircle, MailX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { isUsernameAvailable, isValidUsername } from '@/services/profile';
import { APP_CONFIG } from '@/config/app';

// Password strength calculation (same scale as Signup)
interface PasswordStrength {
    score: number; // 0-4
    label: string;
    color: string;
    bgColor: string;
}

function calculatePasswordStrength(password: string): PasswordStrength {
    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    score = Math.min(score, 4);

    const strengths: PasswordStrength[] = [
        { score: 0, label: 'För svagt', color: 'text-error-strong dark:text-error-soft', bgColor: 'bg-error' },
        { score: 1, label: 'Svagt', color: 'text-error-strong dark:text-error-soft', bgColor: 'bg-warning' },
        { score: 2, label: 'Okej', color: 'text-surface-600 dark:text-surface-300', bgColor: 'bg-brand-yellow' },
        { score: 3, label: 'Bra', color: 'text-surface-700 dark:text-surface-200', bgColor: 'bg-success' },
        { score: 4, label: 'Starkt', color: 'text-surface-900 dark:text-success', bgColor: 'bg-success' },
    ];

    return strengths[score];
}

// Placeholder values created by the handle_new_user trigger for invited users
const PLACEHOLDER_USERNAME = /^user_[0-9a-f]{8}$/;
const PLACEHOLDER_DISPLAY_NAME = 'New User';

export default function AcceptInvite() {
    const navigate = useNavigate();
    const { user, profile, isLoading, updateProfile } = useAuth();

    // Capture URL hash errors (e.g. expired invite link) before Supabase cleans the hash
    const [linkExpired] = useState(() => {
        const hash = window.location.hash;
        return hash.includes('error_code=otp_expired') || hash.includes('error=access_denied');
    });

    const [formData, setFormData] = useState({
        displayName: '',
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prefilled, setPrefilled] = useState(false);

    // Username validation state
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
    const [usernameError, setUsernameError] = useState<string | null>(null);

    // Password strength
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

    // Prefill from profile if the user already customized it (harmless re-visits)
    useEffect(() => {
        if (!profile || prefilled) return;
        setFormData(prev => ({
            ...prev,
            username: PLACEHOLDER_USERNAME.test(profile.username) ? '' : profile.username,
            displayName: profile.display_name === PLACEHOLDER_DISPLAY_NAME ? '' : profile.display_name,
        }));
        setPrefilled(true);
    }, [profile, prefilled]);

    // Check username availability with debounce
    useEffect(() => {
        const username = formData.username.trim().toLowerCase();

        if (!username) {
            setUsernameStatus('idle');
            setUsernameError(null);
            return;
        }

        if (username.length < 3) {
            setUsernameStatus('invalid');
            setUsernameError('Användarnamnet måste vara minst 3 tecken');
            return;
        }

        if (!isValidUsername(username)) {
            setUsernameStatus('invalid');
            setUsernameError('Endast bokstäver, siffror, understreck och bindestreck tillåts');
            return;
        }

        // The user's own current username is always "available" to keep
        if (profile && username === profile.username) {
            setUsernameStatus('available');
            setUsernameError(null);
            return;
        }

        setUsernameStatus('checking');
        setUsernameError(null);

        const timeoutId = setTimeout(async () => {
            try {
                const available = await isUsernameAvailable(username);
                setUsernameStatus(available ? 'available' : 'taken');
                setUsernameError(available ? null : 'Användarnamnet är redan upptaget');
            } catch {
                setUsernameStatus('idle');
                setUsernameError(null);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [formData.username, profile]);

    useEffect(() => {
        if (formData.password) {
            setPasswordStrength(calculatePasswordStrength(formData.password));
        } else {
            setPasswordStrength(null);
        }
    }, [formData.password]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const validateForm = (): string | null => {
        if (!formData.displayName || !formData.username || !formData.password) {
            return 'Alla fält är obligatoriska';
        }
        if (formData.password.length < 6) {
            return 'Lösenordet måste vara minst 6 tecken';
        }
        if (formData.password !== formData.confirmPassword) {
            return 'Lösenorden matchar inte';
        }
        if (usernameStatus === 'taken') {
            return 'Användarnamnet är redan upptaget';
        }
        if (usernameStatus === 'invalid') {
            return usernameError || 'Ogiltigt användarnamn';
        }
        return null;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { error: passwordError } = await supabase.auth.updateUser({
                password: formData.password,
            });
            if (passwordError) {
                throw new Error(passwordError.message || 'Det gick inte att spara lösenordet');
            }

            await updateProfile({
                username: formData.username.trim().toLowerCase(),
                display_name: formData.displayName.trim(),
            });

            navigate('/');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Det gick inte att slutföra kontot';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Username status indicator
    const renderUsernameStatus = () => {
        if (usernameStatus === 'idle' || !formData.username) return null;

        if (usernameStatus === 'checking') {
            return (
                <div className="flex items-center gap-1 mt-1 text-surface-500 dark:text-surface-400 text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Kontrollerar...</span>
                </div>
            );
        }

        if (usernameStatus === 'available') {
            return (
                <div className="mt-1.5">
                    <span className="badge-success">
                        <CheckCircle className="w-3 h-3" />
                        Tillgängligt
                    </span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-1 mt-1 text-error-strong dark:text-error-soft text-xs">
                <XCircle className="w-3 h-3" />
                <span>{usernameError}</span>
            </div>
        );
    };

    // Password strength indicator
    const renderPasswordStrength = () => {
        if (!passwordStrength || !formData.password) return null;

        return (
            <div className="mt-1.5">
                <div className="flex gap-0.5 mb-0.5">
                    {[0, 1, 2, 3].map((index) => (
                        <div
                            key={index}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                                index < passwordStrength.score
                                    ? passwordStrength.bgColor
                                    : 'bg-surface-200 dark:bg-surface-700'
                            }`}
                        />
                    ))}
                </div>
                <div className={`flex items-center gap-1 text-xs ${passwordStrength.color}`}>
                    {passwordStrength.score < 2 ? (
                        <AlertCircle className="w-3 h-3" />
                    ) : (
                        <CheckCircle className="w-3 h-3" />
                    )}
                    <span>{passwordStrength.label}</span>
                </div>
            </div>
        );
    };

    // Waiting for the invite session to be established from the URL hash
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    // No session: the link is invalid, already used, or expired
    if (!user || linkExpired) {
        return (
            <div className="animate-fade-in text-center">
                <div className="w-16 h-16 bg-error/15 dark:bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MailX className="w-8 h-8 text-error-strong dark:text-error-soft" />
                </div>
                <h1 className="text-2xl text-surface-900 dark:text-surface-50 mb-2">
                    Ogiltig inbjudan
                </h1>
                <p className="text-surface-600 dark:text-surface-300 text-sm mb-6">
                    Inbjudningslänken är ogiltig eller har gått ut.
                    Be administratören skicka en ny inbjudan.
                </p>
                <Link to="/login" className="link text-sm">
                    Tillbaka till inloggning
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl text-surface-900 dark:text-surface-50">Välkommen! Slutför ditt konto</h1>
                <p className="text-surface-600 dark:text-surface-300 mt-1 text-sm">
                    Du har blivit inbjuden till {APP_CONFIG.name}. Välj ett användarnamn
                    och lösenord för att komma igång.
                </p>
            </div>

            {error && (
                <div className="alert-error mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Display Name */}
                <div>
                    <label htmlFor="displayName" className="label">
                        Fullständigt namn
                    </label>
                    <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="Ditt fullständiga namn"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                {/* Username */}
                <div>
                    <label htmlFor="username" className="label">
                        Användarnamn
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`w-full ${
                            usernameStatus === 'taken' || usernameStatus === 'invalid'
                                ? 'input-error'
                                : usernameStatus === 'available'
                                ? 'input border-success focus:border-success focus:ring-success'
                                : 'input'
                        }`}
                        placeholder="johndoe"
                        required
                        disabled={isSubmitting}
                    />
                    {renderUsernameStatus()}
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="label">
                        Lösenord
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input w-full pr-10"
                            placeholder="Minst 6 tecken"
                            required
                            disabled={isSubmitting}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {renderPasswordStrength()}
                </div>

                {/* Confirm Password */}
                <div>
                    <label htmlFor="confirmPassword" className="label">
                        Bekräfta lösenord
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full ${
                            formData.confirmPassword && formData.password !== formData.confirmPassword
                                ? 'input-error'
                                : formData.confirmPassword && formData.password === formData.confirmPassword
                                ? 'input border-success focus:border-success focus:ring-success'
                                : 'input'
                        }`}
                        placeholder="Bekräfta ditt lösenord"
                        required
                        disabled={isSubmitting}
                    />
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="flex items-center gap-1 mt-1 text-error-strong dark:text-error-soft text-xs">
                            <XCircle className="w-3 h-3" />
                            <span>Lösenorden matchar inte</span>
                        </div>
                    )}
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isSubmitting || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid'}
                    className="btn-primary w-full"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Skapar ditt konto...</span>
                        </>
                    ) : (
                        <span>Slutför kontot</span>
                    )}
                </button>
            </form>
        </div>
    );
}
