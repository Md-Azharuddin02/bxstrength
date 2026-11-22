import React, { useState } from 'react';
import { Subscription, User } from '../../types';
import { VelocityAPI } from '../../services/api';
import { CreditCard, Trash2, Plus, X } from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Select } from '../../components/ui/Select';

interface FinancialSubscriptionsProps {
  subscriptions: Subscription[];
  clients?: User[];
  onSubscriptionsUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const FinancialSubscriptions: React.FC<FinancialSubscriptionsProps> = ({
  subscriptions,
  clients = [],
  onSubscriptionsUpdated,
  onShowToast
}) => {
  const [deletingSub, setDeletingSub] = useState<{ id: string; name: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [planName, setPlanName] = useState('Pro Performance');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [price, setPrice] = useState(89);
  const [nextBillingDate, setNextBillingDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [status, setStatus] = useState<'active' | 'past_due' | 'cancelled'>('active');

  const handleUpdateStatus = (id: string, newStatus: 'active' | 'past_due' | 'cancelled', userName: string) => {
    VelocityAPI.updateSubscriptionStatus(id, newStatus);
    onShowToast(`Updated subscription for ${userName} to ${newStatus.toUpperCase()}`);
    onSubscriptionsUpdated();
  };

  const handleDeleteTrigger = (id: string, userName: string) => {
    setDeletingSub({ id, name: userName });
  };

  const confirmDelete = () => {
    if (deletingSub) {
      VelocityAPI.deleteSubscription(deletingSub.id);
      onShowToast(`Deleted subscription for "${deletingSub.name}"`);
      setDeletingSub(null);
      onSubscriptionsUpdated();
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      onShowToast('Please select a client profile');
      return;
    }

    try {
      const sub = VelocityAPI.createSubscription({
        userId: selectedUserId,
        planName,
        billingCycle,
        price: Number(price),
        nextBillingDate,
        status
      });

      onShowToast(`Assigned ${sub.planName} billing (£${sub.price}/${sub.billingCycle}) for ${sub.userName}!`);
      setShowCreateModal(false);
      setSelectedUserId('');
      onSubscriptionsUpdated();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create subscription');
    }
  };

  const totalMRR = subscriptions.reduce((sum, s) => (s.status === 'active' ? sum + s.price : sum), 0);

  return (
    <div className="space-y-6">
      <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            FINANCIAL SUBSCRIPTIONS & BILLING CRM
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Manage active memberships, create custom billing tiers for clients, and set renewal schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black tracking-widest px-4 py-2.5 uppercase shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ADD CLIENT BILLING</span>
          </button>

          <div className="bg-gray-900 border border-gray-800 px-4 py-2 text-right">
            <span className="block text-[9px] uppercase font-bold text-gray-400">TOTAL MONTHLY MRR</span>
            <span className="text-xl font-black text-emerald-400 font-mono">£{totalMRR}.00</span>
          </div>
        </div>
      </div>

      <div className="bg-[#111111] border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800 text-gray-400 uppercase font-bold">
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">Plan Tier</th>
                <th className="py-3.5 px-4">Billing Cycle</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Next Billing Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-200">
              {subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-900/50">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white block">{s.userName}</span>
                    <span className="text-[10px] text-gray-400">{s.userEmail}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-gray-800 text-pink-400 font-bold uppercase text-[10px] border border-gray-700">
                      {s.planName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 uppercase text-gray-400">{s.billingCycle}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">£{s.price}.00</td>
                  <td className="py-3.5 px-4 font-mono text-gray-400">{s.nextBillingDate}</td>
                  <td className="py-3.5 px-4">
                    <Select
                      value={s.status}
                      onChange={(e) => handleUpdateStatus(s.id, e.target.value as any, s.userName)}
                      className={`px-2 py-1 font-bold uppercase text-[10px] bg-black border outline-none cursor-pointer ${
                        s.status === 'active'
                          ? 'text-emerald-400 border-emerald-800'
                          : s.status === 'past_due'
                          ? 'text-amber-400 border-amber-800'
                          : 'text-red-400 border-red-800'
                      }`}
                    >
                      <option value="active" className="bg-black text-emerald-400">ACTIVE</option>
                      <option value="past_due" className="bg-black text-amber-400">PAST DUE</option>
                      <option value="cancelled" className="bg-black text-red-400">CANCELLED</option>
                    </Select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteTrigger(s.id, s.userName)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded transition-colors"
                      title="Delete Subscription Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Client Billing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#111111] text-white border-0 sm:border border-emerald-500/60 p-4 sm:p-6 shadow-2xl space-y-4 overflow-y-auto flex flex-col rounded-none sm:rounded-xl">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                CLIENT BILLING ASSIGNMENT
              </span>
              <h3 className="text-lg font-black uppercase text-white">ADD MEMBERSHIP BILLING</h3>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Select Client (Name / Email) *</label>
                <Select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white p-2.5 text-xs outline-none"
                  required
                >
                  <option value="">-- Select Target Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Plan Tier Title *</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. VIP Elite All-Access"
                  className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-xs outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Billing Cycle</label>
                  <Select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Price (£ GBP)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-xs outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Next Billing Date</label>
                  <input
                    type="date"
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-1.5 text-xs outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Initial Status</label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black tracking-widest py-3 uppercase shadow-md transition-all mt-2"
              >
                SAVE & ASSIGN BILLING RECORD
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingSub}
        title="DELETE SUBSCRIPTION RECORD"
        message={`Are you sure you want to delete the subscription record for "${deletingSub?.name}"?`}
        type="danger"
        confirmText="DELETE RECORD"
        cancelText="KEEP RECORD"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingSub(null)}
      />
    </div>
  );
};
