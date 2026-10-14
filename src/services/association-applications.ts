import { supabase } from './supabase';
import type { MemberApplication } from '@/types/association';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Hämta alla medlemsansökningar för en förening (kräver föreningsadmin via RLS).
 */
export async function getMemberApplications(associationId: string): Promise<MemberApplication[]> {
    const { data, error } = await supabase
        .from('member_applications')
        .select('*')
        .eq('association_id', associationId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as MemberApplication[];
}

/**
 * Godkänn en ansökan. Backenden skickar plattformens inbjudningsmejl (eller
 * lägger till ett befintligt konto direkt) och registrerar medlemskapet.
 * Returnerar om ett inbjudningsmejl skickades (false = kontot fanns redan).
 */
export async function approveMemberApplication(applicationId: string): Promise<{ invited: boolean }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Du är inte inloggad');
    }

    const response = await fetch(`${API_URL}/api/associations/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || 'Ansökan kunde inte godkännas');
    }

    return { invited: data.invited !== false };
}

/**
 * Avslå en ansökan (direkt uppdatering, RLS kräver föreningsadmin).
 */
export async function rejectMemberApplication(applicationId: string, handledBy: string): Promise<void> {
    const { error } = await supabase
        .from('member_applications')
        .update({
            status: 'rejected',
            handled_at: new Date().toISOString(),
            handled_by: handledBy,
        })
        .eq('id', applicationId);

    if (error) throw error;
}
