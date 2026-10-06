import { useMemo, useState, lazy, Suspense } from 'react';
import { ArrowRight, Loader2, Pencil, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { GroupWithDetails } from '@/services/group';
import { hasPermission, updateGroup } from '@/services/group';

const RichTextEditor = lazy(() => import('@/components/feed/RichTextEditor'));

// Samma saneringsregler som PostCard
const ALLOWED_TAGS = [
    'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'span', 'div',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];
const FORBID_TAGS = ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'];
const FORBID_ATTR = ['onerror', 'onclick', 'onload', 'onmouseover'];

// Quill lämnar kvar tomma stycken när allt innehåll raderas
function isEmptyContent(html: string | null): boolean {
    if (!html) return true;
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    return stripped.length === 0;
}

interface GroupAboutProps {
    group: GroupWithDetails;
    onStartModules: () => void;
}

export default function GroupAbout({ group, onStartModules }: GroupAboutProps) {
    const canEdit = hasPermission(group.user_role, 'edit_settings');

    const [aboutContent, setAboutContent] = useState<string | null>(group.about_content);
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const sanitizedContent = useMemo(() => {
        if (!aboutContent) return '';
        return DOMPurify.sanitize(aboutContent, {
            ALLOWED_TAGS,
            ALLOWED_ATTR,
            ALLOW_DATA_ATTR: false,
            FORBID_TAGS,
            FORBID_ATTR,
        });
    }, [aboutContent]);

    const handleStartEditing = () => {
        setDraft(aboutContent || '');
        setIsEditing(true);
    };

    const handleSave = async () => {
        const newContent = isEmptyContent(draft) ? null : draft;

        try {
            setIsSaving(true);
            await updateGroup(group.id, { about_content: newContent });
            setAboutContent(newContent);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving about content:', error);
            alert('Det gick inte att spara Om-texten');
        } finally {
            setIsSaving(false);
        }
    };

    const hasContent = !isEmptyContent(aboutContent);

    return (
        <div className="group-about">
            {/* Cover image */}
            {group.cover_url && (
                <img
                    src={group.cover_url}
                    alt=""
                    className="w-full h-48 sm:h-64 object-cover rounded-xl border border-surface-200 dark:border-surface-700 mb-6"
                />
            )}

            {/* Title row */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-50">
                        {group.name}
                    </h1>
                    {group.description && (
                        <p className="text-surface-500 dark:text-surface-400 mt-1">
                            {group.description}
                        </p>
                    )}
                </div>

                {canEdit && !isEditing && (
                    <button
                        onClick={handleStartEditing}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors flex-shrink-0"
                    >
                        <Pencil className="w-4 h-4" />
                        <span className="hidden sm:inline">Redigera</span>
                    </button>
                )}
            </div>

            {/* Editing mode */}
            {isEditing ? (
                <div>
                    <Suspense
                        fallback={
                            <div className="h-64 animate-pulse bg-surface-100 dark:bg-surface-800 rounded-xl" />
                        }
                    >
                        <RichTextEditor
                            value={draft}
                            onChange={setDraft}
                            initialValue={aboutContent || ''}
                            placeholder="Berätta om din community: syfte, upplägg, regler, länkar..."
                        />
                    </Suspense>
                    <div className="flex items-center gap-3 mt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Spara
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            disabled={isSaving}
                            className="px-4 py-2.5 text-surface-600 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                            Avbryt
                        </button>
                    </div>
                </div>
            ) : hasContent ? (
                /* About content */
                <div
                    className="about-content text-surface-700 dark:text-surface-300 break-words"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
            ) : (
                /* Empty state */
                <div className="border border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-surface-400 dark:text-surface-500" />
                    </div>
                    {canEdit ? (
                        <>
                            <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-1">
                                Berätta om din community
                            </h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400 mb-4 max-w-md mx-auto">
                                Skriv en välkomsttext som beskriver vad klassrummet handlar om,
                                vad medlemmarna kan förvänta sig och hur de kommer igång.
                            </p>
                            <button
                                onClick={handleStartEditing}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                Skriv Om-text
                            </button>
                        </>
                    ) : (
                        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-md mx-auto">
                            Det finns ingen presentation av det här klassrummet ännu.
                        </p>
                    )}
                </div>
            )}

            {/* CTA to modules */}
            {!isEditing && (
                <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                    <button
                        onClick={onStartModules}
                        className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        Börja med modulerna
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Typografi för den rika Om-texten (ingen tailwind typography-plugin i projektet) */}
            <style>{`
        .group-about .about-content h1 { font-size: 1.5rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
        .group-about .about-content h2 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .group-about .about-content h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.4rem; }
        .group-about .about-content p { margin: 0.5rem 0; line-height: 1.7; }
        .group-about .about-content ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .group-about .about-content ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .group-about .about-content li { margin: 0.25rem 0; }
        .group-about .about-content a { color: var(--color-primary-600, #0284c7); text-decoration: underline; }
        .dark .group-about .about-content a { color: var(--color-primary-400, #38bdf8); }
        .group-about .about-content blockquote { border-left: 3px solid #d4d4d4; padding-left: 1rem; margin: 0.75rem 0; font-style: italic; }
        .dark .group-about .about-content blockquote { border-color: #525252; }
        .group-about .about-content pre { background: #f5f5f5; border-radius: 0.5rem; padding: 0.75rem; overflow-x: auto; margin: 0.75rem 0; }
        .dark .group-about .about-content pre { background: #262626; }
      `}</style>
        </div>
    );
}
