import { useEffect, useState } from 'react';
import { Users, User } from 'lucide-react';
import { getEventAttendees } from '../../services';
import type { RSVPStatus } from '../../types/database';

interface AttendeeListProps {
    eventId: string;
    filterStatus?: RSVPStatus | 'all';
}

interface Attendee {
    id: string;
    user_id: string;
    event_id: string;
    status: RSVPStatus;
    created_at: string;
    user?: {
        id: string;
        username: string;
        display_name: string;
        avatar_url?: string | null;
        is_online?: boolean;
    };
}

export default function AttendeeList({ eventId, filterStatus = 'all' }: AttendeeListProps) {
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<typeof filterStatus>(filterStatus);

    useEffect(() => {
        loadAttendees();
    }, [eventId]);

    const loadAttendees = async () => {
        try {
            setLoading(true);
            const data = await getEventAttendees(eventId);
            setAttendees(data as Attendee[]);
        } catch (err) {
            console.error('Error loading attendees:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredAttendees = activeFilter === 'all'
        ? attendees
        : attendees.filter(a => a.status === activeFilter);

    const statusCounts = {
        all: attendees.length,
        going: attendees.filter(a => a.status === 'going').length,
        maybe: attendees.filter(a => a.status === 'maybe').length,
        not_going: attendees.filter(a => a.status === 'not_going').length,
    };

    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="skeleton w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <div className="skeleton h-4 w-32 mb-1" />
                            <div className="skeleton h-3 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div>
            {/* Filter tabs */}
            <div className="tabs mb-4">
                {[
                    { key: 'all', label: 'Alla', count: statusCounts.all },
                    { key: 'going', label: 'Deltar', count: statusCounts.going },
                    { key: 'maybe', label: 'Kanske', count: statusCounts.maybe },
                    { key: 'not_going', label: 'Kan inte delta', count: statusCounts.not_going },
                ].map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => setActiveFilter(key as typeof activeFilter)}
                        className={activeFilter === key ? 'tab-active' : 'tab'}
                    >
                        {label} ({count})
                    </button>
                ))}
            </div>

            {/* Attendee list */}
            {filteredAttendees.length === 0 ? (
                <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                    <Users size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Inga deltagare i den här kategorin ännu</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredAttendees.map((attendee) => (
                        <div
                            key={attendee.id}
                            className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        >
                            {/* Avatar */}
                            {attendee.user?.avatar_url ? (
                                <img
                                    src={attendee.user.avatar_url}
                                    alt={attendee.user.display_name}
                                    className="avatar-md object-cover"
                                />
                            ) : (
                                <div className="avatar-md">
                                    <User size={20} />
                                </div>
                            )}

                            {/* User info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-surface-900 dark:text-surface-50 truncate">
                                        {attendee.user?.display_name || 'Okänd användare'}
                                    </p>
                                    {attendee.user?.is_online && (
                                        <div className="w-2 h-2 bg-success rounded-full" title="Online" />
                                    )}
                                </div>
                                {attendee.user?.username && (
                                    <p className="text-sm text-surface-500 dark:text-surface-400">
                                        @{attendee.user.username}
                                    </p>
                                )}
                            </div>

                            {/* Status badge */}
                            <div className={`
                                ${attendee.status === 'going' ? 'badge-success' : ''}
                                ${attendee.status === 'maybe' ? 'badge-warning' : ''}
                                ${attendee.status === 'not_going' ? 'badge-error' : ''}
                            `}>
                                {attendee.status === 'going' && 'Deltar'}
                                {attendee.status === 'maybe' && 'Kanske'}
                                {attendee.status === 'not_going' && 'Kan inte delta'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
