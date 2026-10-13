import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, Loader2, XCircle, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isUsernameAvailable, isValidUsername } from '@/services/profile';
import { APP_CONFIG } from '@/config/app';

// Password strength calculation
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

    // Cap at 4
    score = Math.min(score, 4);

    // Statusfärger som ytor (mätaren); text i mörk/dämpad ton enligt kontrastreglerna
    const strengths: PasswordStrength[] = [
        { score: 0, label: 'För svagt', color: 'text-error-strong dark:text-error-soft', bgColor: 'bg-error' },
        { score: 1, label: 'Svagt', color: 'text-error-strong dark:text-error-soft', bgColor: 'bg-warning' },
        { score: 2, label: 'Okej', color: 'text-surface-600 dark:text-surface-300', bgColor: 'bg-brand-yellow' },
        { score: 3, label: 'Bra', color: 'text-surface-700 dark:text-surface-200', bgColor: 'bg-success' },
        { score: 4, label: 'Starkt', color: 'text-surface-900 dark:text-success', bgColor: 'bg-success' },
    ];

    return strengths[score];
}

export default function Signup() {
    const navigate = useNavigate();
    const { signUp } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        displayName: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
    const [confirmationEmail, setConfirmationEmail] = useState('');

    // Username validation state
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
    const [usernameError, setUsernameError] = useState<string | null>(null);

    // Password strength
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

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
    }, [formData.username]);

    // Update password strength when password changes
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
        if (!formData.email || !formData.password || !formData.username || !formData.displayName) {
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

        setIsLoading(true);
        setError(null);

        try {
            const result = await signUp(formData.email, formData.password, {
                username: formData.username.toLowerCase(),
                display_name: formData.displayName,
            });

            if (result.requiresEmailConfirmation) {
                // Show email confirmation message
                setConfirmationEmail(result.email);
                setEmailConfirmationSent(true);
            } else {
                // Email confirmation disabled - redirect to home
                navigate('/');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Det gick inte att skapa kontot';
            setError(message);
        } finally {
            setIsLoading(false);
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

        if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
            return (
                <div className="flex items-center gap-1 mt-1 text-error-strong dark:text-error-soft text-xs">
                    <XCircle className="w-3 h-3" />
                    <span>{usernameError}</span>
                </div>
            );
        }

        return null;
    };

    // Password strength indicator
    const renderPasswordStrength = () => {
        if (!passwordStrength || !formData.password) return null;

        return (
            <div className="mt-1.5">
                {/* Strength bar */}
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
                {/* Strength label */}
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

    // Show email confirmation message after successful signup
    if (emailConfirmationSent) {
        return (
            <div className="animate-fade-in">
                <div className="text-center">
                    {/* Header */}
                    <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-surface-900" />
                    </div>
                    <h1 className="text-2xl text-surface-900 dark:text-surface-50 mb-2">
                        Kolla din e-post
                    </h1>
                    <p className="text-surface-600 dark:text-surface-300 text-sm mb-4">
                        Vi har skickat en bekräftelselänk till:
                    </p>

                    {/* Email display */}
                    <div className="bg-surface-100 dark:bg-surface-800 rounded-lg px-4 py-3 mb-6">
                        <p className="font-bold text-surface-900 dark:text-surface-50 text-sm break-all">
                            {confirmationEmail}
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-surface-50 dark:bg-surface-800/50 rounded-lg p-4 mb-6 border border-surface-200 dark:border-surface-700 text-left text-sm text-surface-600 dark:text-surface-300">
                        <p className="mb-2">
                            <strong>Nästa steg:</strong>
                        </p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Öppna mejlet vi just skickade</li>
                            <li>Klicka på bekräftelselänken</li>
                            <li>Börja använda {APP_CONFIG.name}!</li>
                        </ol>
                    </div>

                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">
                        Fick du inget mejl? Kolla din skräppost eller{' '}
                        <button
                            onClick={() => setEmailConfirmationSent(false)}
                            className="link"
                        >
                            försök igen
                        </button>
                    </p>
                    <Link
                        to="/login"
                        className="link text-sm"
                    >
                        Tillbaka till inloggning
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Tab Toggle */}
            <TabToggle active="signup" />

            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl text-surface-900 dark:text-surface-50">Skapa ett konto</h1>
                <p className="text-surface-600 dark:text-surface-300 mt-1 text-sm">
                    Gå med i communityt och kom igång
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
                        disabled={isLoading}
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
                        disabled={isLoading}
                    />
                    {renderUsernameStatus()}
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="label">
                        E-post
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="du@exempel.se"
                        required
                        disabled={isLoading}
                    />
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
                            disabled={isLoading}
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
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`w-full pr-10 ${
                                formData.confirmPassword && formData.password !== formData.confirmPassword
                                    ? 'input-error'
                                    : formData.confirmPassword && formData.password === formData.confirmPassword
                                    ? 'input border-success focus:border-success focus:ring-success'
                                    : 'input'
                            }`}
                            placeholder="Bekräfta ditt lösenord"
                            required
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
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
                    disabled={isLoading || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid'}
                    className="btn-primary w-full"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Skapar konto...</span>
                        </>
                    ) : (
                        <span>Skapa konto</span>
                    )}
                </button>
            </form>
        </div>
    );
}
