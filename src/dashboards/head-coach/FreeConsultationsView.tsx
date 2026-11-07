import React, { useState, useEffect, useMemo } from 'react';
import { ConsultationBooking, User } from '../../types';
import { VelocityAPI, formatMeetingUrl } from '../../services/api';
import { normalizeRole } from '../../utils/auth';
import {
  Calendar, Clock, UserCheck, CheckCircle2, Phone, Mail, Award,
  Search, RefreshCw, X, ExternalLink, MessageSquare, Video,
  Check, User as UserIcon, Trash2, AlertCircle, Share2
} from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

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
  const isHeadCoachOrAdmin = isAdmin || isHeadCoach;

  const [consultations, setConsultations] = useState<ConsultationBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'headcoach' | 'coaches' | 'completed'>('all');

  // Assign Modal State
  const [assignTarget, setAssignTarget] = useState<ConsultationBooking | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [selectedCoachName, setSelectedCoachName] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);

  // Status Update Modal State
  const [statusTarget, setStatusTarget] = useState<ConsultationBooking | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Completed');
  const [statusMeetingLink, setStatusMeetingLink] = useState<string>('');
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

  // Available Specialist Coaches for delegation (ONLY real coaches from DB with role === 'coach', excluding Head Coach and Admins)
  const availableSpecialistCoaches = useMemo(() => {
    const combined = [...coaches, ...dbCoaches];
    const uniqueMap = new Map<string, { id: string; name: string; position: string; email: string }>();

    combined.forEach(c => {
      const r = normalizeRole(c.role);
      const isSelf = c.id === user.id || (c.email && c.email.toLowerCase() === user.email.toLowerCase());
      const isHeadCoachRole = r === 'headcoach' || (c.name && c.name.toLowerCase().includes('head coach'));
      const isAdminRole = r === 'admin';

      // STRICT FILTER: Only real database users with role 'coach' (not admin, not head coach, not self)
      if (r === 'coach' && !isSelf && !isHeadCoachRole && !isAdminRole) {
        uniqueMap.set(c.id, {
          id: c.id,
          name: c.name,
          position: c.coachPosition || 'Specialist Coach',
          email: c.email
        });
      }
    });

    return Array.from(uniqueMap.values());
  }, [coaches, dbCoaches, user]);

  const loadConsultations = async () => {
    setIsLoading(true);
    try {
      const data = await VelocityAPI.fetchConsultations();
      setConsultations(data);
    } catch (e: any) {
      console.error('Error fetching consultations:', e);
      onShowToast('Could not refresh demo consultations from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

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
      onShowToast(`✓ Free Demo #${item.id} claimed! Moved to "TAKEN BY HEAD COACH" tab.`);
      setFilterTab('headcoach');
      loadConsultations();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to claim consultation');
    }
  };

  // Quick Action 2: Open modal to assign to coach
  const handleOpenAssignModal = (item: ConsultationBooking) => {
    setAssignTarget(item);
    const initialCoach = availableSpecialistCoaches[0];
    if (initialCoach) {
      setSelectedCoachId(initialCoach.id);
      setSelectedCoachName(initialCoach.name);
    } else {
      setSelectedCoachId('coach-mazhar');
      setSelectedCoachName('Coach (Mazhar Ali)');
    }
    setAssignNotes(item.notes || '');
  };

  // Confirm delegation to specialist coach (NO meeting link field)
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
        assignedBy: user.name,
        notes: assignNotes || `Delegated to Coach ${coachName} by Head Coach`
      });
      onShowToast(`✓ Successfully delegated #${assignTarget.id} to Coach ${coachName}. Moved to "COACH DELEGATED" tab.`);
      setAssignTarget(null);
      setFilterTab('coaches');
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
    setStatusNotes(item.notes || '');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    try {
      await VelocityAPI.updateConsultationStatus(statusTarget.id, {
        status: newStatus,
        meetingLink: statusMeetingLink,
        notes: statusNotes
      });
      if (statusMeetingLink && statusMeetingLink.trim()) {
        onShowToast(`✓ Meeting link saved & email notification sent to ${statusTarget.clientEmail}!`);
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
      loadConsultations();
    } catch (err: any) {
      onShowToast('Failed to delete consultation.');
    }
  };

  return (
    <div className="space-y-6 text-white font-sans">

      {/* Top Banner */}
      <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#CCFF00]/10 text-[#CCFF00] rounded border border-[#CCFF00]/30">
              {isHeadCoachOrAdmin ? 'HEAD COACH PIPELINE • SEPARATE DEMO ENQUIRIES' : 'COACH WORKSPACE • MY ASSIGNED DEMOS'}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {filteredList.length} Leads in this view
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1.5 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#CCFF00]" />
            {isHeadCoachOrAdmin ? 'FREE DEMO & 15-MIN CONSULTATION ENQUIRIES' : 'MY ASSIGNED FREE DEMO CALLS'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            {isHeadCoachOrAdmin
              ? 'Real-time pipeline for "Request My Free 15-Min Demo" submissions. Click "TAKE MYSELF" to conduct the session yourself, or "ASSIGN TO COACH" to delegate.'
              : 'Free strategy calls and demo sessions delegated to you by the Head Coach. Provide your video call link and mark as completed.'}
          </p>
        </div>

        <button
          onClick={loadConsultations}
          className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase px-4 py-2.5 rounded-xl border border-zinc-700 flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-[#CCFF00] ${isLoading ? 'animate-spin' : ''}`} />
          <span>REFRESH LEADS</span>
        </button>
      </div>

      {/* KPI Cards / Filter Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setFilterTab('all')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterTab === 'all' ? 'bg-[#18181b] border-[#CCFF00]/60 shadow-md ring-1 ring-[#CCFF00]/40' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-zinc-400 block tracking-wider">ALL DEMOS</span>
          <span className="text-2xl font-black text-white mt-1 block">{stats.total}</span>
          <span className="text-[9px] text-zinc-500 uppercase font-semibold">Total submissions</span>
        </div>

        <div
          onClick={() => setFilterTab('pending')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterTab === 'pending' ? 'bg-[#18181b] border-amber-500/60 shadow-md ring-1 ring-amber-500/40' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">PENDING ACTION</span>
          <span className="text-2xl font-black text-amber-300 mt-1 block">{stats.pending}</span>
          <span className="text-[9px] text-amber-400/80 uppercase font-semibold">Needs assignment</span>
        </div>

        {isHeadCoachOrAdmin && (
          <div
            onClick={() => setFilterTab('headcoach')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterTab === 'headcoach' ? 'bg-[#18181b] border-[#CCFF00]/60 shadow-md ring-1 ring-[#CCFF00]/40' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-[#CCFF00] block tracking-wider">TAKEN BY HEAD COACH</span>
            <span className="text-2xl font-black text-[#CCFF00] mt-1 block">{stats.takenByHeadCoach}</span>
            <span className="text-[9px] text-[#CCFF00]/80 uppercase font-semibold">My direct sessions</span>
          </div>
        )}

        {isHeadCoachOrAdmin && (
          <div
            onClick={() => setFilterTab('coaches')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterTab === 'coaches' ? 'bg-[#18181b] border-blue-500/60 shadow-md ring-1 ring-blue-500/40' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-blue-400 block tracking-wider">COACH DELEGATED</span>
            <span className="text-2xl font-black text-blue-300 mt-1 block">{stats.assignedToCoaches}</span>
            <span className="text-[9px] text-blue-400/80 uppercase font-semibold">Handled by team</span>
          </div>
        )}

        <div
          onClick={() => setFilterTab('completed')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterTab === 'completed' ? 'bg-[#18181b] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/40' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-wider">COMPLETED</span>
          <span className="text-2xl font-black text-emerald-300 mt-1 block">{stats.completed}</span>
          <span className="text-[9px] text-emerald-400/80 uppercase font-semibold">Finished demos</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client, email, ref, phone, goal, coach..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#18181b] border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00]"
          />
        </div>

        {/* Filter Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-[10px] font-bold text-zinc-500 uppercase mr-1">FILTER:</span>
          {(['all', 'pending', 'headcoach', 'coaches', 'completed'] as const).map(tab => {
            if (!isHeadCoachOrAdmin && (tab === 'headcoach' || tab === 'coaches')) return null;
            const labels: Record<string, string> = {
              all: 'ALL',
              pending: 'PENDING',
              headcoach: 'HEAD COACH',
              coaches: 'COACHES',
              completed: 'COMPLETED'
            };
            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                  filterTab === tab
                    ? 'bg-white text-black font-black shadow-sm'
                    : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List */}
      {filteredList.length === 0 ? (
        <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-12 text-center space-y-4">
          <Award className="w-12 h-12 text-zinc-600 mx-auto" />
          <div>
            <h3 className="text-base font-black uppercase text-white tracking-wide">
              NO FREE DEMO ENQUIRIES FOUND
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
              {filterTab === 'pending'
                ? 'All free demo strategy calls have been claimed or delegated!'
                : filterTab === 'headcoach'
                ? 'No active demo sessions currently claimed by Head Coach.'
                : filterTab === 'coaches'
                ? 'No demo sessions currently delegated to specialist coaches.'
                : 'When clients submit the 15-Min Free Demo form on the website, their enquiries will appear right here in real-time.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((item) => {
            const isAssigned = Boolean(item.assignedCoachName);
            const isTakenByHeadCoach = isAssigned && item.assignedCoachName!.toLowerCase().includes('head coach');
            const isCoachDelegated = isAssigned && !isTakenByHeadCoach;
            const isCompleted = item.status === 'Completed';

            return (
              <div
                key={item.id}
                className="bg-[#121214] border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 space-y-4 transition-all shadow-md"
              >
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3.5 border-b border-zinc-800/80">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                      <UserIcon className="w-5 h-5 text-[#CCFF00]" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-black text-white uppercase tracking-wide">
                          {item.clientName}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {item.id}
                        </span>

                        {/* Status Pills */}
                        {isCompleted ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Demo Completed
                          </span>
                        ) : isTakenByHeadCoach ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/40 flex items-center gap-1">
                            👑 Claimed by Head Coach
                          </span>
                        ) : isCoachDelegated ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                            👤 Delegated: {item.assignedCoachName}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 animate-pulse flex items-center gap-1">
                            ⚡ Pending Assignment
                          </span>
                        )}
                      </div>

                      {/* Contact row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2">
                        <a
                          href={`mailto:${item.clientEmail}`}
                          className="flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{item.clientEmail}</span>
                        </a>

                        {item.clientPhone && (
                          <a
                            href={`https://wa.me/${item.clientPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-[#CCFF00] transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{item.clientPhone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Goal Badge */}
                  <div className="bg-[#18181b] border border-zinc-800 px-4 py-2.5 rounded-xl text-left lg:text-right">
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block">SESSION TYPE</span>
                    <span className="text-xs font-black text-[#CCFF00] uppercase block">
                      {item.goal && item.goal !== 'Fitness Boxing' ? item.goal : '15-MIN STRATEGY DEMO'} ({item.duration && item.duration !== '20 Min' ? item.duration : '15 MIN'})
                    </span>
                  </div>
                </div>

                {/* Details Body */}
                <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Client message / notes from form */}
                  <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800/90 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#CCFF00]" />
                        CLIENT MESSAGE / QUESTION (OPTIONAL FIELD IN FORM):
                      </p>
                      {item.additionalNotes ? (
                        <p className="text-zinc-100 font-medium mt-2 leading-relaxed whitespace-pre-wrap text-xs bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                          "{item.additionalNotes}"
                        </p>
                      ) : (
                        <p className="text-zinc-500 text-xs italic mt-2">
                          Client left this field empty during strategy session request.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Assignment & Meeting details */}
                  <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800/90 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">
                        SESSION HANDLED BY:
                      </span>
                      <p className="text-white font-black text-sm mt-0.5">
                        {item.assignedCoachName || 'Unassigned (Waiting for Head Coach decision)'}
                      </p>
                      {item.notes && (
                        <p className="text-zinc-400 text-xs mt-1.5 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                          <strong className="text-zinc-300">Coach Instructions:</strong> {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Live Meeting Link display */}
                    {item.meetingLink && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                        <a
                          href={formatMeetingUrl(item.meetingLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/30 px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>JOIN DEMO VIDEO CALL</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {item.clientPhone && (
                          <a
                            href={`https://wa.me/${item.clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${item.clientName}, your BxStrength Free 15-Min Strategy Session link is ready: ${formatMeetingUrl(item.meetingLink)}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Share meeting link directly via WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>WhatsApp Link</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons Bar */}
                <div className="mt-4 pt-3.5 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-zinc-500">
                    Received: {new Date(item.createdAt).toLocaleString()}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">

                    {/* CASE 1: UNASSIGNED LEAD -> EXACTLY 2 BUTTONS (TAKE MYSELF & ASSIGN TO COACH) */}
                    {!isAssigned && isHeadCoachOrAdmin && !isCompleted && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTakeMyself(item)}
                          className="bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black px-4 py-2 uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-black" />
                          <span>TAKE MYSELF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(item)}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-4 py-2 uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>ASSIGN TO COACH</span>
                        </button>
                      </>
                    )}

                    {/* CASE 2: CLAIMED BY HEAD COACH -> HEAD COACH CAN ADD MEETING LINK, MARK COMPLETED, OR REASSIGN */}
                    {isAssigned && isTakenByHeadCoach && isHeadCoachOrAdmin && !isCompleted && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(item)}
                          className="bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black px-4 py-2 uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5 text-black" />
                          <span>{item.meetingLink ? 'EDIT MEETING LINK' : 'ADD MEETING LINK'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(item)}
                          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>MARK COMPLETED</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(item)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-3 py-2 uppercase rounded-xl border border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                          <span>REASSIGN TO COACH</span>
                        </button>
                      </>
                    )}

                    {/* CASE 3: DELEGATED TO ANOTHER COACH -> HEAD COACH SEES REASSIGN BUTTON */}
                    {isAssigned && isCoachDelegated && isHeadCoachOrAdmin && !isCompleted && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(item)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-3 py-2 uppercase rounded-xl border border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                          <span>REASSIGN COACH</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(item)}
                          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold px-3 py-2 uppercase rounded-xl border border-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{item.meetingLink ? 'VIEW / EDIT LINK' : 'ADD LINK'}</span>
                        </button>
                      </>
                    )}

                    {/* CASE 4: SPECIALIST COACH LOGGED IN -> SEES ADD LINK & MARK COMPLETED */}
                    {!isHeadCoachOrAdmin && !isCompleted && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(item)}
                          className="bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black px-4 py-2 uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5 text-black" />
                          <span>{item.meetingLink ? 'EDIT MEETING LINK' : 'ADD MEETING LINK'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(item)}
                          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>MARK COMPLETED</span>
                        </button>
                      </>
                    )}

                    {/* Completed State badge */}
                    {isCompleted && (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-900/60">
                        <CheckCircle2 className="w-4 h-4" /> Demo Session Finalized
                      </span>
                    )}

                    {/* Admin Delete */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer ml-1"
                        title="Delete Demo Lead"
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

      {/* MODAL 1: Delegate Demo to Specialist Coach (NO meeting link field) */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-black uppercase text-white">
                  DELEGATE DEMO TO SPECIALIST COACH
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Client: <strong className="text-white">{assignTarget.clientName}</strong> ({assignTarget.clientEmail})
                </p>
              </div>
              <button
                onClick={() => setAssignTarget(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssign} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5">
                  SELECT SPECIALIST COACH * ({availableSpecialistCoaches.length} found in database)
                </label>
                {availableSpecialistCoaches.length === 0 ? (
                  <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-3.5 text-amber-300 text-xs leading-relaxed">
                    No specialist coaches with role <strong>coach</strong> are currently registered in your database. Head Coach can take this demo session directly using the <strong>TAKE MYSELF</strong> button.
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedCoachId}
                      onChange={(e) => {
                        const cId = e.target.value;
                        setSelectedCoachId(cId);
                        const found = availableSpecialistCoaches.find(c => c.id === cId);
                        if (found) setSelectedCoachName(found.name);
                      }}
                      required
                      className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-[#CCFF00] cursor-pointer"
                    >
                      {availableSpecialistCoaches.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email}) {c.position ? `— ${c.position}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Only verified coaches with role 'coach' from your database appear here.
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5">
                  INSTRUCTIONS / NOTES FOR COACH (OPTIONAL)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please contact client within 24 hours, perform 15-min assessment, and schedule session."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#CCFF00] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAssignTarget(null)}
                  className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign || availableSpecialistCoaches.length === 0}
                  className="bg-[#CCFF00] disabled:bg-zinc-800 disabled:text-zinc-500 hover:bg-[#b8e600] text-black font-black uppercase px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  {isSubmittingAssign ? 'DELEGATING...' : 'CONFIRM DELEGATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add / Edit Meeting Link & Status */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121214] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#CCFF00]" />
                  ADD / EDIT MEETING LINK
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ref: <strong className="text-white">{statusTarget.id}</strong> — Athlete: <strong className="text-white">{statusTarget.clientName}</strong>
                </p>
              </div>
              <button
                onClick={() => setStatusTarget(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5">
                  GOOGLE MEET / ZOOM LINK *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom URL"
                  value={statusMeetingLink}
                  onChange={(e) => setStatusMeetingLink(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Once saved, this link will be visible to join and can be sent to the client via WhatsApp or Email.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5">
                  DEMO SESSION STATUS
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-[#CCFF00] cursor-pointer"
                >
                  <option value="Confirmed">Confirmed (Ready for Demo)</option>
                  <option value="Completed">Completed (Demo Conducted)</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5">
                  INTERNAL COACH NOTES
                </label>
                <textarea
                  rows={2}
                  placeholder="Any prep notes for the call..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#CCFF00] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black uppercase px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  SAVE & UPDATE
                </button>
              </div>
            </form>
          </div>
        </div>
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
