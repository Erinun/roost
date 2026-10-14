import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Newspaper, CalendarDays, MessageCircle, MapPin, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import type { AssociationActivity, MemberNews } from '@/types';

function formatDate(iso: string): string {
    return format(new Date(iso), 'd MMMM yyyy', { locale: sv });
}

export default function Home() {
    const { profile } = useAuth();
    const { current } = useAssociation();

    const [news, setNews] = useState<MemberNews[]>([]);
    const [nextActivity, setNextActivity] = useState<AssociationActivity | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!current) return;

        let active = true;
        setLoadingData(true);
        setError(null);

        const load = async () => {
            const [newsRes, activityRes] = await Promise.all([
                supabase
                    .from('member_news')
                    .select('id, association_id, title, content, status, published_at, created_by, created_at, updated_at')
                    .eq('association_id', current.id)
                    .eq('status', 'published')
                    .order('published_at', { ascending: false })
                    .limit(3),
                supabase
                    .from('association_activities')
                    .select('*')
                    .eq('association_id', current.id)
                    .eq('is_published', true)
                    .gte('starts_at', new Date().toISOString())
                    .order('starts_at', { ascending: true })
                    .limit(1),
            ]);

            if (!active) return;

            if (newsRes.error || activityRes.error) {
                setError('Innehållet kunde inte hämtas. Försök igen senare.');
                setNews([]);
                setNextActivity(null);
                setLoadingData(false);
                return;
            }

            setNews((newsRes.data as MemberNews[] | null) ?? []);
            const activities = (activityRes.data as AssociationActivity[] | null) ?? [];
            setNextActivity(activities[0] ?? null);
            setLoadingData(false);
        };

        void load();

        return () => {
            active = false;
        };
    }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const firstName =
        profile?.display_name?.trim().split(/\s+/)[0] || profile?.username || '';

    return (
        <div className="grid gap-6 lg:grid-cols-2 animate-fade-in">
            {/* Hälsning */}
            <div className="lg:col-span-2">
                <h1 className="text-2xl text-surface-900 dark:text-surface-50">
                    {firstName ? `Hej ${firstName}!` : 'Hej!'} 👋
                </h1>
                <p className="text-surface-600 dark:text-surface-300 mt-1">
                    Här hittar du det senaste från din förening.
                </p>
            </div>

            {/* Senaste nytt */}
            <section className="card p-4" aria-labelledby="senaste-nytt">
                <div className="flex items-center justify-between mb-3">
                    <h2 id="senaste-nytt" className="text-base text-surface-900 dark:text-surface-50 flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-primary-600 dark:text-primary-300" aria-hidden="true" />
                        Senaste nytt
                    </h2>
                    <Link to="/news" className="link text-sm">
                        Alla nyheter
                    </Link>
                </div>

                {loadingData ? (
                    <div className="space-y-3">
                        <div className="skeleton h-5 w-3/4" />
                        <div className="skeleton h-5 w-2/3" />
                        <div className="skeleton h-5 w-1/2" />
                    </div>
                ) : error ? (
                    <div className="alert-error" role="alert">
                        {error}
                    </div>
                ) : news.length === 0 ? (
                    <p className="text-sm text-surface-600 dark:text-surface-300">
                        Inga nyheter har publicerats ännu.
                    </p>
                ) : (
                    <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                        {news.map((item) => (
                            <li key={item.id}>
                                <Link
                                    to={`/news/${item.id}`}
                                    className="flex items-center justify-between gap-3 py-2.5 group"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-surface-900 dark:text-surface-50 truncate group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                                            {item.title}
                                        </p>
                                        {item.published_at && (
                                            <p className="text-sm text-surface-500 dark:text-surface-400">
                                                {formatDate(item.published_at)}
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight className="w-4 h-4 shrink-0 text-surface-400" aria-hidden="true" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Nästa aktivitet */}
            <section className="card p-4" aria-labelledby="nasta-aktivitet">
                <h2 id="nasta-aktivitet" className="text-base text-surface-900 dark:text-surface-50 flex items-center gap-2 mb-3">
                    <CalendarDays className="w-4 h-4 text-primary-600 dark:text-primary-300" aria-hidden="true" />
                    Nästa aktivitet
                </h2>

                {loadingData ? (
                    <div className="flex gap-3">
                        <div className="skeleton w-16 h-16 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <div className="skeleton h-5 w-2/3" />
                            <div className="skeleton h-4 w-1/2" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="alert-error" role="alert">
                        {error}
                    </div>
                ) : nextActivity ? (
                    <Link to="/activities" className="flex items-center gap-4 group">
                        {/* Datum stort */}
                        <div className="w-16 h-16 shrink-0 rounded-lg bg-primary-50 dark:bg-surface-800 border border-primary-100 dark:border-surface-700 flex flex-col items-center justify-center text-primary-700 dark:text-primary-300">
                            <span className="text-2xl font-bold leading-none font-heading">
                                {format(new Date(nextActivity.starts_at), 'd')}
                            </span>
                            <span className="text-xs font-semibold uppercase mt-0.5">
                                {format(new Date(nextActivity.starts_at), 'MMM', { locale: sv })}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-surface-900 dark:text-surface-50 truncate group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                                {nextActivity.title}
                            </p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">
                                {format(new Date(nextActivity.starts_at), 'EEEE d MMMM', { locale: sv })}{' '}
                                kl {format(new Date(nextActivity.starts_at), 'HH:mm')}
                            </p>
                            {nextActivity.location && (
                                <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                    <span className="truncate">{nextActivity.location}</span>
                                </p>
                            )}
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0 ml-auto text-surface-400" aria-hidden="true" />
                    </Link>
                ) : (
                    <p className="text-sm text-surface-600 dark:text-surface-300">
                        Inga inplanerade aktiviteter just nu.
                    </p>
                )}
            </section>

            {/* Snabbknappar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:col-span-2">
                <Link to="/news" className="btn-secondary w-full justify-start">
                    <Newspaper className="w-4 h-4" aria-hidden="true" />
                    Nyheter
                </Link>
                <Link to="/activities" className="btn-secondary w-full justify-start">
                    <CalendarDays className="w-4 h-4" aria-hidden="true" />
                    Aktiviteter
                </Link>
                <Link to="/contact" className="btn-secondary w-full justify-start">
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    Kontakta föreningen
                </Link>
            </div>
        </div>
    );
}
