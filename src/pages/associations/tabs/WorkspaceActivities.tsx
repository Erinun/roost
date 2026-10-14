import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { CalendarDays, Loader2, MapPin, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import {
    getActivities,
    createActivity,
    updateActivity,
    publishActivity,
    unpublishActivity,
    deleteActivity,
    getSignupCounts,
} from '@/services/association-portal';
import type { AssociationActivity } from '@/types/association';
import type { WorkspaceContext } from '../AssociationWorkspace';

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** "14 okt. 2026 18:00 – 20:00" (samma dag) eller fullt datum för båda. */
function formatTimeRange(activity: AssociationActivity): string {
    const start = formatDateTime(activity.starts_at);
    if (!activity.ends_at) return start;

    const sameDay =
        new Date(activity.starts_at).toDateString() === new Date(activity.ends_at).toDateString();
    const end = sameDay
        ? new Date(activity.ends_at).toLocaleTimeString('sv-SE', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : formatDateTime(activity.ends_at);

    return `${start} – ${end}`;
}

/** ISO-sträng → värde för datetime-local-fält (lokal tid). */
function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ActivityModalProps {
    isOpen: boolean;
    /** null = skapa ny aktivitet */
    activity: AssociationActivity | null;
    associationId: string;
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

function ActivityModal({
    isOpen,
    activity,
    associationId,
    userId,
    onClose,
    onSuccess,
}: ActivityModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [location, setLocation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fyll i formuläret när modalen öppnas
    useEffect(() => {
        if (isOpen) {
            setTitle(activity?.title ?? '');
            setDescription(activity?.description ?? '');
            setStartsAt(activity ? toDatetimeLocal(activity.starts_at) : '');
            setEndsAt(activity?.ends_at ? toDatetimeLocal(activity.ends_at) : '');
            setLocation(activity?.location ?? '');
            setError(null);
        }
    }, [isOpen, activity]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !startsAt) return;

        setError(null);
        setIsSubmitting(true);

        try {
            if (activity) {
                await updateActivity(activity.id, {
                    title: title.trim(),
                    description: description.trim() || null,
                    starts_at: new Date(startsAt).toISOString(),
                    ends_at: endsAt ? new Date(endsAt).toISOString() : null,
                    location: location.trim() || null,
                });
            } else {
                await createActivity({
                    association_id: associationId,
                    title: title.trim(),
                    starts_at: new Date(startsAt).toISOString(),
                    ends_at: endsAt ? new Date(endsAt).toISOString() : null,
                    description: description.trim() || undefined,
                    location: location.trim() || undefined,
                    created_by: userId,
                });
            }
            onSuccess();
        } catch (err) {
            console.error('Error saving activity:', err);
            setError('Det gick inte att spara aktiviteten.');
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
                        {activity ? 'Redigera aktivitet' : 'Ny aktivitet'}
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

                    {/* Titel */}
                    <div>
                        <label htmlFor="activity-title" className="label">
                            Titel *
                        </label>
                        <input
                            type="text"
                            id="activity-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="t.ex. Årsmöte 2026"
                            className="input"
                            required
                            maxLength={200}
                        />
                    </div>

                    {/* Beskrivning */}
                    <div>
                        <label htmlFor="activity-description" className="label">
                            Beskrivning
                        </label>
                        <textarea
                            id="activity-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Vad händer på aktiviteten?"
                            rows={3}
                            className="input resize-none"
                        />
                    </div>

                    {/* Start */}
                    <div>
                        <label htmlFor="activity-starts-at" className="label">
                            Start *
                        </label>
                        <input
                            type="datetime-local"
                            id="activity-starts-at"
                            value={startsAt}
                            onChange={(e) => setStartsAt(e.target.value)}
                            className="input"
                            required
                        />
                    </div>

                    {/* Slut */}
                    <div>
                        <label htmlFor="activity-ends-at" className="label">
                            Slut
                        </label>
                        <input
                            type="datetime-local"
                            id="activity-ends-at"
                            value={endsAt}
                            onChange={(e) => setEndsAt(e.target.value)}
                            className="input"
                        />
                    </div>

                    {/* Plats */}
                    <div>
                        <label htmlFor="activity-location" className="label">
                            Plats
                        </label>
                        <input
                            type="text"
                            id="activity-location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="t.ex. Föreningslokalen"
                            className="input"
                            maxLength={200}
                        />
                    </div>

                    {/* Knappar */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">
                            Avbryt
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !startsAt}
                            className="btn-primary flex-1"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {activity ? 'Spara' : 'Skapa aktivitet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

interface ActivityCardProps {
    activity: AssociationActivity;
    signupCount: number;
    isBusy: boolean;
    onTogglePublish: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function ActivityCard({
    activity,
    signupCount,
    isBusy,
    onTogglePublish,
    onEdit,
    onDelete,
}: ActivityCardProps) {
    return (
        <div className="card p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <h4 className="font-semibold text-surface-900 dark:text-surface-50 break-words">
                    {activity.title}
                </h4>
                {activity.is_published ? (
                    <span className="badge-success flex-shrink-0">
                        Publicerad i medlemsportalen
                    </span>
                ) : (
                    <span className="badge bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 flex-shrink-0">
                        Utkast
                    </span>
                )}
            </div>

            <div className="mt-2 space-y-1 text-sm text-surface-600 dark:text-surface-300">
                <p className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 flex-shrink-0" />
                    {formatTimeRange(activity)}
                </p>
                {activity.location && (
                    <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        {activity.location}
                    </p>
                )}
                <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    {signupCount === 1 ? '1 anmäld' : `${signupCount} anmälda`}
                </p>
            </div>

            {activity.description && (
                <p className="mt-3 text-sm text-surface-700 dark:text-surface-200 whitespace-pre-wrap break-words">
                    {activity.description}
                </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={onTogglePublish} disabled={isBusy} className="btn-secondary">
                    {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {activity.is_published ? 'Avpublicera' : 'Publicera till medlemsportalen'}
                </button>
                <button onClick={onEdit} disabled={isBusy} className="btn-ghost">
                    <Pencil className="w-4 h-4" />
                    Redigera
                </button>
                <button
                    onClick={onDelete}
                    disabled={isBusy}
                    className="btn-ghost hover:text-error-strong dark:hover:text-error-soft"
                >
                    <Trash2 className="w-4 h-4" />
                    Ta bort
                </button>
            </div>
        </div>
    );
}

export default function WorkspaceActivities() {
    const { association, userId } = useOutletContext<WorkspaceContext>();
    const [activities, setActivities] = useState<AssociationActivity[]>([]);
    const [signupCounts, setSignupCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState<AssociationActivity | null>(null);

    const fetchActivities = useCallback(async () => {
        try {
            const list = await getActivities(association.id);
            setActivities(list);
            setSignupCounts(await getSignupCounts(list.map(a => a.id)));
            setError(null);
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError('Det gick inte att hämta aktiviteterna.');
        } finally {
            setIsLoading(false);
        }
    }, [association.id]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const handleTogglePublish = async (activity: AssociationActivity) => {
        setBusyId(activity.id);
        try {
            const updated = activity.is_published
                ? await unpublishActivity(activity.id)
                : await publishActivity(activity.id);
            setActivities(prev => prev.map(a => (a.id === updated.id ? updated : a)));
        } catch (err) {
            console.error('Error toggling activity publish state:', err);
            setError(
                activity.is_published
                    ? 'Det gick inte att avpublicera aktiviteten.'
                    : 'Det gick inte att publicera aktiviteten.'
            );
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (activity: AssociationActivity) => {
        if (!window.confirm(`Vill du ta bort aktiviteten "${activity.title}"?`)) return;

        setBusyId(activity.id);
        try {
            await deleteActivity(activity.id);
            setActivities(prev => prev.filter(a => a.id !== activity.id));
        } catch (err) {
            console.error('Error deleting activity:', err);
            setError('Det gick inte att ta bort aktiviteten.');
        } finally {
            setBusyId(null);
        }
    };

    const openCreateModal = () => {
        setEditingActivity(null);
        setShowModal(true);
    };

    const openEditModal = (activity: AssociationActivity) => {
        setEditingActivity(activity);
        setShowModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    const now = Date.now();
    const upcoming = activities.filter(a => new Date(a.starts_at).getTime() >= now);
    // Tidigare aktiviteter: senast genomförd först
    const past = activities
        .filter(a => new Date(a.starts_at).getTime() < now)
        .slice()
        .reverse();

    const renderCard = (activity: AssociationActivity) => (
        <ActivityCard
            key={activity.id}
            activity={activity}
            signupCount={signupCounts[activity.id] ?? 0}
            isBusy={busyId === activity.id}
            onTogglePublish={() => handleTogglePublish(activity)}
            onEdit={() => openEditModal(activity)}
            onDelete={() => handleDelete(activity)}
        />
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    Aktiviteter
                </h2>
                <button onClick={openCreateModal} className="btn-primary">
                    <Plus className="w-5 h-5" />
                    Ny aktivitet
                </button>
            </div>

            {error && <div className="alert-error mb-6">{error}</div>}

            {activities.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <CalendarDays className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                    </div>
                    <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-1">
                        Inga aktiviteter än
                    </h3>
                    <p className="text-surface-600 dark:text-surface-300">
                        Skapa föreningens första aktivitet.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Kommande */}
                    {upcoming.length > 0 && (
                        <section>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3">
                                Kommande
                            </h3>
                            <div className="space-y-4">{upcoming.map(renderCard)}</div>
                        </section>
                    )}

                    {/* Tidigare */}
                    {past.length > 0 && (
                        <section>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3">
                                Tidigare
                            </h3>
                            <div className="space-y-4">{past.map(renderCard)}</div>
                        </section>
                    )}
                </div>
            )}

            {/* Skapa/redigera-modal */}
            <ActivityModal
                isOpen={showModal}
                activity={editingActivity}
                associationId={association.id}
                userId={userId}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    setShowModal(false);
                    fetchActivities();
                }}
            />
        </div>
    );
}
