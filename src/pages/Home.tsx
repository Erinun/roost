import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { APP_CONFIG } from '@/config/app';
import { useLiveStatus } from '@/hooks';
import { getMembersCount, getOnlineUsersCount } from '@/services/profile';
import { PostFeed } from '@/components/feed';
import { LeaderboardCard } from '@/components/leaderboard';
import { CommunityMembersWidget } from '@/components/members/CommunityMembersWidget';
import { AnnouncementBanner } from '@/components/admin';
import { Users, Radio } from 'lucide-react';

export default function Home() {
    const { profile } = useAuth();
    const { isLive, session: liveSession } = useLiveStatus();
    const [membersCount, setMembersCount] = useState(0);
    const [onlineCount, setOnlineCount] = useState(0);

    // Fetch counts on mount and periodically
    const fetchCounts = useCallback(async () => {
        try {
            const [members, online] = await Promise.all([
                getMembersCount(),
                getOnlineUsersCount(),
            ]);
            setMembersCount(members);
            setOnlineCount(online);
        } catch (error) {
            console.error('Error fetching counts:', error);
        }
    }, []);

    useEffect(() => {
        fetchCounts();
        // Refresh every 30 seconds
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, [fetchCounts]);

    return (
        <>
            {/* Fixed Right Sidebar - hidden on mobile */}
            <div className="hidden lg:block fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin p-4 space-y-6 bg-white dark:bg-surface-900 border-l border-surface-200 dark:border-surface-700">
                {/* About card */}
                <div className="card p-6">
                    <h2 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Om</h2>
                    <p className="text-surface-600 dark:text-surface-300 text-sm mb-4">
                        Välkommen till {APP_CONFIG.name}! {APP_CONFIG.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-surface-400" />
                            <span className="text-surface-600 dark:text-surface-300">{membersCount} medlem{membersCount !== 1 ? 'mar' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                            <span className="text-surface-600 dark:text-surface-300">{onlineCount} online</span>
                        </div>
                    </div>
                </div>

                {/* Leaderboard card */}
                <LeaderboardCard period={30} limit={10} title="Toppbidragsgivare" />

                {/* Community Members Widget */}
                <CommunityMembersWidget />
            </div>

            {/* Main feed area - leaves space for fixed right sidebar on desktop */}
            <div className="lg:mr-80">
                {/* Announcements */}
                <AnnouncementBanner />

                {/* Live session banner */}
                {isLive && liveSession && (
                    <Link
                        to="/live"
                        className="block mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-xl bg-error-strong text-white hover:bg-error-strong/90 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg">
                                <Radio className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    <span className="text-sm font-bold uppercase tracking-wide">Live nu</span>
                                </div>
                                <p className="text-sm text-white/90 font-medium truncate mt-0.5">
                                    {liveSession.title}
                                </p>
                            </div>
                            <span className="flex-shrink-0 px-3 py-1.5 bg-white text-error-strong text-sm font-semibold rounded-lg">
                                Gå med
                            </span>
                        </div>
                    </Link>
                )}

                <div className="py-8 px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Welcome message */}
                    <div className="card p-6">
                        <h1 className="text-md md:text-lg font-semibold text-surface-900 dark:text-surface-50">
                            Välkommen tillbaka, {profile?.display_name || 'du'}! 👋
                        </h1>
                        <p className="text-surface-600 dark:text-surface-300 mt-1 text-xs   md:text-base">
                            Vad vill du dela med communityt idag?
                        </p>
                    </div>

                    {/* Post feed (handles its own trigger and modal) */}
                    <PostFeed feedMode="home" />
                </div>
            </div>
        </>
    );
}
