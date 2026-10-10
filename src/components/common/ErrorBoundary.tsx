import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in component tree:', error, errorInfo);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6 text-center space-y-4">
                        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                        <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                            Något gick fel
                        </h1>
                        <p className="text-sm text-surface-600 dark:text-surface-400">
                            Ett oväntat fel inträffade. Ladda om sidan för att försöka igen.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Ladda om sidan
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
