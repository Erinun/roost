import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Loader2, Rocket, Clock, CheckCircle, XCircle, Star, FolderOpen, X, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ShowcaseCard, ShowcaseFilterSidebar } from '@/components/showcase';
import {
    getApprovedShowcases,
    getFeaturedShowcases,
    getUserShowcases,
    toggleVote,
    getUserVotesForShowcases,
} from '@/services/showcase';
import type { ShowcaseCardData, ShowcaseFilters as Filters } from '@/types/showcase';
import type { Showcase } from '@/types/database';
import { SHOWCASE_STATUS_INFO } from '@/types/showcase';

export default function Showcase() {
    const { user } = useAuth();
    const location = useLocation();
    const [showcases, setShowcases] = useState<ShowcaseCardData[]>([]);
    const [featuredShowcases, setFeaturedShowcases] = useState<ShowcaseCardData[]>([]);
    const [userShowcases, setUserShowcases] = useState<Showcase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [filters, setFilters] = useState<Filters>({ sortBy: 'newest' });
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [votingShowcaseId, setVotingShowcaseId] = useState<string | null>(null);
    const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(() => window.innerWidth >= 768);
    const [isSubmissionsSidebarOpen, setIsSubmissionsSidebarOpen] = useState(false);

    // Check if we just submitted
    useEffect(() => {
        if (location.state?.submitted) {
            setShowSubmitSuccess(true);
            // Clear the state
            window.history.replaceState({}, document.title);
            // Auto-hide after 5 seconds
            setTimeout(() => setShowSubmitSuccess(false), 5000);
        }
    }, [location.state]);

    // Fetch user's own showcases (including pending)
    const fetchUserShowcases = useCallback(async () => {
        if (!user) {
            setUserShowcases([]);
            return;
        }
        const data = await getUserShowcases(user.id);
        setUserShowcases(data);
    }, [user]);

    // Fetch featured showcases
    const fetchFeatured = useCallback(async () => {
        const featured = await getFeaturedShowcases(3);

        // Get user votes for featured
        if (user && featured.length > 0) {
            const userVotes = await getUserVotesForShowcases(
                user.id,
                featured.map((s) => s.id)
            );
            setFeaturedShowcases(
                featured.map((s) => ({ ...s, user_has_voted: userVotes.has(s.id) }))
            );
        } else {
            setFeaturedShowcases(featured);
        }
    }, [user]);

    // Fetch showcases with filters
    const fetchShowcases = useCallback(async (pageNum = 1, append = false) => {
        if (pageNum === 1) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const result = await getApprovedShowcases(filters, { page: pageNum, pageSize: 12 });

            let showcasesWithVotes = result.showcases;

            // Get user votes
            if (user && showcasesWithVotes.length > 0) {
                const userVotes = await getUserVotesForShowcases(
                    user.id,
                    showcasesWithVotes.map((s) => s.id)
                );
                showcasesWithVotes = showcasesWithVotes.map((s) => ({
                    ...s,
                    user_has_voted: userVotes.has(s.id),
                }));
            }

            if (append) {
                setShowcases((prev) => [...prev, ...showcasesWithVotes]);
            } else {
                setShowcases(showcasesWithVotes);
            }

            setHasMore(result.hasMore);
            setTotal(result.total);
        } catch (error) {
            console.error('Error fetching showcases:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [filters, user]);

    // Initial load
    useEffect(() => {
        fetchFeatured();
        fetchUserShowcases();
    }, [fetchFeatured, fetchUserShowcases]);

    // Refetch on filter change
    useEffect(() => {
        setPage(1);
        fetchShowcases(1);
    }, [filters]);

    // Handle vote
    const handleVote = async (showcaseId: string) => {
        if (!user || votingShowcaseId) return;

        setVotingShowcaseId(showcaseId);

        try {
            const voted = await toggleVote(showcaseId, user.id);

            // Update showcases
            setShowcases((prev) =>
                prev.map((s) =>
                    s.id === showcaseId
                        ? {
                            ...s,
                            user_has_voted: voted,
                            vote_count: voted ? s.vote_count + 1 : s.vote_count - 1,
                        }
                        : s
                )
            );

            // Update featured
            setFeaturedShowcases((prev) =>
                prev.map((s) =>
                    s.id === showcaseId
                        ? {
                            ...s,
                            user_has_voted: voted,
                            vote_count: voted ? s.vote_count + 1 : s.vote_count - 1,
                        }
                        : s
                )
            );
        } catch (error) {
            console.error('Error voting:', error);
        } finally {
            setVotingShowcaseId(null);
        }
    };

    // Load more
    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchShowcases(nextPage, true);
    };

    // Helper to get status icon
    const getStatusIcon = (status: Showcase['status']) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-surface-700 dark:text-warning" />;
            case 'approved':
                return <CheckCircle className="w-4 h-4 text-success" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-error" />;
            case 'featured':
                return <Star className="w-4 h-4 text-brand-purple dark:text-primary-300 fill-current" />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {/* Submit Success Message */}
                    {showSubmitSuccess && (
                        <div className="alert-success mb-6 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-surface-900 dark:text-success flex-shrink-0" />
                                <p className="text-sm">
                                    Ditt projekt har skickats in och väntar på granskning. Vi meddelar dig när det har godkänts!
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSubmitSuccess(false)}
                                className="text-surface-900 dark:text-success hover:opacity-80"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 flex items-center gap-3">
                                <Rocket className="w-7 h-7 text-primary-600" />
                                Projekt
                            </h1>
                            <p className="text-surface-500 dark:text-surface-400 mt-1">
                                Upptäck fantastiska projekt byggda av medlemmar i communityt
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Mobile filter toggle */}
                            <button
                                onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
                                className="md:hidden inline-flex items-center gap-2 px-4 py-2.5 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 rounded-lg font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                                <SlidersHorizontal className="w-5 h-5" />
                                Filter
                            </button>
                            {userShowcases.length > 0 && (
                                <button
                                    onClick={() => setIsSubmissionsSidebarOpen(true)}
                                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 rounded-lg font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                                >
                                    <FolderOpen className="w-5 h-5" />
                                    Mina bidrag
                                    <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-xs rounded-full">
                                        {userShowcases.length}
                                    </span>
                                </button>
                            )}
                            <Link
                                to="/showcase/submit"
                                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Skicka in projekt</span>
                            </Link>
                        </div>
                    </div>

                    {/* My Submissions Sidebar (overlay) */}
                    {isSubmissionsSidebarOpen && (
                        <>
                            <div
                                className="fixed inset-0 bg-surface-950/40 dark:bg-surface-950/60 z-40"
                                onClick={() => setIsSubmissionsSidebarOpen(false)}
                            />
                            <aside className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-surface-900 border-l border-surface-200 dark:border-surface-700 shadow-elevated dark:shadow-elevated-dark z-50 overflow-y-auto">
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                                            Mina bidrag
                                        </h3>
                                        <button
                                            onClick={() => setIsSubmissionsSidebarOpen(false)}
                                            className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded"
                                        >
                                            <X className="w-5 h-5 text-surface-500" />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {userShowcases.map((showcase) => {
                                            const statusInfo = SHOWCASE_STATUS_INFO[showcase.status ?? 'pending'];
                                            return (
                                                <Link
                                                    key={showcase.id}
                                                    to={`/showcase/${showcase.id}`}
                                                    onClick={() => setIsSubmissionsSidebarOpen(false)}
                                                    className="block p-3 bg-surface-50 dark:bg-surface-800 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {showcase.thumbnail_url ? (
                                                            <img
                                                                src={showcase.thumbnail_url}
                                                                alt=""
                                                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-lg bg-surface-200 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                                                                <Rocket className="w-5 h-5 text-surface-400" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-surface-900 dark:text-surface-100 text-sm truncate">
                                                                {showcase.title}
                                                            </h4>
                                                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">
                                                                {showcase.tagline}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-2">
                                                                {getStatusIcon(showcase.status)}
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                                                                    {statusInfo.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                    <Link
                                        to="/showcase/submit"
                                        onClick={() => setIsSubmissionsSidebarOpen(false)}
                                        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Skicka in nytt projekt
                                    </Link>
                                </div>
                            </aside>
                        </>
                    )}

                    {/* Featured Section */}
                    {featuredShowcases.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
                                Utvalda projekt
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {featuredShowcases.map((showcase) => (
                                    <ShowcaseCard
                                        key={showcase.id}
                                        showcase={showcase}
                                        onVote={handleVote}
                                        isVoting={votingShowcaseId === showcase.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results count */}
                    {!isLoading && (
                        <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
                            {total} projekt hittades
                        </p>
                    )}

                    {/* Grid */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                        </div>
                    ) : showcases.length === 0 ? (
                        <div className="text-center py-20">
                            <Rocket className="w-16 h-16 mx-auto text-surface-300 dark:text-surface-600 mb-4" />
                            <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                                Inga projekt hittades
                            </h3>
                            <p className="text-surface-500 dark:text-surface-400 mb-6">
                                {filters.category || filters.search || filters.tagIds
                                    ? 'Prova att justera dina filter'
                                    : 'Bli först med att skicka in ett projekt!'}
                            </p>
                            <Link
                                to="/showcase/submit"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Skicka in projekt
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {showcases.map((showcase) => (
                                    <ShowcaseCard
                                        key={showcase.id}
                                        showcase={showcase}
                                        onVote={handleVote}
                                        isVoting={votingShowcaseId === showcase.id}
                                    />
                                ))}
                            </div>

                            {/* Load more */}
                            {hasMore && (
                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={loadMore}
                                        disabled={isLoadingMore}
                                        className="flex items-center gap-2 px-6 py-3 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-lg font-medium hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Laddar...
                                            </>
                                        ) : (
                                            'Ladda fler'
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Filter Sidebar (inline, not overlay) */}
            <ShowcaseFilterSidebar
                filters={filters}
                onFiltersChange={setFilters}
                isOpen={isFilterSidebarOpen}
                onToggle={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
            />
        </div>
    );
}
