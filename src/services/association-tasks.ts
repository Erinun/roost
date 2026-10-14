import { supabase } from './supabase';
import type {
    AssociationTask,
    AssociationTaskStatus,
    MeetingDecision,
} from '@/types/association';

const ASSIGNEE_JOIN = 'assignee:profiles(id, username, display_name, avatar_url)';

// ============================================
// Uppgifter
// ============================================

/**
 * Hämta föreningens uppgifter med tilldelad profil.
 * Sorteras på förfallodatum (stigande, utan datum sist) och därefter nyast skapade först.
 */
export async function getTasks(
    associationId: string,
    filters?: { status?: AssociationTaskStatus; assigneeId?: string; workgroupId?: string }
): Promise<AssociationTask[]> {
    let query = supabase
        .from('association_tasks')
        .select(`*, ${ASSIGNEE_JOIN}`)
        .eq('association_id', associationId);

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }
    if (filters?.assigneeId) {
        query = query.eq('assignee_id', filters.assigneeId);
    }
    if (filters?.workgroupId) {
        query = query.eq('workgroup_id', filters.workgroupId);
    }

    const { data, error } = await query
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }

    return (data || []) as unknown as AssociationTask[];
}

/**
 * Hämta uppgifter kopplade till ett beslut, med tilldelad profil
 */
export async function getTasksForDecision(decisionId: string): Promise<AssociationTask[]> {
    const { data, error } = await supabase
        .from('association_tasks')
        .select(`*, ${ASSIGNEE_JOIN}`)
        .eq('decision_id', decisionId);

    if (error) {
        console.error('Error fetching tasks for decision:', error);
        throw error;
    }

    return (data || []) as unknown as AssociationTask[];
}

/**
 * Skapa en ny uppgift
 */
export async function createTask(data: {
    association_id: string;
    title: string;
    description?: string;
    assignee_id?: string | null;
    due_date?: string | null;
    workgroup_id?: string | null;
    decision_id?: string | null;
    created_by: string;
}): Promise<AssociationTask> {
    const { data: task, error } = await supabase
        .from('association_tasks')
        .insert(data as never)
        .select()
        .single();

    if (error) {
        console.error('Error creating task:', error);
        throw error;
    }

    return task as AssociationTask;
}

/**
 * Skapa en uppgift utifrån ett mötesbeslut.
 * Titeln defaultar till beslutstexten (trunkerad till 200 tecken) om ingen titel anges.
 */
export async function createTaskFromDecision(
    decision: MeetingDecision,
    associationId: string,
    createdBy: string,
    overrides?: { title?: string; assignee_id?: string; due_date?: string }
): Promise<AssociationTask> {
    return createTask({
        association_id: associationId,
        title: overrides?.title ?? decision.description.slice(0, 200),
        assignee_id: overrides?.assignee_id,
        due_date: overrides?.due_date,
        decision_id: decision.id,
        created_by: createdBy,
    });
}

/**
 * Uppdatera en uppgift
 */
export async function updateTask(
    id: string,
    updates: Partial<
        Pick<AssociationTask, 'title' | 'description' | 'assignee_id' | 'due_date' | 'workgroup_id'>
    >
): Promise<AssociationTask> {
    const { data, error } = await supabase
        .from('association_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating task:', error);
        throw error;
    }

    return data as AssociationTask;
}

/**
 * Uppdatera en uppgifts status.
 * completed_at sätts när uppgiften markeras som klar och nollställs annars.
 */
export async function updateTaskStatus(
    id: string,
    status: AssociationTaskStatus
): Promise<AssociationTask> {
    const { data, error } = await supabase
        .from('association_tasks')
        .update({
            status,
            completed_at: status === 'done' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating task status:', error);
        throw error;
    }

    return data as AssociationTask;
}

/**
 * Ta bort en uppgift
 */
export async function deleteTask(id: string): Promise<void> {
    const { error } = await supabase
        .from('association_tasks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
}
