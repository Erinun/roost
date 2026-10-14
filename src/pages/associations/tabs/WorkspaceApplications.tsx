import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Inbox, Loader2, Mail, Phone, X } from 'lucide-react';
import {
    getMemberApplications,
    approveMemberApplication,
    rejectMemberApplication,
} from '@/services/association-applications';
import type { WorkspaceContext } from '../AssociationWorkspace';
import type { MemberApplication, MemberApplicationStatus } from '@/types/association';
import { formatDateTime } from './shared';

const STATUS_LABELS: Record<MemberApplicationStatus, string> = {
    pending: 'Väntande',
    approved: 'Godkänd',
    rejected: 'Avslagen',
};

const STATUS_BADGE_CLASSES: Record<MemberApplicationStatus, string> = {
    pending: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
};

export default function WorkspaceApplications() {
    const { association, userId } = useOutletContext<WorkspaceContext>();
    const [applications, setApplications] = useState<MemberApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

    const fetchApplications = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            setApplications(await getMemberApplications(association.id));
        } catch (error) {
            console.error('Error fetching member applications:', error);
            setLoadError('Det gick inte att hämta ansökningarna.');
        } finally {
            setIsLoading(false);
        }
    }, [association.id]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const markPending = (id: string, active: boolean) => {
        setPendingIds(prev => {
            const next = new Set(prev);
            if (active) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    const handleApprove = async (application: MemberApplication) => {
        markPending(application.id, true);
        setActionError(null);
        setFeedback(null);
        try {
            const { invited } = await approveMemberApplication(application.id);
            setFeedback(
                invited
                    ? `${application.name} är godkänd — ett inbjudningsmejl har skickats till ${application.email}.`
                    : `${application.name} hade redan ett konto och har lagts till som medlem direkt.`
            );
            await fetchApplications();
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Ansökan kunde inte godkännas.');
        } finally {
            markPending(application.id, false);
        }
    };

    const handleReject = async (application: MemberApplication) => {
        markPending(application.id, true);
        setActionError(null);
        setFeedback(null);
        try {
            await rejectMemberApplication(application.id, userId);
            setFeedback(`Ansökan från ${application.name} är avslagen.`);
            await fetchApplications();
        } catch (error) {
            console.error('Error rejecting application:', error);
            setActionError('Ansökan kunde inte avslås.');
        } finally {
            markPending(application.id, false);
        }
    };

    const pending = applications.filter(a => a.status === 'pending');
    const handled = applications.filter(a => a.status !== 'pending');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    Ansökningar
                </h2>
                <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                    Ansökningar om medlemskap från medlemsportalen. Godkänn för att skicka en
                    inbjudan och lägga till personen som medlem.
                </p>
            </div>

            {loadError && (
                <div className="alert-error" role="alert">
                    {loadError}
                </div>
            )}

            {actionError && (
                <div className="alert-error" role="alert">
                    {actionError}
                </div>
            )}

            {feedback && (
                <div
                    className="alert bg-success/10 border-success/60 text-surface-900 dark:bg-success/20 dark:text-surface-50"
                    role="status"
                >
                    {feedback}
                </div>
            )}

            {/* Väntande ansökningar */}
            <section aria-labelledby="vantande-ansokningar">
                <h3
                    id="vantande-ansokningar"
                    className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3"
                >
                    Väntande ({pending.length})
                </h3>

                {pending.length === 0 ? (
                    <div className="card p-8 text-center">
                        <Inbox className="w-8 h-8 mx-auto mb-3 text-surface-400 dark:text-surface-500" />
                        <p className="text-sm text-surface-600 dark:text-surface-300">
                            Inga väntande ansökningar just nu.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {pending.map(application => {
                            const isBusy = pendingIds.has(application.id);
                            return (
                                <li key={application.id} className="card p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-surface-900 dark:text-surface-50">
                                                {application.name}
                                            </p>
                                            <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                                <a href={`mailto:${application.email}`} className="link truncate">
                                                    {application.email}
                                                </a>
                                            </p>
                                            {application.phone && (
                                                <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                                    {application.phone}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-surface-500 dark:text-surface-400 shrink-0">
                                            {formatDateTime(application.created_at)}
                                        </span>
                                    </div>

                                    {application.message && (
                                        <p className="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-200 mt-3 border-t border-surface-100 dark:border-surface-800 pt-3">
                                            {application.message}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => void handleApprove(application)}
                                            disabled={isBusy}
                                            className="btn-primary"
                                        >
                                            {isBusy ? (
                                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                            ) : (
                                                <Check className="w-4 h-4" aria-hidden="true" />
                                            )}
                                            Godkänn
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleReject(application)}
                                            disabled={isBusy}
                                            className="btn-secondary"
                                        >
                                            <X className="w-4 h-4" aria-hidden="true" />
                                            Avslå
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Hanterade ansökningar */}
            {handled.length > 0 && (
                <section aria-labelledby="hanterade-ansokningar">
                    <h3
                        id="hanterade-ansokningar"
                        className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3"
                    >
                        Hanterade
                    </h3>
                    <div className="card">
                        <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                            {handled.map(application => (
                                <li
                                    key={application.id}
                                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                                            {application.name}
                                        </p>
                                        <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                                            {application.email}
                                            {application.handled_at &&
                                                ` · ${formatDateTime(application.handled_at)}`}
                                        </p>
                                    </div>
                                    <span className={STATUS_BADGE_CLASSES[application.status]}>
                                        {STATUS_LABELS[application.status]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}
        </div>
    );
}
