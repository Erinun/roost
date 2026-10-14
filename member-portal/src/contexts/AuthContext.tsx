import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { ProfileSummary } from '@/types';

interface AuthContextValue {
    user: User | null;
    profile: ProfileSummary | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<ProfileSummary | null>(null);
    const [loading, setLoading] = useState(true);

    // Hämta session vid start + lyssna på auth-förändringar
    useEffect(() => {
        let active = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!active) return;
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!active) return;
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    // Hämta profilen när användaren ändras (separat effekt för att undvika
    // Supabase-anrop inuti onAuthStateChange-callbacken)
    useEffect(() => {
        if (!user) {
            setProfile(null);
            return;
        }

        let active = true;

        supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
                if (active) {
                    setProfile((data as ProfileSummary | null) ?? null);
                }
            });

        return () => {
            active = false;
        };
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? error.message : null };
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth måste användas inom en AuthProvider');
    }
    return context;
}
