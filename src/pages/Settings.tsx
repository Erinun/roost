import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, isUsernameAvailable, isValidUsername, isValidWebsite } from '@/services/profile';
import { uploadImage } from '@/services/s3';
import { supabase } from '@/services/supabase';
import { APP_CONFIG } from '@/config/app';
import {
    getNotificationPreferences,
    updateNotificationPreferences,
    type NotificationPreferences,
} from '@/services/notification';
import AvatarUpload from '@/components/profile/AvatarUpload';
import SubscriptionBadge from '@/components/common/SubscriptionBadge';
import { subscriptionService } from '@/services/subscription';
import ChangePasswordModal from '@/components/settings/ChangePasswordModal';
import TwoFactorSetupModal from '@/components/settings/TwoFactorSetupModal';
import TwoFactorDisableModal from '@/components/settings/TwoFactorDisableModal';
import {
    User,
    AtSign,
    FileText,
    MapPin,
    Link as LinkIcon,
    Loader2,
    Check,
    X,
    AlertCircle,
    Settings as SettingsIcon,
    CreditCard,
    Shield,
    Bell,
    ShieldCheck,
    ShieldOff,
    ImageIcon,
    Trash2,
} from 'lucide-react';

type SettingsTab = 'profile' | 'account' | 'subscription' | 'notifications';

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'account', label: 'Konto', icon: Shield },
    { id: 'subscription', label: 'Prenumeration', icon: CreditCard },
    { id: 'notifications', label: 'Notiser', icon: Bell },
];

