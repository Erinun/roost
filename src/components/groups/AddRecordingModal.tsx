import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createRecording, updateRecording } from '@/services/group';
import { extractVideoInfo } from '@/lib/videoUrl';
import VideoEmbed from '@/components/feed/VideoEmbed';

interface Recording {
    id: string;
    title: string;
    description?: string | null;
    video_url: string;
    video_platform: 'youtube' | 'vimeo';
    video_id: string;
}

interface AddRecordingModalProps {
    isOpen: boolean;
    groupId: string;
    moduleId?: string | null;
    onClose: () => void;
    onSuccess: () => void;
    editingRecording?: Recording | null;
}

export default function AddRecordingModal({
    isOpen,
    groupId,
    moduleId,
    onClose,
    onSuccess,
    editingRecording,
}: AddRecordingModalProps) {
    const { user } = useAuth();
    const [videoUrl, setVideoUrl] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!editingRecording;

    // Populate form when editing
    useEffect(() => {
        if (editingRecording) {
            setVideoUrl(editingRecording.video_url);
            setTitle(editingRecording.title);
            setDescription(editingRecording.description || '');
        }
    }, [editingRecording]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError(null);

        // Validate video URL
        const videoInfo = extractVideoInfo(videoUrl);
        if (!videoInfo) {
            setError('Ogiltig video-URL. Ange en giltig YouTube- eller Vimeo-URL.');
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditing && editingRecording) {
                await updateRecording(editingRecording.id, {
                    title: title.trim(),
                    description: description.trim() || null,
                    video_url: videoUrl.trim(),
                    video_platform: videoInfo.platform,
                    video_id: videoInfo.videoId,
                    thumbnail_url: videoInfo.thumbnailUrl,
                });
            } else {
                await createRecording({
                    group_id: groupId,
                    title: title.trim(),
                    description: description.trim() || null,
                    video_url: videoUrl.trim(),
                    video_platform: videoInfo.platform,
                    video_id: videoInfo.videoId,
                    thumbnail_url: videoInfo.thumbnailUrl,
                    published_by: user.id,
                    ...(moduleId ? { module_id: moduleId } : {}),
                });
            }

            onSuccess();
            resetForm();
        } catch (err) {
            console.error('Error saving recording:', err);
            setError(err instanceof Error ? err.message : 'Det gick inte att spara inspelningen');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setVideoUrl('');
        setTitle('');
        setDescription('');
        setError(null);
    };

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm();
            onClose();
        }
    };

    if (!isOpen) return null;

    const videoInfo = extractVideoInfo(videoUrl);
    const isValidUrl = videoInfo !== null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-100">
                    <h2 className="text-xl font-semibold text-surface-900">
                        {isEditing ? 'Redigera inspelning' : 'Lägg till inspelning'}
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-surface-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-surface-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Video URL */}
                    <div>
                        <label htmlFor="videoUrl" className="block text-sm font-medium text-surface-700 mb-2">
                            Video-URL *
                        </label>
                        <input
                            type="url"
                            id="videoUrl"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=... eller https://vimeo.com/..."
                            className="w-full px-4 py-2.5 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        />
                        <p className="mt-1 text-xs text-surface-500">
                            Stöds: YouTube (vanliga länkar, Shorts, live) och Vimeo
                        </p>
                    </div>

                    {/* Video Preview */}
                    {videoUrl && isValidUrl && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-surface-700">Förhandsvisning</label>
                            <VideoEmbed url={videoUrl} />
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-surface-700 mb-2">
                            Titel *
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="t.ex. Introduktion till React Hooks"
                            className="w-full px-4 py-2.5 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                            minLength={3}
                            maxLength={200}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-surface-700 mb-2">
                            Beskrivning (valfritt)
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Beskriv vad den här videon handlar om..."
                            rows={4}
                            className="w-full px-4 py-2.5 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            maxLength={1000}
                        />
                        <p className="mt-1 text-xs text-surface-500 text-right">
                            {description.length}/1000
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 border border-surface-200 rounded-lg text-surface-700 font-medium hover:bg-surface-50 transition-colors disabled:opacity-50"
                        >
                            Avbryt
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !videoUrl.trim() || !isValidUrl}
                            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? 'Sparar...' : isEditing ? 'Spara ändringar' : 'Lägg till inspelning'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
