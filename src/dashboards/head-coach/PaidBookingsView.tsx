import { decodeHtmlEntities } from '../../services/core/mappers';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PaidPackageBooking, User } from '../../types';
import { VelocityAPI } from '../../services/api';
import { normalizeRole } from '../../utils/auth';
import { Award, Clock, ArrowLeft, ChevronRight } from 'lucide-react';
import { formatScheduledAt } from '../../utils/schedule';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { PaidBookingsHeader } from './paid-bookings/PaidBookingsHeader';
import { PaidBookingsMetrics } from './paid-bookings/PaidBookingsMetrics';
import { PaidBookingsFilters } from './paid-bookings/PaidBookingsFilters';
import { PaidBookingCard } from './paid-bookings/PaidBookingCard';
import { AssignCoachModal } from './paid-bookings/AssignCoachModal';
import { AvailableCoach, FilterTab } from './paid-bookings/types';

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
  const isCustomerSupport = normRole === 'customer_support' || normRole === 'support' || normRole === 'customersupport';

  const [bookings, setBookings] = useState<PaidPackageBooking[]>(() => {
    try {
      const raw = localStorage.getItem('bxstrength_paid_bookings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((b: PaidPackageBooking) => ({
            ...b,
            packageName: decodeHtmlEntities(b.packageName),
            clientName: decodeHtmlEntities(b.clientName),
            assignedCoachName: b.assignedCoachName ? decodeHtmlEntities(b.assignedCoachName) : b.assignedCoachName,
            sessionFocusList: Array.isArray(b.sessionFocusList) ? b.sessionFocusList.map(decodeHtmlEntities) : b.sessionFocusList
          }));
        }
      }
    } catch { }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => bookings.length === 0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Assign Modal
  const [assignTarget, setAssignTarget] = useState<PaidPackageBooking | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [selectedCoachName, setSelectedCoachName] = useState<string>('');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  // Session Progress Modal / Target
  const [sessionTarget, setSessionTarget] = useState<PaidPackageBooking | null>(null);
  const [sessionAction, setSessionAction] = useState<'increment' | 'decrement'>('increment');
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Delete Confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [dbCoaches, setDbCoaches] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    VelocityAPI.fetchUsers().then(uList => {
      setAllUsers(uList);
      const staff = uList.filter(u => {
        const r = normalizeRole(u.role);
        return r === 'coach' || r === 'headcoach';
      });
      if (staff.length > 0) setDbCoaches(staff);
    }).catch(() => {});
  }, []);

  const userMaps = useMemo(() => {
    const byId = new Map<string, User>();
    const byEmail = new Map<string, User>();
    allUsers.forEach(u => {
      if (u.id) byId.set(u.id, u);
      if (u.email) byEmail.set(u.email.toLowerCase().trim(), u);
    });
    return { byId, byEmail };
  }, [allUsers]);

  const availableCoaches = useMemo(() => {
    const combined = [...coaches, ...dbCoaches];
    const map = new Map<string, AvailableCoach>();
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
    try {
      const params = isCoach ? { coachId: user.id } : undefined;
      const data = await VelocityAPI.fetchPaidBookings(params);
      setBookings(data);
      if (!isCoach) {
        try { localStorage.setItem('bxstrength_paid_bookings', JSON.stringify(data)); } catch { }
      }
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
    const hasAssignedCoach = Boolean(
      b.assignedCoachId &&
      b.assignedCoachName &&
      b.assignedCoachName.toLowerCase() !== 'unassigned'
    );

    if (hasAssignedCoach) {
      setSelectedCoachId(b.assignedCoachId || '');
      setSelectedCoachName(b.assignedCoachName || '');
      setIsReassigning(false);
    } else {
      // Unassigned booking:
      // For Customer Support: leave empty so they select from staff directory
      // For Head Coach: can default to available coach or self
      if (isCustomerSupport) {
        setSelectedCoachId('');
        setSelectedCoachName('');
      } else {
        setSelectedCoachId(user.id);
        setSelectedCoachName(user.name);
      }
      setIsReassigning(true);
    }

    setMeetingLink(b.meetingLink || '');
    setScheduledAt(b.scheduledAt ? b.scheduledAt.slice(0, 16) : '');
    setCoachNotes(b.coachNotes || '');
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;

    if (!selectedCoachId || !selectedCoachName) {
      onShowToast('Please select a specialist coach from the staff directory.');
      return;
    }

    const finalCoachId = selectedCoachId;
    const finalCoachName = selectedCoachName;

    setIsSubmittingAssign(true);
    try {
      const res = await VelocityAPI.assignPaidBooking(assignTarget.id, {
        assignedCoachId: finalCoachId || null,
        assignedCoachName: finalCoachName,
        assignedBy: user.name || (isCustomerSupport ? 'Customer Support' : 'Head Coach'),
        meetingLink: meetingLink.trim() || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        coachNotes: coachNotes.trim() || undefined
      });

      if (res.success) {
        onShowToast(
          meetingLink.trim()
            ? `Meeting link & instructions saved for ${assignTarget.clientName}!`
            : `Assigned ${finalCoachName} to ${assignTarget.clientName}'s booking!`
        );
        setAssignTarget(null);
        loadBookings();
      } else {
        onShowToast(res.error || 'Failed to save assignment');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error saving assignment');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Handle Quick Session Increment / Decrement
  const handleQuickSessionUpdate = async (b: PaidPackageBooking, action: 'increment' | 'decrement') => {
    const isAssigned = Boolean(
      b.assignedCoachName &&
      b.assignedCoachName.trim() &&
      b.assignedCoachName.toLowerCase() !== 'unassigned'
    );

    if (action === 'increment' && !isAssigned) {
      onShowToast('Please assign a coach or click "Take Myself" before recording a session.');
      return;
    }

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
        setSelectedId(null);
        loadBookings();
      } else {
        onShowToast('Failed to delete booking.');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error deleting booking');
    }
  };

  const selected = bookings.find(x => x.id === selectedId) || null;

  return (
    <div className="space-y-6">
      {selected ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#CCFF00]" /> Back to paid bookings
          </button>
          <PaidBookingCard
            booking={selected}
            user={user}
            userMaps={userMaps}
            isExpanded={expandedId === selected.id}
            isAdmin={isAdmin}
            isHeadCoach={isHeadCoach}
            isCustomerSupport={isCustomerSupport}
            onToggleExpand={() => setExpandedId(expandedId === selected.id ? null : selected.id)}
            onTakeMyself={handleTakeMyself}
            onOpenAssign={openAssignModal}
            onQuickSessionUpdate={handleQuickSessionUpdate}
            onDelete={setDeletingId}
          />
        </div>
      ) : (<>
      {/* Top Banner & Title */}
      <PaidBookingsHeader isLoading={isLoading} onRefresh={loadBookings} />

      {/* KPI Cards */}
      <PaidBookingsMetrics metrics={metrics} isCustomerSupport={isCustomerSupport} />

      {/* Search and Filters */}
      <PaidBookingsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterTab={filterTab}
        onSelectTab={setFilterTab}
      />

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
        <div className="bg-[#121214] border border-zinc-800 rounded-2xl divide-y divide-zinc-800 overflow-hidden">
          {filteredBookings.map((b) => (
            <button
              key={b.id}
              onClick={() => { setSelectedId(b.id); setExpandedId(b.id); }}
              className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-900/70 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 shrink-0 rounded-full bg-zinc-800 border border-zinc-700 text-[#CCFF00] font-black flex items-center justify-center">
                {(b.clientName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{decodeHtmlEntities(b.clientName)}</div>
                <div className="text-xs text-zinc-400 truncate">
                  {decodeHtmlEntities(b.packageName)} · {b.assignedCoachName ? `Coach: ${b.assignedCoachName}` : 'Unassigned'}
                </div>
              </div>
              <div className="hidden md:block text-xs text-zinc-400 shrink-0 text-right">
                {formatScheduledAt(b.scheduledAt) || 'Not scheduled'}
              </div>
              <span className="hidden sm:inline font-mono text-[11px] text-zinc-300 shrink-0">
                {b.completedSessions || 0}/{b.totalSessions || 1}
              </span>
              <span className="hidden sm:inline text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                {b.status}
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>
          ))}
        </div>
      )}
      </>)}

      {/* ASSIGN COACH & MEETING LINK MODAL */}
      {assignTarget && (
        <AssignCoachModal
          target={assignTarget}
          user={user}
          isCustomerSupport={isCustomerSupport}
          availableCoaches={availableCoaches}
          selectedCoachId={selectedCoachId}
          setSelectedCoachId={setSelectedCoachId}
          setSelectedCoachName={setSelectedCoachName}
          isReassigning={isReassigning}
          setIsReassigning={setIsReassigning}
          scheduledAt={scheduledAt}
          setScheduledAt={setScheduledAt}
          meetingLink={meetingLink}
          setMeetingLink={setMeetingLink}
          coachNotes={coachNotes}
          setCoachNotes={setCoachNotes}
          isSubmitting={isSubmittingAssign}
          onSubmit={handleSaveAssign}
          onClose={() => setAssignTarget(null)}
        />
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
