import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { Calendar, CheckSquare, Gavel, Loader2, Plus, User, X } from 'lucide-react';
import { getTasks, createTask, updateTaskStatus } from '@/services/association-tasks';
import { getWorkgroups, getAssociationMembers } from '@/services/association';
import type { WorkspaceContext } from '../AssociationWorkspace';
import type {
    AssociationMember,
    AssociationTask,
    AssociationTaskStatus,
    AssociationWorkgroup,
} from '@/types/association';
import { TASK_STATUS_LABELS, isOverdue, memberName } from './shared';

const STATUS_ORDER: AssociationTaskStatus[] = ['todo', 'in_progress', 'done'];

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('sv-SE');
}

interface CreateTaskModalProps {
    isOpen: boolean;
    associationId: string;
    userId: string;
    members: AssociationMember[];
    workgroups: AssociationWorkgroup[];
    onClose: () => void;
    onSuccess: (task: AssociationTask) => void;
}

function CreateTaskModal({
    isOpen,
    associationId,
    userId,
    members,
    workgroups,
    onClose,
    onSuccess,
}: CreateTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [workgroupId, setWorkgroupId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Nollställ formuläret när modalen öppnas
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setAssigneeId('');
            setDueDate('');
            setWorkgroupId('');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const task = await createTask({
                association_id: associationId,
                title: title.trim(),
                description: description.trim() || undefined,
                assignee_id: assigneeId || null,
                due_date: dueDate || null,
                workgroup_id: workgroupId || null,
                created_by: userId,
            });
            // Komplettera med ansvarig profil för direkt visning
            const assignee = members.find(m => m.user_id === assigneeId)?.profile ?? null;
            onSuccess({ ...task, assignee });
        } catch (err) {
            console.error('Error creating task:', err);
            setError('Det gick inte att skapa uppgiften. Försök igen.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay flex items-center justify-center p-4">
            <div className="modal-content w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                    <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
                        Ny uppgift
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
                        <label htmlFor="task-title" className="label">
                            Titel *
                        </label>
                        <input
                            type="text"
                            id="task-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Vad ska göras?"
                            className="input"
                            required
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label htmlFor="task-description" className="label">
                            Beskrivning
                        </label>
                        <textarea
                            id="task-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mer detaljer om uppgiften"
                            rows={3}
                            className="input resize-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="task-assignee" className="label">
                            Ansvarig
                        </label>
                        <select
                            id="task-assignee"
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
                        <label htmlFor="task-due" className="label">
                            Deadline
                        </label>
                        <input
                            type="date"
                            id="task-due"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="input"
                        />
                    </div>

                    <div>
                        <label htmlFor="task-workgroup" className="label">
                            Arbetsgrupp
                        </label>
                        <select
                            id="task-workgroup"
                            value={workgroupId}
                            onChange={(e) => setWorkgroupId(e.target.value)}
                            className="input"
                        >
                            <option value="">Ingen arbetsgrupp</option>
                            {workgroups.map(workgroup => (
                                <option key={workgroup.id} value={workgroup.id}>
                                    {workgroup.name}
                                </option>
                            ))}
                        </select>
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

interface TaskCardProps {
    task: AssociationTask;
    isUpdating: boolean;
    onStatusChange: (taskId: string, status: AssociationTaskStatus) => void;
}

function TaskCard({ task, isUpdating, onStatusChange }: TaskCardProps) {
    const overdue = isOverdue(task);
    const assigneeName = task.assignee
        ? task.assignee.display_name || task.assignee.username
        : null;

    return (
        <div className="card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-surface-900 dark:text-surface-50">{task.title}</p>
                {task.decision_id && (
                    <span className="badge-primary flex-shrink-0">
                        <Gavel className="w-3 h-3" />
                        Från beslut
                    </span>
                )}
            </div>

            {task.description && (
                <p className="text-sm text-surface-600 dark:text-surface-300 line-clamp-3 whitespace-pre-wrap">
                    {task.description}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {/* Ansvarig */}
                {assigneeName ? (
                    <span className="inline-flex items-center gap-2 text-surface-700 dark:text-surface-200">
                        {task.assignee?.avatar_url ? (
                            <img
                                src={task.assignee.avatar_url}
                                alt={assigneeName}
                                className="avatar-sm object-cover"
                            />
                        ) : (
                            <span className="avatar-sm">
                                <User className="w-4 h-4" />
                            </span>
                        )}
                        {assigneeName}
                    </span>
                ) : (
                    <span className="text-surface-500 dark:text-surface-400">Ej tilldelad</span>
                )}

                {/* Deadline */}
                {task.due_date && (
                    <span
                        className={`inline-flex items-center gap-1 ${overdue
                            ? 'text-error-strong dark:text-error-soft font-semibold'
                            : 'text-surface-500 dark:text-surface-400'
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        {formatDate(task.due_date)}
                    </span>
                )}
            </div>

            {/* Statusbyte */}
            <div>
                <label htmlFor={`task-status-${task.id}`} className="sr-only">
                    Status för {task.title}
                </label>
                <select
                    id={`task-status-${task.id}`}
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value as AssociationTaskStatus)}
                    disabled={isUpdating}
                    className="input"
                >
                    {STATUS_ORDER.map(status => (
                        <option key={status} value={status}>
                            {TASK_STATUS_LABELS[status]}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default function WorkspaceTasks() {
    const { association, userId } = useOutletContext<WorkspaceContext>();
    const [tasks, setTasks] = useState<AssociationTask[]>([]);
    const [workgroups, setWorkgroups] = useState<AssociationWorkgroup[]>([]);
    const [internalMembers, setInternalMembers] = useState<AssociationMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);

    // Filter
    const [showOnlyMine, setShowOnlyMine] = useState(false);
    const [workgroupFilter, setWorkgroupFilter] = useState('');

    useEffect(() => {
        const fetchTasks = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const [taskList, workgroupList, members] = await Promise.all([
                    getTasks(association.id),
                    getWorkgroups(association.id),
                    getAssociationMembers(association.id),
                ]);
                setTasks(taskList);
                setWorkgroups(workgroupList);
                setInternalMembers(members.filter(m => m.role !== 'member'));
            } catch (error) {
                console.error('Error fetching tasks:', error);
                setLoadError('Det gick inte att ladda uppgifter. Försök igen.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, [association.id]);

    const handleStatusChange = async (taskId: string, status: AssociationTaskStatus) => {
        setStatusError(null);
        setUpdatingTaskId(taskId);
        try {
            const updated = await updateTaskStatus(taskId, status);
            setTasks(prev =>
                prev.map(task =>
                    task.id === taskId
                        ? { ...task, status: updated.status, completed_at: updated.completed_at }
                        : task
                )
            );
        } catch (error) {
            console.error('Error updating task status:', error);
            setStatusError('Det gick inte att ändra status. Försök igen.');
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (showOnlyMine && task.assignee_id !== userId) return false;
        if (workgroupFilter && task.workgroup_id !== workgroupFilter) return false;
        return true;
    });

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    Uppgifter
                </h2>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                    <Plus className="w-5 h-5" />
                    Ny uppgift
                </button>
            </div>

            {/* Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowOnlyMine(false)}
                        className={showOnlyMine ? 'btn-secondary' : 'btn-primary'}
                    >
                        Alla
                    </button>
                    <button
                        onClick={() => setShowOnlyMine(true)}
                        className={showOnlyMine ? 'btn-primary' : 'btn-secondary'}
                    >
                        Mina
                    </button>
                </div>
                <div className="sm:ml-auto sm:w-64">
                    <label htmlFor="task-workgroup-filter" className="sr-only">
                        Filtrera på arbetsgrupp
                    </label>
                    <select
                        id="task-workgroup-filter"
                        value={workgroupFilter}
                        onChange={(e) => setWorkgroupFilter(e.target.value)}
                        className="input"
                    >
                        <option value="">Alla arbetsgrupper</option>
                        {workgroups.map(workgroup => (
                            <option key={workgroup.id} value={workgroup.id}>
                                {workgroup.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Fel vid statusbyte */}
            {statusError && <div className="alert-error mb-4">{statusError}</div>}

            {/* Kolumner (desktop) / sektioner (mobil) */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
            ) : loadError ? (
                <div className="alert-error">{loadError}</div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <CheckSquare className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                    </div>
                    <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-1">
                        Inga uppgifter
                    </h3>
                    <p className="text-surface-600 dark:text-surface-300">
                        {tasks.length === 0
                            ? 'Skapa föreningens första uppgift med knappen ovan.'
                            : 'Inga uppgifter matchar filtret.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
                    {STATUS_ORDER.map(status => {
                        const columnTasks = filteredTasks.filter(task => task.status === status);
                        return (
                            <section key={status}>
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3">
                                    {TASK_STATUS_LABELS[status]}
                                    <span className="badge bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300">
                                        {columnTasks.length}
                                    </span>
                                </h3>
                                {columnTasks.length === 0 ? (
                                    <p className="text-sm text-surface-500 dark:text-surface-400">
                                        Inga uppgifter.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {columnTasks.map(task => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                isUpdating={updatingTaskId === task.id}
                                                onStatusChange={handleStatusChange}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}

            {/* Ny uppgift-modal */}
            <CreateTaskModal
                isOpen={showCreateModal}
                associationId={association.id}
                userId={userId}
                members={internalMembers}
                workgroups={workgroups}
                onClose={() => setShowCreateModal(false)}
                onSuccess={(task) => {
                    setShowCreateModal(false);
                    setTasks(prev => [task, ...prev]);
                }}
            />
        </div>
    );
}
