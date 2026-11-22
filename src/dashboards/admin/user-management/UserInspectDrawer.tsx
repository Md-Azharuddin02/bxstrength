import React from 'react';
import { User } from '../../../types';
import { Award, DollarSign, X } from 'lucide-react';

interface UserInspectDrawerProps {
  user: User;
  onClose: () => void;
}

export const UserInspectDrawer: React.FC<UserInspectDrawerProps> = ({ user: inspectUser, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-[#111111] text-white border-0 sm:border-l border-gray-800 p-4 sm:p-6 shadow-2xl h-full overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={inspectUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(inspectUser.name)}`}
              alt={inspectUser.name}
              className="w-12 h-12 rounded-full border-2 border-[#E52165]"
            />
            <div>
              <h3 className="text-base font-black uppercase text-white">{inspectUser.name}</h3>
              <span className="text-xs text-gray-400">{inspectUser.email}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-gray-900 text-gray-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Overview */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-gray-900/60 p-4 border border-gray-800 rounded">
          <div>
            <span className="text-gray-500 uppercase font-bold block text-[10px]">Account ID</span>
            <span className="font-mono text-gray-300">{inspectUser.id}</span>
          </div>
          <div>
            <span className="text-gray-500 uppercase font-bold block text-[10px]">Role</span>
            <span className="font-bold text-amber-400 uppercase">{inspectUser.role}</span>
          </div>
          <div>
            <span className="text-gray-500 uppercase font-bold block text-[10px]">Account Access Status</span>
            <span className={`font-bold uppercase ${inspectUser.status === 'inactive' ? 'text-red-400' : 'text-emerald-400'}`}>
              {inspectUser.status || 'ACTIVE'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 uppercase font-bold block text-[10px]">Verification Status</span>
            <span className={`font-bold uppercase ${inspectUser.isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
              {inspectUser.isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 uppercase font-bold block text-[10px]">Mobile Phone</span>
            <span className="font-mono text-gray-200">{inspectUser.phone || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500 uppercase font-bold block text-[10px]">Height</span>
            <span className="font-mono text-emerald-400">{inspectUser.heightCm || 175} cm</span>
          </div>
          <div>
            <span className="text-gray-500 uppercase font-bold block text-[10px]">Assigned Coach</span>
            <span className="font-bold text-white">{inspectUser.assignedCoach || 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-gray-500 uppercase font-bold block text-[10px]">Assigned Head Coach</span>
            <span className="font-bold text-amber-400">{inspectUser.assignedHeadCoach || 'Unassigned'}</span>
          </div>
        </div>

        {/* Subscriptions & Invoices */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase text-pink-400 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" /> Purchased Services & Invoices
          </h4>
          <div className="bg-gray-900 p-3 border border-gray-800 rounded space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase">Membership Tier:</span>
              <span className="font-mono text-white font-bold">{inspectUser.subscriptionTier || 'Normal User'}</span>
            </div>
            {inspectUser.billingStatements && inspectUser.billingStatements.length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t border-gray-800">
                {inspectUser.billingStatements.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center text-[11px] bg-black p-2 border border-gray-800 rounded">
                    <div>
                      <span className="font-mono text-white font-bold block">{inv.invoiceNumber} • £{inv.amount}</span>
                      <span className="text-gray-400 text-[10px]">{inv.description} • {inv.date}</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[10px]">{inv.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-500 italic">No billing statements recorded.</p>
            )}
          </div>
        </div>

        {/* Fitness Goals */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
            <Award className="w-4 h-4" /> Fitness Goals & Coaching Notes
          </h4>
          <div className="bg-gray-900 p-3 border border-gray-800 rounded text-xs text-gray-300 leading-relaxed">
            {inspectUser.fitnessGoals || 'No fitness goals recorded.'}
          </div>
        </div>
      </div>
    </div>
  );
};
