import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <ThemeProvider>
                    <SiteSettingsProvider>
                        <AuthProvider>
                            <App />
                        </AuthProvider>
                    </SiteSettingsProvider>
                </ThemeProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </StrictMode>
);
