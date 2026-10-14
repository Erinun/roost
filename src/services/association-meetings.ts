import { supabase } from './supabase';
import type { AssociationMeeting, MeetingDecision } from '@/types/association';

// ============================================
// Möten
// ============================================

/**
 * Hämta föreningens möten, senaste mötesdatum först
 */
export async function getMeetings(associationId: string): Promise<AssociationMeeting[]> {
    const { data, error } = await supabase
        .from('association_meetings')
        .select('*')
        .eq('association_id', associationId)
        .order('meeting_date', { ascending: false });

    if (error) {
        console.error('Error fetching meetings:', error);
        throw error;
    }

    return (data || []) as AssociationMeeting[];
}

/**
 * Hämta ett möte med dess beslut (null om det inte finns)
 */
export async function getMeetingById(id: string): Promise<AssociationMeeting | null> {
    const { data, error } = await supabase
        .from('association_meetings')
        .select('*, decisions:meeting_decisions(*)')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error('Error fetching meeting:', error);
        throw error;
    }

    return data as unknown as AssociationMeeting | null;
}

/**
 * Skapa ett nytt möte
 */
export async function createMeeting(data: {
    association_id: string;
    title: string;
    meeting_date: string;
    agenda?: string;
    location?: string;
    workgroup_id?: string | null;
    created_by: string;
}): Promise<AssociationMeeting> {
    const { data: meeting, error } = await supabase
        .from('association_meetings')
        .insert(data as never)
        .select()
        .single();

    if (error) {
        console.error('Error creating meeting:', error);
        throw error;
    }

    return meeting as AssociationMeeting;
}

/**
 * Uppdatera ett möte
 */
export async function updateMeeting(
    id: string,
    updates: Partial<
        Pick<
            AssociationMeeting,
            'title' | 'agenda' | 'minutes' | 'meeting_date' | 'location' | 'status' | 'workgroup_id'
        >
    >
): Promise<AssociationMeeting> {
    const { data, error } = await supabase
        .from('association_meetings')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating meeting:', error);
        throw error;
    }

    return data as AssociationMeeting;
}

/**
 * Ta bort ett möte (kaskaderar till beslut)
 */
export async function deleteMeeting(id: string): Promise<void> {
    const { error } = await supabase
        .from('association_meetings')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting meeting:', error);
        throw error;
    }
}

// ============================================
// Beslut
// ============================================

/**
 * Lägg till ett beslut till ett möte
 */
export async function addDecision(data: {
    meeting_id: string;
    description: string;
    created_by: string;
}): Promise<MeetingDecision> {
    const { data: decision, error } = await supabase
        .from('meeting_decisions')
        .insert(data as never)
        .select()
        .single();

    if (error) {
        console.error('Error adding decision:', error);
        throw error;
    }

    return decision as MeetingDecision;
}

/**
 * Ta bort ett beslut
 */
export async function deleteDecision(id: string): Promise<void> {
    const { error } = await supabase
        .from('meeting_decisions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting decision:', error);
        throw error;
    }
}
