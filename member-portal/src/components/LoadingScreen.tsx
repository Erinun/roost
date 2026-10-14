import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-300" aria-hidden="true" />
            <span className="sr-only">Laddar…</span>
        </div>
    );
}
