import { supabase } from './supabase';
import type {
    Association,
    AssociationMember,
    AssociationRole,
    AssociationWorkgroup,
    ProfileSummary,
} from '@/types/association';

// ============================================
// Föreningar
// ============================================

/**
 * Hämta alla föreningar som en användare är medlem i, med användarens roll
 */
export async function getMyAssociations(
    userId: string
): Promise<(Association & { my_role: AssociationRole })[]> {
    const { data, error } = await supabase
        .from('association_members')
        .select('role, association:associations(*)')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching my associations:', error);
        throw error;
    }

    const rows = (data || []) as unknown as Array<{
        role: AssociationRole;
        association: Association;
    }>;

    return rows
        .filter(row => row.association)
        .map(row => ({ ...row.association, my_role: row.role }));
}

/**
 * Hämta alla föreningar (för plattformsadmin)
 */
export async function getAllAssociations(): Promise<Association[]> {
    const { data, error } = await supabase
        .from('associations')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching associations:', error);
        throw error;
    }

    return (data || []) as Association[];
}

/**
 * Hämta en förening via slug
 */
export async function getAssociationBySlug(slug: string): Promise<Association | null> {
    const { data, error } = await supabase
        .from('associations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

    if (error) {
        console.error('Error fetching association:', error);
        throw error;
    }

    return data as Association | null;
}

/**
 * Skapa en ny förening. Skaparen läggs till som admin i association_members.
 */
export async function createAssociation(data: {
    name: string;
    slug: string;
    description?: string;
    contact_info?: string;
    created_by: string;
}): Promise<Association> {
    const { data: association, error } = await supabase
        .from('associations')
        .insert(data as never)
        .select()
        .single();

    if (error) {
        console.error('Error creating association:', error);
        throw error;
    }

    const newAssociation = association as Association;

    const { error: memberError } = await supabase
        .from('association_members')
        .insert({
            association_id: newAssociation.id,
            user_id: data.created_by,
            role: 'admin',
        } as never);

    if (memberError) {
        console.error('Error adding creator as association admin:', memberError);
        throw memberError;
    }

    return newAssociation;
}

/**
 * Uppdatera en förening
 */
export async function updateAssociation(
    id: string,
    updates: Partial<Pick<Association, 'name' | 'description' | 'contact_info' | 'avatar_url'>>
): Promise<Association> {
    const { data, error } = await supabase
        .from('associations')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating association:', error);
        throw error;
    }

    return data as Association;
}

/**
 * Ta bort en förening (kaskaderar till medlemmar, arbetsgrupper m.m.)
 */
export async function deleteAssociation(id: string): Promise<void> {
    const { error } = await supabase
        .from('associations')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting association:', error);
        throw error;
    }
}

// ============================================
// Medlemmar
// ============================================

/**
 * Hämta föreningens medlemmar med profilinfo
 */
export async function getAssociationMembers(associationId: string): Promise<AssociationMember[]> {
    const { data, error } = await supabase
        .from('association_members')
        .select('*, profile:profiles(id, username, display_name, avatar_url)')
        .eq('association_id', associationId)
        .order('joined_at');

    if (error) {
        console.error('Error fetching association members:', error);
        throw error;
    }

    return (data || []) as unknown as AssociationMember[];
}

/**
 * Hämta användarens roll i en förening (null om inte medlem)
 */
export async function getMyAssociationRole(
    associationId: string,
    userId: string
): Promise<AssociationRole | null> {
    const { data, error } = await supabase
        .from('association_members')
        .select('role')
        .eq('association_id', associationId)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching association role:', error);
        throw error;
    }

    return (data as { role: AssociationRole } | null)?.role ?? null;
}

/**
 * Lägg till en medlem i en förening
 */
export async function addAssociationMember(
    associationId: string,
    userId: string,
    role: AssociationRole
): Promise<AssociationMember> {
    const { data, error } = await supabase
        .from('association_members')
        .insert({
            association_id: associationId,
            user_id: userId,
            role,
        } as never)
        .select()
        .single();

    if (error) {
        console.error('Error adding association member:', error);
        throw error;
    }

    return data as AssociationMember;
}

/**
 * Uppdatera en medlems roll
 */
export async function updateMemberRole(memberId: string, role: AssociationRole): Promise<void> {
    const { error } = await supabase
        .from('association_members')
        .update({ role } as never)
        .eq('id', memberId);

    if (error) {
        console.error('Error updating member role:', error);
        throw error;
    }
}

/**
 * Ta bort en medlem ur en förening
 */
export async function removeAssociationMember(memberId: string): Promise<void> {
    const { error } = await supabase
        .from('association_members')
        .delete()
        .eq('id', memberId);

    if (error) {
        console.error('Error removing association member:', error);
        throw error;
    }
}

/**
 * Sök profiler på användarnamn eller visningsnamn
 */
export async function searchProfiles(query: string): Promise<ProfileSummary[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

    if (error) {
        console.error('Error searching profiles:', error);
        throw error;
    }

    return (data || []) as ProfileSummary[];
}

// ============================================
// Arbetsgrupper
// ============================================

/**
 * Hämta föreningens arbetsgrupper
 */
export async function getWorkgroups(associationId: string): Promise<AssociationWorkgroup[]> {
    const { data, error } = await supabase
        .from('association_workgroups')
        .select('*')
        .eq('association_id', associationId)
        .order('name');

    if (error) {
        console.error('Error fetching workgroups:', error);
        throw error;
    }

    return (data || []) as AssociationWorkgroup[];
}

/**
 * Skapa en arbetsgrupp
 */
export async function createWorkgroup(data: {
    association_id: string;
    name: string;
    description?: string;
    created_by: string;
}): Promise<AssociationWorkgroup> {
    const { data: workgroup, error } = await supabase
        .from('association_workgroups')
        .insert(data as never)
        .select()
        .single();

    if (error) {
        console.error('Error creating workgroup:', error);
        throw error;
    }

    return workgroup as AssociationWorkgroup;
}

/**
 * Ta bort en arbetsgrupp
 */
export async function deleteWorkgroup(id: string): Promise<void> {
    const { error } = await supabase
        .from('association_workgroups')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting workgroup:', error);
        throw error;
    }
}

/**
 * Hämta arbetsgruppens medlemmar (profiler)
 */
export async function getWorkgroupMembers(workgroupId: string): Promise<ProfileSummary[]> {
    const { data, error } = await supabase
        .from('workgroup_members')
        .select('profile:profiles(id, username, display_name, avatar_url)')
        .eq('workgroup_id', workgroupId);

    if (error) {
        console.error('Error fetching workgroup members:', error);
        throw error;
    }

    const rows = (data || []) as unknown as Array<{ profile: ProfileSummary }>;
    return rows.map(row => row.profile).filter(Boolean);
}

/**
 * Lägg till en medlem i en arbetsgrupp
 */
export async function addWorkgroupMember(workgroupId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('workgroup_members')
        .insert({
            workgroup_id: workgroupId,
            user_id: userId,
        } as never);

    if (error) {
        console.error('Error adding workgroup member:', error);
        throw error;
    }
}

/**
 * Ta bort en medlem ur en arbetsgrupp
 */
export async function removeWorkgroupMember(workgroupId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('workgroup_members')
        .delete()
        .eq('workgroup_id', workgroupId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error removing workgroup member:', error);
        throw error;
    }
}
