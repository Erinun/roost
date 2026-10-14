import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Loader2, MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import type { MemberQuestion, MemberQuestionStatus } from '@/types';

function formatDateTime(iso: string): string {
    return format(new Date(iso), "d MMMM yyyy 'kl' HH:mm", { locale: sv });
}

const STATUS_META: Record<MemberQuestionStatus, { label: string; className: string }> = {
    open: {
        label: 'Öppen',
        className:
            'bg-info/10 border border-info/60 text-surface-900 dark:bg-info/20 dark:text-surface-50',
    },
    answered: {
        label: 'Besvarad',
        className:
            'bg-success/10 border border-success/60 text-surface-900 dark:bg-success/20 dark:text-surface-50',
    },
    closed: {
        label: 'Stängd',
        className:
            'bg-surface-100 border border-surface-300 text-surface-600 dark:bg-surface-800 dark:border-surface-600 dark:text-surface-300',
    },
};

function StatusBadge({ status }: { status: MemberQuestionStatus }) {
    const meta = STATUS_META[status];
    return (
        <span
            className={`inline-flex items-center shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}
        >
            {meta.label}
        </span>
    );
}

export default function Contact() {
    const { user, profile } = useAuth();
    const { current } = useAssociation();

    // Mina frågor
    const [questions, setQuestions] = useState<MemberQuestion[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(true);
    const [questionsError, setQuestionsError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Formulär: ny fråga
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState(false);

    // Svarsfält (följdfråga) för den expanderade frågan
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [replyError, setReplyError] = useState<string | null>(null);

    // Skydd mot sena svar när användaren byter förening mitt i en hämtning
    const currentIdRef = useRef<string | undefined>(current?.id);
    currentIdRef.current = current?.id;

    const loadQuestions = useCallback(async (): Promise<boolean> => {
        if (!current || !user) return false;
        const associationId = current.id;

        const { data, error } = await supabase
            .from('member_questions')
            .select(
                `id, association_id, author_id, subject, content, status, created_at, updated_at,
                 replies:member_question_replies(id, question_id, author_id, content, created_at,
                 author:profiles(id, username, display_name, avatar_url))`
            )
            .eq('association_id', associationId)
            .eq('author_id', user.id)
            .order('created_at', { ascending: false });

        if (currentIdRef.current !== associationId) return false;

        if (error) {
            setQuestionsError('Dina frågor kunde inte hämtas. Försök igen senare.');
            setQuestions([]);
            return false;
        }

        const list = (data as unknown as MemberQuestion[] | null) ?? [];
        // Sortera svarstrådarna äldst först
        for (const question of list) {
            question.replies?.sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        }
        setQuestionsError(null);
        setQuestions(list);
        return true;
    }, [current?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!current || !user) return;

        let active = true;
        setLoadingQuestions(true);
        setExpandedId(null);

        void loadQuestions().then(() => {
            if (active) setLoadingQuestions(false);
        });

        return () => {
            active = false;
        };
    }, [current?.id, user?.id, loadQuestions]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmitQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!current || !user) return;

        setSending(true);
        setSubmitError(null);
        setConfirmation(false);

        const { error } = await supabase.from('member_questions').insert({
            association_id: current.id,
            author_id: user.id,
            subject: subject.trim(),
            content: message.trim(),
        });

        if (error) {
            setSubmitError('Frågan kunde inte skickas. Försök igen.');
        } else {
            setSubject('');
            setMessage('');
            setConfirmation(true);
            await loadQuestions();
        }
        setSending(false);
    };

    const toggleExpanded = (questionId: string) => {
        setExpandedId((prev) => (prev === questionId ? null : questionId));
        setReplyText('');
        setReplyError(null);
    };

    const handleSubmitReply = async (questionId: string) => {
        if (!user || !replyText.trim()) return;

        setSendingReply(true);
        setReplyError(null);

        const { error } = await supabase.from('member_question_replies').insert({
            question_id: questionId,
            author_id: user.id,
            content: replyText.trim(),
        });

        if (error) {
            setReplyError('Svaret kunde inte skickas. Försök igen.');
        } else {
            setReplyText('');
            await loadQuestions();
        }
        setSendingReply(false);
    };

    const replyAuthorName = (authorId: string, author?: { display_name: string | null; username: string } | null): string => {
        if (authorId === user?.id) {
            return profile?.display_name || profile?.username || 'Du';
        }
        return author?.display_name || author?.username || 'Föreningen';
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl text-surface-900 dark:text-surface-50">Kontakt & frågor</h1>
                <p className="text-surface-600 dark:text-surface-300 mt-1">
                    Hör av dig till din förening – vi hjälper dig gärna.
                </p>
            </div>

            {/* Kontaktuppgifter */}
            <section className="card p-4" aria-labelledby="kontaktuppgifter">
                <h2 id="kontaktuppgifter" className="text-base text-surface-900 dark:text-surface-50 mb-2">
                    Kontaktuppgifter
                </h2>
                {current?.contact_info ? (
                    <p className="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-200">
                        {current.contact_info}
                    </p>
                ) : (
                    <p className="text-sm text-surface-600 dark:text-surface-300">
                        Föreningen har inte lagt in några kontaktuppgifter ännu.
                    </p>
                )}
            </section>

            {/* Ställ en fråga */}
            <section className="card p-4" aria-labelledby="stall-fraga">
                <h2 id="stall-fraga" className="text-base text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary-600 dark:text-primary-300" aria-hidden="true" />
                    Ställ en fråga till föreningen
                </h2>

                {confirmation && (
                    <div
                        className="alert bg-success/10 border-success/60 text-surface-900 dark:bg-success/20 dark:text-surface-50 mb-4"
                        role="status"
                    >
                        Tack! Föreningen återkommer till dig.
                    </div>
                )}

                {submitError && (
                    <div className="alert-error mb-4" role="alert">
                        {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmitQuestion} className="space-y-4">
                    <div>
                        <label htmlFor="subject" className="label">
                            Ämne
                        </label>
                        <input
                            id="subject"
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Vad gäller din fråga?"
                            required
                            minLength={2}
                            maxLength={200}
                            className="input"
                            disabled={sending}
                        />
                    </div>
                    <div>
                        <label htmlFor="message" className="label">
                            Meddelande
                        </label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Skriv din fråga här..."
                            required
                            maxLength={5000}
                            rows={4}
                            className="input resize-y"
                            disabled={sending}
                        />
                    </div>
                    <button type="submit" disabled={sending} className="btn-primary w-full">
                        {sending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                <span>Skickar...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" aria-hidden="true" />
                                <span>Skicka fråga</span>
                            </>
                        )}
                    </button>
                </form>
            </section>

            {/* Mina frågor */}
            <section aria-labelledby="mina-fragor">
                <h2 id="mina-fragor" className="text-base text-surface-900 dark:text-surface-50 mb-3">
                    Mina frågor
                </h2>

                {loadingQuestions ? (
                    <div className="space-y-3">
                        {[0, 1].map((i) => (
                            <div key={i} className="card p-4 space-y-2">
                                <div className="skeleton h-5 w-2/3" />
                                <div className="skeleton h-4 w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : questionsError ? (
                    <div className="alert-error" role="alert">
                        {questionsError}
                    </div>
                ) : questions.length === 0 ? (
                    <div className="card p-6 text-center">
                        <p className="text-sm text-surface-600 dark:text-surface-300">
                            Du har inte ställt några frågor ännu.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {questions.map((question) => {
                            const isExpanded = expandedId === question.id;
                            const replies = question.replies ?? [];

                            return (
                                <li key={question.id} className="card">
                                    <button
                                        type="button"
                                        onClick={() => toggleExpanded(question.id)}
                                        aria-expanded={isExpanded}
                                        className="w-full flex items-center justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-xl"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-semibold text-surface-900 dark:text-surface-50 truncate">
                                                {question.subject}
                                            </p>
                                            <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                                                {formatDateTime(question.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <StatusBadge status={question.status} />
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-surface-400" aria-hidden="true" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-surface-400" aria-hidden="true" />
                                            )}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-surface-100 dark:border-surface-800">
                                            {/* Ursprunglig fråga */}
                                            <p className="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-200 mt-3">
                                                {question.content}
                                            </p>

                                            {/* Svarstråd */}
                                            {replies.length > 0 && (
                                                <ul className="mt-4 space-y-3">
                                                    {replies.map((reply) => (
                                                        <li
                                                            key={reply.id}
                                                            className={`rounded-lg border p-3 ${
                                                                reply.author_id === user?.id
                                                                    ? 'bg-primary-50 dark:bg-surface-800 border-primary-100 dark:border-surface-700'
                                                                    : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                                                            }`}
                                                        >
                                                            <div className="flex items-baseline justify-between gap-2">
                                                                <span className="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">
                                                                    {replyAuthorName(reply.author_id, reply.author)}
                                                                </span>
                                                                <span className="text-xs text-surface-500 dark:text-surface-400 shrink-0">
                                                                    {formatDateTime(reply.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-200 mt-1">
                                                                {reply.content}
                                                            </p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {/* Följdfråga */}
                                            {replyError && (
                                                <div className="alert-error mt-4" role="alert">
                                                    {replyError}
                                                </div>
                                            )}
                                            <div className="mt-4 space-y-2">
                                                <label htmlFor={`reply-${question.id}`} className="label">
                                                    Skriv ett svar
                                                </label>
                                                <textarea
                                                    id={`reply-${question.id}`}
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="Skriv en följdfråga eller ett svar..."
                                                    maxLength={5000}
                                                    rows={3}
                                                    className="input resize-y"
                                                    disabled={sendingReply}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSubmitReply(question.id)}
                                                    disabled={sendingReply || !replyText.trim()}
                                                    className="btn-secondary w-full"
                                                >
                                                    {sendingReply ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                                            <span>Skickar...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="w-4 h-4" aria-hidden="true" />
                                                            <span>Skicka svar</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}
