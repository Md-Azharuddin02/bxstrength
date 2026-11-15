import React from 'react';
import { User, UserRole, SubscriptionTier, BillingStatement } from '../../../types';
import { PhoneInput } from '../../../components/PhoneInput';
import { X } from 'lucide-react';
import { BillingInvoicesEditor } from './BillingInvoicesEditor';

interface UserFormModalProps {
  editingUser: User | null;
  isCoach: boolean;
  isHeadCoach: boolean;
  canManageCoaches: boolean;
  availableCoaches: User[];
  availableHeadCoaches: User[];

  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  heightCm: number | '';
  setHeightCm: (v: number | '') => void;
  role: UserRole;
  setRole: (v: UserRole) => void;
  isVerified: boolean;
  setIsVerified: (v: boolean) => void;
  subscriptionTier: SubscriptionTier;
  setSubscriptionTier: (v: SubscriptionTier) => void;
  billingStatements: BillingStatement[];
  fitnessGoals: string;
  setFitnessGoals: (v: string) => void;
  assignedCoach: string;
  setAssignedCoach: (v: string) => void;
  assignedHeadCoach: string;
  setAssignedHeadCoach: (v: string) => void;

  onAddInvoice: () => void;
  onRemoveInvoice: (invId: string) => void;
  onUploadReceipt: (invId: string, file: File) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  editingUser,
  isCoach,
  isHeadCoach,
  canManageCoaches,
  availableCoaches,
  availableHeadCoaches,
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  heightCm,
  setHeightCm,
  role,
  setRole,
  isVerified,
  setIsVerified,
  subscriptionTier,
  setSubscriptionTier,
  billingStatements,
  fitnessGoals,
  setFitnessGoals,
  assignedCoach,
  setAssignedCoach,
  assignedHeadCoach,
  setAssignedHeadCoach,
  onAddInvoice,
  onRemoveInvoice,
  onUploadReceipt,
  onSubmit,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#111111] text-white border-0 sm:border border-gray-800 p-4 sm:p-6 shadow-2xl overflow-y-auto flex flex-col rounded-none sm:rounded-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-black uppercase text-white mb-4">
          {editingUser
            ? `EDIT ACCOUNT: ${editingUser.name}`
            : isCoach
            ? 'ADD NEW CLIENT PROFILE'
            : 'CREATE NEW USER ACCOUNT'}
        </h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white px-3.5 py-2 text-sm outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white px-3.5 py-2 text-sm outline-none"
              required
            />
          </div>

          {!editingUser && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                Initial Account Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="BxStrength2026!"
                className="w-full bg-gray-900 border border-amber-800 text-white px-3.5 py-2 text-sm outline-none font-mono"
                required
              />
              <span className="text-[10px] text-gray-500 block mt-0.5">User will use this password to log in via email/password.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              label="Mobile Phone"
              inputClassName="w-full bg-gray-900 border border-gray-800 text-white pl-[84px] pr-3.5 py-2 text-sm outline-none"
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                placeholder="175"
                className="w-full bg-gray-900 border border-emerald-800 text-white px-3.5 py-2 text-sm outline-none font-mono"
              />
            </div>
          </div>

          {canManageCoaches && (
            <div className="space-y-3 p-3 bg-gray-900/60 border border-gray-800 rounded">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  Assign Account Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-black border border-amber-800 text-white px-3 py-2 text-sm outline-none font-bold uppercase cursor-pointer"
                >
                  <option value="client">Client / Athlete</option>
                  <option value="headcoach">Head Coach</option>
                  <option value="coach">Coach / Trainer</option>
                  {!isHeadCoach && <option value="customer_support">Customer Support Agent</option>}
                  {!isHeadCoach && <option value="admin">System Admin (Master Control)</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  Verification Authority Status *
                </label>
                <select
                  value={isVerified ? 'verified' : 'pending'}
                  onChange={(e) => setIsVerified(e.target.value === 'verified')}
                  className={`w-full bg-black border px-3 py-2 text-sm outline-none font-bold uppercase cursor-pointer ${
                    isVerified ? 'border-emerald-700 text-emerald-400' : 'border-amber-700 text-amber-400'
                  }`}
                >
                  <option value="verified">✅ Verified Account (Active)</option>
                  <option value="pending">⏳ Pending Admin Verification</option>
                </select>
              </div>
            </div>
          )}

          {/* Central Coach & Head Coach Assignment Selectors */}
          <div className="space-y-3 p-3 bg-gray-900/60 border border-gray-800 rounded">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                Assigned Coach
              </label>
              <select
                value={assignedCoach}
                onChange={(e) => setAssignedCoach(e.target.value)}
                className="w-full bg-black border border-blue-900 text-white px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">-- Unassigned --</option>
                {availableCoaches.map((c) => (
                  <option key={c.id} value={c.name}>{c.name} ({c.role.toUpperCase()})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                Assigned Head Coach Supervisor
              </label>
              <select
                value={assignedHeadCoach}
                onChange={(e) => setAssignedHeadCoach(e.target.value)}
                className="w-full bg-black border border-amber-900 text-white px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">-- Unassigned --</option>
                {availableHeadCoaches.map((hc) => (
                  <option key={hc.id} value={hc.name}>{hc.name} (Head Coach)</option>
                ))}
              </select>
            </div>
          </div>

          {role !== 'coach' && role !== 'admin' && (
            <div className="space-y-3 p-3.5 bg-gray-900 border border-gray-800 rounded">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-pink-400 mb-1">
                  Subscription Tier Level (Admin Only) *
                </label>
                <select
                  value={subscriptionTier}
                  onChange={(e) => setSubscriptionTier(e.target.value as SubscriptionTier)}
                  className="w-full bg-black border border-pink-950 text-white px-3 py-2 text-xs font-bold uppercase outline-none"
                >
                  <option value="Normal User">Normal User (Free / Basic Membership)</option>
                  <option value="Premium User">Premium User (£49/mo - Coaching Tier)</option>
                  <option value="Premium Elite User">Premium Elite User (£89/mo - All Access Tier)</option>
                </select>
              </div>

              {/* Billing Statements Manager */}
              <BillingInvoicesEditor
                billingStatements={billingStatements}
                onAddInvoice={onAddInvoice}
                onRemoveInvoice={onRemoveInvoice}
                onUploadReceipt={onUploadReceipt}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Fitness Goals / Coaching Notes
            </label>
            <textarea
              rows={2}
              value={fitnessGoals}
              onChange={(e) => setFitnessGoals(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white p-3.5 text-xs outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#E52165] hover:bg-[#c41551] text-white text-xs font-black tracking-widest py-3 uppercase shadow-md shadow-pink-500/20 cursor-pointer"
          >
            {editingUser ? 'SAVE CHANGES' : isCoach ? 'SAVE CLIENT PROFILE' : 'CREATE USER ACCOUNT'}
          </button>
        </form>
      </div>
    </div>
  );
};
