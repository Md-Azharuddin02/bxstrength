import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { ConsultationBooking, User } from '../../types';
import { VelocityAPI } from '../../services/api';
import { normalizeRole } from '../../utils/auth';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ConsultationsHeader } from './free-consultations/ConsultationsHeader';
import { ConsultationStatsCards } from './free-consultations/ConsultationStatsCards';
import { ConsultationFilters } from './free-consultations/ConsultationFilters';
import { ConsultationsEmptyState } from './free-consultations/ConsultationsEmptyState';
import { ConsultationCard } from './free-consultations/ConsultationCard';
import { AssignCoachModal } from './free-consultations/AssignCoachModal';
import { MeetingLinkStatusModal } from './free-consultations/MeetingLinkStatusModal';
import { FilterTab, SpecialistCoach } from './free-consultations/types';

interface FreeConsultationsViewProps {
  user: User;
  coaches: User[];
  onShowToast: (msg: string) => void;
}

export const FreeConsultationsView: React.FC<FreeConsultationsViewProps> = ({
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
  const isCustomerSupport = normRole === 'customersupport' || normRole === 'customer_support' || normRole === 'support';
  const isHeadCoachOrAdmin = isAdmin || isHeadCoach || isCustomerSupport;

  const [consultations, setConsultations] = useState<ConsultationBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Assign Modal State
  const [assignTarget, setAssignTarget] = useState<ConsultationBooking | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [selectedCoachName, setSelectedCoachName] = useState<string>('');
  const [assignMeetingLink, setAssignMeetingLink] = useState<string>('');
  const [assignScheduledAt, setAssignScheduledAt] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);

  // Status Update Modal State
  const [statusTarget, setStatusTarget] = useState<ConsultationBooking | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Confirmed');
  const [statusMeetingLink, setStatusMeetingLink] = useState<string>('');
  const [statusScheduledAt, setStatusScheduledAt] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');

  // Delete Confirm State
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

  // Available Specialist Coaches for delegation (Coaches and Head Coach if customer support)
  const availableSpecialistCoaches = useMemo(() => {
    const combined = [...coaches, ...dbCoaches];
    const uniqueMap = new Map<string, SpecialistCoach>();

    combined.forEach(c => {
      const r = normalizeRole(c.role);
      const isSelf = c.id === user.id || (c.email && c.email.toLowerCase() === user.email.toLowerCase());
      const isHeadCoachRole = r === 'headcoach' || (c.name && c.name.toLowerCase().includes('head coach'));
      const isAdminRole = r === 'admin';

      // Customer Support can delegate to any coach including Head Coach
      // Head Coach delegates only to Specialist Coaches (excluding self, admin, and head coach)
      const isEligible = isCustomerSupport
        ? (r === 'coach' || r === 'headcoach')
        : (r === 'coach' && !isSelf && !isHeadCoachRole && !isAdminRole);

      if (isEligible) {
        uniqueMap.set(c.id, {
          id: c.id,
          name: c.name,
          position: c.coachPosition || (r === 'headcoach' ? 'Head Coach' : 'Specialist Coach'),
          email: c.email
        });
      }
    });

    return Array.from(uniqueMap.values());
  }, [coaches, dbCoaches, user, isCustomerSupport]);

  const loadConsultations = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // The server only gives a coach the demos assigned to them
      const coachFilter = (normRole === 'coach' && !isHeadCoach) ? user.id : undefined;
      const data = await VelocityAPI.fetchConsultations(undefined, coachFilter);
      setConsultations(data);
    } catch (e: any) {
      console.error('Error fetching consultations:', e);
      onShowToast('Could not refresh demo consultations from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadConsultations(); }, []);

  // Poll only while a demo is underway (coach assigned/confirmed, not finished); idle otherwise.
  const hasLiveDemo = consultations.some(c => c.status === 'Assigned' || c.status === 'Confirmed');
  useEffect(() => {
    if (!hasLiveDemo) return;
    const timer = setInterval(() => { if (!document.hidden) loadConsultations(true); }, 15000);
    return () => clearInterval(timer);
  }, [hasLiveDemo]);

  // Filter based on role and tab
  const filteredList = useMemo(() => {
    return consultations.filter(item => {
      // Role scoping: Specialist Coach only sees items assigned specifically to them
      if (!isHeadCoachOrAdmin) {
        const matchesCoach = item.assignedCoachId === user.id ||
          (item.assignedCoachName && item.assignedCoachName.toLowerCase().includes(user.name.toLowerCase()));
        if (!matchesCoach) return false;
      }

      const isAssigned = Boolean(item.assignedCoachName);
      const isTakenByHeadCoach = isAssigned && item.assignedCoachName!.toLowerCase().includes('head coach');
      const isCoachDelegated = isAssigned && !isTakenByHeadCoach;

      // Tab filtering
      if (filterTab === 'pending') {
        if (isAssigned || item.status === 'Completed' || item.status === 'Cancelled') return false;
      } else if (filterTab === 'headcoach') {
        if (!isTakenByHeadCoach || item.status === 'Completed' || item.status === 'Cancelled') return false;
      } else if (filterTab === 'coaches') {
        if (!isCoachDelegated || item.status === 'Completed' || item.status === 'Cancelled') return false;
      } else if (filterTab === 'completed') {
        if (item.status !== 'Completed') return false;
      }

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches = (
          item.clientName?.toLowerCase().includes(q) ||
          item.clientEmail?.toLowerCase().includes(q) ||
          item.clientPhone?.toLowerCase().includes(q) ||
          item.id?.toLowerCase().includes(q) ||
          item.goal?.toLowerCase().includes(q) ||
          item.assignedCoachName?.toLowerCase().includes(q) ||
          item.additionalNotes?.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [consultations, filterTab, searchTerm, isHeadCoachOrAdmin, user]);

  // Statistics
  const stats = useMemo(() => {
    const list = isHeadCoachOrAdmin
      ? consultations
      : consultations.filter(i => i.assignedCoachId === user.id || (i.assignedCoachName && i.assignedCoachName.toLowerCase().includes(user.name.toLowerCase())));

    const total = list.length;
    const pending = list.filter(i => !i.assignedCoachName && i.status !== 'Completed' && i.status !== 'Cancelled').length;
    const takenByHeadCoach = list.filter(i => i.assignedCoachName && i.assignedCoachName.toLowerCase().includes('head coach') && i.status !== 'Completed').length;
    const assignedToCoaches = list.filter(i => i.assignedCoachName && !i.assignedCoachName.toLowerCase().includes('head coach') && i.status !== 'Completed').length;
    const completed = list.filter(i => i.status === 'Completed').length;

    return { total, pending, takenByHeadCoach, assignedToCoaches, completed };
  }, [consultations, isHeadCoachOrAdmin, user]);

  // Quick Action 1: Head Coach takes demo consultation directly
  const handleTakeMyself = async (item: ConsultationBooking) => {
    try {
      const selfName = user.name.includes('Head Coach') ? user.name : `${user.name} (Head Coach)`;
      await VelocityAPI.assignConsultation(item.id, {
        assignedCoachId: user.id,
        assignedCoachName: selfName,
        assignedBy: user.name,
        notes: 'Head Coach claimed this free demo strategy session directly.'
      });
      onShowToast(`✓ Free Demo #${item.id} claimed! Set scheduled date & meeting link below.`);
      setFilterTab('headcoach');
      await loadConsultations();
      handleOpenStatusModal({ ...item, assignedCoachId: user.id, assignedCoachName: selfName });
    } catch (err: any) {
      onShowToast(err.message || 'Failed to claim consultation');
    }
  };

  // Quick Action 2: Open modal to assign to coach
  const handleOpenAssignModal = (item: ConsultationBooking) => {
    setAssignTarget(item);
    if (item.assignedCoachId) {
      setSelectedCoachId(item.assignedCoachId);
      setSelectedCoachName(item.assignedCoachName || '');
    } else {
      const initialCoach = availableSpecialistCoaches[0];
      if (initialCoach) {
        setSelectedCoachId(initialCoach.id);
        setSelectedCoachName(initialCoach.name);
      } else {
        setSelectedCoachId('coach-mazhar');
        setSelectedCoachName('Coach (Mazhar Ali)');
      }
    }
    setAssignMeetingLink(item.meetingLink || '');
    setAssignScheduledAt(item.scheduledAt ? item.scheduledAt.slice(0, 16) : '');
    setAssignNotes(item.notes || '');
  };

  const handleAssignCoachChange = (cId: string) => {
    setSelectedCoachId(cId);
    const found = availableSpecialistCoaches.find(c => c.id === cId);
    if (found) setSelectedCoachName(found.name);
  };

  // Confirm delegation to specialist coach with meeting link & schedule
  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;

    let coachName = selectedCoachName;
    let coachId = selectedCoachId;
    if (!coachName && coachId) {
      const found = availableSpecialistCoaches.find(c => c.id === coachId);
      if (found) coachName = found.name;
    }
    if (!coachName && availableSpecialistCoaches.length > 0) {
      coachName = availableSpecialistCoaches[0].name;
      coachId = availableSpecialistCoaches[0].id;
    }
    if (!coachName) {
      onShowToast('Please select a coach to assign.');
      return;
    }

    setIsSubmittingAssign(true);
    try {
      await VelocityAPI.assignConsultation(assignTarget.id, {
        assignedCoachId: coachId || null,
        assignedCoachName: coachName,
        assignedBy: user.name || (isCustomerSupport ? 'Customer Support' : 'Head Coach'),
        meetingLink: assignMeetingLink,
        scheduledAt: assignScheduledAt,
        notes: assignNotes || `Delegated to Coach ${coachName} by ${isCustomerSupport ? 'Customer Support' : 'Head Coach'}`
      });
      onShowToast(`✓ Successfully scheduled & delegated #${assignTarget.id} to Coach ${coachName}. Email confirmations sent!`);
      setAssignTarget(null);
      setFilterTab(coachName.toLowerCase().includes('head coach') ? 'headcoach' : 'coaches');
      loadConsultations();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to assign coach');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Quick Action 3: Mark session completed
  const handleMarkCompleted = async (item: ConsultationBooking) => {
    try {
      await VelocityAPI.updateConsultationStatus(item.id, {
        status: 'Completed',
        meetingLink: item.meetingLink,
        scheduledAt: item.scheduledAt,
        notes: item.notes
      });
      onShowToast(`✓ Free Demo #${item.id} marked as Completed!`);
      loadConsultations();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to mark demo completed');
    }
  };

  // Status & Meeting Link modal
  const handleOpenStatusModal = (item: ConsultationBooking) => {
    setStatusTarget(item);
    setNewStatus(item.status || 'Confirmed');
    setStatusMeetingLink(item.meetingLink || '');
    setStatusScheduledAt(item.scheduledAt ? item.scheduledAt.slice(0, 16) : '');
    setStatusNotes(item.notes || '');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    try {
      await VelocityAPI.updateConsultationStatus(statusTarget.id, {
        status: newStatus,
        meetingLink: statusMeetingLink,
        scheduledAt: statusScheduledAt,
        notes: statusNotes
      });
      if (statusMeetingLink && statusMeetingLink.trim()) {
        onShowToast(`✓ Meeting link saved & email notification sent to ${statusTarget.clientEmail} and coach!`);
      } else {
        onShowToast(`✓ Status updated for #${statusTarget.id}!`);
      }
      setStatusTarget(null);
      loadConsultations();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update consultation');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await VelocityAPI.deleteConsultation(deletingId);
      onShowToast(`Consultation #${deletingId} deleted.`);
      setDeletingId(null);
      setSelectedId(null);
      loadConsultations();
    } catch (err: any) {
      onShowToast('Failed to delete consultation.');
    }
  };

  const selected = consultations.find(c => c.id === selectedId) || null;

  return (
    <div className="space-y-6 text-white font-sans">

      {selected ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#CCFF00]" /> Back to demo sessions
          </button>
          <ConsultationCard
            item={selected}
            isAdmin={isAdmin}
            isHeadCoachOrAdmin={isHeadCoachOrAdmin}
            isCustomerSupport={isCustomerSupport}
            onTakeMyself={handleTakeMyself}
            onOpenAssign={handleOpenAssignModal}
            onOpenStatus={handleOpenStatusModal}
            onMarkCompleted={handleMarkCompleted}
            onDelete={setDeletingId}
          />
        </div>
      ) : (
        <>
          <ConsultationsHeader
            isCustomerSupport={isCustomerSupport}
            isHeadCoachOrAdmin={isHeadCoachOrAdmin}
            leadCount={filteredList.length}
            isLoading={isLoading}
            onRefresh={() => loadConsultations()}
          />

          <ConsultationStatsCards
            stats={stats}
            filterTab={filterTab}
            isHeadCoachOrAdmin={isHeadCoachOrAdmin}
            onSelectTab={setFilterTab}
          />

          <ConsultationFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterTab={filterTab}
            onSelectTab={setFilterTab}
            isHeadCoachOrAdmin={isHeadCoachOrAdmin}
          />

          {filteredList.length === 0 ? (
            <ConsultationsEmptyState filterTab={filterTab} />
          ) : (
            <div className="bg-[#121214] border border-zinc-800 rounded-2xl divide-y divide-zinc-800 overflow-hidden">
              {filteredList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-900/70 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 shrink-0 rounded-full bg-zinc-800 border border-zinc-700 text-[#CCFF00] font-black flex items-center justify-center">
                    {(item.clientName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{item.clientName}</div>
                    <div className="text-xs text-zinc-400 truncate">
                      {item.goal || 'Free demo'} · {item.assignedCoachName ? `Coach: ${item.assignedCoachName}` : 'Unassigned'}
                    </div>
                  </div>
                  <span className="hidden sm:inline text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                    {item.status}
                  </span>
                  <div className="hidden sm:block text-right shrink-0">
                    <div className="font-mono text-[11px] text-amber-300">{item.id}</div>
                    <div className="text-[11px] text-zinc-500">{new Date(item.scheduledAt || item.createdAt).toLocaleDateString()}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: Assign Specialist Coach & Schedule Free Demo */}
      {assignTarget && (
        <AssignCoachModal
          target={assignTarget}
          coaches={availableSpecialistCoaches}
          selectedCoachId={selectedCoachId}
          onCoachChange={handleAssignCoachChange}
          scheduledAt={assignScheduledAt}
          onScheduledAtChange={setAssignScheduledAt}
          meetingLink={assignMeetingLink}
          onMeetingLinkChange={setAssignMeetingLink}
          notes={assignNotes}
          onNotesChange={setAssignNotes}
          isSubmitting={isSubmittingAssign}
          onSubmit={handleConfirmAssign}
          onClose={() => setAssignTarget(null)}
        />
      )}

      {/* MODAL 2: Add / Edit Meeting Link & Status */}
      {statusTarget && (
        <MeetingLinkStatusModal
          target={statusTarget}
          scheduledAt={statusScheduledAt}
          onScheduledAtChange={setStatusScheduledAt}
          meetingLink={statusMeetingLink}
          onMeetingLinkChange={setStatusMeetingLink}
          status={newStatus}
          onStatusChange={setNewStatus}
          notes={statusNotes}
          onNotesChange={setStatusNotes}
          onSubmit={handleSaveStatus}
          onClose={() => setStatusTarget(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingId && (
        <ConfirmModal
          isOpen={Boolean(deletingId)}
          title="DELETE DEMO LEAD"
          message={`Are you sure you want to permanently delete lead #${deletingId}? This action cannot be undone.`}
          confirmText="DELETE LEAD"
          cancelText="CANCEL"
          type="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}

    </div>
  );
};
