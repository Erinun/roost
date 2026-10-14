import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useOutletContext } from 'react-router-dom';
import { Calendar, Loader2, MapPin, Plus, Users, X } from 'lucide-react';
import { getMeetings, createMeeting } from '@/services/association-meetings';
import { getWorkgroups } from '@/services/association';
import type { WorkspaceContext } from '../AssociationWorkspace';
import type {
    AssociationMeeting,
    AssociationWorkgroup,
    MeetingStatus,
} from '@/types/association';
import { MEETING_STATUS_LABELS, formatDateTime } from './shared';

const STATUS_BADGE_CLASSES: Record<MeetingStatus, string> = {
    planned: 'badge-primary',
    held: 'badge-success',
    cancelled: 'badge-error',
};

interface CreateMeetingModalProps {
    isOpen: boolean;
    associationId: string;
    userId: string;
    workgroups: AssociationWorkgroup[];
    onClose: () => void;
    onSuccess: (meeting: AssociationMeeting) => void;
}

function CreateMeetingModal({
    isOpen,
    associationId,
    userId,
    workgroups,
    onClose,
    onSuccess,
}: CreateMeetingModalProps) {
    const [title, setTitle] = useState('');
    const [meetingDate, setMeetingDate] = useState('');
    const [location, setLocation] = useState('');
    const [workgroupId, setWorkgroupId] = useState('');
    const [agenda, setAgenda] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Nollställ formuläret när modalen öppnas
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setMeetingDate('');
            setLocation('');
            setWorkgroupId('');
            setAgenda('');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !meetingDate) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const meeting = await createMeeting({
                association_id: associationId,
                title: title.trim(),
                meeting_date: new Date(meetingDate).toISOString(),
                location: location.trim() || undefined,
                workgroup_id: workgroupId || null,
                agenda: agenda.trim() || undefined,
                created_by: userId,
            });
            onSuccess(meeting);
        } catch (err) {
            console.error('Error creating meeting:', err);
            setError('Det gick inte att skapa mötet. Försök igen.');
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
                        Nytt möte
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
                        <label htmlFor="meeting-title" className="label">
                            Titel *
                        </label>
                        <input
                            type="text"
                            id="meeting-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="t.ex. Styrelsemöte oktober"
                            className="input"
                            required
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label htmlFor="meeting-date" className="label">
                            Datum och tid *
                        </label>
                        <input
                            type="datetime-local"
                            id="meeting-date"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            className="input"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="meeting-location" className="label">
                            Plats
                        </label>
                        <input
                            type="text"
                            id="meeting-location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="t.ex. Klubblokalen eller digitalt"
                            className="input"
                        />
                    </div>

                    <div>
                        <label htmlFor="meeting-workgroup" className="label">
                            Arbetsgrupp
                        </label>
                        <select
                            id="meeting-workgroup"
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

                    <div>
                        <label htmlFor="meeting-agenda" className="label">
                            Agenda
                        </label>
                        <textarea
                            id="meeting-agenda"
                            value={agenda}
                            onChange={(e) => setAgenda(e.target.value)}
                            placeholder="Vad ska mötet handla om?"
                            rows={4}
                            className="input resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">
                            Avbryt
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !meetingDate}
                            className="btn-primary flex-1"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Skapa möte
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default function WorkspaceMeetings() {
    const { association, userId } = useOutletContext<WorkspaceContext>();
    const [meetings, setMeetings] = useState<AssociationMeeting[]>([]);
    const [workgroups, setWorkgroups] = useState<AssociationWorkgroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const fetchMeetings = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const [meetingList, workgroupList] = await Promise.all([
                    getMeetings(association.id),
                    getWorkgroups(association.id),
                ]);
                setMeetings(meetingList);
                setWorkgroups(workgroupList);
            } catch (error) {
                console.error('Error fetching meetings:', error);
                setLoadError('Det gick inte att ladda möten. Försök igen.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMeetings();
    }, [association.id]);

    const workgroupNames = new Map(workgroups.map(w => [w.id, w.name]));

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    Möten
                </h2>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                    <Plus className="w-5 h-5" />
                    Nytt möte
                </button>
            </div>

            {/* Lista */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
            ) : loadError ? (
                <div className="alert-error">{loadError}</div>
            ) : meetings.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                    </div>
                    <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-1">
                        Inga möten än
                    </h3>
                    <p className="text-surface-600 dark:text-surface-300">
                        Skapa föreningens första möte med knappen ovan.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {meetings.map(meeting => (
                        <Link
                            key={meeting.id}
                            to={meeting.id}
                            className="card-hover p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-surface-900 dark:text-surface-50 truncate">
                                    {meeting.title}
                                </p>
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
                                    {meeting.workgroup_id && workgroupNames.has(meeting.workgroup_id) && (
                                        <span className="inline-flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {workgroupNames.get(meeting.workgroup_id)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className={`${STATUS_BADGE_CLASSES[meeting.status]} flex-shrink-0 self-start sm:self-center`}>
                                {MEETING_STATUS_LABELS[meeting.status]}
                            </span>
                        </Link>
                    ))}
                </div>
            )}

            {/* Nytt möte-modal */}
            <CreateMeetingModal
                isOpen={showCreateModal}
                associationId={association.id}
                userId={userId}
                workgroups={workgroups}
                onClose={() => setShowCreateModal(false)}
                onSuccess={(meeting) => {
                    setShowCreateModal(false);
                    setMeetings(prev =>
                        [meeting, ...prev].sort(
                            (a, b) =>
                                new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
                        )
                    );
                }}
            />
        </div>
    );
}
