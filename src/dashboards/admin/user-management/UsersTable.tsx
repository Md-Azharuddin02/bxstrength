import React from 'react';
import { User, UserRole } from '../../../types';
import { VelocityAPI } from '../../../services/api';
import { CheckCircle2, Edit2, Eye, Key, Power, Trash2 } from 'lucide-react';
import { Select } from '../../../components/ui/Select';

interface UsersTableProps {
  users: User[];
  canManageCoaches: boolean;
  isHeadCoach: boolean;
  onShowToast: (msg: string) => void;
  onUsersUpdated: () => void;
  onInspect: (user: User) => void;
  onResetPassword: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string, name: string, email?: string) => void;
  onToggleAccountStatus: (user: User) => void;
  onToggleVerify: (id: string, name: string, currentStatus?: boolean) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  canManageCoaches,
  isHeadCoach,
  onShowToast,
  onUsersUpdated,
  onInspect,
  onResetPassword,
  onEdit,
  onDelete,
  onToggleAccountStatus,
  onToggleVerify
}) => {
  return (
    <div className="bg-[#111111] border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-800 text-gray-400 uppercase font-bold tracking-wider">
              <th className="py-3.5 px-4">Account Details</th>
              <th className="py-3.5 px-4">Role & Status</th>
              <th className="py-3.5 px-4">Assigned Coach / Head Coach</th>
              <th className="py-3.5 px-4">Verification</th>
              <th className="py-3.5 px-4">Tier / Subscription</th>
              <th className="py-3.5 px-4">Joined Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-gray-200">
            {users.map((u) => {
              const userStatus = u.status || 'active';
              const isActive = userStatus === 'active';

              return (
                <tr key={u.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <img
                      src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
                      alt={u.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-[#E52165]"
                    />
                    <div>
                      <span className="font-bold text-white block text-sm flex items-center gap-1.5">
                        {u.name}
                        {!isActive && (
                          <span className="bg-red-950 text-red-400 border border-red-800 text-[9px] font-mono px-1 py-0.2 rounded uppercase">
                            INACTIVE
                          </span>
                        )}
                      </span>
                      <span className="text-gray-400 text-xs">{u.email}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {u.phone && <span className="text-[10px] text-gray-500 font-mono">{u.phone}</span>}
                        <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                          {u.heightCm || 175} cm
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col items-start gap-1">
                      {canManageCoaches ? (
                        <Select
                          value={u.role}
                          onChange={async (e) => {
                            const newRole = e.target.value as UserRole;
                            try {
                              await VelocityAPI.updateUser(u.id, { role: newRole });
                              onShowToast(`Updated role for "${u.name}" to ${newRole.toUpperCase()} in real-time!`);
                              onUsersUpdated();
                            } catch (err: any) {
                              onShowToast(err.message || 'Failed to update user role');
                            }
                          }}
                          className={`px-2 py-1 font-black uppercase text-[10px] border rounded outline-none cursor-pointer transition-colors ${
                            u.role === 'admin'
                              ? 'bg-purple-950/90 text-purple-300 border-purple-800 hover:bg-purple-900'
                              : u.role === 'headcoach'
                              ? 'bg-amber-950/90 text-amber-300 border-amber-800 hover:bg-amber-900 font-bold'
                              : u.role === 'coach'
                              ? 'bg-pink-950/90 text-pink-300 border-pink-800 hover:bg-pink-900'
                              : u.role === 'customer_support'
                              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                              : 'bg-blue-950/90 text-blue-300 border-blue-800 hover:bg-blue-900'
                          }`}
                          title="Role Switcher: Change account role in real-time"
                        >
                          <option value="client" className="bg-gray-900 text-white font-bold">CLIENT</option>
                          <option value="headcoach" className="bg-gray-900 text-amber-400 font-bold">HEAD COACH</option>
                          <option value="coach" className="bg-gray-900 text-white font-bold">COACH</option>
                          {!isHeadCoach && <option value="customer_support" className="bg-gray-900 text-white font-bold">CUSTOMER SUPPORT</option>}
                          {!isHeadCoach && <option value="admin" className="bg-gray-900 text-white font-bold">SYSTEM ADMIN</option>}
                        </Select>
                      ) : (
                        <span className="px-2.5 py-1 font-black uppercase text-[10px] border bg-gray-800 text-gray-300 border-gray-700">
                          {u.role}
                        </span>
                      )}

                      <button
                        onClick={() => onToggleAccountStatus(u)}
                        className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 cursor-pointer transition-all ${
                          isActive
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                            : 'bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900'
                        }`}
                        title="Click to toggle account access status"
                      >
                        <Power className="w-3 h-3" />
                        <span>{isActive ? 'STATUS: ACTIVE' : 'STATUS: INACTIVE'}</span>
                      </button>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-gray-300 text-xs space-y-1">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Assigned Coach:</span>
                      <span className="font-bold text-white">{u.assignedCoach || 'Unassigned'}</span>
                    </div>
                    {u.assignedHeadCoach && (
                      <div>
                        <span className="text-[10px] text-amber-500/80 uppercase font-bold block">Head Coach:</span>
                        <span className="font-bold text-amber-400">{u.assignedHeadCoach}</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => onToggleVerify(u.id, u.name, u.isVerified)}
                      className={`text-[10px] font-black px-2.5 py-1 border uppercase flex items-center gap-1.5 cursor-pointer rounded transition-all ${
                        u.isVerified
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800 hover:bg-emerald-900'
                          : 'bg-amber-950/90 text-amber-400 border-amber-800 hover:bg-amber-900 animate-pulse'
                      }`}
                      title={u.isVerified ? "Account verified. Click to revoke verification." : "Pending verification. Click to verify account."}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {u.isVerified ? 'VERIFIED' : 'VERIFY NOW'}
                    </button>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-gray-900 border border-gray-800 font-mono text-[10px] text-pink-400 font-bold uppercase rounded block">
                      {u.subscriptionTier || 'Normal User'}
                    </span>
                    {u.billingStatements && u.billingStatements.length > 0 && (
                      <span className="text-[9px] text-gray-400 block mt-1">
                        {u.billingStatements.length} Invoice(s) Issued
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onInspect(u)}
                        className="p-1.5 bg-gray-900 hover:bg-gray-800 text-blue-400 rounded transition-colors"
                        title="View Complete 360 Client Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onResetPassword(u)}
                        className="p-1.5 bg-gray-900 hover:bg-gray-800 text-amber-400 rounded transition-colors"
                        title="Reset User Password (Admin)"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(u)}
                        className="p-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded transition-colors"
                        title="Edit Details & Role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(u.id, u.name, u.email)}
                        className="p-1.5 bg-gray-900 hover:bg-gray-800 text-red-400 hover:text-red-300 rounded transition-colors"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500 font-bold uppercase tracking-wider">
                  No user accounts found matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
