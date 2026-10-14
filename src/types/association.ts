export type AssociationRole = 'admin' | 'internal' | 'member';
export type MeetingStatus = 'planned' | 'held' | 'cancelled';
export type AssociationTaskStatus = 'todo' | 'in_progress' | 'done';
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

export interface AssociationMember {
    id: string;
    association_id: string;
    user_id: string;
    role: AssociationRole;
    joined_at: string;
    profile?: ProfileSummary;
}

export interface AssociationWorkgroup {
    id: string;
    association_id: string;
    name: string;
    description: string | null;
    created_by: string;
    created_at: string;
    members?: ProfileSummary[];
}

export interface AssociationMeeting {
    id: string;
    association_id: string;
    workgroup_id: string | null;
    title: string;
    agenda: string | null;
    minutes: string | null;
    meeting_date: string;
    location: string | null;
    status: MeetingStatus;
    created_by: string;
    created_at: string;
    updated_at: string;
    decisions?: MeetingDecision[];
}

export interface MeetingDecision {
    id: string;
    meeting_id: string;
    description: string;
    created_by: string;
    created_at: string;
}

export interface AssociationTask {
    id: string;
    association_id: string;
    workgroup_id: string | null;
    decision_id: string | null;
    title: string;
    description: string | null;
    assignee_id: string | null;
    due_date: string | null;
    status: AssociationTaskStatus;
    created_by: string;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    assignee?: ProfileSummary | null;
}

export interface AssociationDocument {
    id: string;
    association_id: string;
    workgroup_id: string | null;
    title: string;
    description: string | null;
    file_url: string;
    file_name: string;
    file_size: number | null;
    uploaded_by: string;
    created_at: string;
    uploader?: ProfileSummary;
}

export interface AssociationPost {
    id: string;
    association_id: string;
    author_id: string;
    parent_post_id: string | null;
    content: string;
    is_edited: boolean;
    created_at: string;
    updated_at: string;
    author?: ProfileSummary;
    replies?: AssociationPost[];
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

export type MemberApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface MemberApplication {
    id: string;
    association_id: string;
    name: string;
    email: string;
    phone: string | null;
    message: string | null;
    status: MemberApplicationStatus;
    created_at: string;
    handled_at: string | null;
    handled_by: string | null;
}