export default function Settings() {
    const { user, profile, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [is2FASetupModalOpen, setIs2FASetupModalOpen] = useState(false);
    const [is2FADisableModalOpen, setIs2FADisableModalOpen] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [is2FALoading, setIs2FALoading] = useState(true);

    // Notification preferences state
    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
    const [isPrefsLoading, setIsPrefsLoading] = useState(true);
    const [isPrefsSaving, setIsPrefsSaving] = useState(false);
    const [prefsSaved, setPrefsSaved] = useState(false);
    const [prefsError, setPrefsError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        display_name: '',
        username: '',
        bio: '',
        location: '',
        website: '',
    });
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [isCoverUploading, setIsCoverUploading] = useState(false);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

    // Fetch 2FA status
    const fetch2FAStatus = useCallback(async () => {
        if (!user) return;

        try {
            setIs2FALoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const apiUrl = APP_CONFIG.apiUrl;
            const response = await fetch(`${apiUrl}/api/2fa/status`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setIs2FAEnabled(data.enabled);
            }
        } catch (err) {
            console.error('Failed to fetch 2FA status:', err);
        } finally {
            setIs2FALoading(false);
        }
    }, [user]);

    // Initialize form with profile data
    useEffect(() => {
        if (profile) {
            setFormData({
                display_name: profile.display_name || '',
                username: profile.username || '',
                bio: profile.bio || '',
                location: profile.location || '',
                website: profile.website || '',
            });
            setAvatarUrl(profile.avatar_url);
            setCoverUrl(profile.cover_url || null);
        }
    }, [profile]);

    // Fetch 2FA status on mount
    useEffect(() => {
        fetch2FAStatus();
    }, [fetch2FAStatus]);

    // Fetch notification preferences on mount
    useEffect(() => {
        async function loadNotificationPreferences() {
            if (!user) return;
            try {
                setIsPrefsLoading(true);
                const prefs = await getNotificationPreferences(user.id);
                setNotificationPrefs(prefs);
            } catch (err) {
                console.error('Failed to load notification preferences:', err);
                setPrefsError('Det gick inte att ladda notisinställningarna');
            } finally {
                setIsPrefsLoading(false);
            }
        }
        loadNotificationPreferences();
    }, [user]);

    // Handle notification preference change
    const handlePrefChange = (key: keyof NotificationPreferences, value: boolean) => {
        if (!notificationPrefs) return;
        setNotificationPrefs({ ...notificationPrefs, [key]: value });
        setPrefsSaved(false);
        setPrefsError(null);
    };

    // Save notification preferences
    const handleSavePreferences = async () => {
        if (!user || !notificationPrefs) return;

        setIsPrefsSaving(true);
        setPrefsError(null);

        try {
            await updateNotificationPreferences(user.id, notificationPrefs);
            setPrefsSaved(true);
            setTimeout(() => setPrefsSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save notification preferences:', err);
            setPrefsError('Det gick inte att spara inställningarna. Försök igen.');
        } finally {
            setIsPrefsSaving(false);
        }
    };

    // Check username availability with debounce
    useEffect(() => {
        const checkUsername = async () => {
            const username = formData.username.toLowerCase().trim();

            // Skip if same as current username
            if (profile && username === profile.username) {
                setUsernameStatus('idle');
                return;
            }

            // Validate format
            if (!isValidUsername(username)) {
                if (username.length > 0) {
                    setUsernameStatus('invalid');
                } else {
                    setUsernameStatus('idle');
                }
                return;
            }

            setUsernameStatus('checking');

            try {
                const available = await isUsernameAvailable(username, user?.id);
                setUsernameStatus(available ? 'available' : 'taken');
            } catch {
                setUsernameStatus('idle');
            }
        };

        const timeout = setTimeout(checkUsername, 500);
        return () => clearTimeout(timeout);
    }, [formData.username, profile, user?.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setIsSaved(false);
    };

    const handleAvatarUpload = async (url: string) => {
        setAvatarUrl(url);

        // Update profile immediately
        if (user) {
            try {
                await updateProfile(user.id, { avatar_url: url });
                await refreshProfile();
            } catch (err) {
                console.error('Failed to update avatar:', err);
            }
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsCoverUploading(true);
        try {
            const result = await uploadImage(file);
            setCoverUrl(result.url);
            await updateProfile(user.id, { cover_url: result.url });
            await refreshProfile();
        } catch (err) {
            console.error('Failed to upload cover photo:', err);
            setError(err instanceof Error ? err.message : 'Det gick inte att ladda upp omslagsbilden');
        } finally {
            setIsCoverUploading(false);
        }
    };

    const handleRemoveCover = async () => {
        if (!user) return;
        setIsCoverUploading(true);
        try {
            await updateProfile(user.id, { cover_url: null });
            setCoverUrl(null);
            await refreshProfile();
        } catch (err) {
            console.error('Failed to remove cover photo:', err);
        } finally {
            setIsCoverUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError(null);

        // Validate
        if (!formData.display_name.trim()) {
            setError('Visningsnamn krävs');
            return;
        }

        if (!isValidUsername(formData.username)) {
            setError('Användarnamnet måste vara 3–30 tecken och får bara innehålla bokstäver, siffror, understreck och bindestreck');
            return;
        }

        if (usernameStatus === 'taken') {
            setError('Användarnamnet är redan upptaget');
            return;
        }

        if (formData.website && !isValidWebsite(formData.website)) {
            setError('Ange en giltig webbplatsadress');
            return;
        }

        if (formData.bio.length > 500) {
            setError('Bio får vara högst 500 tecken');
            return;
        }

        setIsLoading(true);

        try {
            await updateProfile(user.id, {
                display_name: formData.display_name.trim(),
                username: formData.username.toLowerCase().trim(),
                bio: formData.bio.trim() || null,
                location: formData.location.trim() || null,
                website: formData.website.trim() || null,
            });

            await refreshProfile();
            setIsSaved(true);

            // Clear saved indicator after 3 seconds
            setTimeout(() => setIsSaved(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Det gick inte att uppdatera profilen');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user || !profile) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
                    <SettingsIcon className="w-7 h-7 text-primary-600" />
                    Inställningar
                </h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Hantera dina kontoinställningar och preferenser
                </p>
            </div>

            {/* Main Layout */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:w-56 flex-shrink-0">
                    <nav className="lg:sticky lg:top-6 space-y-1">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                                        ${isActive
                                            ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                                            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                                        }
                                    `}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="card p-6 sm:p-8">
                            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-6">
                                Profilinformation
                            </h2>

                            {/* Cover Photo */}
                            <div className="mb-8 pb-8 border-b border-surface-200 dark:border-surface-700">
                                <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-3">
                                    Omslagsbild
                                </h3>
                                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-blue">
                                    {coverUrl && (
                                        <img
                                            src={coverUrl}
                                            alt="Omslag"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    {isCoverUploading && (
                                        <div className="absolute inset-0 bg-surface-950/40 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-white" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 right-3 flex gap-2">
                                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-surface-800/90 text-surface-700 dark:text-surface-200 text-sm font-medium rounded-lg hover:bg-white dark:hover:bg-surface-800 transition-colors">
                                            <ImageIcon className="w-4 h-4" />
                                            <span>{coverUrl ? 'Byt' : 'Ladda upp'}</span>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                className="hidden"
                                                onChange={handleCoverUpload}
                                                disabled={isCoverUploading}
                                            />
                                        </label>
                                        {coverUrl && (
                                            <button
                                                onClick={handleRemoveCover}
                                                disabled={isCoverUploading}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-error-strong text-white text-sm font-medium rounded-lg hover:bg-error-strong/90 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>Ta bort</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                                    Rekommenderad storlek: 1200x400 px. JPG, PNG, GIF eller WebP.
                                </p>
                            </div>

                            {/* Avatar */}
                            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-surface-200 dark:border-surface-700">
                                <AvatarUpload
                                    currentUrl={avatarUrl}
                                    displayName={formData.display_name}
                                    userId={user.id}
                                    onUpload={handleAvatarUpload}
                                    size="xl"
                                />
                                <div>
                                    <h3 className="font-medium text-surface-900 dark:text-surface-100">
                                        Profilbild
                                    </h3>
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                        Klicka för att ladda upp en ny bild. JPG, PNG eller GIF, max 5 MB.
                                    </p>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Error message */}
                                {error && (
                                    <div className="alert-error items-center">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Success message */}
                                {isSaved && (
                                    <div className="alert-success items-center">
                                        <Check className="w-4 h-4" />
                                        <span>Profilen har sparats!</span>
                                    </div>
                                )}

                                {/* Two column layout for name fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Display Name */}
                                    <div>
                                        <label htmlFor="display_name" className="label">
                                            Visningsnamn
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                            <input
                                                id="display_name"
                                                name="display_name"
                                                type="text"
                                                value={formData.display_name}
                                                onChange={handleChange}
                                                placeholder="Ditt namn"
                                                required
                                                maxLength={100}
                                                className="input pl-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Username */}
                                    <div>
                                        <label htmlFor="username" className="label">
                                            Användarnamn
                                        </label>
                                        <div className="relative">
                                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                            <input
                                                id="username"
                                                name="username"
                                                type="text"
                                                value={formData.username}
                                                onChange={handleChange}
                                                placeholder="användarnamn"
                                                required
                                                pattern="^[a-zA-Z0-9_\-]+$"
                                                maxLength={30}
                                                className="input pl-10 pr-10"
                                            />
                                            {/* Username status indicator */}
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {usernameStatus === 'checking' && (
                                                    <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
                                                )}
                                                {usernameStatus === 'available' && (
                                                    <Check className="w-4 h-4 text-success" />
                                                )}
                                                {usernameStatus === 'taken' && (
                                                    <X className="w-4 h-4 text-error" />
                                                )}
                                                {usernameStatus === 'invalid' && (
                                                    <AlertCircle className="w-4 h-4 text-surface-700 dark:text-warning" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                                            3–30 tecken. Endast bokstäver, siffror, understreck och bindestreck.
                                        </p>
                                    </div>
                                </div>

                                {/* Bio */}
                                <div>
                                    <label htmlFor="bio" className="label">
                                        Bio
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 w-4 h-4 text-surface-400" />
                                        <textarea
                                            id="bio"
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            placeholder="Berätta om dig själv..."
                                            rows={4}
                                            maxLength={500}
                                            className="input pl-10 resize-none"
                                        />
                                    </div>
                                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-1 text-right">
                                        {formData.bio.length}/500
                                    </p>
                                </div>

                                {/* Two column layout for location and website */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Location */}
                                    <div>
                                        <label htmlFor="location" className="label">
                                            Plats
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                            <input
                                                id="location"
                                                name="location"
                                                type="text"
                                                value={formData.location}
                                                onChange={handleChange}
                                                placeholder="Stad, land"
                                                maxLength={100}
                                                className="input pl-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Website */}
                                    <div>
                                        <label htmlFor="website" className="label">
                                            Webbplats
                                        </label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                            <input
                                                id="website"
                                                name="website"
                                                type="url"
                                                value={formData.website}
                                                onChange={handleChange}
                                                placeholder="https://dinwebbplats.se"
                                                className="input pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading || usernameStatus === 'taken' || usernameStatus === 'checking'}
                                        className="btn-primary px-8 py-2.5"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Sparar...</span>
                                            </>
                                        ) : (
                                            <span>Spara ändringar</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Account Tab */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            {/* Email Section */}
                            <div className="card p-6 sm:p-8">
                                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-6">
                                    E-postadress
                                </h2>
                                <div>
                                    <label className="label">E-post</label>
                                    <input
                                        type="email"
                                        value={user.email || ''}
                                        disabled
                                        className="input bg-surface-50 dark:bg-surface-800 text-surface-500 dark:text-surface-400 cursor-not-allowed"
                                    />
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                                        Kontakta supporten för att byta e-postadress.
                                    </p>
                                </div>
                            </div>

                            {/* Security Section */}
                            <div className="card p-6 sm:p-8">
                                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-6">
                                    Säkerhet
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                        <div>
                                            <h3 className="font-medium text-surface-900 dark:text-surface-100">
                                                Lösenord
                                            </h3>
                                            <p className="text-sm text-surface-500 dark:text-surface-400">
                                                Håll ditt konto säkert med ett starkt lösenord
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsChangePasswordModalOpen(true)}
                                            className="btn-secondary px-4 py-2 text-sm"
                                        >
                                            Byt lösenord
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {is2FAEnabled ? (
                                                <div className="p-2 bg-success/15 dark:bg-success/20 rounded-lg">
                                                    <ShieldCheck className="w-5 h-5 text-surface-900 dark:text-success" />
                                                </div>
                                            ) : (
                                                <div className="p-2 bg-surface-200 dark:bg-surface-700 rounded-lg">
                                                    <ShieldOff className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-medium text-surface-900 dark:text-surface-100">
                                                    Tvåfaktorsautentisering
                                                </h3>
                                                <p className="text-sm text-surface-500 dark:text-surface-400">
                                                    {is2FAEnabled
                                                        ? 'Ditt konto är skyddat med 2FA'
                                                        : 'Lägg till ett extra säkerhetslager för ditt konto'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        {is2FALoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-surface-400" />
                                        ) : is2FAEnabled ? (
                                            <button
                                                onClick={() => setIs2FADisableModalOpen(true)}
                                                className="px-4 py-2 min-h-11 text-sm font-medium text-error-strong dark:text-error-soft border border-error/60 rounded-lg hover:bg-error/10 dark:hover:bg-error/20 transition-colors"
                                            >
                                                Inaktivera 2FA
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setIs2FASetupModalOpen(true)}
                                                className="px-4 py-2 min-h-11 text-sm font-medium text-surface-900 dark:text-success border border-success/60 rounded-lg hover:bg-success/10 dark:hover:bg-success/20 transition-colors"
                                            >
                                                Aktivera 2FA
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="card p-6 sm:p-8 border-error/60 dark:border-error/60">
                                <h2 className="text-lg font-semibold text-error-strong dark:text-error-soft mb-4">
                                    Farozon
                                </h2>
                                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                                    När du har tagit bort ditt konto går det inte att ångra. Var helt säker.
                                </p>
                                <button className="btn-danger text-sm">
                                    Ta bort konto
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Subscription Tab */}
                    {activeTab === 'subscription' && (
                        <div className="card p-6 sm:p-8">
                            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-6">
                                Prenumerationsstatus
                            </h2>

                            <div className="mb-6">
                                <SubscriptionBadge showDetails />
                            </div>

                            <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-6 space-y-4">
                                <h3 className="font-medium text-surface-900 dark:text-surface-100">
                                    Medlemsförmåner
                                </h3>
                                <ul className="space-y-3">
                                    {[
                                        'Tillgång till alla communityfunktioner',
                                        'Delta i exklusiva klassrum',
                                        'Skicka in projekt till Projekt-sektionen',
                                        'Direktmeddelanden med medlemmar',
                                        'Prioriterad support',
                                    ].map((benefit, index) => (
                                        <li key={index} className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-400">
                                            <Check className="w-4 h-4 text-success flex-shrink-0" />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={async () => {
                                    try {
                                        const url = await subscriptionService.createPortalSession();
                                        window.location.href = url;
                                    } catch {
                                        // User may not have a Stripe customer yet
                                    }
                                }}
                                className="mt-6 btn-primary text-sm"
                            >
                                Hantera prenumeration
                            </button>
                            <p className="text-sm text-surface-500 dark:text-surface-400 mt-3">
                                Hantera din prenumeration via Stripe. Det kan ta några minuter innan ändringar syns här.
                            </p>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            {/* Email Notifications */}
                            <div className="card p-6 sm:p-8">
                                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                                    E-postnotiser
                                </h2>
                                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
                                    Välj vilka notiser du vill få via e-post.
                                </p>

                                {isPrefsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Error message */}
                                        {prefsError && (
                                            <div className="alert-error mb-4 items-center">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                <span>{prefsError}</span>
                                            </div>
                                        )}

                                        {/* Success message */}
                                        {prefsSaved && (
                                            <div className="alert-success mb-4 items-center">
                                                <Check className="w-4 h-4" />
                                                <span>Notisinställningarna har sparats!</span>
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            {[
                                                { id: 'email_comments' as const, label: 'Kommentarer på dina inlägg', description: 'Få ett mejl när någon kommenterar dina inlägg' },
                                                { id: 'email_replies' as const, label: 'Svar på dina kommentarer', description: 'Få ett mejl när någon svarar på dina kommentarer' },
                                                { id: 'email_mentions' as const, label: 'Omnämnanden', description: 'Få ett mejl när någon @nämner dig i en kommentar' },
                                                { id: 'email_messages' as const, label: 'Direktmeddelanden', description: 'Få ett mejl när du får ett nytt direktmeddelande' },
                                                { id: 'email_announcements' as const, label: 'Nyheter från communityt', description: 'Få viktiga uppdateringar om communityt' },
                                            ].map((item) => (
                                                <div key={item.id} className="flex items-center justify-between py-4 border-b border-surface-100 dark:border-surface-800 last:border-0">
                                                    <div>
                                                        <h3 className="font-medium text-surface-900 dark:text-surface-100">
                                                            {item.label}
                                                        </h3>
                                                        <p className="text-sm text-surface-500 dark:text-surface-400">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={notificationPrefs?.[item.id] ?? true}
                                                            onChange={(e) => handlePrefChange(item.id, e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-primary-600"></div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* In-App Notifications */}
                            <div className="card p-6 sm:p-8">
                                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                                    Notiser i appen
                                </h2>
                                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
                                    Välj vilka notiser som visas i ditt notiscenter.
                                </p>

                                {isPrefsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {[
                                            { id: 'notify_comments' as const, label: 'Kommentarer', description: 'När någon kommenterar dina inlägg' },
                                            { id: 'notify_replies' as const, label: 'Svar', description: 'När någon svarar på dina kommentarer' },
                                            { id: 'notify_mentions' as const, label: 'Omnämnanden', description: 'När någon @nämner dig' },
                                            { id: 'notify_messages' as const, label: 'Meddelanden', description: 'När du får ett direktmeddelande' },
                                            { id: 'notify_reactions' as const, label: 'Reaktioner', description: 'När någon reagerar på ditt innehåll' },
                                        ].map((item) => (
                                            <div key={item.id} className="flex items-center justify-between py-4 border-b border-surface-100 dark:border-surface-800 last:border-0">
                                                <div>
                                                    <h3 className="font-medium text-surface-900 dark:text-surface-100">
                                                        {item.label}
                                                    </h3>
                                                    <p className="text-sm text-surface-500 dark:text-surface-400">
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={notificationPrefs?.[item.id] ?? true}
                                                        onChange={(e) => handlePrefChange(item.id, e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-primary-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Save Button */}
                            {!isPrefsLoading && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSavePreferences}
                                        disabled={isPrefsSaving}
                                        className="btn-primary px-8 py-2.5"
                                    >
                                        {isPrefsSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Sparar...</span>
                                            </>
                                        ) : (
                                            <span>Spara inställningar</span>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={isChangePasswordModalOpen}
                onClose={() => setIsChangePasswordModalOpen(false)}
            />

            {/* 2FA Setup Modal */}
            <TwoFactorSetupModal
                isOpen={is2FASetupModalOpen}
                onClose={() => setIs2FASetupModalOpen(false)}
                onSuccess={() => {
                    setIs2FAEnabled(true);
                    fetch2FAStatus();
                }}
            />

            {/* 2FA Disable Modal */}
            <TwoFactorDisableModal
                isOpen={is2FADisableModalOpen}
                onClose={() => setIs2FADisableModalOpen(false)}
                onSuccess={() => {
                    setIs2FAEnabled(false);
                    fetch2FAStatus();
                }}
            />
        </div>
    );
}
