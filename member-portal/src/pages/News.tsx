import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import type { MemberNews } from '@/types';

function formatDate(iso: string): string {
    return format(new Date(iso), 'd MMMM yyyy', { locale: sv });
}

/** Första 150 tecknen av innehållet, med ellips om texten är längre. */
function excerpt(content: string): string {
    const trimmed = content.trim();
    if (trimmed.length <= 150) return trimmed;
    return `${trimmed.slice(0, 150).trimEnd()}…`;
}

export default function News() {
    const { current } = useAssociation();

    const [news, setNews] = useState<MemberNews[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!current) return;

        let active = true;
        setLoading(true);
        setError(null);

        const load = async () => {
            const { data, error: queryError } = await supabase
                .from('member_news')
                .select('id, association_id, title, content, status, published_at, created_by, created_at, updated_at')
                .eq('association_id', current.id)
                .eq('status', 'published')
                .order('published_at', { ascending: false });

            if (!active) return;

            if (queryError) {
                setError('Nyheterna kunde inte hämtas. Försök igen senare.');
                setNews([]);
            } else {
                setNews((data as MemberNews[] | null) ?? []);
            }
            setLoading(false);
        };

        void load();

        return () => {
            active = false;
        };
    }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl text-surface-900 dark:text-surface-50">Nyheter</h1>
                <p className="text-surface-600 dark:text-surface-300 mt-1">
                    Publicerade nyheter från din förening.
                </p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="card p-4 space-y-2">
                            <div className="skeleton h-5 w-2/3" />
                            <div className="skeleton h-4 w-1/3" />
                            <div className="skeleton h-4 w-full" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="alert-error" role="alert">
                    {error}
                </div>
            ) : news.length === 0 ? (
                <div className="card p-6 text-center">
                    <p className="text-sm text-surface-600 dark:text-surface-300">
                        Inga nyheter har publicerats ännu.
                    </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {news.map((item) => (
                        <li key={item.id}>
                            <Link to={`/news/${item.id}`} className="card-hover block p-4 group">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="text-base text-surface-900 dark:text-surface-50 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                                            {item.title}
                                        </h2>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                                            {formatDate(item.published_at ?? item.created_at)}
                                        </p>
                                    </div>
                                    <ChevronRight
                                        className="w-4 h-4 shrink-0 mt-1 text-surface-400"
                                        aria-hidden="true"
                                    />
                                </div>
                                <p className="text-sm text-surface-600 dark:text-surface-300 mt-2">
                                    {excerpt(item.content)}
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
