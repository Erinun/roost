import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const appName = import.meta.env.VITE_APP_NAME || 'Medlemsportalen';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const { error: signInError } = await signIn(email, password);

        if (signInError) {
            setError('Fel e-postadress eller lösenord.');
            setIsLoading(false);
        }
        // Vid lyckad inloggning omdirigerar route-guarden från /login till /.
    };

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md animate-fade-in">
                {/* Rubrik */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" aria-hidden="true" />
                    </div>
                    <h1 className="text-2xl text-surface-900 dark:text-surface-50">{appName}</h1>
                    <p className="text-surface-600 dark:text-surface-300 mt-1 text-sm">
                        Logga in för att följa din förening
                    </p>
                </div>

                {/* Centrerat kort */}
                <div className="card p-6 sm:p-8">
                    {/* Felmeddelande */}
                    {error && (
                        <div className="alert-error mb-6" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* E-post */}
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
                                autoComplete="email"
                                required
                                className="input"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Lösenord */}
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
                                    autoComplete="current-password"
                                    required
                                    className="input pr-10"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Dölj lösenordet' : 'Visa lösenordet'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                                    ) : (
                                        <Eye className="w-4 h-4" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Logga in */}
                        <button type="submit" disabled={isLoading} className="btn-primary w-full">
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                    <span>Loggar in...</span>
                                </>
                            ) : (
                                <span>Logga in</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Hjälptext */}
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-6 text-center">
                    Saknar du inloggningsuppgifter?{' '}
                    <Link to="/apply" className="link">
                        Ansök om åtkomst här
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
