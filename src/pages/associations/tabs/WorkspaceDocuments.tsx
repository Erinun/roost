import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { Download, FileText, Loader2, Plus, Trash2, X } from 'lucide-react';
import {
    getDocuments,
    uploadAssociationDocument,
    deleteDocument,
} from '@/services/association-docs';
import { MAX_FILE_SIZE } from '@/services/s3';
import type { AssociationDocument } from '@/types/association';
import type { WorkspaceContext } from '../AssociationWorkspace';

/** Formatera filstorlek som B/KB/MB. */
function formatFileSize(bytes: number | null): string {
    if (!bytes) return '–';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

interface UploadDocumentModalProps {
    isOpen: boolean;
    associationId: string;
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

function UploadDocumentModal({
    isOpen,
    associationId,
    userId,
    onClose,
    onSuccess,
}: UploadDocumentModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Nollställ formuläret när modalen öppnas
    useEffect(() => {
        if (isOpen) {
            setFile(null);
            setTitle('');
            setDescription('');
            setError(null);
        }
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] ?? null;

        // Validera storleken direkt så att uploadFile:s specifika felmeddelande
        // inte sväljs av den generiska fallbacken i submit-catchen.
        if (selected && selected.size > MAX_FILE_SIZE) {
            setFile(null);
            setError(`Filen är för stor (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`);
            e.target.value = '';
            return;
        }

        setError(null);
        setFile(selected);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title.trim()) return;

        setError(null);
        setIsSubmitting(true);

        try {
            await uploadAssociationDocument(file, {
                association_id: associationId,
                title: title.trim(),
                description: description.trim() || undefined,
                uploaded_by: userId,
            });
            onSuccess();
        } catch (err) {
            console.error('Error uploading document:', err);
            setError('Det gick inte att ladda upp dokumentet.');
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
                        Ladda upp dokument
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <X className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <div className="alert-error">{error}</div>}

                    {/* Fil */}
                    <div>
                        <label htmlFor="document-file" className="label">
                            Fil *
                        </label>
                        <input
                            type="file"
                            id="document-file"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-surface-700 dark:text-surface-200 file:mr-4 file:cursor-pointer file:rounded-lg file:border file:border-solid file:border-surface-300 dark:file:border-surface-600 file:bg-white dark:file:bg-surface-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-600 dark:file:text-primary-300"
                            required
                        />
                        {file && (
                            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                                {file.name} ({formatFileSize(file.size)})
                            </p>
                        )}
                    </div>

                    {/* Titel */}
                    <div>
                        <label htmlFor="document-title" className="label">
                            Titel *
                        </label>
                        <input
                            type="text"
                            id="document-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="t.ex. Stadgar 2026"
                            className="input"
                            required
                            maxLength={200}
                        />
                    </div>

                    {/* Beskrivning */}
                    <div>
                        <label htmlFor="document-description" className="label">
                            Beskrivning
                        </label>
                        <textarea
                            id="document-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Vad innehåller dokumentet?"
                            rows={3}
                            className="input resize-none"
                        />
                    </div>

                    {/* Knappar */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="btn-secondary flex-1"
                        >
                            Avbryt
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !file || !title.trim()}
                            className="btn-primary flex-1"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Ladda upp
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default function WorkspaceDocuments() {
    const { association, role, userId } = useOutletContext<WorkspaceContext>();
    const [documents, setDocuments] = useState<AssociationDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        try {
            setDocuments(await getDocuments(association.id));
            setError(null);
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError('Det gick inte att hämta dokumenten.');
        } finally {
            setIsLoading(false);
        }
    }, [association.id]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleDelete = async (doc: AssociationDocument) => {
        if (!window.confirm(`Vill du ta bort dokumentet "${doc.title}"?`)) return;

        setDeletingId(doc.id);
        try {
            await deleteDocument(doc.id);
            setDocuments(prev => prev.filter(d => d.id !== doc.id));
        } catch (err) {
            console.error('Error deleting document:', err);
            setError('Det gick inte att ta bort dokumentet.');
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    Dokument
                </h2>
                <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                    <Plus className="w-5 h-5" />
                    Ladda upp dokument
                </button>
            </div>

            {error && <div className="alert-error mb-6">{error}</div>}

            {/* Lista */}
            {documents.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                    </div>
                    <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-1">
                        Inga dokument än
                    </h3>
                    <p className="text-surface-600 dark:text-surface-300">
                        Ladda upp föreningens första dokument.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {documents.map((doc) => {
                        const canDelete = role === 'admin' || doc.uploaded_by === userId;
                        const uploaderName =
                            doc.uploader?.display_name || doc.uploader?.username || 'Okänd';

                        return (
                            <div key={doc.id} className="card p-4 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-primary-600 dark:text-primary-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-surface-900 dark:text-surface-50 break-words">
                                        {doc.title}
                                    </h3>
                                    {doc.description && (
                                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-0.5 break-words">
                                            {doc.description}
                                        </p>
                                    )}
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 break-words">
                                        {doc.file_name} · {formatFileSize(doc.file_size)} ·{' '}
                                        {uploaderName} · {formatDate(doc.created_at)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-ghost p-2 min-w-11"
                                        title="Ladda ner"
                                        aria-label={`Ladda ner ${doc.title}`}
                                    >
                                        <Download className="w-5 h-5" />
                                    </a>
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(doc)}
                                            disabled={deletingId === doc.id}
                                            className="btn-ghost p-2 min-w-11 hover:text-error-strong dark:hover:text-error-soft"
                                            title="Ta bort"
                                            aria-label={`Ta bort ${doc.title}`}
                                        >
                                            {deletingId === doc.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-5 h-5" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Ladda upp-modal */}
            <UploadDocumentModal
                isOpen={showUploadModal}
                associationId={association.id}
                userId={userId}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => {
                    setShowUploadModal(false);
                    fetchDocuments();
                }}
            />
        </div>
    );
}
