import { supabase } from './supabase';
import type {
    AssociationActivity,
    MemberNews,
    MemberQuestion,
    MemberQuestionReply,
    MemberQuestionStatus,
} from '@/types/association';

const PROFILE_FIELDS = 'id, username, display_name, avatar_url';

// ─── Aktiviteter ───────────────────────────────────────────────────

/**
 * Hämta föreningens aktiviteter, tidigast start först.
 */
export async function getActivities(
    associationId: string,
    opts?: { onlyPublished?: boolean; upcomingOnly?: boolean }
): Promise<AssociationActivity[]> {
    let query = supabase
        .from('association_activities')
        .select('*')
        .eq('association_id', associationId)
        .order('starts_at', { ascending: true });

    if (opts?.onlyPublished) {
        query = query.eq('is_published', true);
    }

    if (opts?.upcomingOnly) {
        query = query.gte('starts_at', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching association activities:', error);
        throw error;
    }

    return (data || []) as AssociationActivity[];
}

/**
 * Skapa en aktivitet (opublicerad tills publishActivity anropas).
 */
export async function createActivity(data: {
    association_id: string;
    title: string;
    starts_at: string;
    ends_at?: string | null;
    description?: string;
    location?: string;
    created_by: string;
}): Promise<AssociationActivity> {
    const { data: activity, error } = await supabase
        .from('association_activities')
        .insert({
            association_id: data.association_id,
            title: data.title,
            starts_at: data.starts_at,
            ends_at: data.ends_at ?? null,
            description: data.description ?? null,
            location: data.location ?? null,
            created_by: data.created_by,
        } as never)
        .select()
        .single();

    if (error) {
        console.error('Error creating activity:', error);
        throw error;
    }

    return activity as AssociationActivity;
}

/**
 * Uppdatera en aktivitets fält.
 */
export async function updateActivity(
    id: string,
    updates: Partial<Pick<AssociationActivity, 'title' | 'description' | 'starts_at' | 'ends_at' | 'location'>>
): Promise<AssociationActivity> {
    const { data, error } = await supabase
        .from('association_activities')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating activity:', error);
        throw error;
    }

    return data as AssociationActivity;
}

/**
 * Publicera en aktivitet så att medlemmar ser den i portalen.
 */
export async function publishActivity(id: string): Promise<AssociationActivity> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('association_activities')
        .update({ is_published: true, published_at: now, updated_at: now } as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error publishing activity:', error);
        throw error;
    }

    return data as AssociationActivity;
}

/**
 * Avpublicera en aktivitet.
 */
export async function unpublishActivity(id: string): Promise<AssociationActivity> {
    const { data, error } = await supabase
        .from('association_activities')
        .update({
            is_published: false,
            published_at: null,
            updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error unpublishing activity:', error);
        throw error;
    }

    return data as AssociationActivity;
}

/**
 * Ta bort en aktivitet (anmälningar tas bort via cascade).
 */
export async function deleteActivity(id: string): Promise<void> {
    const { error } = await supabase
        .from('association_activities')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting activity:', error);
        throw error;
    }
}

// ─── Anmälningar ───────────────────────────────────────────────────

/**
 * Antal anmälningar per aktivitet. Tom input ger tomt objekt utan query.
 */
export async function getSignupCounts(activityIds: string[]): Promise<Record<string, number>> {
    if (activityIds.length === 0) {
        return {};
    }

    const { data, error } = await supabase
        .from('activity_signups')
        .select('activity_id')
        .in('activity_id', activityIds);

    if (error) {
        console.error('Error fetching signup counts:', error);
        throw error;
    }

    const counts: Record<string, number> = {};
    ((data || []) as Array<{ activity_id: string }>).forEach(row => {
        counts[row.activity_id] = (counts[row.activity_id] || 0) + 1;
    });

    return counts;
}

/**
 * Vilka av de angivna aktiviteterna användaren är anmäld till.
 */
export async function getMySignups(userId: string, activityIds: string[]): Promise<string[]> {
    if (activityIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('activity_signups')
        .select('activity_id')
        .eq('user_id', userId)
        .in('activity_id', activityIds);

    if (error) {
        console.error('Error fetching user signups:', error);
        throw error;
    }

    return ((data || []) as Array<{ activity_id: string }>).map(row => row.activity_id);
}

/**
 * Anmäl en användare till en aktivitet.
 */
export async function signUpForActivity(activityId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('activity_signups')
        .insert({ activity_id: activityId, user_id: userId } as never);

    if (error) {
        console.error('Error signing up for activity:', error);
        throw error;
    }
}

/**
 * Avanmäl en användare från en aktivitet.
 */
export async function cancelSignup(activityId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('activity_signups')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error cancelling signup:', error);
        throw error;
    }
}

// ─── Nyheter ───────────────────────────────────────────────────────

/**
 * Hämta föreningens nyheter.
 * onlyPublished: endast publicerade, senast publicerad först.
 * Annars: utkast överst (status ASC), därefter nyast skapad först.
 */
export async function getNews(
    associationId: string,
    opts?: { onlyPublished?: boolean }
): Promise<MemberNews[]> {
    let query = supabase
        .from('member_news')
        .select('*')
        .eq('association_id', associationId);

    if (opts?.onlyPublished) {
        query = query
            .eq('status', 'published')
            .order('published_at', { ascending: false });
    } else {
        query = query
            .order('status', { ascending: true })
            .order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching member news:', error);
        throw error;
    }

    return (data || []) as MemberNews[];
}

