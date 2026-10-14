import type {
    Profile,
    Showcase,
    ShowcaseImage,
    ShowcaseTag,
    ShowcaseReview,
    ShowcaseCategory,
    ShowcaseStatus,
} from './database';

// Showcase with author and related data
export interface ShowcaseWithDetails extends Showcase {
    author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
    images: ShowcaseImage[];
    tags: ShowcaseTag[];
    user_has_voted?: boolean;
    user_review?: ShowcaseReviewWithAuthor | null;
}

// Review with author profile
export interface ShowcaseReviewWithAuthor extends ShowcaseReview {
    author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

// Showcase card display (lighter version for lists)
export interface ShowcaseCardData {
    id: string;
    title: string;
    tagline: string;
    thumbnail_url: string | null;
    category: ShowcaseCategory;
    vote_count: number;
    review_count: number;
    average_rating: number;
    launch_date: string | null;
    is_featured: boolean;
    author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
    tags: Pick<ShowcaseTag, 'id' | 'name' | 'slug' | 'color'>[];
    user_has_voted?: boolean;
}

// Filter options for showcase listing
export interface ShowcaseFilters {
    category?: ShowcaseCategory;
    tagIds?: string[];
    sortBy?: 'newest' | 'votes' | 'rating' | 'featured';
    search?: string;
}

// Pagination options
export interface ShowcasePaginationOptions {
    page?: number;
    pageSize?: number;
}

// Admin moderation view
export interface ShowcaseForModeration extends Showcase {
    author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
    moderator?: Pick<Profile, 'id' | 'username' | 'display_name'> | null;
}

// Create/Update form data
export interface ShowcaseFormData {
    title: string;
    tagline: string;
    description: string;
    url: string;
    category: ShowcaseCategory;
    tech_stack: string[];
    tagIds: string[];
    thumbnailUrl?: string;
    imageUrls?: string[];
}

// Showcase stats for admin dashboard
export interface ShowcaseStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    featured: number;
    thisMonth: number;
}

// Category display info
// Färgerna är profilens nio färger (Aktiespararnas grafiska profil 2023),
// se docs/redesign/designsystem.md. "Övrigt" använder neutralen surface-600.
export const SHOWCASE_CATEGORY_INFO: Record<ShowcaseCategory, { label: string; icon: string; color: string }> = {
    web_app: { label: 'Webbapp', icon: 'Globe', color: '#185DA9' },
    mobile_app: { label: 'Mobilapp', icon: 'Smartphone', color: '#652FA0' },
    saas: { label: 'SaaS', icon: 'Cloud', color: '#159EDA' },
    tool: { label: 'Verktyg', icon: 'Wrench', color: '#F5A118' },
    api: { label: 'API', icon: 'Code', color: '#32D7CD' },
    website: { label: 'Webbplats', icon: 'Layout', color: '#EE0181' },
    game: { label: 'Spel', icon: 'Gamepad2', color: '#EC5345' },
    extension: { label: 'Tillägg', icon: 'Puzzle', color: '#FBC231' },
    other: { label: 'Övrigt', icon: 'Package', color: '#4A5B73' },
};

// Status display info
// Klasserna följer badge-mönstret i src/index.css: tonad statusyta + mörk text
// i ljust läge, accentfärg i mörkt läge. "Utvalt" = brand-purple med vit text.
export const SHOWCASE_STATUS_INFO: Record<ShowcaseStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Väntar på granskning', color: 'text-surface-900 dark:text-warning', bgColor: 'bg-warning/20 dark:bg-warning/20' },
    approved: { label: 'Godkänt', color: 'text-surface-900 dark:text-success', bgColor: 'bg-success/15 dark:bg-success/20' },
    rejected: { label: 'Avvisat', color: 'text-surface-900 dark:text-error-soft', bgColor: 'bg-error/15 dark:bg-error/20' },
    featured: { label: 'Utvalt', color: 'text-white', bgColor: 'bg-brand-purple' },
};
