import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/request-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Det gick inte att skicka återställningsmejlet');
            }

            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Det gick inte att skicka återställningsmejlet');
        } finally {
            setIsLoading(false);
        }
    };

    // Success state
    if (success) {
        return (
            <div className='max-w-md w-full mx-auto'>
                <div className="card p-8 animate-fade-in text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">Kolla din e-post</h1>
                <p className="text-surface-500 dark:text-surface-400 mb-6">
                    Om det finns ett konto med <strong>{email}</strong> har vi skickat en länk för att återställa lösenordet.
                    Länken upphör att gälla om 1 timme.
                </p>
                <p className="text-surface-400 dark:text-surface-500 text-sm mb-6">
                    Ser du inget mejl? Kolla din skräppost.
                </p>
                <Link to="/login" className="btn-primary w-full py-2.5">
                    Tillbaka till inloggning
                </Link>
            </div>
            </div>
        );
    }

    return (
        <div className="card p-8 animate-fade-in max-w-md w-full mx-auto">
            {/* Back link */}
            <Link
                to="/login"
                className="inline-flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Tillbaka till inloggning</span>
            </Link>

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Glömt lösenordet?</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-2">
                    Ingen fara, vi skickar instruktioner för återställning
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Reset form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email field */}
                <div>
                    <label htmlFor="email" className="label">
                        E-postadress
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="du@exempel.se"
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
                    className="btn-primary w-full py-2.5"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Skickar...</span>
                        </>
                    ) : (
                        <span>Återställ lösenord</span>
                    )}
                </button>
            </form>
        </div>
    );
}
