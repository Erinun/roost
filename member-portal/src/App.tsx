import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import Login from '@/pages/Login';
import Apply from '@/pages/Apply';
import Home from '@/pages/Home';
import News from '@/pages/News';
import NewsDetail from '@/pages/NewsDetail';
import Activities from '@/pages/Activities';
import Contact from '@/pages/Contact';

/** /login: inloggad användare skickas till startsidan. */
function LoginGate() {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (user) return <Navigate to="/" replace />;

    return <Login />;
}

/** /apply: ansökan om åtkomst — inloggad användare skickas till startsidan. */
function ApplyGate() {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (user) return <Navigate to="/" replace />;

    return <Apply />;
}

/** Skyddat skal: kräver inloggning och minst ett föreningsmedlemskap. */
function ProtectedShell() {
    const { user, loading: authLoading, signOut } = useAuth();
    const { associations, loading: associationsLoading } = useAssociation();

    if (authLoading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (associationsLoading) return <LoadingScreen />;

    if (associations.length === 0) {
        return (
            <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center px-4">
                <div className="card p-8 w-full max-w-md text-center animate-fade-in">
                    <h1 className="text-xl text-surface-900 dark:text-surface-50 mb-2">
                        Ingen förening hittades
                    </h1>
                    <p className="text-surface-600 dark:text-surface-300">
                        Ditt konto är inte kopplat till någon förening. Kontakta din förening.
                    </p>
                    <button
                        type="button"
                        onClick={() => void signOut()}
                        className="btn-secondary w-full mt-6"
                    >
                        Logga ut
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <Outlet />
        </Layout>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginGate />} />
            <Route path="/apply" element={<ApplyGate />} />
            <Route element={<ProtectedShell />}>
                <Route path="/" element={<Home />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<NewsDetail />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/contact" element={<Contact />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
