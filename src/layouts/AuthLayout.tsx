import { Outlet, useLocation } from 'react-router-dom';
import { Crown, CheckCircle } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';

const premiumBenefits = [
    { text: 'Allt i gratisversionen, plus:', bold: true },
    { text: 'Direktmeddelanden med medlemmar', bold: false },
    { text: 'Åtkomst till premiumgrupper', bold: false },
    { text: 'Prioriterad support', bold: false },
    { text: 'Exklusivt innehåll och evenemang', bold: false },
];

export default function AuthLayout() {
    const location = useLocation();
    const isMainAuth = ['/login', '/signup'].includes(location.pathname);

    // Glömt/återställ lösenord m.fl. – enkel centrerad layout
    if (!isMainAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 opacity-40 dark:bg-primary-900 dark:opacity-20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-100 opacity-60 dark:bg-primary-800 dark:opacity-20 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 w-full py-8 px-4">
                    <Outlet />
                </div>
            </div>
        );
    }

    // Delad layout för inloggning och registrering
    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Vänsterpanel – hero på blå övertoning med premiumkort */}
            <div className="hidden lg:flex lg:w-[48%] xl:w-[45%] bg-gradient-blue p-8 xl:p-12 flex-col relative overflow-hidden">
                <div className="relative z-10 max-w-md mx-auto w-full flex flex-col flex-1">
                    {/* Logotyp och namn – överst, på gradientens mörkblå del */}
                    <div className="flex flex-col items-center gap-2 mb-10">
                        <img src="/logo-square-sm.png" alt={APP_CONFIG.name} className="w-12 h-12 rounded-xl" />
                        <div className="text-center">
                            <h2 className="text-xl text-white uppercase tracking-wide leading-tight">{APP_CONFIG.name}</h2>
                            <p className="text-sm font-semibold text-white">Community-plattform</p>
                        </div>
                    </div>

                    {/* Premiumkort – solid yta ovanpå övertoningen */}
                    <div className="card bg-white dark:bg-surface-900 rounded-2xl p-6 xl:p-8 my-auto">
                        <div className="text-center mb-5">
                            <div className="w-14 h-14 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                                <Crown className="w-7 h-7 text-surface-900" />
                            </div>
                            <h3 className="text-2xl text-surface-900 dark:text-surface-50">Skaffa Premium</h3>
                            <p className="text-surface-600 dark:text-surface-300 text-sm mt-1">
                                Lås upp alla funktioner och exklusivt innehåll
                            </p>
                        </div>

                        {/* Fördelar */}
                        <div className="mb-6">
                            <ul className="space-y-3">
                                {premiumBenefits.map((benefit, index) => (
                                    <li key={index} className="flex items-center gap-2.5 text-sm text-surface-700 dark:text-surface-200">
                                        <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-300 flex-shrink-0" />
                                        <span className={benefit.bold ? 'font-bold' : ''}>{benefit.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Uppmaning – premiumgult med mörk text */}
                        <div className="w-full min-h-11 py-3 text-sm flex items-center justify-center gap-2 bg-brand-yellow text-surface-900 font-bold rounded-xl">
                            <span>Skaffa premiummedlemskap</span>
                        </div>

                        <p className="text-xs text-surface-600 dark:text-surface-300 text-center mt-3">
                            Skapa ett konto för att komma igång. Uppgradera till premium när du vill.
                        </p>

                        {/* Notis */}
                        <div className="mt-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                            <p className="text-xs text-surface-600 dark:text-surface-300 text-center">
                                Inte säker än? Börja med ett gratiskonto och uppgradera när du vill!
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Högerpanel – formulär */}
            <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 bg-white dark:bg-surface-950 min-h-screen lg:min-h-0 overflow-y-auto">
                <div className="w-full max-w-[420px] lg:max-w-md">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
