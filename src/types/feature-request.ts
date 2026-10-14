import type {
    Profile,
    FeatureRequest,
    FeatureRequestComment,
    FeatureRequestStatus,
    FeatureRequestType,
} from './database';

// Feature request with author details (for cards)
export interface FeatureRequestCardData {
    id: string;
    title: string;
    description: string;
    type: FeatureRequestType;
    status: FeatureRequestStatus;
    vote_count: number;
    comment_count: number;
    is_pinned: boolean;
    created_at: string;
    author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
    user_has_voted?: boolean;
}

// Full detail view
export interface FeatureRequestWithDetails extends FeatureRequest {
    author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
    user_has_voted?: boolean;
}

// Comment with author
export interface FeatureRequestCommentWithAuthor extends FeatureRequestComment {
    author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'role'>;
    replies?: FeatureRequestCommentWithAuthor[];
}

// Filter options
export interface FeatureRequestFilters {
    status?: FeatureRequestStatus;
    statuses?: FeatureRequestStatus[];
    type?: FeatureRequestType;
    sortBy?: 'newest' | 'oldest' | 'most_votes' | 'most_comments';
    search?: string;
    pinnedOnly?: boolean;
}

// Open statuses (not released/declined)
export const OPEN_STATUSES: FeatureRequestStatus[] = [
    'under_review',
    'planned',
    'in_progress',
];

// Status display info (matches screenshot colors)
export const FEATURE_REQUEST_STATUS_INFO: Record<FeatureRequestStatus, {
    label: string;
    color: string;
    bgColor: string;
    dotColor: string;
}> = {
    under_review: {
        label: 'Under granskning',
        color: 'text-surface-900 dark:text-warning',
        bgColor: 'bg-warning/20 dark:bg-warning/20',
        dotColor: 'bg-warning',
    },
    planned: {
        label: 'Planerad',
        color: 'text-primary-700 dark:text-primary-200',
        bgColor: 'bg-primary-100 dark:bg-primary-900',
        dotColor: 'bg-primary-500',
    },
    in_progress: {
        label: 'Pågår',
        color: 'text-surface-900 dark:text-info',
        bgColor: 'bg-info/15 dark:bg-info/20',
        dotColor: 'bg-info',
    },
    released: {
        label: 'Släppt',
        color: 'text-surface-900 dark:text-success',
        bgColor: 'bg-success/15 dark:bg-success/20',
        dotColor: 'bg-success',
    },
    declined: {
        label: 'Avböjd',
        color: 'text-surface-900 dark:text-error-soft',
        bgColor: 'bg-error/15 dark:bg-error/20',
        dotColor: 'bg-error',
    },
    duplicate: {
        label: 'Dubblett',
        color: 'text-surface-600 dark:text-surface-400',
        bgColor: 'bg-surface-100 dark:bg-surface-800',
        dotColor: 'bg-surface-400',
    },
};

// Type display info
export const FEATURE_REQUEST_TYPE_INFO: Record<FeatureRequestType, {
    label: string;
    color: string;
    bgColor: string;
}> = {
    feature_request: {
        label: 'Funktion',
        color: 'text-white',
        bgColor: 'bg-brand-purple',
    },
    bug_report: {
        label: 'Bugg',
        color: 'text-surface-900 dark:text-error-soft',
        bgColor: 'bg-error/15 dark:bg-error/20',
    },
    improvement: {
        label: 'Förbättring',
        color: 'text-surface-900 dark:text-info',
        bgColor: 'bg-info/15 dark:bg-info/20',
    },
};

// Kanban column statuses (4 main columns for the board)
export const KANBAN_COLUMNS: FeatureRequestStatus[] = [
    'under_review',
    'planned',
    'in_progress',
    'released',
];
