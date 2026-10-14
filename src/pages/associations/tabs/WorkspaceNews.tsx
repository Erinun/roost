import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { Loader2, Newspaper, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
    getNews,
    createNews,
    updateNews,
    publishNews,
    unpublishNews,
    deleteNews,
} from '@/services/association-portal';
import type { MemberNews } from '@/types/association';
import type { WorkspaceContext } from '../AssociationWorkspace';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

interface NewsModalProps {
    isOpen: boolean;
    /** null = skapa ny nyhet */
    newsItem: MemberNews | null;
    associationId: string;
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

function NewsModal({ isOpen, newsItem, associationId, userId, onClose, onSuccess }: NewsModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fyll i formuläret när modalen öppnas
    useEffect(() => {
        if (isOpen) {
            setTitle(newsItem?.title ?? '');
            setContent(newsItem?.content ?? '');
            setError(null);
        }
    }, [isOpen, newsItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setError(null);
        setIsSubmitting(true);

        try {
            if (newsItem) {
                await updateNews(newsItem.id, {
                    title: title.trim(),
                    content: content.trim(),
                });
            } else {
                await createNews({
                    association_id: associationId,
                    title: title.trim(),
                    content: content.trim(),
                    created_by: userId,
                });
            }
            onSuccess();
        } catch (err) {
            console.error('Error saving news:', err);
            setError('Det gick inte att spara nyheten.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay flex items-center justify-center p-4">
            <div className="modal-content w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                    <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
                        {newsItem ? 'Redigera nyhet' : 'Skapa nyhet'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                        <X className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <div className="alert-error">{error}</div>}

                    {/* Titel */}
                    <div>
                        <label htmlFor="news-title" className="label">
                            Titel *
                        </label>
                        <input
                            type="text"
                            id="news-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="t.ex. Nytt från styrelsen"
                            className="input"
                            required
                            maxLength={200}
                        />
                    </div>

                    {/* Innehåll */}
                    <div>
                        <label htmlFor="news-content" className="label">
                            Innehåll *
                        </label>
                        <textarea
                            id="news-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Skriv nyheten…"
                            rows={6}
                            className="input resize-none"
                            required
                        />
                    </div>

                    {/* Knappar */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">
                            Avbryt
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !content.trim()}
                            className="btn-primary flex-1"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {newsItem ? 'Spara' : 'Skapa nyhet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default function WorkspaceNews() {
    const { association, userId } = useOutletContext<WorkspaceContext>();
    const [news, setNews] = useState<MemberNews[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [editingNews, setEditingNews] = useState<MemberNews | null>(null);

    const fetchNews = useCallback(async () => {
        try {
            setNews(await getNews(association.id));
            setError(null);
        } catch (err) {
            console.error('Error fetching news:', err);
            setError('Det gick inte att hämta nyheterna.');
        } finally {
            setIsLoading(false);
        }
    }, [association.id]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const handleTogglePublish = async (item: MemberNews) => {
        setBusyId(item.id);
        try {
            if (item.status === 'published') {
                await unpublishNews(item.id);
            } else {
                await publishNews(item.id);
            }
            // Hämta om listan — sorteringen (utkast överst) kan ha ändrats
            await fetchNews();
        } catch (err) {
            console.error('Error toggling news publish state:', err);
            setError(
                item.status === 'published'
                    ? 'Det gick inte att avpublicera nyheten.'
                    : 'Det gick inte att publicera nyheten.'
            );
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (item: MemberNews) => {
        if (!window.confirm(`Vill du ta bort nyheten "${item.title}"?`)) return;

        setBusyId(item.id);
        try {
            await deleteNews(item.id);
            setNews(prev => prev.filter(n => n.id !== item.id));
        } catch (err) {
            console.error('Error deleting news:', err);
            setError('Det gick inte att ta bort nyheten.');
        } finally {
            setBusyId(null);
        }
    };

    const openCreateModal = () => {
        setEditingNews(null);
        setShowModal(true);
    };

    const openEditModal = (item: MemberNews) => {
        setEditingNews(item);
        setShowModal(true);
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                        Nyheter
                    </h2>
                    <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                        Publicerade nyheter visas för medlemmarna i medlemsportalen.
                    </p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex-shrink-0">
                    <Plus className="w-5 h-5" />
                    Skapa nyhet
                </button>
            </div>

            {error && <div className="alert-error mb-6">{error}</div>}

            {/* Lista */}
            {news.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <Newspaper className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                    </div>
                    <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-1">
                        Inga nyheter än
                    </h3>
                    <p className="text-surface-600 dark:text-surface-300">
                        Skapa föreningens första nyhet.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {news.map((item) => (
                        <div key={item.id} className="card p-5">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <h3 className="font-semibold text-surface-900 dark:text-surface-50 break-words">
                                    {item.title}
                                </h3>
                                {item.status === 'published' ? (
                                    <span className="badge-success flex-shrink-0">Publicerad</span>
                                ) : (
                                    <span className="badge bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 flex-shrink-0">
                                        Utkast
                                    </span>
                                )}
                            </div>

                            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                                {item.published_at
                                    ? `Publicerad ${formatDate(item.published_at)}`
                                    : `Skapad ${formatDate(item.created_at)}`}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleTogglePublish(item)}
                                    disabled={busyId === item.id}
                                    className="btn-secondary"
                                >
                                    {busyId === item.id && (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    )}
                                    {item.status === 'published' ? 'Avpublicera' : 'Publicera'}
                                </button>
                                <button
                                    onClick={() => openEditModal(item)}
                                    disabled={busyId === item.id}
                                    className="btn-ghost"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Redigera
                                </button>
                                <button
                                    onClick={() => handleDelete(item)}
                                    disabled={busyId === item.id}
                                    className="btn-ghost hover:text-error-strong dark:hover:text-error-soft"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Ta bort
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Skapa/redigera-modal */}
            <NewsModal
                isOpen={showModal}
                newsItem={editingNews}
                associationId={association.id}
                userId={userId}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    setShowModal(false);
                    fetchNews();
                }}
            />
        </div>
    );
}
