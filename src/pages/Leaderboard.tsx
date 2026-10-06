import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LeaderboardTable } from '../components/leaderboard';
import { getUserRank } from '../services';
import { useEffect } from 'react';
import type { UserRankInfo } from '../types';
import UserRankBadge from '../components/leaderboard/UserRankBadge';

export default function Leaderboard() {
    const { slug } = useParams<{ slug?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [period, setPeriod] = useState<7 | 30 | 365>(30);
    const [userRank, setUserRank] = useState<UserRankInfo | null>(null);

    // Determine if this is a group leaderboard
    const groupId = slug; // If slug exists, it's a group leaderboard

    useEffect(() => {
        if (user) {
            loadUserRank();
        }
    }, [user, groupId, period]);

    const loadUserRank = async () => {
        if (!user) return;

        try {
            const rank = await getUserRank(user.id, groupId, period);
            setUserRank(rank);
        } catch (err) {
            console.error('Error loading user rank:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-950 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    {groupId && (
                        <button
                            onClick={() => navigate(`/groups/${groupId}`)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Tillbaka till gruppen</span>
                        </button>
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                <Trophy size={32} className="text-purple-600 dark:text-purple-400" />
                                Topplista
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {groupId ? 'Toppbidragsgivare i den här gruppen' : 'Toppbidragsgivare på hela plattformen'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="bg-white dark:bg-surface-900 rounded-lg border border-gray-200 dark:border-surface-700 p-4 mb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Tidsperiod:</span>
                        <button
                            onClick={() => setPeriod(7)}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${period === 7
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-surface-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-700'
                                }
                            `}
                        >
                            7 dagar
                        </button>
                        <button
                            onClick={() => setPeriod(30)}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${period === 30
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-surface-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-700'
                                }
                            `}
                        >
                            30 dagar
                        </button>
                        <button
                            onClick={() => setPeriod(365)}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${period === 365
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-surface-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-700'
                                }
                            `}
                        >
                            Genom tiderna
                        </button>
                    </div>
                </div>

                {/* Current User Rank Card */}
                {user && userRank && (
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 mb-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium mb-1">Din placering</p>
                                <div className="flex items-center gap-4">
                                    <UserRankBadge rank={userRank.rank} size="lg" />
                                    <div>
                                        <p className="text-3xl font-bold">#{userRank.rank}</p>
                                        <p className="text-purple-100">av {userRank.totalUsers.toLocaleString()} användare</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-purple-100 text-sm font-medium mb-1">Dina poäng</p>
                                <p className="text-4xl font-bold">{userRank.points.toLocaleString()}</p>
                                <p className="text-purple-100">poäng</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leaderboard Table */}
                <LeaderboardTable groupId={groupId} period={period} />

                {/* Point Earning Guide */}
                <div className="mt-8 bg-white dark:bg-surface-900 rounded-lg border border-gray-200 dark:border-surface-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Så tjänar du poäng</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 dark:text-blue-400 font-bold">+10</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Skapa ett inlägg</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Dela din kunskap och dina insikter</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-green-600 dark:text-green-400 font-bold">+5</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Skriv en kommentar</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Delta i diskussioner</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-600 dark:text-purple-400 font-bold">+1</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Reagera på innehåll</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Visa uppskattning</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-yellow-600 dark:text-yellow-400 font-bold">+2</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Få en reaktion</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Få erkännande för ditt innehåll</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-pink-600 dark:text-pink-400 font-bold">+15</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Delta i ett evenemang</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Anmäl dig och delta i communityns evenemang</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-teal-600 dark:text-teal-400 font-bold">+20</span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Fyll i din profil</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Engångsbonus för en komplett profil</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
