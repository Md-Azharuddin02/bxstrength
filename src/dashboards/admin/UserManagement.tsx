import React, { useState } from 'react';
import { User, UserRole, SubscriptionTier, BillingStatement } from '../../types';
import { VelocityAPI } from '../../services/api';
import { isValidUkMobile, UK_PHONE_ERROR_MSG } from '../../utils/phoneValidation';
import { Users, Search, Plus, Filter, Shield } from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { UsersTable } from './user-management/UsersTable';
import { UserFormModal } from './user-management/UserFormModal';
import { ResetPasswordModal } from './user-management/ResetPasswordModal';
import { UserInspectDrawer } from './user-management/UserInspectDrawer';
import { Select } from '../../components/ui/Select';

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
            <Select
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
            </Select>
          </div>
        )}
      </div>

      {/* CRM Users Table */}
      <UsersTable
        users={filteredUsers}
        canManageCoaches={canManageCoaches}
        isHeadCoach={isHeadCoach}
        onShowToast={onShowToast}
        onUsersUpdated={onUsersUpdated}
        onInspect={setInspectUser}
        onResetPassword={(u) => {
          setResetPasswordUser(u);
          setNewPasswordInput('');
        }}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteTrigger}
        onToggleAccountStatus={handleToggleAccountStatus}
        onToggleVerify={handleToggleVerify}
      />

      {/* Modal for Create/Edit User */}
      {showModal && (
        <UserFormModal
          editingUser={editingUser}
          isCoach={isCoach}
          isHeadCoach={isHeadCoach}
          canManageCoaches={canManageCoaches}
          availableCoaches={availableCoaches}
          availableHeadCoaches={availableHeadCoaches}
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          password={password}
          setPassword={setPassword}
          heightCm={heightCm}
          setHeightCm={setHeightCm}
          role={role}
          setRole={setRole}
          isVerified={isVerified}
          setIsVerified={setIsVerified}
          subscriptionTier={subscriptionTier}
          setSubscriptionTier={setSubscriptionTier}
          billingStatements={billingStatements}
          fitnessGoals={fitnessGoals}
          setFitnessGoals={setFitnessGoals}
          assignedCoach={assignedCoach}
          setAssignedCoach={setAssignedCoach}
          assignedHeadCoach={assignedHeadCoach}
          setAssignedHeadCoach={setAssignedHeadCoach}
          onAddInvoice={handleAddInvoice}
          onRemoveInvoice={handleRemoveInvoice}
          onUploadReceipt={handleReceiptFileUpload}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Admin Reset Password Modal */}
      {resetPasswordUser && (
        <ResetPasswordModal
          user={resetPasswordUser}
          newPassword={newPasswordInput}
          onPasswordChange={setNewPasswordInput}
          onSubmit={handleAdminResetPasswordSubmit}
          onClose={() => setResetPasswordUser(null)}
        />
      )}

      {/* 360 Client Profile Inspection Drawer / Modal */}
      {inspectUser && (
        <UserInspectDrawer user={inspectUser} onClose={() => setInspectUser(null)} />
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
