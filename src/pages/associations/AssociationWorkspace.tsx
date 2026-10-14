import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { Briefcase, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAssociationBySlug, getMyAssociationRole } from '@/services/association';
import type { Association, AssociationRole } from '@/types/association';

/** Delad kontext för arbetsytans flikar (via <Outlet context>). */
export interface WorkspaceContext {
    association: Association;
    role: AssociationRole;
    userId: string;
    /** Anropas efter att en flik uppdaterat föreningen så att sidhuvudet hålls aktuellt. */
    onAssociationUpdated: (association: Association) => void;
}

interface WorkspaceTab {
    label: string;
    /** Relativ sökväg under /associations/:slug ('' = index) */
    path: string;
    adminOnly?: boolean;
}

const TABS: WorkspaceTab[] = [
    { label: 'Översikt', path: '' },
    { label: 'Möten', path: 'meetings' },
    { label: 'Uppgifter', path: 'tasks' },
    { label: 'Dokument', path: 'documents' },
    { label: 'Aktiviteter', path: 'activities' },
    { label: 'Nyheter', path: 'news' },
    { label: 'Kommunikation', path: 'posts' },
    { label: 'Frågor', path: 'questions' },
    { label: 'Ansökningar', path: 'applications', adminOnly: true },
    { label: 'Inställningar', path: 'settings', adminOnly: true },
];

export default function AssociationWorkspace() {
    const { slug } = useParams<{ slug: string }>();
    const { user, isPlatformAdmin } = useAuth();
    const [association, setAssociation] = useState<Association | null>(null);
    const [role, setRole] = useState<AssociationRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWorkspace = async () => {
            if (!slug || !user) return;

            setIsLoading(true);
            try {
                const found = await getAssociationBySlug(slug);
                setAssociation(found);

                if (!found) {
                    setRole(null);
                } else if (isPlatformAdmin) {
                    // Plattformsadmin behandlas som admin oavsett medlemskap
                    setRole('admin');
                } else {
                    setRole(await getMyAssociationRole(found.id, user.id));
                }
            } catch (error) {
                console.error('Error fetching association workspace:', error);
                setAssociation(null);
                setRole(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkspace();
    }, [slug, user, isPlatformAdmin]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    // Föreningen finns inte
    if (!association) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                </div>
                <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
                    Föreningen hittades inte.
                </h1>
                <Link to="/associations" className="link">
                    Tillbaka till Föreningar
                </Link>
            </div>
        );
    }

    // Ingen åtkomst: inte medlem, eller medlem utan intern-/adminroll
    if (!role || role === 'member') {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                </div>
                <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
                    Du har inte åtkomst till den här arbetsytan.
                </h1>
                {role === 'member' && (
                    <p className="text-surface-600 dark:text-surface-300 mb-4">
                        Som medlem hittar du föreningens innehåll i medlemsportalen.
                    </p>
                )}
                <Link to="/associations" className="link">
                    Tillbaka till Föreningar
                </Link>
            </div>
        );
    }

    const visibleTabs = TABS.filter(tab => !tab.adminOnly || role === 'admin');

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Sidhuvud */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                    {association.name}
                </h1>
                {association.description && (
                    <p className="text-surface-600 dark:text-surface-300 mt-1">
                        {association.description}
                    </p>
                )}
            </div>

            {/* Fliknav */}
            <nav className="border-b border-surface-200 dark:border-surface-700 mb-6 overflow-x-auto">
                <div className="flex gap-1 -mb-px min-w-max">
                    {visibleTabs.map(tab => (
                        <NavLink
                            key={tab.path}
                            to={tab.path === '' ? `/associations/${association.slug}` : tab.path}
                            end={tab.path === ''}
                            className={({ isActive }) =>
                                `px-4 py-3 min-h-11 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isActive
                                    ? 'border-primary-600 text-primary-600 dark:text-primary-300'
                                    : 'border-transparent text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-50 hover:border-surface-300 dark:hover:border-surface-600'
                                }`
                            }
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Aktiv flik */}
            <Outlet
                context={{
                    association,
                    role,
                    userId: user!.id,
                    onAssociationUpdated: setAssociation,
                } satisfies WorkspaceContext}
            />
        </div>
    );
}
