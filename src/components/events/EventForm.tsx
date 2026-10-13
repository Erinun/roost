import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import type { Event } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { getUserGroups, type GroupWithDetails } from '../../services/group';

interface EventFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EventFormData) => Promise<void>;
    initialData?: Partial<Event> | any;
    groupId?: string;
}

export interface EventFormData {
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location?: string;
    meeting_url?: string;
    is_virtual: boolean;
    group_id?: string;
}

export default function EventForm({ isOpen, onClose, onSubmit, initialData, groupId }: EventFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [userGroups, setUserGroups] = useState<GroupWithDetails[]>([]);
    const [formData, setFormData] = useState<EventFormData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        start_time: initialData?.start_time ? format(new Date(initialData.start_time), "yyyy-MM-dd'T'HH:mm") : '',
        end_time: initialData?.end_time ? format(new Date(initialData.end_time), "yyyy-MM-dd'T'HH:mm") : '',
        location: initialData?.location || '',
        meeting_url: initialData?.meeting_url || '',
        is_virtual: initialData?.is_virtual ?? false,
        group_id: groupId || initialData?.group_id || undefined,
    });

    useEffect(() => {
        const fetchGroups = async () => {
            if (user) {
                try {
                    const groups = await getUserGroups(user.id);
                    setUserGroups(groups);
                } catch (err) {
                    console.error('Failed to load user groups:', err);
                }
            }
        };

        if (isOpen) {
            fetchGroups();
        }
    }, [user, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: initialData?.title || '',
                description: initialData?.description || '',
                start_time: initialData?.start_time ? format(new Date(initialData.start_time), "yyyy-MM-dd'T'HH:mm") : '',
                end_time: initialData?.end_time ? format(new Date(initialData.end_time), "yyyy-MM-dd'T'HH:mm") : '',
                location: initialData?.location || '',
                meeting_url: initialData?.meeting_url || '',
                is_virtual: initialData?.is_virtual ?? false,
                group_id: groupId || initialData?.group_id || undefined,
            });
        }
    }, [initialData, groupId, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        try {
            setLoading(true);

            // Sanitize data: convert empty strings to undefined/null for optional fields
            const cleanData = {
                ...formData,
                group_id: formData.group_id || undefined, // Send undefined if empty string
                location: formData.location || undefined,
                meeting_url: formData.meeting_url || undefined
            };

            await onSubmit(cleanData);
            onClose();
        } catch (err) {
            console.error('Form submission error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof EventFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-overlay z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="modal-content fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[90vh] z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                    <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                        {initialData ? 'Redigera evenemang' : 'Skapa nytt evenemang'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="min-h-11 min-w-11 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-600 dark:text-surface-300"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Group Selection */}
                    <div>
                        <label className="label">
                            Klassrum (valfritt)
                        </label>
                        <select
                            value={formData.group_id || ''}
                            onChange={(e) => handleChange('group_id', e.target.value)}
                            className="input"
                        >
                            <option value="">Allmänt (community-evenemang)</option>
                            {userGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                            Välj "Allmänt" för evenemang som gäller hela communityt, eller välj ett specifikt klassrum.
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="label">
                            Evenemangets titel <span className="text-error-strong dark:text-error-soft">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="input"
                            placeholder="Månatlig teamträff"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="label">
                            Beskrivning
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={4}
                            className="input"
                            placeholder="Berätta för deltagarna vad de kan förvänta sig..."
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">
                                Startdatum och -tid <span className="text-error-strong dark:text-error-soft">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.start_time}
                                onChange={(e) => handleChange('start_time', e.target.value)}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">
                                Slutdatum och -tid <span className="text-error-strong dark:text-error-soft">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.end_time}
                                onChange={(e) => handleChange('end_time', e.target.value)}
                                className="input"
                            />
                        </div>
                    </div>

                    {/* Virtual Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <input
                            type="checkbox"
                            id="is_virtual"
                            checked={formData.is_virtual}
                            onChange={(e) => handleChange('is_virtual', e.target.checked)}
                            className="w-5 h-5 accent-primary-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                        />
                        <label htmlFor="is_virtual" className="text-sm font-medium text-surface-700 dark:text-surface-200 cursor-pointer">
                            Det här är ett virtuellt evenemang
                        </label>
                    </div>

                    {/* Location OR Meeting URL */}
                    {formData.is_virtual ? (
                        <div>
                            <label className="label">
                                Mötes-URL
                            </label>
                            <input
                                type="url"
                                value={formData.meeting_url}
                                onChange={(e) => handleChange('meeting_url', e.target.value)}
                                className="input"
                                placeholder="https://zoom.us/j/123456789"
                            />
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                Valfritt: Lägg till efter att evenemanget skapats eller närmare evenemangsdatumet
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="label">
                                Plats
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                className="input"
                                placeholder="Storgatan 1, Stockholm"
                            />
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-surface-200 dark:border-surface-700 flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                    >
                        Avbryt
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Sparar...' : initialData ? 'Uppdatera evenemang' : 'Skapa evenemang'}
                    </button>
                </div>
            </div>
        </>
    );
}
