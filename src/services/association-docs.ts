import { supabase } from './supabase';
import { uploadFile } from './s3';
import type { AssociationDocument, AssociationPost } from '@/types/association';

const PROFILE_FIELDS = 'id, username, display_name, avatar_url';

// ─── Dokument ──────────────────────────────────────────────────────

/**
 * Hämta föreningens dokument med uppladdarens profil, nyast först.
 */
export async function getDocuments(associationId: string): Promise<AssociationDocument[]> {
    const { data, error } = await supabase
        .from('association_documents')
        .select(`*, uploader:profiles(${PROFILE_FIELDS})`)
        .eq('association_id', associationId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching association documents:', error);
        throw error;
    }

    return (data || []) as AssociationDocument[];
}

/**
 * Ladda upp en fil till S3 och registrera dokumentet i databasen.
 *
 * OBS: Heter uploadAssociationDocument (inte uploadDocument) eftersom
 * uploadDocument redan exporteras från './s3' via services/index.ts.
 */
export async function uploadAssociationDocument(
    file: File,
    data: {
        association_id: string;
        title: string;
        description?: string;
        workgroup_id?: string | null;
        uploaded_by: string;
    }
): Promise<AssociationDocument> {
    const uploadResult = await uploadFile(file, `association-docs/${data.association_id}`);

    const { data: doc, error } = await supabase
        .from('association_documents')
        .insert({
            association_id: data.association_id,
            workgroup_id: data.workgroup_id ?? null,
            title: data.title,
            description: data.description ?? null,
            file_url: uploadResult.url,
            file_name: file.name,
            file_size: file.size,
            uploaded_by: data.uploaded_by,
        } as never)
        .select()
        .single();

    if (error) {
        console.error('Error creating association document:', error);
        throw error;
    }

    return doc as AssociationDocument;
}

/**
 * Ta bort ett dokument (endast databasraden — filen ligger kvar i lagringen).
 */
export async function deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
        .from('association_documents')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting association document:', error);
        throw error;
    }
}

// ─── Kommunikation (inlägg) ────────────────────────────────────────

/**
 * Hämta föreningens inlägg som ett träd:
 * toppinlägg nyast först, svar äldst först under respektive förälder.
 */
export async function getAssociationPosts(associationId: string): Promise<AssociationPost[]> {
    const { data, error } = await supabase
        .from('association_posts')
        .select(`*, author:profiles(${PROFILE_FIELDS})`)
        .eq('association_id', associationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching association posts:', error);
        throw error;
    }

    const posts = (data || []) as AssociationPost[];

    // Data kommer i created_at ASC — svaren behåller därmed äldst-först-ordning.
    const topLevel = posts
        .filter(post => post.parent_post_id === null)
        .map(post => ({
            ...post,
            replies: posts.filter(reply => reply.parent_post_id === post.id),
        }));

    // Toppinlägg nyast först
    topLevel.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return topLevel;
}

/**
 * Skapa ett inlägg eller svar i föreningens kommunikationsflöde.
 */
export async function createAssociationPost(data: {
    association_id: string;
    content: string;
    author_id: string;
    parent_post_id?: string | null;
}): Promise<AssociationPost> {
    const { data: post, error } = await supabase
        .from('association_posts')
        .insert({
            association_id: data.association_id,
            content: data.content,
            author_id: data.author_id,
            parent_post_id: data.parent_post_id ?? null,
        } as never)
        .select(`*, author:profiles(${PROFILE_FIELDS})`)
        .single();

    if (error) {
        console.error('Error creating association post:', error);
        throw error;
    }

    return post as AssociationPost;
}

/**
 * Ta bort ett inlägg (svar tas bort via cascade i databasen).
 */
export async function deleteAssociationPost(id: string): Promise<void> {
    const { error } = await supabase
        .from('association_posts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting association post:', error);
        throw error;
    }
}
