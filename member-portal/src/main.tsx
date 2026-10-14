import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import { AuthProvider } from '@/contexts/AuthContext';
import { AssociationProvider } from '@/contexts/AssociationContext';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <AssociationProvider>
                    <App />
                </AssociationProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);
