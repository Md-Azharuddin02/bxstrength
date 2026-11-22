import { planToSafeHtml } from '../../utils/planHtml';
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronRight, Pencil } from 'lucide-react';
import { User, PaidPackageBooking, BookingDietPlan } from '../../types';
import { VelocityAPI } from '../../services/api';
import { 
  Utensils, Plus, Trash2, Calendar, UserCheck, Search, 
  ChevronDown, ChevronUp, Eye, X, Sparkles
} from 'lucide-react';
import { RichPlanEditor } from '../../components/ui/RichPlanEditor';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Select } from '../../components/ui/Select';

interface NutritionManagerProps {
  plans?: any[];
  clients?: User[];
  coaches?: User[];
  user?: User;
  onPlansUpdated?: () => void;
  onShowToast: (msg: string) => void;
}

export const NutritionManager: React.FC<NutritionManagerProps> = ({
  coaches = [],
  user,
  onShowToast
}) => {
  const currentUser = user || VelocityAPI.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isHeadCoachRole = currentUser?.role === 'headcoach' || (currentUser?.role === 'coach' && Boolean(currentUser.coachPosition?.toLowerCase().includes('head')));
  const isHeadCoachOrAdmin = isAdmin || isHeadCoachRole;

  const [bookings, setBookings] = useState<PaidPackageBooking[]>([]);
  const [dietPlans, setDietPlans] = useState<BookingDietPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [coachFilter, setCoachFilter] = useState<string>('all');
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<BookingDietPlan | null>(null);

  // Add Diet Plan Modal
  const [modalBooking, setModalBooking] = useState<PaidPackageBooking | null>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [planContent, setPlanContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // View Diet Plan Modal
  const [viewingPlan, setViewingPlan] = useState<BookingDietPlan | null>(null);

  // Delete Diet Plan State
  const [deletingPlan, setDeletingPlan] = useState<BookingDietPlan | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allBookings = await VelocityAPI.fetchPaidBookings();
      const allPlans = await VelocityAPI.fetchBookingDietPlans();
      setBookings(allBookings);
      setDietPlans(allPlans);

      // Expand all bookings by default
      const initialExpanded: Record<string, boolean> = {};
      allBookings.forEach(b => { initialExpanded[b.id] = true; });
      setExpandedBookings(initialExpanded);
    } catch (err: any) {
      console.error('Failed to load diet plans/bookings:', err);
      onShowToast('Failed to load diet plans data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter bookings assigned to this coach (or all for Head Coach / Admin)
  const assignedBookings = useMemo(() => {
    if (!currentUser) return [];

    let filtered = bookings.filter(b => {
      if (!isHeadCoachOrAdmin) {
        const matchesId = b.assignedCoachId && b.assignedCoachId === currentUser.id;
        const a = (b.assignedCoachName || '').trim().toLowerCase();
        const me = (currentUser.name || '').trim().toLowerCase();
        const matchesName = Boolean(a && me && a === me);
        // A booking that carries a coach id belongs to that coach only; names are a fallback
        return b.assignedCoachId ? Boolean(matchesId) : matchesName;
      }
      return true;
    });

    if (isHeadCoachOrAdmin && coachFilter !== 'all') {
      filtered = filtered.filter(b => {
        const cName = (b.assignedCoachName || '').toLowerCase();
        return cName.includes(coachFilter.toLowerCase());
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(b => 
        (b.clientName || '').toLowerCase().includes(term) ||
        (b.clientEmail || '').toLowerCase().includes(term) ||
        (b.packageName || '').toLowerCase().includes(term) ||
        (b.assignedCoachName || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [bookings, currentUser, isHeadCoachOrAdmin, coachFilter, searchTerm]);

  // Open modal for a specific booking
  // Opens the editor. New plans continue where the booking's latest plan ends (weekly: 7 days, monthly: 30).
  const handleOpenAddModal = (booking: PaidPackageBooking) => {
    const existing = dietPlans.filter(p => p.bookingId === booking.id);
    const lastEnd = existing.map(p => p.validTo).sort().pop();
    const start = lastEnd ? new Date(`${lastEnd}T00:00:00`) : new Date();
    if (lastEnd) start.setDate(start.getDate() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + (booking.packageType === 'monthly' ? 29 : 6));
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    setEditingPlan(null);
    setModalBooking(booking);
    setPlanTitle(`${booking.packageType === 'monthly' ? 'Month' : 'Week'} ${existing.length + 1} Diet & Nutrition Protocol - ${booking.clientName}`);
    setValidFrom(iso(start));
    setValidTo(iso(end));
    setPlanContent('');
  };

  const handleOpenEditModal = (booking: PaidPackageBooking, plan: BookingDietPlan) => {
    setEditingPlan(plan);
    setModalBooking(booking);
    setPlanTitle(plan.title);
    setValidFrom(plan.validFrom);
    setValidTo(plan.validTo);
    setPlanContent(planToSafeHtml(plan.content));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalBooking) return;

    if (!planTitle.trim()) {
      onShowToast('Please enter a diet plan title');
      return;
    }
    if (!validFrom || !validTo) {
      onShowToast('Please select valid from and valid to dates');
      return;
    }
    if (!planContent.trim() || planContent === '<p><br></p>') {
      onShowToast('Please add the diet plan details');
      return;
    }

    setIsSaving(true);
    try {
      const res = editingPlan
        ? await VelocityAPI.updateBookingDietPlan(editingPlan.id, { title: planTitle.trim(), validFrom, validTo, content: planContent })
        : await VelocityAPI.createBookingDietPlan({
        bookingId: modalBooking.id,
        clientEmail: modalBooking.clientEmail,
        clientName: modalBooking.clientName,
        coachId: modalBooking.assignedCoachId || currentUser?.id,
        coachName: modalBooking.assignedCoachName || currentUser?.name || 'Head Coach',
        title: planTitle.trim(),
        validFrom,
        validTo,
        content: planContent
        });

      if (res.success) {
        onShowToast(`Diet plan "${planTitle}" published successfully!`);
        setModalBooking(null);
        setEditingPlan(null);
        await loadData();
      } else {
        onShowToast(res.error || 'Failed to save diet plan');
      }
    } catch (err: any) {
      console.error('Save diet plan error:', err);
      onShowToast('Failed to save diet plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlanConfirm = async () => {
    if (!deletingPlan) return;
    try {
      const success = await VelocityAPI.deleteBookingDietPlan(deletingPlan.id);
      if (success) {
        onShowToast('Diet plan deleted successfully');
        setDeletingPlan(null);
        await loadData();
      } else {
        onShowToast('Failed to delete diet plan');
      }
    } catch (err: any) {
      console.error('Delete diet plan error:', err);
      onShowToast('Failed to delete diet plan');
    }
  };

  const toggleExpand = (bookingId: string) => {
    setExpandedBookings(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  const getPlanStatusBadge = (plan: BookingDietPlan) => {
    const today = new Date().toISOString().split('T')[0];
    if (plan.validFrom <= today && plan.validTo >= today) {
      return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">ACTIVE THIS WEEK</span>;
    } else if (plan.validFrom > today) {
      return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">UPCOMING</span>;
    } else {
      return <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">PAST PLAN</span>;
    }
  };

  const selectedBooking = assignedBookings.find(b => b.id === selectedId) || null;

  return (
    <div className="space-y-6">
      {!selectedBooking && (<>
      {/* Header */}
      <div className="bg-[#111111] border border-zinc-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-emerald-400" />
            DIET PLANS
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isHeadCoachOrAdmin 
              ? 'Manage and assign custom weekly nutrition protocols for all client bookings.' 
              : 'Create and assign customized weekly diet plans for your assigned client bookings.'}
          </p>
        </div>

        {/* Quick Search and Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search athlete, package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 w-48 sm:w-60"
            />
          </div>

          {isHeadCoachOrAdmin && (
            <Select
              value={coachFilter}
              onChange={(e) => setCoachFilter(e.target.value)}
              className="py-1.5 px-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="all">All Assigned Coaches</option>
              {coaches.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </Select>
          )}
        </div>
      </div>

      </>)}

      {/* Bookings & Plans List */}
      {isLoading ? (
        <div className="bg-[#111111] border border-zinc-800 p-12 text-center text-zinc-500 rounded-xl">
          Loading assigned bookings and diet plans...
        </div>
      ) : assignedBookings.length === 0 ? (
        <div className="bg-[#111111] border border-zinc-800 p-12 text-center rounded-xl space-y-3">
          <Utensils className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold uppercase text-white tracking-wider">NO ASSIGNED BOOKINGS FOUND</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {isHeadCoachOrAdmin 
              ? 'There are no active paid bookings available yet. Once a client books a package, it will appear here.'
              : 'You do not have any paid bookings assigned to you currently. Head Coach will assign bookings to your roster.'}
          </p>
        </div>
      ) : selectedBooking ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#CCFF00]" /> Back to bookings
          </button>
          {[selectedBooking!].map((booking) => {
            const bookingPlans = dietPlans.filter(p => p.bookingId === booking.id);
            const isExpanded = expandedBookings[booking.id] ?? true;

            return (
              <div 
                key={booking.id}
                className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden transition-all hover:border-zinc-700 shadow-md"
              >
                {/* Booking Header Card */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-950/70 border-b border-zinc-800/80">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Utensils className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                          {booking.clientName}
                        </h3>
                        <span className="text-[10px] font-bold bg-zinc-800 text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded uppercase">
                          {booking.packageName}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {booking.durationMinutes || 15} Min / Session
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span>{booking.clientEmail}</span>
                        {booking.clientPhone && <span>• {booking.clientPhone}</span>}
                        <span>• Sessions: <strong className="text-white">{booking.completedSessions || 0} / {booking.totalSessions || 0}</strong></span>
                        <span className="text-emerald-300 font-medium flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          Coach: {booking.assignedCoachName || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <button
                      onClick={() => handleOpenAddModal(booking)}
                      className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Add Diet Plan</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(booking.id)}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
                      title={isExpanded ? 'Collapse Diet Plans' : 'Expand Diet Plans'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Booking Plans Timeline / History */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-[#0e0e0e] space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800/80 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        Diet Plans History ({bookingPlans.length})
                      </span>
                    </div>

                    {bookingPlans.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-500">
                        No diet plans created for this booking yet. Click <span className="text-emerald-400 font-semibold cursor-pointer" onClick={() => handleOpenAddModal(booking)}>+ Add Diet Plan</span> to publish nutrition protocol for this client.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {bookingPlans.map((plan) => (
                          <div
                            key={plan.id}
                            className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3.5 space-y-2.5 flex flex-col justify-between hover:border-zinc-700 transition"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                                  {plan.title}
                                </h4>
                                {getPlanStatusBadge(plan)}
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                                <Calendar className="w-3 h-3 text-emerald-400" />
                                <span>Valid: <strong className="text-zinc-200">{plan.validFrom}</strong> to <strong className="text-zinc-200">{plan.validTo}</strong></span>
                              </div>

                              {/* Formatted snippet */}
                              <div 
                                className="text-xs text-zinc-400 line-clamp-2 max-h-12 overflow-hidden prose prose-invert prose-xs"
                                dangerouslySetInnerHTML={{ __html: planToSafeHtml(plan.content) }}
                              />
                            </div>

                            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                              <span className="text-[10px] text-zinc-500">
                                By {plan.coachName || 'Coach'}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingPlan(plan)}
                                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold uppercase rounded flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3 text-emerald-400" />
                                  View Plan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(booking, plan)}
                                  className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded transition cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingPlan(plan)}
                                  className="p-1 hover:bg-red-950/40 text-zinc-500 hover:text-red-400 rounded transition cursor-pointer"
                                  title="Delete Diet Plan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#121214] border border-zinc-800 rounded-2xl divide-y divide-zinc-800 overflow-hidden">
          {assignedBookings.map((b) => {
            const count = dietPlans.filter(p => p.bookingId === b.id).length;
            return (
              <div key={b.id} className="flex items-center hover:bg-zinc-900/70 transition-colors">
              <button
                onClick={() => setSelectedId(b.id)}
                className="flex-1 min-w-0 text-left pl-4 sm:pl-5 py-3.5 flex items-center gap-4 cursor-pointer"
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-zinc-800 border border-zinc-700 text-[#CCFF00] font-black flex items-center justify-center">
                  {(b.clientName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{b.clientName}</div>
                  <div className="text-xs text-zinc-400 truncate">{b.packageName} · {b.assignedCoachName ? `Coach: ${b.assignedCoachName}` : 'Unassigned'}</div>
                </div>
                <span className="hidden sm:inline text-[11px] text-zinc-300 shrink-0">{count} {count === 1 ? 'plan' : 'plans'}</span>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>
              <button
                onClick={() => handleOpenAddModal(b)}
                className="mx-4 sm:mx-5 shrink-0 px-3 py-1.5 bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black uppercase rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Plan</span>
              </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD DIET PLAN MODAL */}
      {modalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141416] border border-zinc-700 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-400" />
                  {editingPlan ? 'Edit Diet & Nutrition Plan' : 'Add Diet & Nutrition Plan'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Client: <strong className="text-white">{modalBooking.clientName}</strong> ({modalBooking.packageName})
                </p>
              </div>
              <button
                onClick={() => setModalBooking(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePlan} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                  Plan Title *
                </label>
                <input
                  type="text"
                  required
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g. Week 1: Calorie Deficit & High Protein Protocol"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Valid From Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Valid To Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Rich Plan HTML Editor */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                  Diet & Nutrition Protocol (Rich Editor) *
                </label>
                <RichPlanEditor
                  value={planContent}
                  onChange={setPlanContent}
                  type="diet"
                  placeholder="Write meal plan, calorie intake, macro breakdown, and hydration schedule..."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalBooking(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold uppercase rounded-lg transition disabled:opacity-50 cursor-pointer shadow"
                >
                  {isSaving ? 'Publishing...' : editingPlan ? 'Save Changes' : 'Save & Publish Diet Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DIET PLAN MODAL */}
      {viewingPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141416] border border-zinc-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-400" />
                  {viewingPlan.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Client: <strong className="text-zinc-200">{viewingPlan.clientName}</strong> • Coach: {viewingPlan.coachName}
                </p>
              </div>
              <button
                onClick={() => setViewingPlan(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-3 text-xs text-zinc-400 pb-2 border-b border-zinc-800">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Validity Period: <strong className="text-white">{viewingPlan.validFrom}</strong> to <strong className="text-white">{viewingPlan.validTo}</strong></span>
                {getPlanStatusBadge(viewingPlan)}
              </div>

              <div 
                className="prose prose-invert prose-sm max-w-none [&_h3]:text-emerald-400 [&_h3]:font-black [&_h3]:text-base [&_h3]:mb-2 [&_h4]:text-white [&_h4]:font-bold [&_h4]:text-sm [&_h4]:mt-4 [&_h4]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_li]:text-zinc-300"
                dangerouslySetInnerHTML={{ __html: planToSafeHtml(viewingPlan.content) }}
              />
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setViewingPlan(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingPlan && (
        <ConfirmModal
          isOpen={Boolean(deletingPlan)}
          title="Delete Diet Plan"
          message={`Are you sure you want to delete "${deletingPlan.title}"? This action cannot be undone.`}
          type="danger"
          requireTextConfirm={false}
          confirmText="DELETE DIET PLAN"
          onConfirm={handleDeletePlanConfirm}
          onCancel={() => setDeletingPlan(null)}
        />
      )}
    </div>
  );
};
