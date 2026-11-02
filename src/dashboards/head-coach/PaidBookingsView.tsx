import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PaidPackageBooking, User } from '../../types';
import { VelocityAPI } from '../../services/api';
import { normalizeRole } from '../../utils/auth';
import {
  Calendar, Clock, UserCheck, CheckCircle2, Phone, Mail, Award,
  Search, RefreshCw, X, ExternalLink, Video,
  Trash2, AlertCircle, Plus, Minus, Layers, DollarSign, RotateCcw,
  ChevronDown, ChevronUp, MessageCircle
} from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { PlanCustomizationBreakdown } from '../../components/bookings/PlanCustomizationBreakdown';

interface PaidBookingsViewProps {
  user: User;
  coaches: User[];
  onShowToast: (msg: string) => void;
}

export const PaidBookingsView: React.FC<PaidBookingsViewProps> = ({
  user,
  coaches,
  onShowToast
}) => {
  const normRole = normalizeRole(user.role);
  const isAdmin = normRole === 'admin';
  const isHeadCoach = normRole === 'headcoach' || (normRole === 'coach' && Boolean(
    user.coachPosition && (
      user.coachPosition.toLowerCase().includes('head') ||
      user.coachPosition.toLowerCase().includes('chief')
    )
  ));
  const isCoach = normRole === 'coach' && !isHeadCoach;

  const [bookings, setBookings] = useState<PaidPackageBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'scheduled' | 'completed' | 'custom'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Assign Modal
  const [assignTarget, setAssignTarget] = useState<PaidPackageBooking | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [selectedCoachName, setSelectedCoachName] = useState<string>('');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);

  // Session Progress Modal / Target
  const [sessionTarget, setSessionTarget] = useState<PaidPackageBooking | null>(null);
  const [sessionAction, setSessionAction] = useState<'increment' | 'decrement'>('increment');
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Delete Confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [dbCoaches, setDbCoaches] = useState<User[]>([]);

  useEffect(() => {
    VelocityAPI.fetchUsers().then(uList => {
      const staff = uList.filter(u => {
        const r = normalizeRole(u.role);
        return r === 'coach' || r === 'headcoach';
      });
      if (staff.length > 0) setDbCoaches(staff);
    }).catch(() => {});
  }, []);

  const availableCoaches = useMemo(() => {
    const combined = [...coaches, ...dbCoaches];
    const map = new Map<string, { id: string; name: string; position: string; email: string }>();
    combined.forEach(c => {
      const r = normalizeRole(c.role);
      if (r === 'coach' || r === 'headcoach') {
        map.set(c.id, {
          id: c.id,
          name: c.name,
          position: c.coachPosition || (r === 'headcoach' ? 'Head Coach' : 'Fitness Coach'),
          email: c.email
        });
      }
    });
    return Array.from(map.values());
  }, [coaches, dbCoaches]);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = isCoach ? { coachId: user.id } : undefined;
      const data = await VelocityAPI.fetchPaidBookings(params);
      setBookings(data);
    } catch (err: any) {
      console.warn('Failed to load paid bookings:', err?.message);
      onShowToast('Could not load paid bookings from server');
    } finally {
      setIsLoading(false);
    }
  }, [isCoach, user.id, onShowToast]);

  useEffect(() => {
    loadBookings();
    const handleUpdate = () => loadBookings();
    window.addEventListener('bxstrength_paid_bookings_updated', handleUpdate);
    return () => window.removeEventListener('bxstrength_paid_bookings_updated', handleUpdate);
  }, [loadBookings]);

  // Metrics
  const metrics = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter(b => b.status === 'Active' || b.status === 'Scheduled').length;
    const completed = bookings.filter(b => b.status === 'Completed').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
    const totalSessions = bookings.reduce((sum, b) => sum + (Number(b.totalSessions) || 1), 0);
    const completedSessions = bookings.reduce((sum, b) => sum + (Number(b.completedSessions) || 0), 0);
    return { total, active, completed, totalRevenue, totalSessions, completedSessions };
  }, [bookings]);

  // Filtering
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch =
        !searchTerm.trim() ||
        b.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.assignedCoachName?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (filterTab === 'active') return b.status === 'Active';
      if (filterTab === 'scheduled') return b.status === 'Scheduled';
      if (filterTab === 'completed') return b.status === 'Completed';
      if (filterTab === 'custom') return b.packageType === 'custom';

      return true;
    });
  }, [bookings, searchTerm, filterTab]);

  // Handle Take Myself (1-Click direct assignment to currently logged-in coach/head coach)
  const handleTakeMyself = async (b: PaidPackageBooking) => {
    try {
      const res = await VelocityAPI.assignPaidBooking(b.id, {
        assignedCoachId: user.id,
        assignedCoachName: user.name || 'Head Coach',
        assignedBy: user.name || 'Head Coach'
      });
      if (res.success) {
        onShowToast(`Assigned ${b.clientName}'s booking to yourself (${user.name})!`);
        loadBookings();
      } else {
        onShowToast(res.error || 'Failed to assign booking to yourself.');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Error assigning booking');
    }
  };

  // Open Assign Modal
  const openAssignModal = (b: PaidPackageBooking) => {
    setAssignTarget(b);
    setSelectedCoachId(b.assignedCoachId || '');
    setSelectedCoachName(b.assignedCoachName || '');
    setMeetingLink(b.meetingLink || '');
    setCoachNotes(b.coachNotes || '');
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;

    if (!selectedCoachName) {
      onShowToast('Please select a coach to assign.');
      return;
    }

    setIsSubmittingAssign(true);
    try {
      const res = await VelocityAPI.assignPaidBooking(assignTarget.id, {
        assignedCoachId: selectedCoachId || null,
        assignedCoachName: selectedCoachName,
        assignedBy: user.name || 'Head Coach',
        meetingLink: meetingLink.trim() || undefined,
        coachNotes: coachNotes.trim() || undefined
      });

      if (res.success) {
        onShowToast(`Assigned ${selectedCoachName} to ${assignTarget.clientName}'s booking!`);
        setAssignTarget(null);
        loadBookings();
      } else {
        onShowToast(res.error || 'Failed to assign coach');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error assigning coach');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Handle Quick Session Increment / Decrement
  const handleQuickSessionUpdate = async (b: PaidPackageBooking, action: 'increment' | 'decrement') => {
    try {
      const res = await VelocityAPI.updatePaidBookingSession(b.id, { action });
      if (res.success) {
        onShowToast(action === 'increment' ? `Logged completed session for ${b.clientName} (+1)` : `Reverted session for ${b.clientName} (-1)`);
        loadBookings();
      } else {
        onShowToast(res.error || 'Failed to update session progress');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error updating session');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await VelocityAPI.deletePaidBooking(id);
      if (success) {
        onShowToast('Paid booking deleted successfully.');
        setDeletingId(null);
        loadBookings();
      } else {
        onShowToast('Failed to delete booking.');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error deleting booking');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#CCFF00]" />
            PAID PACKAGES & 1-ON-1 SESSIONS DESK
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Manage purchases from Train Your Way, Personalised Support, and Commit & Save. Assign coaches, set video meeting links, and log completed sessions.
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white bg-black/50 border border-gray-800 px-3 py-2 rounded-lg cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#CCFF00]' : ''}`} />
          Refresh Bookings
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-gray-800 p-4 rounded-lg">
          <p className="text-[11px] font-mono text-gray-400 uppercase">Total Paid Bookings</p>
          <p className="text-2xl font-black text-white mt-1">{metrics.total}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{metrics.active} active / scheduled</p>
        </div>

        <div className="bg-[#111111] border border-gray-800 p-4 rounded-lg">
          <p className="text-[11px] font-mono text-gray-400 uppercase">Total Revenue</p>
          <p className="text-2xl font-black text-[#CCFF00] mt-1">£{metrics.totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Verified package payments</p>
        </div>

        <div className="bg-[#111111] border border-gray-800 p-4 rounded-lg">
          <p className="text-[11px] font-mono text-gray-400 uppercase">Session Delivery</p>
          <p className="text-2xl font-black text-white mt-1">{metrics.completedSessions} / {metrics.totalSessions}</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">
            {metrics.totalSessions > 0 ? Math.round((metrics.completedSessions / metrics.totalSessions) * 100) : 0}% completed
          </p>
        </div>

        <div className="bg-[#111111] border border-gray-800 p-4 rounded-lg">
          <p className="text-[11px] font-mono text-gray-400 uppercase">Completed Packages</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.completed}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">All sessions fulfilled</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#111111] border border-gray-800 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, email, package, booking ID or assigned coach..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/60 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#CCFF00]/60"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'ALL' },
            { id: 'active', label: 'ACTIVE' },
            { id: 'scheduled', label: 'SCHEDULED' },
            { id: 'completed', label: 'COMPLETED' },
            { id: 'custom', label: 'CUSTOM PLANS' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded transition-all cursor-pointer whitespace-nowrap ${
                filterTab === tab.id
                  ? 'bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="bg-[#111111] border border-gray-800 p-12 text-center text-xs text-gray-400">
          <Clock className="w-6 h-6 text-[#CCFF00] animate-spin mx-auto mb-2" />
          <p>Loading paid bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-[#111111] border border-dashed border-gray-800 p-12 text-center text-xs text-gray-400 space-y-2">
          <Award className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-sm font-bold text-white">No Paid Bookings Found</p>
          <p className="text-xs text-gray-500">
            {searchTerm ? 'No results matched your search query.' : 'No paid bookings recorded in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const totalSess = b.totalSessions || 1;
            const completedSess = b.completedSessions || 0;
            const remainingSess = Math.max(0, totalSess - completedSess);
            const progressPercent = Math.min(100, Math.round((completedSess / totalSess) * 100));
            const isExpanded = expandedId === b.id;

            return (
              <div
                key={b.id}
                className="bg-[#111111] border border-gray-800 hover:border-gray-700 transition-all rounded-xl p-5 space-y-4 relative overflow-hidden"
              >
                {/* Header bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30">
                        {b.packageType}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        REF: {b.id}
                      </span>
                      {b.orderId && (
                        <span className="text-[10px] font-mono text-zinc-500">
                          ORDER: {b.orderId}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500">
                        • {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-black uppercase text-white mt-1">
                      {b.packageName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#CCFF00] font-mono">
                      £{b.totalPrice}
                    </span>

                    <span
                      className={`text-xs font-black uppercase px-2.5 py-1 rounded-full border ${
                        b.status === 'Completed'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : b.status === 'Scheduled'
                          ? 'bg-sky-950 text-sky-400 border-sky-800'
                          : 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/40'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>

                {/* Client & Contact bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/40 border border-gray-800/80 p-3 rounded-lg text-xs">
                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Client</p>
                    <p className="text-white font-bold text-sm">{b.clientName}</p>
                    <p className="text-gray-400 text-[11px]">{b.clientEmail}</p>
                    {b.clientPhone && <p className="text-zinc-500 text-[11px]">{b.clientPhone}</p>}
                  </div>

                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Assigned Coach</p>
                    {b.assignedCoachName ? (
                      <div>
                        <p className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {b.assignedCoachName}
                        </p>
                        {b.assignedBy && <p className="text-gray-500 text-[10px]">Assigned by {b.assignedBy}</p>}
                      </div>
                    ) : (
                      <p className="text-amber-400 font-semibold text-xs flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Unassigned
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Live Meeting Link</p>
                    {b.meetingLink ? (
                      <a
                        href={b.meetingLink.startsWith('http') ? b.meetingLink : `https://${b.meetingLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#CCFF00] hover:underline font-bold text-xs flex items-center gap-1 mt-0.5"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join / Test Video Call
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-gray-500 text-xs mt-0.5">Not set yet</p>
                    )}
                  </div>
                </div>

                {/* Session Delivery & Attendance Tracking Desk */}
                <div className="bg-black/70 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Layers className="w-4 h-4 text-[#CCFF00]" />
                        <span className="text-xs font-black uppercase text-white tracking-wider">
                          Session Delivery & Attendance Tracking
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          completedSess >= totalSess
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                            : completedSess > 0
                            ? 'bg-sky-950/80 text-sky-400 border-sky-800'
                            : 'bg-amber-950/80 text-amber-400 border-amber-800'
                        }`}>
                          {completedSess >= totalSess
                            ? '✓ All Sessions Delivered (Package Completed)'
                            : completedSess > 0
                            ? `In Progress (${remainingSess} remaining)`
                            : `Pending First Session (${totalSess} to conduct)`}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Track live 1-on-1 coaching sessions completed with the client. When a session is held, record it below to update the client's balance.
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {completedSess < totalSess ? (
                        <button
                          type="button"
                          onClick={() => handleQuickSessionUpdate(b, 'increment')}
                          className="px-3 py-1.5 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(204,255,0,0.25)] transition-all"
                          title="Record that a coaching session has been completed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          Record Session {completedSess + 1} Done
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-black uppercase rounded-lg flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Package Fulfilled
                        </span>
                      )}

                      {completedSess > 0 && (
                        <button
                          type="button"
                          onClick={() => handleQuickSessionUpdate(b, 'decrement')}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Revert last session if recorded by mistake"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Undo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress visual bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                      <span>Conducted: <strong className="text-white">{completedSess} of {totalSess} Sessions</strong></span>
                      <span>{progressPercent}% Delivered</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#CCFF00] to-emerald-400 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Selected Focuses preview */}
                {b.sessionFocusList && b.sessionFocusList.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Focuses:</span>
                    {b.sessionFocusList.map((f, idx) => (
                      <span key={idx} className="bg-zinc-800/90 text-zinc-300 border border-zinc-700/80 px-2 py-0.5 rounded text-[11px]">
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expandable Customization Breakdown */}
                {isExpanded && (
                  <div className="mt-3">
                    <PlanCustomizationBreakdown
                      customizedDetails={b.customizedDetails}
                      packageName={b.packageName}
                      packageType={b.packageType}
                      durationMinutes={b.durationMinutes}
                      totalSessions={b.totalSessions}
                      totalPrice={b.totalPrice}
                      sessionFocusList={b.sessionFocusList}
                    />
                  </div>
                )}

                {/* Actions Desk: Assign Coach, Direct Contact, View Details, Delete */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!b.assignedCoachId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTakeMyself(b)}
                          className="px-3 py-1.5 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(204,255,0,0.2)]"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Take Myself
                        </button>

                        <button
                          type="button"
                          onClick={() => openAssignModal(b)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Assign Coach & Link
                        </button>
                      </>
                    ) : b.assignedCoachId === user.id ? (
                      <>
                        <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Assigned to You
                        </span>

                        <button
                          type="button"
                          onClick={() => openAssignModal(b)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                        >
                          <Video className="w-3.5 h-3.5 text-[#CCFF00]" />
                          Edit Link & Notes
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTakeMyself(b)}
                          className="px-2.5 py-1.5 bg-[#CCFF00]/20 hover:bg-[#CCFF00]/30 text-[#CCFF00] font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer border border-[#CCFF00]/40"
                          title="Reassign to yourself"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Take Over (Me)
                        </button>

                        <button
                          type="button"
                          onClick={() => openAssignModal(b)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Reassign / Edit Link
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : b.id)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                        isExpanded
                          ? 'bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/40'
                          : 'bg-black/60 hover:bg-zinc-800 text-gray-300 border border-gray-800'
                      }`}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? 'Hide Details' : 'View Full Details'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Direct Contact Buttons */}
                    {b.clientPhone && (
                      <a
                        href={`https://wa.me/${b.clientPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 text-xs font-bold rounded flex items-center gap-1"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}

                    {b.clientPhone && (
                      <a
                        href={`tel:${b.clientPhone}`}
                        className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold rounded flex items-center gap-1"
                        title="Call Athlete"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}

                    <a
                      href={`mailto:${b.clientEmail}?subject=BxStrength%20Training%20Session%20(${b.id})`}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold rounded flex items-center gap-1"
                      title="Email Athlete"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>

                    {/* Delete for Admin / Head Coach */}
                    {(isAdmin || isHeadCoach) && (
                      <button
                        type="button"
                        onClick={() => setDeletingId(b.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                        title="Delete booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ASSIGN COACH & MEETING LINK MODAL */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-gray-800 rounded-xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setAssignTarget(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 font-bold uppercase">
                  {assignTarget.packageType}
                </span>
                <span className="text-[10px] font-mono text-gray-400">REF: {assignTarget.id}</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white mt-1">
                Assign Specialist Coach & Video Link
              </h3>
              <p className="text-xs text-gray-400">
                Package: <strong className="text-white">{assignTarget.packageName}</strong> • Client: <strong className="text-white">{assignTarget.clientName}</strong>
              </p>
            </div>

            <form onSubmit={handleSaveAssign} className="space-y-4">
              {/* Quick Self-Assignment Option */}
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white">Coach this athlete yourself?</p>
                  <p className="text-[10px] text-zinc-400">Instantly assign to {user.name} ({normRole === 'headcoach' ? 'Head Coach' : 'Coach'})</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCoachId(user.id);
                    setSelectedCoachName(user.name);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg cursor-pointer transition-colors ${
                    selectedCoachId === user.id
                      ? 'bg-[#CCFF00] text-black font-black shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                      : 'bg-black/60 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  {selectedCoachId === user.id ? '✓ Selected (You)' : 'Assign To Me'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Or Delegate to a Team Coach
                </label>
                <select
                  value={selectedCoachId}
                  onChange={(e) => {
                    const found = availableCoaches.find(c => c.id === e.target.value);
                    setSelectedCoachId(e.target.value);
                    setSelectedCoachName(found ? found.name : '');
                  }}
                  required
                  className="w-full bg-black/80 border border-gray-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                >
                  <option value="">-- Choose Coach from Staff Directory --</option>
                  {availableCoaches
                    .filter(c => c.id !== user.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.position})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center justify-between">
                  <span>Live Video Meeting URL (Google Meet / Zoom)</span>
                  <Video className="w-3.5 h-3.5 text-[#CCFF00]" />
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full bg-black/80 border border-gray-800 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00]"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  This link is instantly visible on the client's dashboard under MY BOOKINGS.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Coaching Notes / Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes on client focus, warmup emphasis, injury considerations..."
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  className="w-full bg-black/80 border border-gray-800 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignTarget(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold uppercase rounded-lg text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="px-5 py-2 bg-[#CCFF00] hover:bg-[#b8e600] disabled:opacity-50 text-xs font-black uppercase tracking-wider rounded-lg text-black flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                >
                  {isSubmittingAssign ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Confirm & Save Assignment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="Delete Paid Booking Record"
        message="Are you sure you want to delete this paid booking record? This action cannot be undone."
        confirmText="Delete Booking"
        cancelText="Keep Record"
        onConfirm={() => deletingId && handleDelete(deletingId)}
        onCancel={() => setDeletingId(null)}
        requireTextConfirm={false}
      />
    </div>
  );
};
export default PaidBookingsView;
