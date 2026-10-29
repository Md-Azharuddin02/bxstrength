import React, { useState } from 'react';
import { User, UserRole, SubscriptionTier, BillingStatement } from '../../types';
import { VelocityAPI, getApiUrl } from '../../services/api';
import { isValidUkMobile, UK_PHONE_ERROR_MSG } from '../../utils/phoneValidation';
import { PhoneInput } from '../../components/PhoneInput';
import { 
  Users, Search, Plus, Edit2, Trash2, CheckCircle2, Filter, X, 
  ShieldCheck, UserCheck, Key, Eye, Power, Lock, Shield, Award, Calendar, DollarSign
} from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { validatePassword } from '../../utils/passwordValidation';

interface UserManagementProps {
  users: User[];
  isCoach?: boolean;
  isHeadCoach?: boolean;
  onUsersUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  isCoach = false,
  isHeadCoach = false,
  onUsersUpdated,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('BxStrength2026!');
  const [heightCm, setHeightCm] = useState<number | ''>(175);
  const [role, setRole] = useState<UserRole>('client');
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [coachPosition, setCoachPosition] = useState<string>('Coach');
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('Normal User');
  const [billingStatements, setBillingStatements] = useState<BillingStatement[]>([]);
  const [fitnessGoals, setFitnessGoals] = useState('');
  const [assignedCoach, setAssignedCoach] = useState<string>('');
  const [assignedHeadCoach, setAssignedHeadCoach] = useState<string>('');

  // Password Reset Modal State
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // 360 Client Profile Drawer State
  const [inspectUser, setInspectUser] = useState<User | null>(null);

  const canManageCoaches = !isCoach || isHeadCoach;
  const targetUsers = isHeadCoach
    ? users.filter((u) => u.role === 'client' || u.role === 'coach' || u.role === 'headcoach')
    : (isCoach ? users.filter((u) => u.role === 'client') : users);

  const availableCoaches = users.filter((u) => u.role === 'coach' || u.role === 'headcoach' || u.role === 'admin');
  const availableHeadCoaches = users.filter((u) => u.role === 'headcoach' || u.role === 'admin');

