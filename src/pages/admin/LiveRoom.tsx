import { useState, useEffect, useCallback } from 'react';
import {
    Radio,
    Plus,
    Trash2,
    Play,
    Square,
    RefreshCw,
    Copy,
    Check,
    Clock,
    Youtube,
    Video,
    AlertCircle,
    Users,
    ChevronDown,
    ChevronUp,
    Calendar,
    Pencil,
    Save,
    X,
    Lock,
    Globe,
} from 'lucide-react';
import {
    liveRoomAdminService,
    type LiveSession,
    type RsvpEntry,
} from '@/services/live-room';

export default function AdminLiveRoom() {
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Create session form
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        youtube_embed_url: '',
        scheduled_at: '',
        visibility: 'unlisted' as 'unlisted' | 'private',
    });
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // Inline URL editing
    const [editingUrl, setEditingUrl] = useState<string | null>(null);
    const [urlValue, setUrlValue] = useState('');
    const [urlSaving, setUrlSaving] = useState(false);

    // RSVP expansion
    const [expandedRsvp, setExpandedRsvp] = useState<string | null>(null);
    const [rsvpLists, setRsvpLists] = useState<Record<string, RsvpEntry[]>>({});
    const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const sessionsData = await liveRoomAdminService.listSessions();
            setSessions(sessionsData);
        } catch (error) {
            console.error('Error fetching live room data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCopy = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);

        if (!createForm.title.trim()) {
            setCreateError('Titel krävs');
            return;
        }

        try {
            setIsCreating(true);
            await liveRoomAdminService.createSession({
                title: createForm.title.trim(),
                description: createForm.description.trim() || undefined,
                youtube_embed_url: createForm.youtube_embed_url.trim() || undefined,
                scheduled_at: createForm.scheduled_at
                    ? new Date(createForm.scheduled_at).toISOString()
                    : undefined,
                visibility: createForm.visibility,
            });

            setShowCreateForm(false);
            setCreateForm({ title: '', description: '', youtube_embed_url: '', scheduled_at: '', visibility: 'unlisted' });
            await fetchData();
        } catch (error) {
            setCreateError(error instanceof Error ? error.message : 'Det gick inte att skapa sessionen');
        } finally {
            setIsCreating(false);
        }
    };

    const handleGoLive = async (sessionId: string) => {
        try {
            await liveRoomAdminService.updateSession(sessionId, { status: 'live' });
            await fetchData();
        } catch (error) {
            console.error('Error going live:', error);
        }
    };

    const handleEndSession = async (sessionId: string) => {
        try {
            await liveRoomAdminService.updateSession(sessionId, { status: 'ended' });
            await fetchData();
        } catch (error) {
            console.error('Error ending session:', error);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!window.confirm('Är du säker på att du vill ta bort den här sessionen?')) return;
        try {
            await liveRoomAdminService.deleteSession(sessionId);
            await fetchData();
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    const handleSaveUrl = async (sessionId: string) => {
        setUrlSaving(true);
        try {
            await liveRoomAdminService.updateSession(sessionId, {
                youtube_embed_url: urlValue.trim(),
            });
            setEditingUrl(null);
            await fetchData();
        } catch (error) {
            console.error('Error saving URL:', error);
        } finally {
            setUrlSaving(false);
        }
    };

    const toggleRsvpList = async (sessionId: string) => {
        if (expandedRsvp === sessionId) {
            setExpandedRsvp(null);
            return;
        }

        setExpandedRsvp(sessionId);
        if (!rsvpLists[sessionId]) {
            setRsvpLoading(sessionId);
            try {
                const rsvps = await liveRoomAdminService.getRsvpList(sessionId);
                setRsvpLists((prev) => ({ ...prev, [sessionId]: rsvps }));
            } catch (error) {
                console.error('Error fetching RSVP list:', error);
            } finally {
                setRsvpLoading(null);
            }
        }
    };

    const copyAllEmails = (sessionId: string) => {
        const rsvps = rsvpLists[sessionId];
        if (!rsvps?.length) return;
        const emails = rsvps.map((r) => r.email).join(', ');
        handleCopy(emails, `emails-${sessionId}`);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '\u2014';
        return new Date(dateStr).toLocaleDateString('sv-SE', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'live':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-error/15 text-surface-900 dark:bg-error/20 dark:text-error-soft">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                        </span>
                        LIVE
                    </span>
                );
            case 'idle':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/20 text-surface-900 dark:bg-warning/20 dark:text-warning">
                        Redo
                    </span>
                );
            case 'ended':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                        Avslutad
                    </span>
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-error/15 dark:bg-error/20">
                        <Radio className="w-6 h-6 text-error-strong dark:text-error-soft" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Live-rum</h1>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                            Hantera livesändningssessioner
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    title="Uppdatera"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Create Session Button */}
            <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
                <Plus className="w-4 h-4" />
                Ny session
            </button>

            {/* Create Session Form */}
            {showCreateForm && (
                <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                    <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                        Skapa ny session
                    </h3>
                    <form onSubmit={handleCreateSession} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Titel
                            </label>
                            <input
                                type="text"
                                value={createForm.title}
                                onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                                placeholder="t.ex. Veckans frågestund"
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Beskrivning (valfritt)
                            </label>
                            <textarea
                                value={createForm.description}
                                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Vad handlar den här sessionen om?"
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Schemalagt datum och tid
                            </label>
                            <input
                                type="datetime-local"
                                value={createForm.scheduled_at}
                                onChange={(e) => setCreateForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-xs text-surface-400">
                                Anmälan stänger 1 timme före denna tid. Lämna tomt om du inte schemalägger i förväg.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                YouTube-synlighet
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCreateForm((prev) => ({ ...prev, visibility: 'unlisted' }))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                        createForm.visibility === 'unlisted'
                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                            : 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-surface-400'
                                    }`}
                                >
                                    <Globe className="w-4 h-4" />
                                    Olistad
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCreateForm((prev) => ({ ...prev, visibility: 'private' }))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                        createForm.visibility === 'private'
                                            ? 'border-warning bg-warning/10 dark:bg-warning/15 text-surface-900 dark:text-warning'
                                            : 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-surface-400'
                                    }`}
                                >
                                    <Lock className="w-4 h-4" />
                                    Privat
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-surface-400">
                                {createForm.visibility === 'unlisted'
                                    ? 'Sändningen bäddas in direkt på sidan. Alla med länken kan titta.'
                                    : 'Användare ser en länk för att titta på YouTube. Du måste lägga till anmälda e-postadresser i YouTubes åtkomstlista.'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                YouTube-inbäddnings-URL (valfritt &mdash; kan läggas till senare)
                            </label>
                            <input
                                type="url"
                                value={createForm.youtube_embed_url}
                                onChange={(e) => setCreateForm((prev) => ({ ...prev, youtube_embed_url: e.target.value }))}
                                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                            />
                            <p className="mt-1 text-xs text-surface-400">
                                Skapa en olistad livesändning i YouTube Studio och klistra sedan in inbäddnings-URL:en här.
                            </p>
                        </div>

                        {createError && (
                            <div className="flex items-center gap-2 text-sm text-error-strong dark:text-error-soft">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {createError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {isCreating ? 'Skapar...' : 'Skapa session'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setCreateError(null);
                                }}
                                className="px-4 py-2 text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200 text-sm"
                            >
                                Avbryt
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Sessions List */}
            {sessions.length === 0 ? (
                <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-8 text-center">
                    <Video className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600" />
                    <p className="mt-3 text-surface-500 dark:text-surface-400">
                        Inga sessioner än. Skapa en för att komma igång.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl"
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="p-2 rounded-lg mt-0.5 bg-error/15 dark:bg-error/20">
                                            <Youtube className="w-4 h-4 text-error-strong dark:text-error-soft" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-surface-900 dark:text-surface-50 truncate">
                                                    {session.title}
                                                </h3>
                                                {getStatusBadge(session.status)}
                                                {session.visibility === 'private' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-surface-900 dark:bg-warning/20 dark:text-warning">
                                                        <Lock className="w-3 h-3" />
                                                        Privat
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-info/15 text-surface-900 dark:bg-info/20 dark:text-info">
                                                        <Globe className="w-3 h-3" />
                                                        Olistad
                                                    </span>
                                                )}
                                            </div>
                                            {session.description && (
                                                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-1">
                                                    {session.description}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-400 dark:text-surface-500">
                                                {session.scheduled_at && (
                                                    <span className="flex items-center gap-1 text-primary-500">
                                                        <Calendar className="w-3 h-3" />
                                                        Schemalagd {formatDate(session.scheduled_at)}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Skapad {formatDate(session.created_at)}
                                                </span>
                                                {session.started_at && (
                                                    <span>Startad {formatDate(session.started_at)}</span>
                                                )}
                                            </div>

                                            {/* YouTube URL section */}
                                            {session.status !== 'ended' && (
                                                <div className="mt-3">
                                                    {editingUrl === session.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="url"
                                                                value={urlValue}
                                                                onChange={(e) => setUrlValue(e.target.value)}
                                                                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                                                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                            />
                                                            <button
                                                                onClick={() => handleSaveUrl(session.id)}
                                                                disabled={urlSaving}
                                                                className="p-1.5 text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Spara"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingUrl(null)}
                                                                className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 rounded-lg transition-colors"
                                                                title="Avbryt"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : session.youtube_embed_url ? (
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-xs text-surface-500 dark:text-surface-400 font-mono truncate">
                                                                {session.youtube_embed_url}
                                                            </code>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingUrl(session.id);
                                                                    setUrlValue(session.youtube_embed_url || '');
                                                                }}
                                                                className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                                                                title="Redigera URL"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleCopy(session.youtube_embed_url!, `url-${session.id}`)}
                                                                className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                                                                title="Kopiera URL"
                                                            >
                                                                {copiedField === `url-${session.id}` ? (
                                                                    <Check className="w-3 h-3 text-success" />
                                                                ) : (
                                                                    <Copy className="w-3 h-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingUrl(session.id);
                                                                setUrlValue('');
                                                            }}
                                                            className="text-xs text-primary-600 dark:text-primary-300 hover:underline flex items-center gap-1"
                                                        >
                                                            <Youtube className="w-3 h-3" />
                                                            Lägg till YouTube-URL
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => toggleRsvpList(session.id)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                                            title="Visa anmälningar"
                                        >
                                            <Users className="w-4 h-4" />
                                            {expandedRsvp === session.id ? (
                                                <ChevronUp className="w-3 h-3" />
                                            ) : (
                                                <ChevronDown className="w-3 h-3" />
                                            )}
                                        </button>
                                        {session.status === 'idle' && (
                                            <button
                                                onClick={() => handleGoLive(session.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-error-strong hover:bg-error-strong/90 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Play className="w-3.5 h-3.5" />
                                                Gå live
                                            </button>
                                        )}
                                        {session.status === 'live' && (
                                            <button
                                                onClick={() => handleEndSession(session.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-600 hover:bg-surface-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Square className="w-3.5 h-3.5" />
                                                Avsluta
                                            </button>
                                        )}
                                        {session.status !== 'live' && (
                                            <button
                                                onClick={() => handleDeleteSession(session.id)}
                                                className="p-1.5 text-surface-400 hover:text-error-strong dark:hover:text-error-soft hover:bg-error/10 dark:hover:bg-error/20 rounded-lg transition-colors"
                                                title="Ta bort session"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RSVP List (expandable) */}
                            {expandedRsvp === session.id && (
                                <div className="border-t border-surface-200 dark:border-surface-700 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Anmälningar ({rsvpLists[session.id]?.length || 0})
                                        </h4>
                                        {(rsvpLists[session.id]?.length || 0) > 0 && (
                                            <button
                                                onClick={() => copyAllEmails(session.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-lg transition-colors"
                                            >
                                                {copiedField === `emails-${session.id}` ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-success" />
                                                        Kopierat!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3.5 h-3.5" />
                                                        Kopiera alla e-postadresser
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {rsvpLoading === session.id ? (
                                        <div className="flex items-center justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                                        </div>
                                    ) : rsvpLists[session.id]?.length ? (
                                        <div className="space-y-2">
                                            {rsvpLists[session.id].map((rsvp) => (
                                                <div
                                                    key={rsvp.id}
                                                    className="flex items-center justify-between py-2 px-3 bg-surface-50 dark:bg-surface-800 rounded-lg"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                                                            {rsvp.display_name || 'Okänd användare'}
                                                        </p>
                                                        <p className="text-xs text-surface-500 dark:text-surface-400 font-mono">
                                                            {rsvp.email}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopy(rsvp.email, `email-${rsvp.id}`)}
                                                        className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                                                        title="Kopiera e-postadress"
                                                    >
                                                        {copiedField === `email-${rsvp.id}` ? (
                                                            <Check className="w-3.5 h-3.5 text-success" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-surface-400 dark:text-surface-500 text-center py-4">
                                            Inga anmälningar än för den här sessionen.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* YouTube Live Guide */}
            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-error" />
                    Så här går du live
                </h3>
                <div className="text-sm text-surface-600 dark:text-surface-400 space-y-2">
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Skapa en session ovan med titel och schemalagd tid</li>
                        <li>Gå till <strong>YouTube Studio</strong> och skapa en ny livesändning</li>
                        <li>Ställ in sekretessen på <strong>Olistad</strong> (eller Privat om du använder anmälda e-postadresser)</li>
                        <li>Kopiera inbäddnings-URL:en (format: <code className="text-xs bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded">https://www.youtube.com/embed/VIDEO_ID</code>)</li>
                        <li>Redigera sessionen för att lägga till YouTube-URL:en och klicka sedan på <strong>Gå live</strong></li>
                        <li>För privata sändningar: expandera anmälningslistan och kopiera e-postadresserna för att lägga till dem i YouTubes åtkomstlista</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
