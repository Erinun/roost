import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, Loader2, ThumbsUp, Heart, Flame, Hand, Brain, Laugh } from 'lucide-react';
import { getReactors } from '@/services/reaction';
import type { ReactableType, ReactionCounts, ReactorInfo } from '@/services/reaction';
import type { ReactionType } from '@/types';

interface ReactorListModalProps {
    onClose: () => void;
    reactableType: ReactableType;
    reactableId: string;
    reactionCounts: ReactionCounts;
}

const reactionConfig: Record<ReactionType, { icon: typeof ThumbsUp; label: string; color: string; activeColor: string }> = {
    like: { icon: ThumbsUp, label: 'Gilla', color: 'text-primary-600 dark:text-primary-300', activeColor: 'border-primary-600 text-primary-700 bg-primary-100 dark:bg-primary-900 dark:text-primary-200' },
    love: { icon: Heart, label: 'Älska', color: 'text-accent-love', activeColor: 'border-accent-love text-surface-900 bg-accent-love/15 dark:bg-accent-love/20 dark:text-surface-50' },
    fire: { icon: Flame, label: 'Eld', color: 'text-accent-fire', activeColor: 'border-accent-fire text-surface-900 bg-accent-fire/15 dark:bg-accent-fire/20 dark:text-surface-50' },
    clap: { icon: Hand, label: 'Applåd', color: 'text-accent-clap', activeColor: 'border-accent-clap text-surface-900 bg-accent-clap/20 dark:bg-accent-clap/20 dark:text-surface-50' },
    think: { icon: Brain, label: 'Tänkvärt', color: 'text-accent-think', activeColor: 'border-accent-think text-surface-900 bg-accent-think/15 dark:bg-accent-think/20 dark:text-surface-50' },
    haha: { icon: Laugh, label: 'Haha', color: 'text-success', activeColor: 'border-success text-surface-900 bg-success/15 dark:bg-success/20 dark:text-surface-50' },
};

type TabType = 'all' | ReactionType;

export default function ReactorListModal({
    onClose,
    reactableType,
    reactableId,
    reactionCounts,
}: ReactorListModalProps) {
    const [reactors, setReactors] = useState<ReactorInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');

    const loadReactors = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getReactors(reactableType, reactableId);
            setReactors(data);
        } catch (error) {
            console.error('Error loading reactors:', error);
        } finally {
            setIsLoading(false);
        }
    }, [reactableType, reactableId]);

    useEffect(() => {
        loadReactors();
    }, [loadReactors]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const filteredReactors = activeTab === 'all'
        ? reactors
        : reactors.filter((r) => r.reaction_type === activeTab);

    // Build tabs: "All" + each reaction type with count > 0
    const tabs: { key: TabType; label: string; count: number }[] = [
        { key: 'all', label: 'Alla', count: reactionCounts.total },
    ];
    (Object.keys(reactionConfig) as ReactionType[]).forEach((type) => {
        if (reactionCounts[type] > 0) {
            tabs.push({ key: type, label: reactionConfig[type].label, count: reactionCounts[type] });
        }
    });

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-surface-950/60 dark:bg-surface-950/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-elevated dark:shadow-elevated-dark max-w-md w-full max-h-[70vh] flex flex-col animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                        Reaktioner
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-surface-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5 px-5 pb-3 overflow-x-auto">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const config = tab.key !== 'all' ? reactionConfig[tab.key as ReactionType] : null;
                        const Icon = config?.icon;

                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                                    border transition-all whitespace-nowrap
                                    ${isActive
                                        ? config
                                            ? config.activeColor
                                            : 'border-primary-600 text-primary-700 bg-primary-100 dark:bg-primary-900 dark:text-primary-200'
                                        : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800'
                                    }
                                `}
                            >
                                {Icon && <Icon className={`w-4 h-4 ${config?.color}`} />}
                                {tab.key === 'all' && <span>Alla</span>}
                                <span className="text-xs">{tab.count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Divider */}
                <div className="border-t border-surface-200 dark:border-surface-700" />

                {/* Reactor List */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                        </div>
                    ) : filteredReactors.length === 0 ? (
                        <p className="text-center py-8 text-sm text-surface-600 dark:text-surface-300">Inga reaktioner än</p>
                    ) : (
                        <div className="space-y-1">
                            {filteredReactors.map((reactor) => {
                                const config = reactionConfig[reactor.reaction_type];
                                const Icon = config.icon;

                                return (
                                    <Link
                                        key={`${reactor.user_id}-${reactor.reaction_type}`}
                                        to={`/profile/${reactor.user.username}`}
                                        onClick={onClose}
                                        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                                    >
                                        {/* Avatar */}
                                        {reactor.user.avatar_url ? (
                                            <img
                                                src={reactor.user.avatar_url}
                                                alt={reactor.user.display_name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                                                {reactor.user.display_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                        )}

                                        {/* Name */}
                                        <span className="flex-1 font-medium text-surface-900 dark:text-surface-50 text-sm truncate">
                                            {reactor.user.display_name}
                                        </span>

                                        {/* Reaction Icon */}
                                        <div className="w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                            <Icon className={`w-4 h-4 ${config.color}`} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
