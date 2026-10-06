import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createModule, updateModule } from '@/services/module';
import { uploadImage } from '@/services/s3';
import type { Module } from '@/types';

interface ManageModuleModalProps {
    isOpen: boolean;
    groupId: string;
    onClose: () => void;
    onSuccess: () => void;
    editingModule?: Module | null;
    nextOrder?: number;
}

export default function ManageModuleModal({
    isOpen,
    groupId,
    onClose,
    onSuccess,
    editingModule,
    nextOrder = 0,
}: ManageModuleModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [thumbnailUrlInput, setThumbnailUrlInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEditing = !!editingModule;

    useEffect(() => {
        if (isOpen) {
            if (editingModule) {
                setTitle(editingModule.title);
                setDescription(editingModule.description || '');
                setThumbnailUrl(editingModule.thumbnail_url || '');
            } else {
                setTitle('');
                setDescription('');
                setThumbnailUrl('');
            }
            setThumbnailUrlInput('');
            setError(null);
        }
    }, [isOpen, editingModule]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            setError(null);
            const result = await uploadImage(file);
            setThumbnailUrl(result.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Det gick inte att ladda upp bilden');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUseThumbnailUrl = () => {
        const value = thumbnailUrlInput.trim();
        if (!value) return;
        try {
            new URL(value);
        } catch {
            setError('Ogiltig bild-URL. Ange en fullständig adress, t.ex. https://exempel.se/bild.jpg');
            return;
        }
        setThumbnailUrl(value);
        setThumbnailUrlInput('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title.trim()) return;

        try {
            setIsSubmitting(true);
            setError(null);

            if (isEditing && editingModule) {
                await updateModule(editingModule.id, {
                    title: title.trim(),
                    description: description.trim() || null,
                    thumbnail_url: thumbnailUrl || null,
                });
            } else {
                await createModule({
                    group_id: groupId,
                    title: title.trim(),
                    description: description.trim() || null,
                    thumbnail_url: thumbnailUrl || null,
                    display_order: nextOrder,
                    created_by: user.id,
                });
            }

            onSuccess();
        } catch (err) {
            console.error('Error saving module:', err);
            setError(err instanceof Error ? err.message : 'Det gick inte att spara modulen');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-surface-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                        {isEditing ? 'Redigera modul' : 'Skapa modul'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Thumbnail */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Miniatyrbild
                        </label>
                        {thumbnailUrl ? (
                            <div className="relative w-full h-40 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
                                <img
                                    src={thumbnailUrl}
                                    alt="Modulens miniatyrbild"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setThumbnailUrl('')}
                                    className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-full h-40 rounded-lg border-2 border-dashed border-surface-300 dark:border-surface-600 hover:border-primary-400 dark:hover:border-primary-600 flex flex-col items-center justify-center gap-2 transition-colors"
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-surface-400" />
                                            <span className="text-sm text-surface-500 dark:text-surface-400">
                                                Klicka för att ladda upp miniatyrbild
                                            </span>
                                        </>
                                    )}
                                </button>
                                <div className="mt-2 flex gap-2">
                                    <input
                                        type="url"
                                        value={thumbnailUrlInput}
                                        onChange={(e) => setThumbnailUrlInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleUseThumbnailUrl();
                                            }
                                        }}
                                        placeholder="…eller klistra in en bild-URL (https://…)"
                                        className="flex-1 px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleUseThumbnailUrl}
                                        disabled={!thumbnailUrlInput.trim()}
                                        className="px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Använd
                                    </button>
                                </div>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                            Titel <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="T.ex. Kom igång"
                            className="w-full px-3 py-2.5 border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                            Beskrivning
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Vad kommer deltagarna att lära sig i den här modulen?"
                            rows={3}
                            className="w-full px-3 py-2.5 border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                        >
                            Avbryt
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim()}
                            className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isEditing ? 'Spara ändringar' : 'Skapa modul'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
