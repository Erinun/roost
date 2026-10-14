import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Clock, Loader2, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import type { AssociationActivity } from '@/types';

/** Kort månadsnamn utan punkt, t.ex. "okt" (date-fns ger "okt."). */
function shortMonth(iso: string): string {
    return format(new Date(iso), 'MMM', { locale: sv }).replace('.', '');
}

function formatTime(activity: AssociationActivity): string {
    const start = format(new Date(activity.starts_at), 'HH:mm');
    if (activity.ends_at) {
        return `kl ${start}–${format(new Date(activity.ends_at), 'HH:mm')}`;
    }
    return `kl ${start}`;
}

export default function Activities() {
    const { user } = useAuth();
    const { current } = useAssociation();

    const [activities, setActivities] = useState<AssociationActivity[]>([]);
    const [signedUpIds, setSignedUpIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!current || !user) return;

        let active = true;
        setLoading(true);
        setError(null);

        const load = async () => {
            const [activitiesRes, signupsRes] = await Promise.all([
                supabase
                    .from('association_activities')
                    .select('*')
                    .eq('association_id', current.id)
                    .eq('is_published', true)
                    .order('starts_at', { ascending: true }),
                supabase
                    .from('activity_signups')
                    .select('activity_id')
                    .eq('user_id', user.id),
            ]);

            if (!active) return;

            if (activitiesRes.error || signupsRes.error) {
                setError('Aktiviteterna kunde inte hämtas. Försök igen senare.');
                setActivities([]);
                setSignedUpIds(new Set());
            } else {
                setActivities((activitiesRes.data as AssociationActivity[] | null) ?? []);
                setSignedUpIds(
                    new Set(
                        ((signupsRes.data as { activity_id: string }[] | null) ?? []).map(
                            (row) => row.activity_id
                        )
                    )
                );
            }
            setLoading(false);
        };

        void load();

        return () => {
            active = false;
        };
    }, [current?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSignUp = async (activityId: string) => {
        if (!user) return;
        setPendingIds((prev) => new Set(prev).add(activityId));
        setActionError(null);

        try {
            const { error: insertError } = await supabase
                .from('activity_signups')
                .insert({ activity_id: activityId, user_id: user.id });

            if (insertError && insertError.code !== '23505') {
                setActionError('Anmälan kunde inte sparas. Försök igen.');
            } else {
                // 23505 = unik-krock: du är redan anmäld, behandla som framgång.
                setSignedUpIds((prev) => new Set(prev).add(activityId));
            }
        } finally {
            setPendingIds((prev) => {
                const next = new Set(prev);
                next.delete(activityId);
                return next;
            });
        }
    };

    const handleCancelSignup = async (activityId: string) => {
        if (!user) return;
        setPendingIds((prev) => new Set(prev).add(activityId));
        setActionError(null);

        try {
            const { error: deleteError } = await supabase
                .from('activity_signups')
                .delete()
                .eq('activity_id', activityId)
                .eq('user_id', user.id);

            if (deleteError) {
                setActionError('Avanmälan kunde inte sparas. Försök igen.');
            } else {
                setSignedUpIds((prev) => {
                    const next = new Set(prev);
                    next.delete(activityId);
                    return next;
                });
            }
        } finally {
            setPendingIds((prev) => {
                const next = new Set(prev);
                next.delete(activityId);
                return next;
            });
        }
    };

    const now = Date.now();
    const upcoming = activities.filter((a) => new Date(a.starts_at).getTime() >= now);
    const past = activities
        .filter((a) => new Date(a.starts_at).getTime() < now)
        .reverse(); // senaste först

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl text-surface-900 dark:text-surface-50">Aktiviteter</h1>
                <p className="text-surface-600 dark:text-surface-300 mt-1">
                    Föreningens aktiviteter – anmäl dig direkt här.
                </p>
            </div>

            {actionError && (
                <div className="alert-error" role="alert">
                    {actionError}
                </div>
            )}

            {loading ? (
                <div className="grid gap-3 md:grid-cols-2">
                    {[0, 1].map((i) => (
                        <div key={i} className="card p-4 flex gap-3">
                            <div className="skeleton w-16 h-16 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-5 w-2/3" />
                                <div className="skeleton h-4 w-1/2" />
                                <div className="skeleton h-4 w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="alert-error" role="alert">
                    {error}
                </div>
            ) : (
                <>
                    {/* Kommande aktiviteter */}
                    <section aria-labelledby="kommande">
                        <h2 id="kommande" className="text-base text-surface-900 dark:text-surface-50 mb-3">
                            Kommande
                        </h2>

                        {upcoming.length === 0 ? (
                            <div className="card p-6 text-center">
                                <p className="text-sm text-surface-600 dark:text-surface-300">
                                    Inga inplanerade aktiviteter just nu.
                                </p>
                            </div>
                        ) : (
                            <ul className="grid gap-3 md:grid-cols-2">
                                {upcoming.map((activity) => {
                                    const isSignedUp = signedUpIds.has(activity.id);
                                    const isPending = pendingIds.has(activity.id);

                                    return (
                                        <li key={activity.id} className="card p-4 flex flex-col">
                                            <div className="flex gap-4">
                                                {/* Datum-badge */}
                                                <div className="w-16 h-16 shrink-0 rounded-lg bg-primary-50 dark:bg-surface-800 border border-primary-100 dark:border-surface-700 flex flex-col items-center justify-center text-primary-700 dark:text-primary-300">
                                                    <span className="text-2xl font-bold leading-none font-heading">
                                                        {format(new Date(activity.starts_at), 'd')}
                                                    </span>
                                                    <span className="text-xs font-semibold uppercase mt-0.5">
                                                        {shortMonth(activity.starts_at)}
                                                    </span>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-base text-surface-900 dark:text-surface-50">
                                                        {activity.title}
                                                    </h3>
                                                    <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-0.5">
                                                        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                                        {formatTime(activity)}
                                                    </p>
                                                    {activity.location && (
                                                        <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-0.5">
                                                            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                                            <span className="truncate">{activity.location}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {activity.description && (
                                                <p className="text-sm text-surface-600 dark:text-surface-300 mt-3 whitespace-pre-wrap">
                                                    {activity.description}
                                                </p>
                                            )}

                                            {/* Anmälan (mt-auto fäster knappen i kortets botten i rutnätet) */}
                                            <div className="mt-auto pt-4">
                                                {isSignedUp ? (
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                                                            Du är anmäld ✓
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleCancelSignup(activity.id)}
                                                            disabled={isPending}
                                                            className="btn-secondary"
                                                        >
                                                            {isPending ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                                            ) : null}
                                                            Avanmäl
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSignUp(activity.id)}
                                                        disabled={isPending}
                                                        className="btn-primary w-full"
                                                    >
                                                        {isPending ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                                        ) : null}
                                                        Anmäl dig
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    {/* Tidigare aktiviteter (komprimerad lista) */}
                    {past.length > 0 && (
                        <section aria-labelledby="tidigare">
                            <h2 id="tidigare" className="text-base text-surface-900 dark:text-surface-50 mb-3">
                                Tidigare
                            </h2>
                            <div className="card">
                                <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                                    {past.map((activity) => (
                                        <li key={activity.id} className="flex items-center gap-3 px-4 py-2.5">
                                            <span className="w-20 shrink-0 text-sm text-surface-500 dark:text-surface-400">
                                                {format(new Date(activity.starts_at), 'd')}{' '}
                                                {shortMonth(activity.starts_at)}{' '}
                                                {format(new Date(activity.starts_at), 'yyyy')}
                                            </span>
                                            <span className="min-w-0 truncate text-sm text-surface-700 dark:text-surface-200">
                                                {activity.title}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
