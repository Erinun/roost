import { useEffect, useState, useRef } from 'react';
import { MessageCircle, ThumbsUp, Calendar, Award, FileText, Loader2 } from 'lucide-react';
import { getUserPointActivities } from '../../services';
import type { PointActivity } from '../../types/database';

interface PointActivityFeedProps {
    userId: string;
    limit?: number;
}

const ITEMS_PER_PAGE = 15;

// Map action types to icons and labels (ikonfärger = dekor ur profilens palett)
const ACTION_CONFIG = {
    post_created: { icon: FileText, label: 'Skapade ett inlägg', color: 'text-primary-600 dark:text-primary-300' },
    comment_created: { icon: MessageCircle, label: 'Skrev en kommentar', color: 'text-success' },
    reaction_given: { icon: ThumbsUp, label: 'Reagerade på innehåll', color: 'text-brand-purple dark:text-primary-300' },
    reaction_received: { icon: Award, label: 'Fick en reaktion', color: 'text-brand-orange' },
    event_attended: { icon: Calendar, label: 'Deltog i ett evenemang', color: 'text-brand-pink' },
    daily_login: { icon: Award, label: 'Daglig inloggning', color: 'text-brand-sky' },
    profile_completed: { icon: Award, label: 'Slutförde profilen', color: 'text-brand-teal' },
    manual_adjustment: { icon: Award, label: 'Manuell justering', color: 'text-surface-500' },
} as const;

export default function PointActivityFeed({ userId, limit = ITEMS_PER_PAGE }: PointActivityFeedProps) {
    const [activities, setActivities] = useState<PointActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Reset when userId changes
        setActivities([]);
        setOffset(0);
        setHasMore(true);
        loadActivities(true);
    }, [userId]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading]);

    const loadActivities = async (reset = false) => {
        const currentOffset = reset ? 0 : offset;

        try {
            if (reset) {
                setLoading(true);
                setOffset(0);
            }
            setError(null);

            const data = await getUserPointActivities(userId, limit, currentOffset);

            if (reset) {
                setActivities(data);
            } else {
                setActivities(prev => [...prev, ...data]);
            }
            setHasMore(data.length >= limit);
        } catch (err) {
            console.error('Error loading point activities:', err);
            setError('Kunde inte ladda poängaktiviteter');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = async () => {
        if (!hasMore || loadingMore) return;

        setLoadingMore(true);
        const newOffset = offset + limit;
        setOffset(newOffset);

        try {
            const data = await getUserPointActivities(userId, limit, newOffset);
            setActivities(prev => [...prev, ...data]);
            setHasMore(data.length >= limit);
        } catch (err) {
            console.error('Error loading more activities:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Nyss';
        if (minutes < 60) return `${minutes} min sedan`;
        if (hours < 24) return `${hours} h sedan`;
        if (days < 7) return `${days} d sedan`;
        return date.toLocaleDateString('sv-SE');
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <div className="skeleton w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <div className="skeleton h-4 w-3/4 mb-2" />
                            <div className="skeleton h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-error-strong dark:text-error-soft">
                <p>{error}</p>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                <Award size={48} className="mx-auto mb-2 opacity-20" />
                <p>Inga poängaktiviteter ännu</p>
                <p className="text-sm mt-1">Börja tjäna poäng genom att skapa inlägg och engagera dig!</p>
            </div>
        );
    }

    // Default config for unknown action types
    const DEFAULT_CONFIG = { icon: Award, label: 'Aktivitet', color: 'text-surface-500' };

    return (
        <div className="space-y-3">
            {activities.map((activity) => {
                const config = ACTION_CONFIG[activity.action_type as keyof typeof ACTION_CONFIG] || DEFAULT_CONFIG;
                const Icon = config.icon;

                return (
                    <div key={activity.id} className="flex items-start gap-3 group hover:bg-surface-50 dark:hover:bg-surface-800 -mx-2 px-2 py-2 rounded-lg transition-colors">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center ${config.color}`}>
                            <Icon size={20} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                                <p className="text-sm text-surface-700 dark:text-surface-300">
                                    {activity.description || config.label}
                                </p>
                                <span className={`text-sm font-semibold ${activity.points > 0 ? 'text-surface-900 dark:text-success' : 'text-error-strong dark:text-error-soft'}`}>
                                    {activity.points > 0 ? '+' : ''}{activity.points}
                                </span>
                            </div>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                {formatTimestamp(activity.created_at || new Date().toISOString())}
                            </p>
                        </div>
                    </div>
                );
            })}

            {/* Infinite scroll trigger */}
            {hasMore && (
                <div ref={observerTarget} className="py-3 text-center">
                    {loadingMore ? (
                        <div className="flex items-center justify-center gap-2 text-surface-500 dark:text-surface-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Laddar fler...</span>
                        </div>
                    ) : (
                        <span className="text-xs text-surface-400 dark:text-surface-500">Skrolla för fler</span>
                    )}
                </div>
            )}
        </div>
    );
}
