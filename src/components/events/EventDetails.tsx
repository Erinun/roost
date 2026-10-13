import { X, Calendar, MapPin, Video, User, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useState } from 'react';
import type { EventWithDetails } from '../../types';
import type { RSVPStatus } from '../../types/database';
import RSVPButton from './RSVPButton';
import AttendeeList from './AttendeeList';
import { useAuth } from '../../contexts/AuthContext';

interface EventDetailsProps {
    event: EventWithDetails;
    isOpen: boolean;
    onClose: () => void;
    onRSVP?: (status: RSVPStatus) => Promise<void>;
    onEdit?: () => void;
    onDelete?: () => Promise<void>;
}

export default function EventDetails({
    event,
    isOpen,
    onClose,
    onRSVP,
    onEdit,
    onDelete,
}: EventDetailsProps) {
    const { user } = useAuth();
    const [deleting, setDeleting] = useState(false);
    const [showAttendees, setShowAttendees] = useState(false);

    if (!isOpen) return null;

    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    const isPast = endDate < new Date();
    const isCreator = user?.id === event.created_by;

    const handleDelete = async () => {
        if (!onDelete || !confirm('Är du säker på att du vill ta bort det här evenemanget?')) return;

        try {
            setDeleting(true);
            await onDelete();
            onClose();
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-overlay z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="modal-content fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[90vh] z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
                            {event.title}
                        </h2>
                        {event.group && (
                            <p className="text-brand-purple dark:text-primary-300 font-medium">
                                {event.group.name}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="min-h-11 min-w-11 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-600 dark:text-surface-300"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Date & Time */}
                    <div>
                        <div className="flex items-center gap-2 text-surface-600 dark:text-surface-300 mb-2">
                            <Calendar size={20} />
                            <span className="font-semibold">Datum och tid</span>
                        </div>
                        <p className="text-surface-900 dark:text-surface-50 ml-7">
                            {format(startDate, 'EEEE d MMMM yyyy', { locale: sv })}
                            <br />
                            {format(startDate, 'HH:mm', { locale: sv })} - {format(endDate, 'HH:mm', { locale: sv })}
                        </p>
                    </div>

                    {/* Location */}
                    <div>
                        <div className="flex items-center gap-2 text-surface-600 dark:text-surface-300 mb-2">
                            {event.is_virtual ? <Video size={20} /> : <MapPin size={20} />}
                            <span className="font-semibold">
                                {event.is_virtual ? 'Virtuellt möte' : 'Plats'}
                            </span>
                        </div>
                        {event.is_virtual ? (
                            event.meeting_url ? (
                                <a
                                    href={event.meeting_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link ml-7"
                                >
                                    Gå med i mötet
                                </a>
                            ) : (
                                <p className="text-surface-500 dark:text-surface-400 ml-7 italic">Möteslänken delas närmare evenemanget</p>
                            )
                        ) : (
                            <p className="text-surface-900 dark:text-surface-50 ml-7">{event.location || 'Meddelas senare'}</p>
                        )}
                    </div>

                    {/* Creator */}
                    {event.creator && (
                        <div>
                            <div className="flex items-center gap-2 text-surface-600 dark:text-surface-300 mb-2">
                                <User size={20} />
                                <span className="font-semibold">Arrangeras av</span>
                            </div>
                            <div className="flex items-center gap-2 ml-7">
                                {event.creator.avatar_url && (
                                    <img
                                        src={event.creator.avatar_url}
                                        alt={event.creator.display_name}
                                        className="avatar-sm object-cover"
                                    />
                                )}
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-surface-50">{event.creator.display_name}</p>
                                    <p className="text-sm text-surface-500 dark:text-surface-400">@{event.creator.username}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div>
                            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">Om evenemanget</h3>
                            <p className="text-surface-700 dark:text-surface-200 whitespace-pre-wrap">{event.description}</p>
                        </div>
                    )}

                    {/* RSVP Section */}
                    {onRSVP && !isPast && (
                        <div>
                            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-3">Ditt svar</h3>
                            <RSVPButton
                                eventId={event.id}
                                currentStatus={event.userRSVP || null}
                                onRSVP={onRSVP}
                                attendeeCounts={event.attendeeCount}
                            />
                        </div>
                    )}

                    {/* Attendees */}
                    <div>
                        <button
                            onClick={() => setShowAttendees(!showAttendees)}
                            className="min-h-11 font-semibold text-surface-900 dark:text-surface-50 mb-3 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
                        >
                            {showAttendees ? '▼' : '▶'} Deltagare
                            {event.attendeeCount && ` (${event.attendeeCount.going + event.attendeeCount.maybe})`}
                        </button>
                        {showAttendees && <AttendeeList eventId={event.id} />}
                    </div>
                </div>

                {/* Footer with action buttons */}
                {isCreator && (
                    <div className="p-6 border-t border-surface-200 dark:border-surface-700 flex gap-3">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="btn-primary"
                            >
                                <Edit size={18} />
                                Redigera evenemang
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="btn-danger"
                            >
                                <Trash2 size={18} />
                                {deleting ? 'Tar bort...' : 'Ta bort evenemang'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
