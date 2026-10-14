import { useState, useRef } from 'react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import {
    Save,
    Upload,
    Palette,
    Type,
    Image,
    Globe,
    Loader2,
    Check,
    X,
    Puzzle,
    Radio,
    Key,
    Lightbulb,
} from 'lucide-react';
import type { FeatureAccess } from '@/contexts/SiteSettingsContext';

// Förval ur Aktiespararnas grafiska profil 2023 (se docs/redesign/designsystem.md)
const COLOR_PRESETS = [
    { name: 'Blå', value: '#185DA9' },
    { name: 'Himmelsblå', value: '#159EDA' },
    { name: 'Blågrön', value: '#32D7CD' },
    { name: 'Lila', value: '#652FA0' },
    { name: 'Plommonlila', value: '#973B8E' },
    { name: 'Rosa', value: '#EE0181' },
    { name: 'Röd', value: '#EC5345' },
    { name: 'Orange', value: '#F5A118' },
    { name: 'Gul', value: '#FBC231' },
];

export default function AdminSiteSettings() {
    const { settings, updateSettings, uploadBrandingAsset } = useSiteSettings();
    const [form, setForm] = useState(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const logoRef = useRef<HTMLInputElement>(null);
    const logoDarkRef = useRef<HTMLInputElement>(null);
    const faviconRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await updateSettings({
                site_name: form.site_name,
                site_tagline: form.site_tagline,
                site_description: form.site_description,
                primary_color: form.primary_color,
                support_email: form.support_email,
                support_url: form.support_url,
                feature_live_room: form.feature_live_room,
                feature_activations: form.feature_activations,
                feature_roadmap: form.feature_roadmap,
            });
            setMessage({ type: 'success', text: 'Inställningarna har sparats!' });
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Det gick inte att spara inställningarna' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpload = async (file: File, type: 'logo' | 'logo_dark' | 'favicon') => {
        setIsUploading(type);
        setMessage(null);
        try {
            const url = await uploadBrandingAsset(file, type);
            const key = type === 'logo' ? 'logo_url' : type === 'logo_dark' ? 'logo_dark_url' : 'favicon_url';
            setForm(prev => ({ ...prev, [key]: url }));
            setMessage({ type: 'success', text: `${type === 'favicon' ? 'Favicon' : 'Logotyp'} har laddats upp!` });
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Uppladdningen misslyckades' });
        } finally {
            setIsUploading(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'logo_dark' | 'favicon') => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file, type);
        e.target.value = '';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Webbplatsinställningar</h1>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                        Anpassa din communitys varumärke och utseende
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Spara ändringar
                </button>
            </div>

            {/* Status message */}
            {message && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                    message.type === 'success'
                        ? 'bg-success/10 dark:bg-success/15 text-surface-900 dark:text-surface-50 border border-success/40'
                        : 'bg-error/10 dark:bg-error/20 text-surface-900 dark:text-error-soft border border-error/60'
                }`}>
                    {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* Site Identity */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Type className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Webbplatsidentitet</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                            Webbplatsnamn
                        </label>
                        <input
                            type="text"
                            value={form.site_name}
                            onChange={e => setForm(prev => ({ ...prev, site_name: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Min community"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                            Slogan
                        </label>
                        <input
                            type="text"
                            value={form.site_tagline}
                            onChange={e => setForm(prev => ({ ...prev, site_tagline: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Lär, bygg och väx tillsammans"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                            Beskrivning
                        </label>
                        <textarea
                            value={form.site_description}
                            onChange={e => setForm(prev => ({ ...prev, site_description: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            placeholder="En community-plattform för att lära och växa tillsammans."
                        />
                    </div>
                </div>
            </div>

            {/* Logos */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Image className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Logotyper</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Light Logo */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Logotyp (ljust tema)
                        </label>
                        <div className="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg p-4 text-center">
                            {form.logo_url ? (
                                <img src={form.logo_url} alt="Logotyp" className="h-16 mx-auto mb-2 object-contain" />
                            ) : (
                                <div className="h-16 flex items-center justify-center text-surface-400">
                                    <Image className="w-8 h-8" />
                                </div>
                            )}
                            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'logo')} />
                            <button
                                onClick={() => logoRef.current?.click()}
                                disabled={isUploading === 'logo'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-md transition-colors disabled:opacity-50"
                            >
                                {isUploading === 'logo' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                Ladda upp
                            </button>
                        </div>
                    </div>

                    {/* Dark Logo */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Logotyp (mörkt tema)
                        </label>
                        <div className="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg p-4 text-center bg-surface-900 dark:bg-surface-800">
                            {form.logo_dark_url ? (
                                <img src={form.logo_dark_url} alt="Mörk logotyp" className="h-16 mx-auto mb-2 object-contain" />
                            ) : (
                                <div className="h-16 flex items-center justify-center text-surface-500">
                                    <Image className="w-8 h-8" />
                                </div>
                            )}
                            <input ref={logoDarkRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'logo_dark')} />
                            <button
                                onClick={() => logoDarkRef.current?.click()}
                                disabled={isUploading === 'logo_dark'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-700 hover:bg-surface-600 text-surface-200 rounded-md transition-colors disabled:opacity-50"
                            >
                                {isUploading === 'logo_dark' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                Ladda upp
                            </button>
                        </div>
                    </div>

                    {/* Favicon */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Favicon
                        </label>
                        <div className="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg p-4 text-center">
                            {form.favicon_url ? (
                                <img src={form.favicon_url} alt="Favicon" className="h-16 w-16 mx-auto mb-2 object-contain" />
                            ) : (
                                <div className="h-16 flex items-center justify-center text-surface-400">
                                    <Globe className="w-8 h-8" />
                                </div>
                            )}
                            <input ref={faviconRef} type="file" accept="image/png,image/x-icon,image/svg+xml" className="hidden" onChange={e => handleFileSelect(e, 'favicon')} />
                            <button
                                onClick={() => faviconRef.current?.click()}
                                disabled={isUploading === 'favicon'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-md transition-colors disabled:opacity-50"
                            >
                                {isUploading === 'favicon' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                Ladda upp
                            </button>
                        </div>
                        <p className="text-xs text-surface-400 mt-1">Rekommenderat: 32x32 eller 64x64 PNG</p>
                    </div>
                </div>
            </div>

            {/* Primary Color */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Varumärkesfärg</h2>
                </div>

                <div className="space-y-4">
                    {/* Color presets */}
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Förval
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_PRESETS.map(preset => (
                                <button
                                    key={preset.value}
                                    onClick={() => setForm(prev => ({ ...prev, primary_color: preset.value }))}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                        form.primary_color === preset.value
                                            ? 'border-surface-900 dark:border-white ring-2 ring-offset-2 ring-surface-400'
                                            : 'border-surface-200 dark:border-surface-700 hover:border-surface-400'
                                    }`}
                                    title={preset.name}
                                >
                                    <span
                                        className="w-4 h-4 rounded-full border border-surface-900/10"
                                        style={{ backgroundColor: preset.value }}
                                    />
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom color */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                            Anpassad
                        </label>
                        <input
                            type="color"
                            value={form.primary_color}
                            onChange={e => setForm(prev => ({ ...prev, primary_color: e.target.value }))}
                            className="w-10 h-10 rounded-lg cursor-pointer border border-surface-200 dark:border-surface-700"
                        />
                        <input
                            type="text"
                            value={form.primary_color}
                            onChange={e => {
                                const val = e.target.value;
                                if (val.match(/^#[0-9a-fA-F]{0,6}$/)) {
                                    setForm(prev => ({ ...prev, primary_color: val }));
                                }
                            }}
                            className="w-28 px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm font-mono"
                            placeholder="#185DA9"
                        />
                        {/* Preview */}
                        <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-surface-500">Förhandsvisning:</span>
                            <button
                                className="px-4 py-1.5 rounded-lg text-white text-xs font-medium"
                                style={{ backgroundColor: form.primary_color }}
                            >
                                Knapp
                            </button>
                            <span
                                className="text-sm font-medium"
                                style={{ color: form.primary_color }}
                            >
                                Länktext
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Support</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                            Support-e-post
                        </label>
                        <input
                            type="email"
                            value={form.support_email}
                            onChange={e => setForm(prev => ({ ...prev, support_email: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="support@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                            Support-URL
                        </label>
                        <input
                            type="url"
                            value={form.support_url}
                            onChange={e => setForm(prev => ({ ...prev, support_url: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="https://support.example.com"
                        />
                    </div>
                </div>
            </div>

            {/* Feature Modules */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Puzzle className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Funktionsmoduler</h2>
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                    Aktivera eller inaktivera funktioner och styr vem som har åtkomst till dem.
                </p>

                <div className="space-y-3">
                    {([
                        { key: 'feature_live_room' as const, name: 'Live-rum', description: 'Livesändningar med chatt', icon: Radio },
                        { key: 'feature_activations' as const, name: 'Aktiveringar', description: 'Produktaktivering och licenshantering', icon: Key },
                        { key: 'feature_roadmap' as const, name: 'Roadmap & ärenden', description: 'Funktionsönskemål och buggrapporter från användare', icon: Lightbulb },
                    ]).map(feature => {
                        const Icon = feature.icon;
                        const value = (form[feature.key] || 'all') as FeatureAccess;
                        return (
                            <div key={feature.key} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-surface-700 rounded-lg">
                                        <Icon className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{feature.name}</p>
                                        <p className="text-xs text-surface-500 dark:text-surface-400">{feature.description}</p>
                                    </div>
                                </div>
                                <select
                                    value={value}
                                    onChange={e => setForm(prev => ({ ...prev, [feature.key]: e.target.value as FeatureAccess }))}
                                    className="px-3 py-1.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="all">Alla</option>
                                    <option value="premium_only">Endast premium</option>
                                    <option value="disabled">Inaktiverad</option>
                                </select>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
