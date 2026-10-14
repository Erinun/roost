// Typer kopierade från roost/src/types/association.ts.
// Medlemsportalen är en separat kodbas; dupliceringen är avsiktlig.

export type AssociationRole = 'admin' | 'internal' | 'member';
export type MemberNewsStatus = 'draft' | 'published';
export type MemberQuestionStatus = 'open' | 'answered' | 'closed';

export interface ProfileSummary {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
}

export interface Association {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    contact_info: string | null;
    avatar_url: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface AssociationActivity {
    id: string;
    association_id: string;
    title: string;
    description: string | null;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    is_published: boolean;
    published_at: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    signup_count?: number;
    has_signed_up?: boolean;
}

export interface MemberNews {
    id: string;
    association_id: string;
    title: string;
    content: string;
    status: MemberNewsStatus;
    published_at: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface MemberQuestion {
    id: string;
    association_id: string;
    author_id: string;
    subject: string;
    content: string;
    status: MemberQuestionStatus;
    created_at: string;
    updated_at: string;
    author?: ProfileSummary;
    replies?: MemberQuestionReply[];
}

export interface MemberQuestionReply {
    id: string;
    question_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author?: ProfileSummary;
}
