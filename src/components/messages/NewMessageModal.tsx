import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import UserSearchInput from './UserSearchInput';
import type { Profile } from '../../types/database';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (user: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_online' | 'membership_type'>) => void;
}

export default function NewMessageModal({ isOpen, onClose, onUserSelect }: NewMessageModalProps) {
  if (!isOpen) return null;

  const handleUserSelect = (user: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_online' | 'membership_type'>) => {
    onUserSelect(user);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-950/60 dark:bg-surface-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="modal-content relative w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Nytt meddelande</h2>
          <button
            onClick={onClose}
            className="w-11 h-11 -my-2 -mr-2 flex items-center justify-center text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <label className="label mb-2">
            Sök efter en användare att skicka meddelande till
          </label>
          <UserSearchInput
            onUserSelect={handleUserSelect}
            placeholder="Sök på namn eller användarnamn..."
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 rounded-b-xl">
          <p className="text-xs text-surface-500 dark:text-surface-400 text-center">
            Börja skriva för att söka efter användare i communityt
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
