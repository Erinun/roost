import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Send, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MemberApplicationInsert, PublicAssociation } from '@/types';

export default function Apply() {
    const appName = import.meta.env.VITE_APP_NAME || 'Medlemsportalen';

    const [associations, setAssociations] = useState<PublicAssociation[]>([]);
    const [loadingAssociations, setLoadingAssociations] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [associationId, setAssociationId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');

    const [sending, setSending] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        let active = true;

        const load = async () => {
            const { data, error } = await supabase.rpc('list_associations_public');

            if (!active) return;

            if (error) {
                setLoadError('Föreningslistan kunde inte hämtas. Försök igen senare.');
                setAssociations([]);
            } else {
                const list = (data as PublicAssociation[] | null) ?? [];
                setAssociations(list);
                // Förvälj föreningen när det bara finns en
                if (list.length === 1) setAssociationId(list[0].id);
            }
            setLoadingAssociations(false);
        };

        void load();

        return () => {
            active = false;
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!associationId) return;

        setSending(true);
        setSubmitError(null);

        const payload: MemberApplicationInsert = {
            association_id: associationId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim() || null,
            message: message.trim() || null,
        };

        const { error } = await supabase.from('member_applications').insert(payload);

        if (error) {
            if (error.code === '23505') {
                // Unik-krock: samma e-post har redan en väntande ansökan
                setSubmitError('Du har redan en pågående ansökan till den här föreningen.');
            } else {
                setSubmitError('Ansökan kunde inte skickas. Försök igen senare.');
            }
            setSending(false);
            return;
        }

        setSubmitted(true);
        setSending(false);
    };

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md animate-fade-in">
                {/* Rubrik */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" aria-hidden="true" />
                    </div>
                    <h1 className="text-2xl text-surface-900 dark:text-surface-50">{appName}</h1>
                    <p className="text-surface-600 dark:text-surface-300 mt-1 text-sm">
                        Ansök om åtkomst till din förening
                    </p>
                </div>

                {submitted ? (
                    /* Bekräftelse */
                    <div className="card p-6 sm:p-8 text-center">
                        <CheckCircle2
                            className="w-12 h-12 mx-auto mb-4 text-success"
                            aria-hidden="true"
                        />
                        <h2 className="text-lg text-surface-900 dark:text-surface-50 mb-2">
                            Tack för din ansökan!
                        </h2>
                        <p className="text-sm text-surface-600 dark:text-surface-300">
                            Föreningen granskar din ansökan och återkommer till dig via e-post
                            när den är godkänd.
                        </p>
                        <Link to="/login" className="btn-secondary w-full mt-6">
                            Tillbaka till inloggningen
                        </Link>
                    </div>
                ) : (
                    <div className="card p-6 sm:p-8">
                        {loadError && (
                            <div className="alert-error mb-6" role="alert">
                                {loadError}
                            </div>
                        )}

                        {submitError && (
                            <div className="alert-error mb-6" role="alert">
                                {submitError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Förening */}
                            <div>
                                <label htmlFor="association" className="label">
                                    Förening
                                </label>
                                <select
                                    id="association"
                                    value={associationId}
                                    onChange={(e) => setAssociationId(e.target.value)}
                                    required
                                    className="input"
                                    disabled={sending || loadingAssociations || associations.length === 0}
                                >
                                    <option value="" disabled>
                                        {loadingAssociations ? 'Hämtar föreningar...' : 'Välj förening'}
                                    </option>
                                    {associations.map((association) => (
                                        <option key={association.id} value={association.id}>
                                            {association.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Namn */}
                            <div>
                                <label htmlFor="name" className="label">
                                    Namn
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="För- och efternamn"
                                    autoComplete="name"
                                    required
                                    minLength={2}
                                    maxLength={100}
                                    className="input"
                                    disabled={sending}
                                />
                            </div>

                            {/* E-post */}
                            <div>
                                <label htmlFor="email" className="label">
                                    E-post
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="du@exempel.se"
                                    autoComplete="email"
                                    required
                                    className="input"
                                    disabled={sending}
                                />
                            </div>

                            {/* Telefon (valfritt) */}
                            <div>
                                <label htmlFor="phone" className="label">
                                    Telefon <span className="text-surface-400 font-normal">(valfritt)</span>
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="070-123 45 67"
                                    autoComplete="tel"
                                    maxLength={30}
                                    className="input"
                                    disabled={sending}
                                />
                            </div>

                            {/* Meddelande (valfritt) */}
                            <div>
                                <label htmlFor="message" className="label">
                                    Meddelande <span className="text-surface-400 font-normal">(valfritt)</span>
                                </label>
                                <textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="T.ex. vem du är eller varför du ansöker"
                                    maxLength={2000}
                                    rows={3}
                                    className="input resize-y"
                                    disabled={sending}
                                />
                            </div>

                            {/* Skicka */}
                            <button
                                type="submit"
                                disabled={sending || !associationId}
                                className="btn-primary w-full"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                        <span>Skickar...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" aria-hidden="true" />
                                        <span>Skicka ansökan</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tillbaka */}
                {!submitted && (
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-6 text-center">
                        <Link to="/login" className="link inline-flex items-center gap-1">
                            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                            Tillbaka till inloggningen
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
