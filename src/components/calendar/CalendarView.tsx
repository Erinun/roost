import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useState } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { CalendarEvent, EventWithDetails } from '../../types';
import EventDetails from '../events/EventDetails';
import { rsvpToEvent, deleteEvent, updateEvent } from '../../services';
import type { RSVPStatus } from '../../types/database';
import EventForm, { type EventFormData } from '../events/EventForm';

// =============================================================================
// Tokentabell för react-big-calendar (tredjepartsbibliotek som kräver
// färgsträngar i CSS-överlagringar och inline-stilar). Detta är filens ENDA
// ställe med färgvärden och de speglar designsystemets tokens exakt
// (docs/redesign/designsystem.md). Alla tokens läses via var(--token) med
// profilens hex som fallback.
// =============================================================================
const RBC = {
    /** surface-50 – ljus brödtext i mörkt läge */
    surface50: 'var(--surface-50, #F3F7FC)',
    /** surface-300 – dämpad text i mörkt läge */
    surface300: 'var(--surface-300, #B9C9DE)',
    /** surface-400 – datumtext/dekor i mörkt läge */
    surface400: 'var(--surface-400, #8CA0BC)',
    /** surface-500 – förflutna evenemang (vit text 5,0:1) */
    surface500: 'var(--surface-500, #5C7190)',
    /** surface-600 – nedtonad text (utanför perioden) i mörkt läge */
    surface600: 'var(--surface-600, #4A5B73)',
    /** surface-700 – linjer i mörkt läge */
    surface700: 'var(--surface-700, #334862)',
    /** surface-800 – upphöjda ytor/hover i mörkt läge */
    surface800: 'var(--surface-800, #1D3754)',
    /** surface-900 – kortbakgrund i mörkt läge; mörk text på teal/orange */
    surface900: 'var(--surface-900, #0E2A4D)',
    /** surface-950 – dagar utanför perioden i mörkt läge */
    surface950: 'var(--surface-950, #081E3A)',
    /** brand-purple – evenemang/kampanj (standardfärg, vit text 8,5:1) */
    brandPurple: 'var(--brand-purple, #652FA0)',
    /** success = brand-teal – "deltar", alltid mörk text */
    success: 'var(--brand-teal, #32D7CD)',
    /** warning = brand-orange – "kanske", alltid mörk text */
    warning: 'var(--brand-orange, #F5A118)',
    /** primary-200 – länk-hover i mörkt läge */
    primary200: 'var(--color-primary-200, #BDD8F4)',
    /** primary-300 – länkar/accent i mörkt läge */
    primary300: 'var(--color-primary-300, #8EBBEB)',
    /** primary-400 – aktiv markering/tidsindikator i mörkt läge */
    primary400: 'var(--color-primary-400, #5497DE)',
    /** primary-900 – markering av dagens datum i mörkt läge */
    primary900: 'var(--color-primary-900, #0F2E52)',
    /** vit text – endast på blå/lila ytor (kontrastregel) */
    white: '#FFFFFF',
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales: { sv },
});

const calendarMessages = {
    today: 'Idag',
    previous: 'Föregående',
    next: 'Nästa',
    month: 'Månad',
    week: 'Vecka',
    day: 'Dag',
    agenda: 'Agenda',
    date: 'Datum',
    time: 'Tid',
    event: 'Evenemang',
    noEventsInRange: 'Inga evenemang i perioden',
    showMore: (n: number) => `+${n} till`,
};

interface CalendarViewProps {
    events: EventWithDetails[];
    onCreateEvent?: (start: Date, end: Date) => void;
    onRefresh?: () => void;
}

