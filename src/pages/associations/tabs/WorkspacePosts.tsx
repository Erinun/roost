import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
    getAssociationPosts,
    createAssociationPost,
    deleteAssociationPost,
} from '@/services/association-docs';
import type { AssociationPost, ProfileSummary } from '@/types/association';
import type { WorkspaceContext } from '../AssociationWorkspace';

function authorName(author?: ProfileSummary): string {
    return author?.display_name || author?.username || 'Okänd';
}

function PostAvatar({ author }: { author?: ProfileSummary }) {
    const name = authorName(author);

    return author?.avatar_url ? (
        <img
            src={author.avatar_url}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
    ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

interface PostHeaderProps {
    post: AssociationPost;
    canDelete: boolean;
    isDeleting: boolean;
    onDelete: () => void;
}

function PostHeader({ post, canDelete, isDeleting, onDelete }: PostHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
                <span className="font-medium text-sm text-surface-900 dark:text-surface-50">
                    {authorName(post.author)}
                </span>
                <span className="text-xs text-surface-500 dark:text-surface-400 ml-2">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: sv })}
                </span>
            </div>
            {canDelete && (
                <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-error-strong dark:hover:text-error-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
                    title="Ta bort"
                    aria-label="Ta bort inlägg"
                >
                    {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                </button>
            )}
        </div>
    );
}

export default function WorkspacePosts() {
    const { association, role, userId } = useOutletContext<WorkspaceContext>();
    const [posts, setPosts] = useState<AssociationPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newContent, setNewContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        try {
            setPosts(await getAssociationPosts(association.id));
            setError(null);
        } catch (err) {
            console.error('Error fetching association posts:', err);
            setError('Det gick inte att hämta inläggen.');
        } finally {
            setIsLoading(false);
        }
    }, [association.id]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const canDelete = (post: AssociationPost) => role === 'admin' || post.author_id === userId;

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContent.trim()) return;

        setIsPosting(true);
        try {
            await createAssociationPost({
                association_id: association.id,
                content: newContent.trim(),
                author_id: userId,
            });
            setNewContent('');
            await fetchPosts();
        } catch (err) {
            console.error('Error creating post:', err);
            setError('Det gick inte att publicera inlägget.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleCreateReply = async (parentPostId: string) => {
        if (!replyContent.trim()) return;

        setIsReplying(true);
        try {
            await createAssociationPost({
                association_id: association.id,
                content: replyContent.trim(),
                author_id: userId,
                parent_post_id: parentPostId,
            });
            setReplyingToId(null);
            setReplyContent('');
            await fetchPosts();
        } catch (err) {
            console.error('Error creating reply:', err);
            setError('Det gick inte att publicera svaret.');
        } finally {
            setIsReplying(false);
        }
    };

    const handleDelete = async (post: AssociationPost) => {
        if (!window.confirm('Vill du ta bort inlägget?')) return;

        setDeletingId(post.id);
        try {
            await deleteAssociationPost(post.id);
            await fetchPosts();
        } catch (err) {
            console.error('Error deleting post:', err);
            setError('Det gick inte att ta bort inlägget.');
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-6">
                Kommunikation
            </h2>

            {error && <div className="alert-error mb-6">{error}</div>}

            {/* Nytt inlägg */}
            <form onSubmit={handleCreatePost} className="card p-4 mb-6">
                <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Skriv ett inlägg…"
                    rows={3}
                    className="input resize-none"
                />
                <div className="flex justify-end mt-3">
                    <button
                        type="submit"
                        disabled={isPosting || !newContent.trim()}
                        className="btn-primary"
                    >
                        {isPosting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Posta
                    </button>
                </div>
            </form>

            {/* Flöde */}
            {posts.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                    </div>
                    <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-1">
                        Inga inlägg än
                    </h3>
                    <p className="text-surface-600 dark:text-surface-300">
                        Skriv det första inlägget till arbetsytan.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <div key={post.id} className="card p-4">
                            <div className="flex items-start gap-3">
                                <PostAvatar author={post.author} />
                                <div className="flex-1 min-w-0">
                                    <PostHeader
                                        post={post}
                                        canDelete={canDelete(post)}
                                        isDeleting={deletingId === post.id}
                                        onDelete={() => handleDelete(post)}
                                    />
                                    <p className="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-wrap break-words mt-1">
                                        {post.content}
                                    </p>

                                    {/* Svara (endast på toppinlägg) */}
                                    {replyingToId !== post.id && (
                                        <button
                                            onClick={() => {
                                                setReplyingToId(post.id);
                                                setReplyContent('');
                                            }}
                                            className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline underline-offset-2 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm"
                                        >
                                            Svara
                                        </button>
                                    )}

                                    {/* Inline-svarsformulär */}
                                    {replyingToId === post.id && (
                                        <div className="mt-3">
                                            <textarea
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="Skriv ett svar…"
                                                rows={2}
                                                className="input resize-none"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setReplyingToId(null);
                                                        setReplyContent('');
                                                    }}
                                                    className="btn-ghost"
                                                >
                                                    Avbryt
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCreateReply(post.id)}
                                                    disabled={isReplying || !replyContent.trim()}
                                                    className="btn-primary"
                                                >
                                                    {isReplying && (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    )}
                                                    Svara
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Svar — indragna under toppinlägget, ingen svarsknapp */}
                                    {post.replies && post.replies.length > 0 && (
                                        <div className="mt-3 space-y-3 border-l-2 border-surface-200 dark:border-surface-700 pl-4">
                                            {post.replies.map((reply) => (
                                                <div key={reply.id} className="flex items-start gap-3">
                                                    <PostAvatar author={reply.author} />
                                                    <div className="flex-1 min-w-0">
                                                        <PostHeader
                                                            post={reply}
                                                            canDelete={canDelete(reply)}
                                                            isDeleting={deletingId === reply.id}
                                                            onDelete={() => handleDelete(reply)}
                                                        />
                                                        <p className="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-wrap break-words mt-1">
                                                            {reply.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
