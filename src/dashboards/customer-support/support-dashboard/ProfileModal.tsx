import React from 'react';
import { X } from 'lucide-react';
import { ProfileManagement } from '../../client/ProfileManagement';

interface ProfileModalProps {
  user: React.ComponentProps<typeof ProfileManagement>['user'];
  onShowToast: (msg: string) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onShowToast, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-0 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Edit profile">
      <div className="relative w-full max-w-3xl bg-[#121214] border border-zinc-800 sm:rounded-2xl p-4 sm:p-6 min-h-full sm:min-h-0">
        <button onClick={onClose} className="absolute top-3 right-3 text-zinc-400 hover:text-white cursor-pointer" aria-label="Close profile"><X className="w-5 h-5" /></button>
        <ProfileManagement user={user} onShowToast={onShowToast} />
      </div>
    </div>
  );
};
