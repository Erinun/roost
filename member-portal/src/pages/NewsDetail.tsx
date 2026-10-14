import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MemberNews } from '@/types';

function formatDate(iso: string): string {
    return format(new Date(iso), 'd MMMM yyyy', { locale: sv });
}

export default function NewsDetail() {
    const { id } = useParams<{ id: string }>();

    const [item, setItem] = useState<MemberNews | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        let active = true;
        setLoading(true);
        setError(null);

        const load = async () => {
            const { data, error: queryError } = await supabase
                .from('member_news')
                .select('id, association_id, title, content, status, published_at, created_by, created_at, updated_at')
                .eq('id', id)
                .eq('status', 'published')
                .maybeSingle();

            if (!active) return;

            if (queryError) {
                setError('Nyheten kunde inte hämtas. Försök igen senare.');
                setItem(null);
            } else {
                setItem((data as MemberNews | null) ?? null);
            }
            setLoading(false);
        };

        void load();

        return () => {
            active = false;
        };
    }, [id]);

    return (
        <div className="mx-auto max-w-2xl space-y-4 animate-fade-in">
            <Link to="/news" className="link text-sm inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Tillbaka till nyheter
            </Link>

            {loading ? (
                <div className="card p-4 space-y-3">
                    <div className="skeleton h-7 w-3/4" />
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-2/3" />
                </div>
            ) : error ? (
                <div className="alert-error" role="alert">
                    {error}
                </div>
            ) : !item ? (
                <div className="card p-6 text-center">
                    <p className="text-sm text-surface-600 dark:text-surface-300">
                        Nyheten hittades inte. Den kan ha avpublicerats.
                    </p>
                </div>
            ) : (
                <article className="card p-4 sm:p-6">
                    <h1 className="text-2xl text-surface-900 dark:text-surface-50">{item.title}</h1>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                        {formatDate(item.published_at ?? item.created_at)}
                    </p>
                    <div className="whitespace-pre-wrap text-surface-800 dark:text-surface-100 mt-4">
                        {item.content}
                    </div>
                </article>
            )}
        </div>
    );
}
