import { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { getActiveAnnouncements, dismissAnnouncement, getDismissedAnnouncementIds } from '../../services';
import type { Announcement, AnnouncementType } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

interface AnnouncementBannerProps {
    groupId?: string | null;
}

const typeStyles: Record<AnnouncementType, { bg: string; border: string; icon: typeof Info }> = {
    info: { bg: 'bg-info/10 dark:bg-info/15', border: 'border-info/40', icon: Info },
    warning: { bg: 'bg-warning/10 dark:bg-warning/15', border: 'border-warning/50', icon: AlertTriangle },
    success: { bg: 'bg-success/10 dark:bg-success/15', border: 'border-success/40', icon: CheckCircle },
    error: { bg: 'bg-error/10 dark:bg-error/20', border: 'border-error/60', icon: AlertCircle },
};

const typeTextColors: Record<AnnouncementType, string> = {
    info: 'text-surface-900 dark:text-surface-50',
    warning: 'text-surface-900 dark:text-surface-50',
    success: 'text-surface-900 dark:text-surface-50',
    error: 'text-surface-900 dark:text-error-soft',
};

const typeIconColors: Record<AnnouncementType, string> = {
    info: 'text-info',
    warning: 'text-surface-700 dark:text-warning',
    success: 'text-surface-900 dark:text-success',
    error: 'text-error-strong dark:text-error-soft',
};

export default function AnnouncementBanner({ groupId }: AnnouncementBannerProps) {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAnnouncements = async () => {
            if (!user) return;

            try {
                const [activeAnnouncements, dismissed] = await Promise.all([
                    getActiveAnnouncements(groupId || null),
                    getDismissedAnnouncementIds(user.id),
                ]);
                setAnnouncements(activeAnnouncements);
                setDismissedIds(new Set(dismissed));
            } catch (err) {
                console.error('Failed to load announcements:', err);
            } finally {
                setLoading(false);
            }
        };

        loadAnnouncements();
    }, [user, groupId]);

    const handleDismiss = async (announcementId: string) => {
        if (!user) return;

        try {
            await dismissAnnouncement(announcementId, user.id);
            setDismissedIds((prev) => new Set([...prev, announcementId]));
        } catch (err) {
            console.error('Failed to dismiss announcement:', err);
        }
    };

    if (loading) return null;

    const visibleAnnouncements = announcements.filter(
        (a) => !dismissedIds.has(a.id)
    );

    if (visibleAnnouncements.length === 0) return null;

    return (
        <div className="px-4 sm:px-6 lg:px-8 mt-4 space-y-2">
            {visibleAnnouncements.map((announcement) => {
                const style = typeStyles[announcement.type];
                const Icon = style.icon;

                return (
                    <div
                        key={announcement.id}
                        className={`${style.bg} ${style.border} border rounded-lg px-4 py-3 flex items-start gap-3`}
                    >
                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${typeIconColors[announcement.type]}`} />
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-medium ${typeTextColors[announcement.type]}`}>
                                {announcement.title}
                            </h4>
                            <p className={`text-sm mt-0.5 ${typeTextColors[announcement.type]} opacity-90`}>
                                {announcement.content}
                            </p>
                        </div>
                        {announcement.is_dismissible && (
                            <button
                                onClick={() => handleDismiss(announcement.id)}
                                className={`p-1 rounded hover:bg-surface-900/10 dark:hover:bg-white/10 transition-colors ${typeTextColors[announcement.type]}`}
                                title="Avfärda"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
