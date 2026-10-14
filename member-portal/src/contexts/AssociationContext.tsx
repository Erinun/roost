import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Association } from '@/types';

const STORAGE_KEY = 'member-portal:association';

interface AssociationContextValue {
    associations: Association[];
    current: Association | null;
    setCurrent: (association: Association) => void;
    loading: boolean;
}

const AssociationContext = createContext<AssociationContextValue | undefined>(undefined);

export function AssociationProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [associations, setAssociations] = useState<Association[]>([]);
    const [current, setCurrentState] = useState<Association | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setAssociations([]);
            setCurrentState(null);
            setLoading(false);
            return;
        }

        let active = true;
        setLoading(true);

        const load = async () => {
            const { data, error } = await supabase
                .from('association_members')
                .select('joined_at, associations(*)')
                .eq('user_id', user.id)
                .order('joined_at', { ascending: true });

            if (!active) return;

            if (error) {
                console.error('Kunde inte hämta föreningar:', error.message);
                setAssociations([]);
                setCurrentState(null);
                setLoading(false);
                return;
            }

            const list: Association[] = (data ?? [])
                .map((row: { associations: unknown }) =>
                    (Array.isArray(row.associations)
                        ? row.associations[0]
                        : row.associations) as Association | null | undefined
                )
                .filter((a): a is Association => Boolean(a));

            // Initiera från localStorage om det sparade id:t finns bland
            // medlemskapen, annars första föreningen.
            const storedId = localStorage.getItem(STORAGE_KEY);
            const initial = list.find((a) => a.id === storedId) ?? list[0] ?? null;

            setAssociations(list);
            setCurrentState(initial);
            setLoading(false);
        };

        void load();

        return () => {
            active = false;
        };
    }, [user?.id, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const setCurrent = useCallback((association: Association) => {
        setCurrentState(association);
        localStorage.setItem(STORAGE_KEY, association.id);
    }, []);

    return (
        <AssociationContext.Provider value={{ associations, current, setCurrent, loading }}>
            {children}
        </AssociationContext.Provider>
    );
}

export function useAssociation(): AssociationContextValue {
    const context = useContext(AssociationContext);
    if (!context) {
        throw new Error('useAssociation måste användas inom en AssociationProvider');
    }
    return context;
}