/**
 * Hämta en nyhet, eller null om den inte finns.
 */
export async function getNewsById(id: string): Promise<MemberNews | null> {
    const { data, error } = await supabase
        .from('member_news')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error('Error fetching news item:', error);
        throw error;
    }

    return (data as MemberNews | null) ?? null;
}

/**
 * Skapa en nyhet (börjar som utkast).
 */
export async function createNews(data: {
    association_id: string;
    title: string;
    content: string;
    created_by: string;
}): Promise<MemberNews> {
    const { data: news, error } = await supabase
        .from('member_news')
        .insert({
            association_id: data.association_id,
            title: data.title,
            content: data.content,
            created_by: data.created_by,
        } as never)
        .select()
        .single();

    if (error) {
        console.error('Error creating news:', error);
        throw error;
    }

    return news as MemberNews;
}

/**
 * Uppdatera en nyhets titel/innehåll.
 */
export async function updateNews(
    id: string,
    updates: Partial<Pick<MemberNews, 'title' | 'content'>>
): Promise<MemberNews> {
    const { data, error } = await supabase
        .from('member_news')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating news:', error);
        throw error;
    }

    return data as MemberNews;
}

/**
 * Publicera en nyhet.
 */
export async function publishNews(id: string): Promise<MemberNews> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('member_news')
        .update({ status: 'published', published_at: now, updated_at: now } as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error publishing news:', error);
        throw error;
    }

    return data as MemberNews;
}

/**
 * Avpublicera en nyhet (blir utkast igen).
 */
export async function unpublishNews(id: string): Promise<MemberNews> {
    const { data, error } = await supabase
        .from('member_news')
        .update({
            status: 'draft',
            published_at: null,
            updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error unpublishing news:', error);
        throw error;
    }

    return data as MemberNews;
}

/**
 * Ta bort en nyhet.
 */
export async function deleteNews(id: string): Promise<void> {
    const { error } = await supabase
        .from('member_news')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting news:', error);
        throw error;
    }
}

// ─── Medlemsfrågor ─────────────────────────────────────────────────

/**
 * Hämta föreningens medlemsfrågor med frågeställarens profil, nyast först.
 */
export async function getQuestions(associationId: string): Promise<MemberQuestion[]> {
    const { data, error } = await supabase
        .from('member_questions')
        .select(`*, author:profiles(${PROFILE_FIELDS})`)
        .eq('association_id', associationId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching member questions:', error);
        throw error;
    }

    return (data || []) as MemberQuestion[];
}

/**
 * Hämta en användares egna frågor, nyast först.
 */
export async function getMyQuestions(userId: string): Promise<MemberQuestion[]> {
    const { data, error } = await supabase
        .from('member_questions')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user questions:', error);
        throw error;
    }

    return (data || []) as MemberQuestion[];
}

/**
 * Hämta en fråga inklusive svar (äldst först), eller null om den inte finns.
 */
export async function getQuestionById(id: string): Promise<MemberQuestion | null> {
    const { data, error } = await supabase
        .from('member_questions')
        .select(`*, author:profiles(${PROFILE_FIELDS}), replies:member_question_replies(*, author:profiles(${PROFILE_FIELDS}))`)
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error('Error fetching question:', error);
        throw error;
    }

    if (!data) {
        return null;
    }

    const question = data as MemberQuestion;

    if (question.replies) {
        question.replies = [...question.replies].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }

    return question;
}

/**
 * Skapa en medlemsfråga (status blir 'open' via databasens default).
 */
export async function createQuestion(data: {
    association_id: string;
    author_id: string;
    subject: string;
    content: string;
}): Promise<MemberQuestion> {
    const { data: question, error } = await supabase
        .from('member_questions')
        .insert({
            association_id: data.association_id,
            author_id: data.author_id,
            subject: data.subject,
            content: data.content,
        } as never)
        .select()
        .single();

    if (error) {
        console.error('Error creating question:', error);
        throw error;
    }

    return question as MemberQuestion;
}

/**
 * Lägg till ett svar på en fråga.
 * markAnswered=true markerar även frågan som besvarad.
 */
export async function addQuestionReply(
    data: { question_id: string; author_id: string; content: string },
    markAnswered?: boolean
): Promise<MemberQuestionReply> {
    const { data: reply, error } = await supabase
        .from('member_question_replies')
        .insert({
            question_id: data.question_id,
            author_id: data.author_id,
            content: data.content,
        } as never)
        .select()
        .single();

    if (error) {
        console.error('Error adding question reply:', error);
        throw error;
    }

    if (markAnswered === true) {
        const { error: statusError } = await supabase
            .from('member_questions')
            .update({ status: 'answered', updated_at: new Date().toISOString() } as never)
            .eq('id', data.question_id);

        if (statusError) {
            console.error('Error marking question as answered:', statusError);
            throw statusError;
        }
    }

    return reply as MemberQuestionReply;
}

/**
 * Uppdatera en frågas status.
 */
export async function updateQuestionStatus(id: string, status: MemberQuestionStatus): Promise<void> {
    const { error } = await supabase
        .from('member_questions')
        .update({ status, updated_at: new Date().toISOString() } as never)
        .eq('id', id);

    if (error) {
        console.error('Error updating question status:', error);
        throw error;
    }
}
