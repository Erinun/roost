import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Newspaper, CalendarDays, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';

const NAV_ITEMS = [
    { to: '/', label: 'Hem', icon: Home, end: true },
    { to: '/news', label: 'Nyheter', icon: Newspaper, end: false },
    { to: '/activities', label: 'Aktiviteter', icon: CalendarDays, end: false },
    { to: '/contact', label: 'Kontakt', icon: MessageCircle, end: false },
];

export default function Layout({ children }: { children: ReactNode }) {
    const { signOut } = useAuth();
    const { associations, current, setCurrent } = useAssociation();

    const handleAssociationChange = (id: string) => {
        const association = associations.find((a) => a.id === id);
        if (association) {
            setCurrent(association);
        }
    };

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
            {/* Topbar */}
            <header className="sticky top-0 z-40 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
                <div className="max-w-lg md:max-w-3xl xl:max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3">
                    {/* Föreningens namn / väljare vid fler än en förening */}
                    <div className="min-w-0 flex-1">
                        {associations.length > 1 ? (
                            <select
                                value={current?.id ?? ''}
                                onChange={(e) => handleAssociationChange(e.target.value)}
                                aria-label="Välj förening"
                                className="max-w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-2 py-1.5 text-sm font-semibold text-surface-900 dark:text-surface-100 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                            >
                                {associations.map((association) => (
                                    <option key={association.id} value={association.id}>
                                        {association.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="block truncate font-heading font-bold text-surface-900 dark:text-surface-50">
                                {current?.name ?? import.meta.env.VITE_APP_NAME ?? 'Medlemsportalen'}
                            </span>
                        )}
                    </div>

                    {/* Länkar i topbaren på ≥md (bottennaven döljs där) */}
                    <nav className="hidden md:flex items-center gap-1" aria-label="Huvudnavigation">
                        {NAV_ITEMS.map(({ to, label, end }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({ isActive }) =>
                                    `rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors ${
                                        isActive
                                            ? 'text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-surface-800'
                                            : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-800'
                                    }`
                                }
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Logga ut */}
                    <button
                        type="button"
                        onClick={() => void signOut()}
                        aria-label="Logga ut"
                        title="Logga ut"
                        className="shrink-0 inline-flex items-center gap-2 rounded-lg px-2.5 min-h-11 text-sm font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden md:inline">Logga ut</span>
                    </button>
                </div>
            </header>

            {/* Innehåll: smal kolumn på mobil, bredare yta på surfplatta/desktop */}
            <main className="max-w-lg md:max-w-3xl xl:max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-10">{children}</main>

            {/* Fast bottennavigation på mobil */}
            <nav
                className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 md:hidden"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                aria-label="Huvudnavigation"
            >
                <div className="max-w-lg mx-auto grid grid-cols-4">
                    {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-0.5 pt-2 pb-1.5 min-h-11 text-xs font-semibold transition-colors ${
                                    isActive
                                        ? 'text-primary-600 dark:text-primary-300'
                                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5" aria-hidden="true" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}
