import { useEffect, useState, useRef } from 'react';
import { Trophy } from 'lucide-react';
import { getGlobalLeaderboard, getGroupLeaderboard, subscribeToLeaderboardChanges } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import type { LeaderboardRank } from '../../types';
import UserRankBadge from './UserRankBadge';
import { ProBadge } from '../common/ProBadge';

interface LeaderboardTableProps {
    groupId?: string;
    period: 7 | 30 | 365;
}

export default function LeaderboardTable({ groupId, period }: LeaderboardTableProps) {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardRank[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const observerTarget = useRef<HTMLDivElement>(null);

    const ITEMS_PER_PAGE = 50;

    useEffect(() => {
        // Reset state when groupId or period changes
        setLeaderboard([]);
        setOffset(0);
        setHasMore(true);
        loadLeaderboard(true, 0);

        // Subscribe to real-time updates
        const channel = subscribeToLeaderboardChanges(groupId || null, () => {
            // On real-time update, reload from beginning
            setLeaderboard([]);
            setOffset(0);
            setHasMore(true);
            loadLeaderboard(false, 0);
        });

        return () => {
            channel.unsubscribe();
        };
    }, [groupId, period]);

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

    const loadLeaderboard = async (showLoading = true, currentOffset = offset) => {
        try {
            if (showLoading) setLoading(true);

            const result = groupId
                ? await getGroupLeaderboard(groupId, period, ITEMS_PER_PAGE, currentOffset)
                : await getGlobalLeaderboard(period, ITEMS_PER_PAGE, currentOffset);

            if (currentOffset === 0) {
                setLeaderboard(result.entries);
            } else {
                setLeaderboard(prev => [...prev, ...result.entries]);
            }
            setHasMore(result.hasMore);
        } catch (err) {
            console.error('Error loading leaderboard:', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!hasMore || loadingMore) return;

        try {
            setLoadingMore(true);
            const newOffset = offset + ITEMS_PER_PAGE;
            setOffset(newOffset);

            const result = groupId
                ? await getGroupLeaderboard(groupId, period, ITEMS_PER_PAGE, newOffset)
                : await getGlobalLeaderboard(period, ITEMS_PER_PAGE, newOffset);

            setLeaderboard(prev => [...prev, ...result.entries]);
            setHasMore(result.hasMore);
        } catch (err) {
            console.error('Error loading more:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    // Get medal icon for top 3
    const getMedalElement = (rank: number) => {
        if (rank === 1) return <span className="text-2xl">🥇</span>;
        if (rank === 2) return <span className="text-2xl">🥈</span>;
        if (rank === 3) return <span className="text-2xl">🥉</span>;
        return null;
    };

    if (loading) {
        return (
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="table-header border-b border-surface-200 dark:border-surface-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-20">
                                    Placering
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Användare
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider w-32">
                                    Poäng
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                            {[...Array(10)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">
                                        <div className="skeleton w-8 h-8 rounded-full" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="skeleton w-10 h-10 rounded-full" />
                                            <div className="flex-1">
                                                <div className="skeleton h-4 w-32 mb-2" />
                                                <div className="skeleton h-3 w-24" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="skeleton h-5 w-16 ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="card p-12 text-center">
                <Trophy size={64} className="mx-auto mb-4 text-surface-300 dark:text-surface-600" />
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Ingen data ännu</h3>
                <p className="text-surface-500 dark:text-surface-400">
                    Topplistan fylls på när användare börjar tjäna poäng!
                </p>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="table-header border-b border-surface-200 dark:border-surface-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wider w-20">
                                Placering
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wider">
                                Användare
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wider w-32">
                                Poäng
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                        {leaderboard.map((entry) => {
                            const isCurrentUser = entry.user_id === user?.id;

                            return (
                                <tr
                                    key={entry.id}
                                    className={`
                                        group hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors
                                        ${isCurrentUser ? 'bg-primary-50 dark:bg-primary-900 hover:bg-primary-100 dark:hover:bg-primary-800' : ''}
                                    `}
                                >
                                    {/* Rank */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center">
                                            {entry.rank <= 3 ? (
                                                getMedalElement(entry.rank)
                                            ) : (
                                                <UserRankBadge rank={entry.rank} size="sm" />
                                            )}
                                        </div>
                                    </td>

                                    {/* User */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            {entry.user?.avatar_url ? (
                                                <img
                                                    src={entry.user.avatar_url}
                                                    alt={entry.user.display_name}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-surface-800"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 font-semibold ring-2 ring-white dark:ring-surface-800">
                                                    {entry.user?.display_name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                            )}

                                            {/* Name and location */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                                                        {entry.user?.display_name || 'Okänd'}
                                                    </p>
                                                    {entry.user?.membership_type === 'premium' && <ProBadge size="xs" />}
                                                    {isCurrentUser && (
                                                        <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded">
                                                            Du
                                                        </span>
                                                    )}
                                                </div>
                                                {entry.user?.username && (
                                                    <p className="text-sm text-surface-500 dark:text-surface-400">
                                                        @{entry.user.username}
                                                    </p>
                                                )}
                                                {entry.user?.location && (
                                                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                                                        {entry.user.location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Points */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-bold text-brand-purple dark:text-primary-300">
                                                {(entry.total_points || 0).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-surface-500 dark:text-surface-400">poäng</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Infinite scroll trigger */}
            {hasMore && (
                <div ref={observerTarget} className="py-4 text-center">
                    {loadingMore ? (
                        <div className="flex items-center justify-center gap-2 text-surface-500 dark:text-surface-400">
                            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Laddar fler...</span>
                        </div>
                    ) : (
                        <span className="text-sm text-surface-400 dark:text-surface-500">Skrolla för fler</span>
                    )}
                </div>
            )}
        </div>
    );
}
