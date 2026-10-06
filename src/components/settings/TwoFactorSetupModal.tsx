import { useState, useEffect } from 'react';
import { X, Loader2, Check, AlertCircle, Shield, Copy, CheckCircle, Key } from 'lucide-react';
import { supabase } from '@/services/supabase';

interface TwoFactorSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type SetupStep = 'intro' | 'scan' | 'verify' | 'backup' | 'complete';

export default function TwoFactorSetupModal({ isOpen, onClose, onSuccess }: TwoFactorSetupModalProps) {
    const [step, setStep] = useState<SetupStep>('intro');
    const [secret, setSecret] = useState('');
    const [otpauthUri, setOtpauthUri] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('intro');
            setSecret('');
            setOtpauthUri('');
            setVerificationCode('');
            setBackupCodes([]);
            setCopiedBackupCodes(false);
            setError(null);
        }
    }, [isOpen]);

    const handleClose = () => {
        if (!isLoading && step !== 'backup') {
            onClose();
        }
    };

    const startSetup = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Du måste vara inloggad');
            }

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/2fa/setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Kunde inte konfigurera 2FA');
            }

            setSecret(data.secret);
            setOtpauthUri(data.otpauthUri);
            setStep('scan');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Kunde inte konfigurera 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    const verifyCode = async () => {
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

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/2fa/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ code: verificationCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ogiltig verifieringskod');
            }

            setBackupCodes(data.backupCodes);
            setStep('backup');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Kunde inte verifiera koden');
        } finally {
            setIsLoading(false);
        }
    };

    const copyBackupCodes = () => {
        const codesText = backupCodes.join('\n');
        navigator.clipboard.writeText(codesText);
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
    };

    const completeSetup = () => {
        onSuccess();
        onClose();
    };

    // Generate QR code URL using Google Charts API (simple approach)
    const getQRCodeUrl = (uri: string) => {
        const encoded = encodeURIComponent(uri);
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 dark:bg-black/70"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-surface-900 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                            Konfigurera tvåfaktorsautentisering
                        </h2>
                    </div>
                    {step !== 'backup' && (
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className="p-2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Step: Intro */}
                    {step === 'intro' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                                    Lägg till ett extra säkerhetslager
                                </h3>
                                <p className="text-surface-500 dark:text-surface-400">
                                    Tvåfaktorsautentisering ger ditt konto ett extra säkerhetslager
                                    genom att kräva en kod från din autentiseringsapp när du loggar in.
                                </p>
                            </div>

                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-2">
                                    Du behöver:
                                </h4>
                                <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        En autentiseringsapp (Google Authenticator, Authy m.fl.)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        Din telefon till hands för att skanna en QR-kod
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={startSetup}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Konfigurerar...</span>
                                    </>
                                ) : (
                                    <span>Kom igång</span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step: Scan QR Code */}
                    {step === 'scan' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                                    Skanna QR-koden
                                </h3>
                                <p className="text-surface-500 dark:text-surface-400 text-sm">
                                    Öppna din autentiseringsapp och skanna den här QR-koden
                                </p>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center">
                                <div className="p-4 bg-white rounded-lg border border-surface-200 dark:border-surface-700">
                                    <img
                                        src={getQRCodeUrl(otpauthUri)}
                                        alt="QR-kod"
                                        className="w-48 h-48"
                                    />
                                </div>
                            </div>

                            {/* Manual entry option */}
                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                <p className="text-xs text-surface-500 dark:text-surface-400 mb-2">
                                    Kan du inte skanna? Ange den här koden manuellt:
                                </p>
                                <code className="block px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded text-sm font-mono break-all">
                                    {secret}
                                </code>
                            </div>

                            <button
                                onClick={() => setStep('verify')}
                                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                            >
                                Fortsätt
                            </button>
                        </div>
                    )}

                    {/* Step: Verify Code */}
                    {step === 'verify' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                                    Ange verifieringskod
                                </h3>
                                <p className="text-surface-500 dark:text-surface-400 text-sm">
                                    Ange den 6-siffriga koden från din autentiseringsapp
                                </p>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setVerificationCode(value);
                                    }}
                                    placeholder="000000"
                                    className="input text-center text-2xl tracking-widest font-mono"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('scan')}
                                    className="flex-1 px-4 py-3 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                                >
                                    Tillbaka
                                </button>
                                <button
                                    onClick={verifyCode}
                                    disabled={isLoading || verificationCode.length !== 6}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Verifierar...</span>
                                        </>
                                    ) : (
                                        <span>Verifiera</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Backup Codes */}
                    {step === 'backup' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Key className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                                    Spara dina reservkoder
                                </h3>
                                <p className="text-surface-500 dark:text-surface-400 text-sm">
                                    Om du förlorar åtkomsten till din autentiseringsapp kan du använda dessa reservkoder för att logga in.
                                    Varje kod kan bara användas en gång.
                                </p>
                            </div>

                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {backupCodes.map((code, index) => (
                                        <div
                                            key={index}
                                            className="px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded font-mono text-sm text-center"
                                        >
                                            {code}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={copyBackupCodes}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                                {copiedBackupCodes ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>Kopierat!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span>Kopiera koder</span>
                                    </>
                                )}
                            </button>

                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                    <strong>Viktigt:</strong> Förvara dessa koder på ett säkert ställe. Du kommer inte att kunna se dem igen.
                                </p>
                            </div>

                            <button
                                onClick={completeSetup}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                            >
                                <Check className="w-5 h-5" />
                                <span>Jag har sparat mina koder</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
