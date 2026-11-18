import React from 'react';
import { User } from '../../../types';
import { Key, X } from 'lucide-react';

interface ResetPasswordModalProps {
  user: User;
  newPassword: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  user,
  newPassword,
  onPasswordChange,
  onSubmit,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full h-full sm:h-auto sm:max-w-sm bg-[#111111] text-white border-0 sm:border border-gray-800 p-4 sm:p-6 shadow-2xl rounded-none sm:rounded-xl flex flex-col justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-sm font-black uppercase text-amber-400 mb-2 flex items-center gap-2">
          <Key className="w-4 h-4" /> RESET USER PASSWORD
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Enter a new password for <strong className="text-white">{user.name}</strong> ({user.email}).
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              New Password *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter new password"
              required
              className="w-full bg-gray-900 border border-amber-800 text-white px-3.5 py-2.5 text-sm font-mono outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-bold uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase cursor-pointer"
            >
              Confirm Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