  const filteredUsers = targetUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesRole = roleFilter === 'all';
    if (!matchesRole) {
      if (roleFilter === 'customer_support') {
        matchesRole = u.role === 'customer_support';
      } else {
        matchesRole = u.role === roleFilter;
      }
    }
    return matchesSearch && matchesRole;
  });

  const handleOpenCreateClient = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('BxStrength2026!');
    setHeightCm(175);
    setRole('client');
    setIsVerified(true);
    setCoachPosition('Coach');
    setSubscriptionTier('Normal User');
    setBillingStatements([]);
    setFitnessGoals('');
    setAssignedCoach('');
    setAssignedHeadCoach('');
    setShowModal(true);
  };

  const handleOpenCreateCoach = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('BxStrength2026!');
    setHeightCm(175);
    setRole('coach');
    setIsVerified(true);
    setCoachPosition('Coach');
    setSubscriptionTier('Premium Elite User');
    setBillingStatements([]);
    setFitnessGoals('UK Certified Fitness & Strength Master Coach');
    setAssignedCoach('');
    setAssignedHeadCoach('');
    setShowModal(true);
  };

  const handleOpenCreateSupport = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('BxStrength2026!');
    setHeightCm(175);
    setRole('customer_support');
    setIsVerified(true);
    setCoachPosition('Customer Support');
    setSubscriptionTier('Normal User');
    setBillingStatements([]);
    setFitnessGoals('Customer Service & Operations Agent');
    setAssignedCoach('');
    setAssignedHeadCoach('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setPassword('');
    setHeightCm(user.heightCm || 175);
    setRole(user.role);
    setIsVerified(user.isVerified !== undefined ? Boolean(user.isVerified) : true);
    setCoachPosition(user.coachPosition || (user.role === 'headcoach' ? 'Head Coach' : (user.role === 'customer_support' ? 'Customer Support' : 'Coach')));
    setSubscriptionTier(user.subscriptionTier || 'Normal User');
    setBillingStatements(user.billingStatements || []);
    setFitnessGoals(user.fitnessGoals || '');
    setAssignedCoach(user.assignedCoach || '');
    setAssignedHeadCoach(user.assignedHeadCoach || '');
    setShowModal(true);
  };

  const handleAddInvoice = () => {
    const invNum = `INV-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`;
    const amount = subscriptionTier === 'Premium Elite User' ? 89 : (subscriptionTier === 'Premium User' ? 49 : 0);
    const newInv: BillingStatement = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNum,
      amount: amount,
      currency: 'GBP (£)',
      date: new Date().toISOString().split('T')[0],
      status: 'Paid',
      description: `${subscriptionTier} Monthly Billing`
    };
    setBillingStatements(prev => [newInv, ...prev]);
  };

  const handleReceiptFileUpload = (invId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      onShowToast('Receipt document size should be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setBillingStatements(prev => prev.map(inv => inv.id === invId ? {
        ...inv,
        receiptFileUrl: base64,
        fileName: file.name
      } : inv));
      onShowToast(`Attached payment slip / receipt "${file.name}"!`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveInvoice = (invId: string) => {
    setBillingStatements(prev => prev.filter(i => i.id !== invId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      onShowToast('Name and email are required');
      return;
    }

    if (phone && !isValidUkMobile(phone)) {
      onShowToast(UK_PHONE_ERROR_MSG);
      return;
    }

    // NEW: validate password only when creating a user
    if (!editingUser) {
      const pwError = validatePassword(password);
      if (pwError) {
        onShowToast(pwError);
        return;
      }
    }

    const targetRole = isCoach ? 'client' : (role === 'customer_support' ? 'customer_support' : role);
    const finalCoachPos = targetRole === 'headcoach' ? 'Head Coach' : (targetRole === 'coach' ? 'Coach' : (targetRole === 'customer_support' ? 'Customer Support' : undefined));
    const numHeight = Number(heightCm) || 175;

    try {
      if (editingUser) {
        await VelocityAPI.updateUser(editingUser.id, {
          name,
          email,
          phone,
          heightCm: numHeight,
          role: targetRole,
          coachPosition: finalCoachPos,
          subscriptionTier,
          billingStatements,
          fitnessGoals,
          isVerified,
          assignedCoach,
          assignedHeadCoach
        });

        onShowToast(`Updated ${targetRole.toUpperCase()} profile for ${name}`);
      } else {
        await VelocityAPI.createUser({
          name,
          email,
          phone,
          password: password || 'BxStrength2026!',
          heightCm: numHeight,
          role: targetRole,
          coachPosition: finalCoachPos,
          fitnessGoals,
          isVerified,
          assignedCoach,
          assignedHeadCoach
        });

        onShowToast(`Created new ${targetRole.toUpperCase()} account for ${name}`);
      }

      setShowModal(false);
      onUsersUpdated();
    } catch (err: any) {
      onShowToast(err.message || 'Operation failed');
    }
  };

  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string; email?: string } | null>(null);

  const handleDeleteTrigger = (id: string, userName: string, userEmail?: string) => {
    setDeletingUser({ id, name: userName, email: userEmail });
  };

  const confirmDelete = async () => {
    if (deletingUser) {
      await VelocityAPI.deleteUser(deletingUser.id);
      onShowToast(`Deleted account "${deletingUser.name}" permanently from database`);
      setDeletingUser(null);
      onUsersUpdated();
    }
  };

  const handleToggleVerify = async (id: string, userName: string, currentStatus?: boolean) => {
    const nextStatus = currentStatus !== undefined ? !currentStatus : true;
    try {
      await VelocityAPI.updateUser(id, { isVerified: nextStatus });
      onShowToast(`${nextStatus ? 'Verified' : 'Unverified'} account for ${userName}`);
      onUsersUpdated();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update verification status');
    }
  };

  const handleToggleAccountStatus = async (user: User) => {
    const current = user.status || 'active';
    const nextStatus = (current === 'active' || current === 'pending_verification') ? 'inactive' : 'active';
    try {
      await VelocityAPI.setUserStatus(user.id, nextStatus);
      onShowToast(`Account status for ${user.name} set to ${nextStatus.toUpperCase()}`);
      onUsersUpdated();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update status');
    }
  };

  const handleAdminResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPasswordInput) return;

    // NEW: block weak passwords
    const pwError = validatePassword(newPasswordInput);
    if (pwError) {
      onShowToast(pwError);
      return;
    }

    try {
      await VelocityAPI.adminResetUserPassword(resetPasswordUser.id, newPasswordInput);
      onShowToast(`✓ Password successfully reset for "${resetPasswordUser.name}"`);
      setResetPasswordUser(null);
      setNewPasswordInput('');
      onUsersUpdated();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8C532B]" />
            {isHeadCoach
              ? 'HEAD COACH CONTROL: COACH & ATHLETE DIRECTORY'
              : isCoach
              ? 'MY CLIENT & ATHLETE ROSTER'
              : 'ALL ACCOUNTS & USER MANAGEMENT (CRM)'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isHeadCoach
              ? 'Head Coach Master Authority: Onboard new coaches, update, edit, delete, and control coach profiles, assign client packages, and verify coach accounts to approve active dashboard access.'
              : isCoach
              ? 'View client profiles, add new clients, update fitness goals, and manage your athlete roster.'
              : 'Admin Master Control: View, create, update, activate/deactivate, reset passwords, and manage Head Coach, Coach, Client, and Customer Support accounts end-to-end.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isCoach && (
            <button
              onClick={handleOpenCreateSupport}
              className="bg-purple-700 hover:bg-purple-600 text-white text-xs font-black tracking-widest px-3.5 py-3 uppercase transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>ADD SUPPORT AGENT</span>
            </button>
          )}

          {canManageCoaches && (
            <button
              onClick={handleOpenCreateCoach}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black tracking-widest px-3.5 py-3 uppercase transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ADD COACH</span>
            </button>
          )}

          {(!isCoach || isHeadCoach) && (
            <button
              onClick={handleOpenCreateClient}
              className="bg-[#8C532B] hover:bg-[#70401E] text-white text-xs font-black tracking-widest px-4 py-3 uppercase transition-all shadow-md shadow-amber-950/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ADD CLIENT / USER</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#111111] border border-gray-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search accounts by name or email..."
            className="w-full bg-gray-900 border border-gray-800 focus:border-[#E52165] text-white pl-9 pr-4 py-2 text-xs rounded-none outline-none"
          />
        </div>

        {canManageCoaches && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-400 uppercase">Role Filter:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-white text-xs px-3 py-2 rounded-none outline-none cursor-pointer font-bold"
            >
              <option value="all">All Roles ({targetUsers.length})</option>
              <option value="client">Client</option>
              <option value="headcoach">Head Coach</option>
              <option value="coach">Coach</option>
              {!isHeadCoach && <option value="customer_support">Customer Support</option>}
              {!isHeadCoach && <option value="admin">System Admin</option>}
            </select>
          </div>
        )}
      </div>

      {/* CRM Users Table */}
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
              {filteredUsers.map((u) => {
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
                          <select
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
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 font-black uppercase text-[10px] border bg-gray-800 text-gray-300 border-gray-700">
                            {u.role}
                          </span>
                        )}

                        <button
                          onClick={() => handleToggleAccountStatus(u)}
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
                        onClick={() => handleToggleVerify(u.id, u.name, u.isVerified)}
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
                          onClick={() => setInspectUser(u)}
                          className="p-1.5 bg-gray-900 hover:bg-gray-800 text-blue-400 rounded transition-colors"
                          title="View Complete 360 Client Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setResetPasswordUser(u);
                            setNewPasswordInput('');
                          }}
                          className="p-1.5 bg-gray-900 hover:bg-gray-800 text-amber-400 rounded transition-colors"
                          title="Reset User Password (Admin)"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded transition-colors"
                          title="Edit Details & Role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(u.id, u.name, u.email)}
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
              {filteredUsers.length === 0 && (
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

      {/* Modal for Create/Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#111111] text-white border-0 sm:border border-gray-800 p-4 sm:p-6 shadow-2xl overflow-y-auto flex flex-col rounded-none sm:rounded-xl">
            <button
              onClick={() => setShowModal(false)}
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div className="pt-2 border-t border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                        Client Billing Invoices ({billingStatements.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddInvoice}
                        className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-1 uppercase rounded transition-colors"
                      >
                        + Issue Invoice
                      </button>
                    </div>

                    {billingStatements.length === 0 ? (
                      <p className="text-[10px] text-gray-500 italic">No billing statements issued yet for this user.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {billingStatements.map((inv) => (
                          <div key={inv.id} className="bg-black p-2.5 border border-gray-800 rounded space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-white block">{inv.invoiceNumber} • £{inv.amount}.00</span>
                                <span className="text-[9px] text-gray-400">{inv.date} • {inv.status}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveInvoice(inv.id)}
                                className="text-red-400 hover:text-red-300 text-[10px] font-bold px-1.5 py-0.5"
                              >
                                ✕ Remove
                              </button>
                            </div>

                            {/* Receipt File Upload Control */}
                            <div className="pt-1 border-t border-gray-900 flex items-center justify-between gap-2 text-[10px]">
                              {inv.fileName ? (
                                <span className="text-emerald-400 font-mono font-bold truncate max-w-[200px]" title={inv.fileName}>
                                  📄 Attached: {inv.fileName}
                                </span>
                              ) : (
                                <span className="text-gray-500 italic">No document attached</span>
                              )}

                              <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 text-[9px] font-bold px-2 py-1 rounded uppercase transition-colors shrink-0">
                                <span>{inv.fileName ? 'Change File' : '+ Attach Receipt File'}</span>
                                <input
                                  type="file"
                                  accept="image/*,.pdf,.doc,.docx"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleReceiptFileUpload(inv.id, file);
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
      )}

      {/* Admin Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full h-full sm:h-auto sm:max-w-sm bg-[#111111] text-white border-0 sm:border border-gray-800 p-4 sm:p-6 shadow-2xl rounded-none sm:rounded-xl flex flex-col justify-center">
            <button
              onClick={() => setResetPasswordUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black uppercase text-amber-400 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" /> RESET USER PASSWORD
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Enter a new password for <strong className="text-white">{resetPasswordUser.name}</strong> ({resetPasswordUser.email}).
            </p>

            <form onSubmit={handleAdminResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full bg-gray-900 border border-amber-800 text-white px-3.5 py-2.5 text-sm font-mono outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
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
      )}

      {/* 360 Client Profile Inspection Drawer / Modal */}
      {inspectUser && (
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
                onClick={() => setInspectUser(null)}
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
      )}

      {/* Dedicated Confirm Modal for Delete User */}
      <ConfirmModal
        isOpen={!!deletingUser}
        title="DELETE USER / CLIENT ACCOUNT"
        message={`Are you sure you want to permanently delete the account for "${deletingUser?.name}" (${deletingUser?.email})? This action cannot be undone.`}
        type="danger"
        confirmText="DELETE PERMANENTLY"
        cancelText="KEEP ACCOUNT"
        requireTextConfirm={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
};

