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
                <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
                    <div className="card max-w-md w-full p-6 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-8 h-8 text-warning" />
                        </div>
                        <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                            Något gick fel
                        </h1>
                        <p className="text-sm text-surface-600 dark:text-surface-300">
                            Ett oväntat fel inträffade. Ladda om sidan för att försöka igen.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary"
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
