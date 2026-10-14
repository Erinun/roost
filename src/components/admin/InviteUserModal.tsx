import { useState, FormEvent } from 'react';
import { X, UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import { inviteUser } from '../../services';

interface InviteUserModalProps {
    onClose: () => void;
    onInvited: () => void;
}

export default function InviteUserModal({ onClose, onInvited }: InviteUserModalProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sentTo, setSentTo] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) return;

        setLoading(true);
        setError(null);

        try {
            await inviteUser(trimmed);
            setSentTo(trimmed);
            onInvited();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Det gick inte att skicka inbjudan');
        } finally {
            setLoading(false);
        }
    };

    const handleInviteAnother = () => {
        setEmail('');
        setSentTo(null);
        setError(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-surface-950/60 dark:bg-surface-950/80"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-elevated dark:shadow-elevated-dark max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                            <UserPlus className="w-5 h-5 text-primary-700 dark:text-primary-300" />
                        </div>
                        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">Bjud in en ny användare</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                    </button>
                </div>

                {sentTo ? (
                    /* Success state */
                    <div className="text-center">
                        <div className="w-14 h-14 bg-success/15 dark:bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-7 h-7 text-surface-900 dark:text-success" />
                        </div>
                        <p className="text-surface-900 dark:text-surface-100 font-medium mb-1">
                            Inbjudan har skickats
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-400 break-all mb-6">
                            {sentTo}
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleInviteAnother}
                                className="flex-1 px-4 py-2.5 text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                            >
                                Bjud in fler
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 text-white bg-primary-600 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                            >
                                Stäng
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Form */
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm text-surface-600 dark:text-surface-300">
                            Vi skickar en inbjudningslänk via e-post. Mottagaren väljer själv
                            användarnamn och lösenord när inbjudan accepteras.
                        </p>

                        <div>
                            <label htmlFor="invite-email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                E-postadress
                            </label>
                            <input
                                type="email"
                                id="invite-email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError(null);
                                }}
                                placeholder="namn@exempel.se"
                                className="input w-full"
                                required
                                autoFocus
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-error/10 dark:bg-error/20 text-surface-900 dark:text-error-soft border border-error/60 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                            >
                                Avbryt
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="flex-1 px-4 py-2.5 text-white bg-primary-600 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Skickar...
                                    </>
                                ) : (
                                    'Skicka inbjudan'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
