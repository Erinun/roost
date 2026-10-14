import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Plus, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getMyAssociations,
    getAllAssociations,
    createAssociation,
} from '@/services/association';
import type { Association, AssociationRole } from '@/types/association';

type AssociationListItem = Association & { my_role?: AssociationRole };

/**
 * Autogenerera slug från föreningsnamn:
 * gemener, å/ä→a, ö→o, é→e, mellanslag/övriga tecken→bindestreck, trimma bindestreck.
 */
function generateAssociationSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/é/g, 'e')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const ROLE_LABELS: Record<AssociationRole, string> = {
    admin: 'Administratör',
    internal: 'Intern',
    member: 'Medlem',
};

const ROLE_BADGE_CLASSES: Record<AssociationRole, string> = {
    admin: 'badge-primary',
    internal: 'badge-success',
    member: 'badge bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
};

interface CreateAssociationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (association: Association) => void;
}

function CreateAssociationModal({ isOpen, onClose, onSuccess }: CreateAssociationModalProps) {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const slug = generateAssociationSlug(name);

    // Nollställ formuläret när modalen öppnas
    useEffect(() => {
        if (isOpen) {
            setName('');
            setDescription('');
            setContactInfo('');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim() || !slug) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const association = await createAssociation({
                name: name.trim(),
                slug,
                description: description.trim() || undefined,
                contact_info: contactInfo.trim() || undefined,
                created_by: user.id,
            });
            onSuccess(association);
        } catch (err) {
            console.error('Error creating association:', err);
            setError(err instanceof Error ? err.message : 'Det gick inte att skapa föreningen');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay flex items-center justify-center p-4">
            <div className="modal-content w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                    <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
                        Skapa förening
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                        <X className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <div className="alert-error">{error}</div>}

                    {/* Namn */}
                    <div>
                        <label htmlFor="association-name" className="label">
                            Namn *
                        </label>
                        <input
                            type="text"
                            id="association-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="t.ex. Aktiespararna Göteborg"
                            className="input"
                            required
                            minLength={2}
                            maxLength={100}
                        />
                        {slug && (
                            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                                URL: /associations/{slug}
                            </p>
                        )}
                    </div>

                    {/* Beskrivning */}
                    <div>
                        <label htmlFor="association-description" className="label">
                            Beskrivning
                        </label>
                        <textarea
                            id="association-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Vad gör föreningen?"
                            rows={3}
                            className="input resize-none"
                        />
                    </div>

                    {/* Kontaktinfo */}
                    <div>
                        <label htmlFor="association-contact" className="label">
                            Kontaktinfo
                        </label>
                        <textarea
                            id="association-contact"
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            placeholder="E-post, telefon eller annan kontaktväg"
                            rows={2}
                            className="input resize-none"
                        />
                    </div>

                    {/* Knappar */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">
                            Avbryt
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !name.trim() || !slug}
                            className="btn-primary flex-1"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Skapa förening
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default function AssociationList() {
    const { user, isPlatformAdmin } = useAuth();
    const navigate = useNavigate();
    const [associations, setAssociations] = useState<AssociationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchAssociations = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            if (isPlatformAdmin) {
                // Plattformsadmin ser alla föreningar; egna medlemskap ger roll-badge
                const [all, mine] = await Promise.all([
                    getAllAssociations(),
                    getMyAssociations(user.id),
                ]);
                const roleById = new Map(mine.map(a => [a.id, a.my_role]));
                setAssociations(all.map(a => ({ ...a, my_role: roleById.get(a.id) })));
            } else {
                setAssociations(await getMyAssociations(user.id));
            }
        } catch (error) {
            console.error('Error fetching associations:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, isPlatformAdmin]);

    useEffect(() => {
        fetchAssociations();
    }, [fetchAssociations]);

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Föreningar</h1>
                    <p className="text-surface-600 dark:text-surface-300 mt-1">
                        Arbetsytor för föreningar och ledningsgrupper.
                    </p>
                </div>
                {isPlatformAdmin && (
                    <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                        <Plus className="w-5 h-5" />
                        Skapa förening
                    </button>
                )}
            </div>

            {/* Lista */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card p-6 space-y-3">
                            <div className="skeleton h-5 w-2/3" />
                            <div className="skeleton h-3 w-full" />
                            <div className="skeleton h-3 w-1/2" />
                        </div>
                    ))}
                </div>
            ) : associations.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <Briefcase className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                    </div>
                    <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-1">
                        Inga föreningar
                    </h3>
                    <p className="text-surface-600 dark:text-surface-300">
                        Du är inte medlem i någon förening än.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {associations.map((association) => (
                        <Link
                            key={association.id}
                            to={`/associations/${association.slug}`}
                            className="card-hover p-6 flex flex-col gap-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                                    {association.name}
                                </h2>
                                {association.my_role && (
                                    <span className={`${ROLE_BADGE_CLASSES[association.my_role]} flex-shrink-0`}>
                                        {ROLE_LABELS[association.my_role]}
                                    </span>
                                )}
                            </div>
                            {association.description && (
                                <p className="text-sm text-surface-600 dark:text-surface-300 line-clamp-3">
                                    {association.description}
                                </p>
                            )}
                        </Link>
                    ))}
                </div>
            )}

            {/* Skapa förening-modal (endast plattformsadmin) */}
            {isPlatformAdmin && (
                <CreateAssociationModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={(association) => {
                        setShowCreateModal(false);
                        navigate(`/associations/${association.slug}`);
                    }}
                />
            )}
        </div>
    );
}
