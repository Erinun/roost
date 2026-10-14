import { useState } from 'react';
import { X, Loader2, AlertCircle, ShieldOff } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { APP_CONFIG } from '@/config/app';

interface TwoFactorDisableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TwoFactorDisableModal({ isOpen, onClose, onSuccess }: TwoFactorDisableModalProps) {
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        if (!isLoading) {
            setVerificationCode('');
            setError(null);
            onClose();
        }
    };

    const handleDisable = async () => {
        if (verificationCode.length !== 6) {
            setError('Ange en 6-siffrig kod');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Du måste vara inloggad');
            }

            const apiUrl = APP_CONFIG.apiUrl;
            const response = await fetch(`${apiUrl}/api/2fa/disable`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ code: verificationCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Kunde inte inaktivera 2FA');
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Kunde inte inaktivera 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-surface-950/60 dark:bg-surface-950/80"
                onClick={handleClose}
            />

            {/* Modal (flytande lager får ha skugga) */}
            <div className="relative w-full max-w-md mx-4 modal-content">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-error/10 dark:bg-error/20 rounded-lg">
                            <ShieldOff className="w-5 h-5 text-error-strong dark:text-error-soft" />
                        </div>
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                            Inaktivera tvåfaktorsautentisering
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="p-2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Warning */}
                    <div className="alert-warning">
                        <p>
                            <strong>Varning:</strong> Om du inaktiverar 2FA blir ditt konto mindre säkert.
                            Du behöver då bara ditt lösenord för att logga in.
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="alert-error items-center">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Verification code */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Ange din 2FA-kod för att bekräfta
                        </label>
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setVerificationCode(value);
                            }}
                            placeholder="000000"
                            className="input text-center text-xl tracking-widest font-mono"
                            maxLength={6}
                            autoFocus
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
                        >
                            Avbryt
                        </button>
                        <button
                            onClick={handleDisable}
                            disabled={isLoading || verificationCode.length !== 6}
                            className="flex-1 btn-danger"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Inaktiverar...</span>
                                </>
                            ) : (
                                <span>Inaktivera 2FA</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