export default function CalendarView({ events, onCreateEvent, onRefresh }: CalendarViewProps) {
    const [selectedEvent, setSelectedEvent] = useState<EventWithDetails | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentView, setCurrentView] = useState<View>('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Convert events to calendar format
    const calendarEvents: CalendarEvent[] = events.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        resource: event,
    }));

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event.resource);
        setIsDetailsOpen(true);
    };

    const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
        if (onCreateEvent) {
            onCreateEvent(start, end);
        }
    };

    const handleRSVP = async (status: RSVPStatus) => {
        if (!selectedEvent) return;
        await rsvpToEvent(selectedEvent.id, selectedEvent.created_by, status);
        if (onRefresh) onRefresh();
    };

    const handleEdit = () => {
        setIsDetailsOpen(false);
        setIsEditOpen(true);
    };

    const handleUpdateEvent = async (data: EventFormData) => {
        if (!selectedEvent) return;
        await updateEvent(selectedEvent.id, {
            ...data,
            start_time: new Date(data.start_time).toISOString(),
            end_time: new Date(data.end_time).toISOString(),
        });
        setIsEditOpen(false);
        if (onRefresh) onRefresh();
    };

    const handleDelete = async () => {
        if (!selectedEvent) return;
        await deleteEvent(selectedEvent.id);
        setIsDetailsOpen(false);
        if (onRefresh) onRefresh();
    };

    // Evenemangens färger utifrån RSVP-status. Samma semantik som tidigare,
    // mappad till profilens tokens:
    //   standard = brand-purple (evenemang/kampanj), deltar = success (mörk text),
    //   kanske = warning (mörk text), förflutet = dämpad neutral.
    const eventStyleGetter = (event: CalendarEvent) => {
        const userRSVP = event.resource.userRSVP;
        const isPast = new Date(event.resource.end_time) < new Date();

        let backgroundColor = RBC.brandPurple;
        let borderColor = RBC.brandPurple;
        let color = RBC.white;

        if (isPast) {
            backgroundColor = RBC.surface500;
            borderColor = RBC.surface500;
        } else if (userRSVP === 'going') {
            backgroundColor = RBC.success;
            borderColor = RBC.success;
            color = RBC.surface900; // mörk text på teal – alltid
        } else if (userRSVP === 'maybe') {
            backgroundColor = RBC.warning;
            borderColor = RBC.warning;
            color = RBC.surface900; // mörk text på orange – alltid
        }

        return {
            style: {
                backgroundColor,
                borderColor,
                color,
                borderLeft: `4px solid ${borderColor}`,
                opacity: isPast ? 0.6 : 1,
            },
        };
    };

    return (
        <div className="h-full card p-4 calendar-container">
            <style>{`
                /* Mörkt läge för react-big-calendar – surface-neutraler och
                   primary-accenter ur tokentabellen ovan. */
                .dark .calendar-container .rbc-calendar {
                    color: ${RBC.surface50};
                }

                /* Verktygsrad */
                .dark .calendar-container .rbc-toolbar {
                    color: ${RBC.surface50};
                }

                .dark .calendar-container .rbc-toolbar button {
                    color: ${RBC.surface300};
                    background-color: transparent;
                    border: 1px solid ${RBC.surface700};
                }

                .dark .calendar-container .rbc-toolbar button:hover,
                .dark .calendar-container .rbc-toolbar button:focus {
                    background-color: ${RBC.surface800};
                    border-color: ${RBC.surface600};
                }

                .dark .calendar-container .rbc-toolbar button.rbc-active {
                    background-color: ${RBC.surface800};
                    border-color: ${RBC.primary400};
                    color: ${RBC.surface50};
                }

                /* Månadsvy */
                .dark .calendar-container .rbc-month-view {
                    background-color: ${RBC.surface900};
                    border-color: ${RBC.surface700};
                }

                .dark .calendar-container .rbc-header {
                    background-color: ${RBC.surface800};
                    border-color: ${RBC.surface700};
                    color: ${RBC.surface50};
                }

                .dark .calendar-container .rbc-day-bg {
                    background-color: ${RBC.surface900};
                    border-color: ${RBC.surface700};
                }

                .dark .calendar-container .rbc-off-range-bg {
                    background-color: ${RBC.surface950};
                }

                .dark .calendar-container .rbc-today {
                    background-color: ${RBC.primary900};
                }

                .dark .calendar-container .rbc-date-cell {
                    color: ${RBC.surface400};
                }

                .dark .calendar-container .rbc-off-range .rbc-date-cell {
                    color: ${RBC.surface600};
                }

                /* Evenemang (färg sätts per evenemang via eventPropGetter) */
                .calendar-container .rbc-event {
                    font-size: 0.7rem;
                    line-height: 1.1;
                    padding: 1px 3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .calendar-container .rbc-event-content {
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* Agendavy */
                .dark .calendar-container .rbc-agenda-view {
                    background-color: ${RBC.surface900};
                }

                .dark .calendar-container .rbc-agenda-view table {
                    border-color: ${RBC.surface700};
                }

                .dark .calendar-container .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
                    background-color: ${RBC.surface800};
                    border-color: ${RBC.surface700};
                    color: ${RBC.surface50};
                }

                .dark .calendar-container .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
                    border-color: ${RBC.surface700};
                    color: ${RBC.surface300};
                }

                .dark .calendar-container .rbc-agenda-date-cell,
                .dark .calendar-container .rbc-agenda-time-cell {
                    color: ${RBC.surface400};
                }

                /* Vecko-/dagsvy */
                .dark .calendar-container .rbc-time-view {
                    background-color: ${RBC.surface900};
                    border-color: ${RBC.surface700};
                }

                .dark .calendar-container .rbc-time-header-content {
                    border-color: ${RBC.surface700};
                }

                .dark .calendar-container .rbc-time-content {
                    border-color: ${RBC.surface700};
                }

                .dark .calendar-container .rbc-time-slot {
                    border-color: ${RBC.surface700};
                }

                .dark .calendar-container .rbc-day-slot .rbc-time-slot {
                    border-color: ${RBC.surface800};
                }

                .dark .calendar-container .rbc-timeslot-group {
                    border-color: ${RBC.surface700};
                }

                .dark .calendar-container .rbc-current-time-indicator {
                    background-color: ${RBC.primary400};
                }

                /* "+N till"-länk */
                .dark .calendar-container .rbc-show-more {
                    color: ${RBC.primary300};
                }

                .dark .calendar-container .rbc-show-more:hover {
                    color: ${RBC.primary200};
                }
            `}</style>
            <BigCalendar
                localizer={localizer}
                culture="sv"
                messages={calendarMessages}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '600px' }}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                view={currentView}
                onView={setCurrentView}
                date={currentDate}
                onNavigate={setCurrentDate}
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day', 'agenda']}
            />

            {/* Event Details Modal */}
            {selectedEvent && (
                <EventDetails
                    event={selectedEvent}
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                    onRSVP={handleRSVP}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Edit Event Modal */}
            {selectedEvent && (
                <EventForm
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSubmit={handleUpdateEvent}
                    initialData={selectedEvent}
                />
            )}
        </div>
    );
}
