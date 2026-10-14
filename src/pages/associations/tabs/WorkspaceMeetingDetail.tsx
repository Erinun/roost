import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    ClipboardList,
    Gavel,
    Loader2,
    MapPin,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import {
    getMeetingById,
    updateMeeting,
    addDecision,
    deleteDecision,
} from '@/services/association-meetings';
import { getTasksForDecision, createTaskFromDecision } from '@/services/association-tasks';
import { getAssociationMembers } from '@/services/association';
import type { WorkspaceContext } from '../AssociationWorkspace';
import type {
    AssociationMeeting,
    AssociationMember,
    AssociationTask,
    MeetingDecision,
    MeetingStatus,
} from '@/types/association';
import {
    MEETING_STATUS_LABELS,
    TASK_STATUS_LABELS,
    TASK_STATUS_BADGE_CLASSES,
    formatDateTime,
    memberName,
} from './shared';

interface CreateTaskFromDecisionModalProps {
    decision: MeetingDecision;
    associationId: string;
    userId: string;
    members: AssociationMember[];
    onClose: () => void;
    onSuccess: (decisionId: string, task: AssociationTask) => void;
}

function CreateTaskFromDecisionModal({
    decision,
    associationId,
    userId,
    members,
    onClose,
    onSuccess,
}: CreateTaskFromDecisionModalProps) {
    const [title, setTitle] = useState(decision.description.slice(0, 200));
    const [assigneeId, setAssigneeId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const task = await createTaskFromDecision(decision, associationId, userId, {
                title: title.trim(),
                assignee_id: assigneeId || undefined,
                due_date: dueDate || undefined,
            });
            // Komplettera med ansvarig profil för direkt visning
            const assignee = members.find(m => m.user_id === assigneeId)?.profile ?? null;
            onSuccess(decision.id, { ...task, assignee });
        } catch (err) {
            console.error('Error creating task from decision:', err);
            setError('Det gick inte att skapa uppgiften. Försök igen.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="modal-overlay flex items-center justify-center p-4">
            <div className="modal-content w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                    <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
                        Skapa uppgift från beslut
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                        <X className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <div className="alert-error">{error}</div>}

                    <div>
                        <label htmlFor="decision-task-title" className="label">
                            Titel *
                        </label>
                        <input
                            type="text"
                            id="decision-task-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input"
                            required
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label htmlFor="decision-task-assignee" className="label">
                            Ansvarig
                        </label>
                        <select
                            id="decision-task-assignee"
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            className="input"
                        >
                            <option value="">Ingen ansvarig</option>
                            {members.map(member => (
                                <option key={member.user_id} value={member.user_id}>
                                    {memberName(member)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="decision-task-due" className="label">
                            Deadline
                        </label>
                        <input
                            type="date"
                            id="decision-task-due"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="input"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">
                            Avbryt
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim()}
                            className="btn-primary flex-1"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Skapa uppgift
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default function WorkspaceMeetingDetail() {
    const { association, userId } = useOutletContext<WorkspaceContext>();
    const { meetingId } = useParams<{ meetingId: string }>();

    const [meeting, setMeeting] = useState<AssociationMeeting | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [internalMembers, setInternalMembers] = useState<AssociationMember[]>([]);
    const [decisionTasks, setDecisionTasks] = useState<Record<string, AssociationTask[]>>({});

    // Redigerbara fält
    const [agenda, setAgenda] = useState('');
    const [minutes, setMinutes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);

    // Beslut
    const [newDecision, setNewDecision] = useState('');
    const [isAddingDecision, setIsAddingDecision] = useState(false);
    const [decisionError, setDecisionError] = useState<string | null>(null);
    const [taskModalDecision, setTaskModalDecision] = useState<MeetingDecision | null>(null);

    const fetchDecisionTasks = useCallback(async (decisions: MeetingDecision[]) => {
        try {
            const taskLists = await Promise.all(decisions.map(d => getTasksForDecision(d.id)));
            const map: Record<string, AssociationTask[]> = {};
            decisions.forEach((decision, index) => {
                map[decision.id] = taskLists[index];
            });
            setDecisionTasks(map);
        } catch (error) {
            console.error('Error fetching decision tasks:', error);
        }
    }, []);

    useEffect(() => {
        const fetchMeeting = async () => {
            if (!meetingId) return;

            setIsLoading(true);
            try {
                const [meetingData, members] = await Promise.all([
                    getMeetingById(meetingId),
                    getAssociationMembers(association.id),
                ]);

                setMeeting(meetingData);
                setInternalMembers(members.filter(m => m.role !== 'member'));

                if (meetingData) {
                    setAgenda(meetingData.agenda ?? '');
                    setMinutes(meetingData.minutes ?? '');
                    await fetchDecisionTasks(meetingData.decisions ?? []);
                }
            } catch (error) {
                console.error('Error fetching meeting detail:', error);
                setMeeting(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMeeting();
    }, [meetingId, association.id, fetchDecisionTasks]);

    const handleSave = async () => {
        if (!meeting) return;

        setSaveError(null);
        setIsSaving(true);
        try {
            const updated = await updateMeeting(meeting.id, {
                agenda: agenda.trim() || null,
                minutes: minutes.trim() || null,
            });
            setMeeting(prev => (prev ? { ...prev, ...updated, decisions: prev.decisions } : prev));
        } catch (error) {
            console.error('Error saving meeting:', error);
            setSaveError('Det gick inte att spara mötet. Försök igen.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusChange = async (status: MeetingStatus) => {
        if (!meeting) return;

        setStatusError(null);
        setIsUpdatingStatus(true);
        try {
            const updated = await updateMeeting(meeting.id, { status });
            setMeeting(prev => (prev ? { ...prev, status: updated.status } : prev));
        } catch (error) {
            console.error('Error updating meeting status:', error);
            setStatusError('Det gick inte att ändra status. Försök igen.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleAddDecision = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!meeting || !newDecision.trim()) return;

        setDecisionError(null);
        setIsAddingDecision(true);
        try {
            const decision = await addDecision({
                meeting_id: meeting.id,
                description: newDecision.trim(),
                created_by: userId,
            });
            setMeeting(prev =>
                prev ? { ...prev, decisions: [...(prev.decisions ?? []), decision] } : prev
            );
            setNewDecision('');
        } catch (error) {
            console.error('Error adding decision:', error);
            setDecisionError('Det gick inte att lägga till beslutet. Försök igen.');
        } finally {
            setIsAddingDecision(false);
        }
    };

    const handleDeleteDecision = async (decisionId: string) => {
        if (!window.confirm('Vill du ta bort beslutet?')) return;

        setDecisionError(null);
        try {
            await deleteDecision(decisionId);
            setMeeting(prev =>
                prev
                    ? { ...prev, decisions: (prev.decisions ?? []).filter(d => d.id !== decisionId) }
                    : prev
            );
        } catch (error) {
            console.error('Error deleting decision:', error);
            setDecisionError('Det gick inte att ta bort beslutet. Försök igen.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-2">
                    Mötet hittades inte.
                </h3>
                <Link to={`/associations/${association.slug}/meetings`} className="link">
                    Tillbaka till Möten
                </Link>
            </div>
        );
    }

    const decisions = meeting.decisions ?? [];

    return (
        <div className="space-y-6">
            {/* Tillbaka + sidhuvud */}
            <div>
                <Link
                    to={`/associations/${association.slug}/meetings`}
                    className="inline-flex items-center gap-1 text-sm text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-50 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Tillbaka till Möten
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
                            {meeting.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-surface-500 dark:text-surface-400 mt-1">
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDateTime(meeting.meeting_date)}
                            </span>
                            {meeting.location && (
                                <span className="inline-flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {meeting.location}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Statusväljare */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="meeting-status" className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                            Status
                        </label>
                        <select
                            id="meeting-status"
                            value={meeting.status}
                            onChange={(e) => handleStatusChange(e.target.value as MeetingStatus)}
                            disabled={isUpdatingStatus}
                            className="input w-auto"
                        >
                            {(Object.keys(MEETING_STATUS_LABELS) as MeetingStatus[]).map(status => (
                                <option key={status} value={status}>
                                    {MEETING_STATUS_LABELS[status]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {statusError && <div className="alert-error mt-3">{statusError}</div>}
            </div>

            {/* Agenda & protokoll */}
            <div className="card p-5 space-y-5">
                {saveError && <div className="alert-error">{saveError}</div>}

                <div>
                    <label htmlFor="meeting-agenda" className="label">
                        Agenda
                    </label>
                    <textarea
                        id="meeting-agenda"
                        value={agenda}
                        onChange={(e) => setAgenda(e.target.value)}
                        placeholder="Vad ska mötet handla om?"
                        rows={5}
                        className="input resize-y"
                    />
                </div>

                <div>
                    <label htmlFor="meeting-minutes" className="label">
                        Protokoll
                    </label>
                    <textarea
                        id="meeting-minutes"
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        placeholder="Anteckna vad som sades och beslutades."
                        rows={8}
                        className="input resize-y"
                    />
                </div>

                <div className="flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Spara
                    </button>
                </div>
            </div>

            {/* Beslut */}
            <div className="card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-surface-900 dark:text-surface-50 mb-4">
                    <Gavel className="w-5 h-5 text-primary-600 dark:text-primary-300" />
                    Beslut
                </h3>

                {decisionError && <div className="alert-error mb-4">{decisionError}</div>}

                {decisions.length === 0 ? (
                    <p className="text-sm text-surface-600 dark:text-surface-300 mb-4">
                        Inga beslut har lagts till än.
                    </p>
                ) : (
                    <ul className="space-y-3 mb-4">
                        {decisions.map(decision => {
                            const linkedTasks = decisionTasks[decision.id] ?? [];
                            return (
                                <li
                                    key={decision.id}
                                    className="rounded-lg border border-surface-200 dark:border-surface-700 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm text-surface-900 dark:text-surface-50 whitespace-pre-wrap flex-1">
                                            {decision.description}
                                        </p>
                                        <button
                                            onClick={() => handleDeleteDecision(decision.id)}
                                            className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                                            title="Ta bort beslut"
                                        >
                                            <Trash2 className="w-4 h-4 text-error-strong dark:text-error-soft" />
                                        </button>
                                    </div>

                                    {/* Kopplade uppgifter */}
                                    {linkedTasks.length > 0 && (
                                        <ul className="mt-3 space-y-2">
                                            {linkedTasks.map(task => (
                                                <li
                                                    key={task.id}
                                                    className="flex items-center justify-between gap-3 rounded-lg bg-surface-50 dark:bg-surface-800 px-3 py-2"
                                                >
                                                    <span className="flex items-center gap-2 min-w-0 text-sm text-surface-900 dark:text-surface-50">
                                                        <ClipboardList className="w-4 h-4 flex-shrink-0 text-surface-500 dark:text-surface-400" />
                                                        <span className="truncate">{task.title}</span>
                                                    </span>
                                                    <span className={`${TASK_STATUS_BADGE_CLASSES[task.status]} flex-shrink-0`}>
                                                        {TASK_STATUS_LABELS[task.status]}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="mt-3">
                                        <button
                                            onClick={() => setTaskModalDecision(decision)}
                                            className="btn-secondary"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Skapa uppgift
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* Lägg till beslut */}
                <form onSubmit={handleAddDecision} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={newDecision}
                        onChange={(e) => setNewDecision(e.target.value)}
                        placeholder="Beskriv beslutet..."
                        className="input flex-1"
                        maxLength={1000}
                    />
                    <button
                        type="submit"
                        disabled={isAddingDecision || !newDecision.trim()}
                        className="btn-primary flex-shrink-0"
                    >
                        {isAddingDecision && <Loader2 className="w-4 h-4 animate-spin" />}
                        Lägg till beslut
                    </button>
                </form>
            </div>

            {/* Skapa uppgift från beslut-modal */}
            {taskModalDecision && (
                <CreateTaskFromDecisionModal
                    decision={taskModalDecision}
                    associationId={association.id}
                    userId={userId}
                    members={internalMembers}
                    onClose={() => setTaskModalDecision(null)}
                    onSuccess={(decisionId, task) => {
                        setTaskModalDecision(null);
                        setDecisionTasks(prev => ({
                            ...prev,
                            [decisionId]: [...(prev[decisionId] ?? []), task],
                        }));
                    }}
                />
            )}
        </div>
    );
}
