import type {
    AssociationMember,
    AssociationTask,
    AssociationTaskStatus,
    MeetingStatus,
} from '@/types/association';

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
    planned: 'Planerat',
    held: 'Genomfört',
    cancelled: 'Inställt',
};

export const TASK_STATUS_LABELS: Record<AssociationTaskStatus, string> = {
    todo: 'Att göra',
    in_progress: 'Pågår',
    done: 'Klart',
};

export const TASK_STATUS_BADGE_CLASSES: Record<AssociationTaskStatus, string> = {
    todo: 'badge bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
    in_progress: 'badge-warning',
    done: 'badge-success',
};

export function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('sv-SE')} ${date.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
}

export function memberName(member: AssociationMember): string {
    return member.profile?.display_name || member.profile?.username || 'Okänd medlem';
}

/**
 * `due_date` är en ren datumsträng (YYYY-MM-DD). `new Date('YYYY-MM-DD')`
 * tolkas som UTC-midnatt och rödmarkerar därför uppgifter fel i lokala
 * tidszoner — jämför därför datumsträngar i stället. sv-SE formaterar
 * dagens datum som YYYY-MM-DD, så strängjämförelsen blir korrekt.
 */
export function isOverdue(task: AssociationTask): boolean {
    return (
        task.status !== 'done' &&
        !!task.due_date &&
        task.due_date < new Intl.DateTimeFormat('sv-SE').format(new Date())
    );
}
