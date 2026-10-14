import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronDown, ChevronUp, HelpCircle, Loader2 } from 'lucide-react';
import {
    getQuestions,
    getQuestionById,
    addQuestionReply,
    updateQuestionStatus,
} from '@/services/association-portal';
import type { WorkspaceContext } from '../AssociationWorkspace';
import type { MemberQuestion, MemberQuestionStatus, ProfileSummary } from '@/types/association';

const STATUS_LABELS: Record<MemberQuestionStatus, string> = {
    open: 'Öppen',
    answered: 'Besvarad',
    closed: 'Stängd',
};

const STATUS_BADGE_CLASSES: Record<MemberQuestionStatus, string> = {
    open: 'badge-warning',
    answered: 'badge-success',
    closed: 'badge bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
};

const STATUS_OPTIONS: MemberQuestionStatus[] = ['open', 'answered', 'closed'];

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('sv-SE');
}

function authorName(author?: ProfileSummary | null): string {
    return author?.display_name || author?.username || 'Okänd medlem';
}

export default function WorkspaceQuestions() {
    const { association, userId } = useOutletContext<WorkspaceContext>();
    const [questions, setQuestions] = useState<MemberQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<MemberQuestionStatus | 'all'>('all');

    // Expanderad fråga med svarstråd
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const expandedIdRef = useRef<string | null>(null);
    const [detail, setDetail] = useState<MemberQuestion | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            setQuestions(await getQuestions(association.id));
        } catch (error) {
            console.error('Error fetching member questions:', error);
            setLoadError('Det gick inte att hämta frågorna.');
        } finally {
            setIsLoading(false);
        }
    }, [association.id]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const toggleQuestion = async (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            expandedIdRef.current = null;
            setDetail(null);
            return;
        }

        setExpandedId(id);
        expandedIdRef.current = id;
        setDetail(null);
        setDetailError(null);
        setReplyContent('');
        setIsDetailLoading(true);

        try {
            const question = await getQuestionById(id);
            // Ignorera svaret om användaren hunnit byta fråga
            if (expandedIdRef.current !== id) return;
            setDetail(question);
            if (!question) {
                setDetailError('Frågan hittades inte.');
            }
        } catch (error) {
            console.error('Error fetching question:', error);
            if (expandedIdRef.current === id) {
                setDetailError('Det gick inte att hämta frågan.');
            }
        } finally {
            if (expandedIdRef.current === id) {
                setIsDetailLoading(false);
            }
        }
    };

    const handleStatusChange = async (questionId: string, status: MemberQuestionStatus) => {
        setDetailError(null);
        try {
            await updateQuestionStatus(questionId, status);
            setDetail(prev => (prev && prev.id === questionId ? { ...prev, status } : prev));
            setQuestions(prev => prev.map(q => (q.id === questionId ? { ...q, status } : q)));
        } catch (error) {
            console.error('Error updating question status:', error);
            setDetailError('Det gick inte att uppdatera frågans status.');
        }
    };

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!detail || !replyContent.trim()) return;

        setIsSubmittingReply(true);
        setDetailError(null);

        try {
            await addQuestionReply(
                { question_id: detail.id, author_id: userId, content: replyContent.trim() },
                true
            );
        } catch (error) {
            console.error('Error adding question reply:', error);
            setDetailError('Det gick inte att skicka svaret.');
            setIsSubmittingReply(false);
            return;
        }

        setReplyContent('');

        // Svaret är sparat — ett fel i refreshen får inte se ut som ett misslyckat svar
        try {
            // Hämta om frågan så att tråden visar det nya svaret med författare
            const refreshed = await getQuestionById(detail.id);
            if (expandedIdRef.current === detail.id && refreshed) {
                setDetail(refreshed);
            }
            setQuestions(prev =>
                prev.map(q => (q.id === detail.id ? { ...q, status: refreshed?.status ?? 'answered' } : q))
            );
        } catch (error) {
            console.error('Error refreshing question after reply:', error);
            // Uppdatera det vi kan lokalt och visa mjuk info i stället för ett skickafel
            setDetail(prev => (prev && prev.id === detail.id ? { ...prev, status: 'answered' } : prev));
            setQuestions(prev =>
                prev.map(q => (q.id === detail.id ? { ...q, status: 'answered' } : q))
            );
            setDetailError('Svaret skickades, men tråden kunde inte uppdateras — ladda om sidan.');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const visibleQuestions =
        statusFilter === 'all' ? questions : questions.filter(q => q.status === statusFilter);

    return (
        <div>
            {/* Rubrik + statusfilter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                        Frågor
                    </h2>
                    <p className="text-sm text-surface-600 dark:text-surface-300">
                        Frågor från medlemmarna i medlemsportalen.
                    </p>
                </div>
                <div>
                    <label htmlFor="question-status-filter" className="sr-only">
                        Filtrera på status
                    </label>
                    <select
                        id="question-status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as MemberQuestionStatus | 'all')}
                        className="input w-auto"
                    >
                        <option value="all">Alla statusar</option>
                        {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loadError && <div className="alert-error mb-4">{loadError}</div>}

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
            ) : questions.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <HelpCircle className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                    </div>
                    <p className="text-surface-600 dark:text-surface-300">
                        Inga frågor från medlemmarna än.
                    </p>
                </div>
            ) : visibleQuestions.length === 0 ? (
                <p className="text-surface-600 dark:text-surface-300 py-8 text-center">
                    Inga frågor med den valda statusen.
                </p>
            ) : (
                <div className="space-y-3">
                    {visibleQuestions.map(question => {
                        const isExpanded = expandedId === question.id;
                        const Chevron = isExpanded ? ChevronUp : ChevronDown;

                        return (
                            <div key={question.id} className="card">
                                {/* Fråge-rad (klick öppnar/stänger) */}
                                <button
                                    onClick={() => toggleQuestion(question.id)}
                                    className="w-full flex items-center gap-3 p-4 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600"
                                    aria-expanded={isExpanded}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-surface-900 dark:text-surface-50 truncate">
                                            {question.subject}
                                        </p>
                                        <p className="text-sm text-surface-500 dark:text-surface-400">
                                            {authorName(question.author)} · {formatDate(question.created_at)}
                                        </p>
                                    </div>
                                    <span className={`${STATUS_BADGE_CLASSES[question.status]} flex-shrink-0`}>
                                        {STATUS_LABELS[question.status]}
                                    </span>
                                    <Chevron className="w-5 h-5 text-surface-400 dark:text-surface-500 flex-shrink-0" />
                                </button>

                                {/* Expanderad vy: innehåll + svarstråd + svarsformulär */}
                                {isExpanded && (
                                    <div className="border-t border-surface-200 dark:border-surface-700 p-4 space-y-4">
                                        {detailError && <div className="alert-error">{detailError}</div>}

                                        {isDetailLoading ? (
                                            <div className="flex items-center justify-center py-6">
                                                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                                            </div>
                                        ) : detail ? (
                                            <>
                                                {/* Frågans innehåll */}
                                                <p className="text-surface-700 dark:text-surface-200 whitespace-pre-wrap">
                                                    {detail.content}
                                                </p>

                                                {/* Statusändring */}
                                                <div className="flex items-center gap-2">
                                                    <label
                                                        htmlFor={`question-status-${detail.id}`}
                                                        className="text-sm font-semibold text-surface-700 dark:text-surface-200"
                                                    >
                                                        Status:
                                                    </label>
                                                    <select
                                                        id={`question-status-${detail.id}`}
                                                        value={detail.status}
                                                        onChange={(e) =>
                                                            handleStatusChange(
                                                                detail.id,
                                                                e.target.value as MemberQuestionStatus
                                                            )
                                                        }
                                                        className="input w-auto"
                                                    >
                                                        {STATUS_OPTIONS.map(status => (
                                                            <option key={status} value={status}>
                                                                {STATUS_LABELS[status]}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Svarstråd */}
                                                {detail.replies && detail.replies.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                                                            Svar
                                                        </h3>
                                                        {detail.replies.map(reply => (
                                                            <div
                                                                key={reply.id}
                                                                className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3"
                                                            >
                                                                <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">
                                                                    <span className="font-semibold text-surface-900 dark:text-surface-50">
                                                                        {authorName(reply.author)}
                                                                    </span>{' '}
                                                                    · {formatDate(reply.created_at)}
                                                                </p>
                                                                <p className="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-wrap">
                                                                    {reply.content}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Svarsformulär */}
                                                <form onSubmit={handleReplySubmit} className="space-y-2">
                                                    <label
                                                        htmlFor={`question-reply-${detail.id}`}
                                                        className="label"
                                                    >
                                                        Skriv ett svar
                                                    </label>
                                                    <textarea
                                                        id={`question-reply-${detail.id}`}
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder="Ditt svar till medlemmen..."
                                                        rows={3}
                                                        className="input resize-none"
                                                    />
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-sm text-surface-500 dark:text-surface-400">
                                                            Frågan markeras som besvarad när du svarar.
                                                        </p>
                                                        <button
                                                            type="submit"
                                                            disabled={isSubmittingReply || !replyContent.trim()}
                                                            className="btn-primary flex-shrink-0"
                                                        >
                                                            {isSubmittingReply && (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            )}
                                                            Svara
                                                        </button>
                                                    </div>
                                                </form>
                                            </>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
