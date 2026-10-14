import { useEffect, useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { getTopUsers } from '../../services';
import type { LeaderboardRank } from '../../types';
import { ProBadge } from '../common/ProBadge';

interface LeaderboardCardProps {
    groupId?: string;
    period?: 7 | 30 | 365;
    limit?: number;
    title?: string;
}

export default function LeaderboardCard({
    groupId,
    period = 30,
    limit = 10,
    title = 'Toppbidragsgivare',
}: LeaderboardCardProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardRank[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, [groupId, period, limit]);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            const data = await getTopUsers(limit, groupId, period);
            setLeaderboard(data);
        } catch (err) {
            console.error('Error loading leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    // Get medal icon for top 3 (dekorfärger ur profilen: guld/silver/brons)
    const getMedalIcon = (rank: number) => {
        if (rank === 1) return <Trophy size={16} className="text-brand-yellow" />;
        if (rank === 2) return <Medal size={16} className="text-surface-400" />;
        if (rank === 3) return <Medal size={16} className="text-brand-orange" />;
        return null;
    };

    if (loading) {
        return (
            <div className="card p-4">
                <div className="skeleton h-6 w-1/2 mb-4" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="skeleton w-8 h-8 rounded-full" />
                            <div className="flex-1">
                                <div className="skeleton h-4 w-3/4" />
                            </div>
                            <div className="skeleton h-4 w-12" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                        <Award size={20} className="text-brand-purple dark:text-primary-300" />
                        {title}
                    </h3>
                    <span className="text-xs text-surface-600 dark:text-surface-300">{period} d</span>
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {leaderboard.length === 0 ? (
                    <div className="px-4 py-8 text-center text-surface-500 dark:text-surface-400">
                        <Award size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Ingen data ännu</p>
                    </div>
                ) : (
                    leaderboard.map((entry) => (
                        <div
                            key={entry.id}
                            className="px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                {/* Rank/Medal */}
                                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                                    {entry.rank <= 3 ? (
                                        getMedalIcon(entry.rank)
                                    ) : (
                                        <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                                            #{entry.rank}
                                        </span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {entry.user?.avatar_url ? (
                                        <img
                                            src={entry.user.avatar_url}
                                            alt={entry.user.display_name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 text-sm font-semibold">
                                            {entry.user?.display_name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                                            {entry.user?.display_name || 'Okänd'}
                                        </p>
                                        {entry.user?.membership_type === 'premium' && <ProBadge size="xs" />}
                                    </div>
                                    {entry.user?.location && (
                                        <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                                            {entry.user.location}
                                        </p>
                                    )}
                                </div>

                                {/* Points */}
                                <div className="flex-shrink-0">
                                    <span className="text-sm font-bold text-brand-purple dark:text-primary-300">
                                        {(entry.total_points || 0).toLocaleString()}
                                    </span>
                                    <span className="text-xs text-surface-500 dark:text-surface-400 ml-1">p</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Link */}
            {leaderboard.length > 0 && (
                <div className="px-4 py-3 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
                    <a
                        href={groupId ? `/groups/${groupId}/leaderboard` : '/leaderboard'}
                        className="text-sm text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 font-medium flex items-center justify-center gap-1 group"
                    >
                        Visa hela topplistan
                        <svg
                            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
            )}
        </div>
    );
}
