import React, { useState, useMemo } from 'react';
import { PaidPackageBooking, User } from '../../types';
import { VelocityAPI, decodeHtmlEntities } from '../../services/api';
import { normalizeRole } from '../../utils/auth';
import {
  UserCheck, CheckCircle2, AlertCircle, Clock, Video, ExternalLink,
  Mail, Phone, MessageCircle, Search, Calendar, Award, Zap,
  Layers, ChevronDown, ChevronUp, ShieldCheck
} from 'lucide-react';

interface CoachAvailabilityRosterProps {
  coaches: User[];
  paidBookings: PaidPackageBooking[];
  onBookingsUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const CoachAvailabilityRoster: React.FC<CoachAvailabilityRosterProps> = ({
  coaches,
  paidBookings,
  onBookingsUpdated,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'moderate' | 'busy'>('all');
  const [expandedCoachId, setExpandedCoachId] = useState<string | null>(null);

  // Quick Assignment Modal State
  const [assigningCoach, setAssigningCoach] = useState<User | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [meetingLinkInput, setMeetingLinkInput] = useState<string>('');
  const [coordinationNotes, setCoordinationNotes] = useState<string>('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);

  // Unassigned bookings list
  const unassignedBookings = useMemo(() => {
    return paidBookings.filter(b => 
      !b.assignedCoachName || 
      b.assignedCoachName.toLowerCase() === 'unassigned' ||
      !b.assignedCoachId
    );
  }, [paidBookings]);

  // Aggregate workload and availability metrics per coach
  const coachRoster = useMemo(() => {
    return coaches.map(coach => {
      const cRole = normalizeRole(coach.role);
      const isHead = cRole === 'headcoach' || Boolean(
        coach.coachPosition && (
          coach.coachPosition.toLowerCase().includes('head') ||
          coach.coachPosition.toLowerCase().includes('chief')
        )
      );

      // Match bookings assigned to this coach by ID or by exact name
      const assignedBookings = paidBookings.filter(b => 
        b.assignedCoachId === coach.id || 
        (b.assignedCoachName && b.assignedCoachName.toLowerCase().trim() === coach.name.toLowerCase().trim())
      );

      const activeBookings = assignedBookings.filter(b => b.status === 'Active' || b.status === 'Scheduled');
      const completedBookings = assignedBookings.filter(b => b.status === 'Completed');
      const totalSessionsDelivered = assignedBookings.reduce((sum, b) => sum + (Number(b.completedSessions) || 0), 0);
      const totalSessionsScheduled = assignedBookings.reduce((sum, b) => sum + (Number(b.totalSessions) || 1), 0);

      // Workload categorization:
      // 0 active bookings => Available (🟢)
      // 1-2 active bookings => Moderate Load (🟡)
      // 3+ active bookings => High Load / Busy (🔴)
      let workloadTier: 'available' | 'moderate' | 'busy' = 'available';
      if (activeBookings.length >= 3) {
        workloadTier = 'busy';
      } else if (activeBookings.length > 0) {
        workloadTier = 'moderate';
      }

      return {
        coach,
        isHead,
        assignedBookings,
        activeBookings,
        completedBookings,
        totalSessionsDelivered,
        totalSessionsScheduled,
        workloadTier
      };
    });
  }, [coaches, paidBookings]);

  // Filtered coaches based on search & availability
  const filteredRoster = useMemo(() => {
    return coachRoster.filter(item => {
      const matchSearch = !searchTerm.trim() ||
        item.coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.coach.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.coach.coachPosition || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (availabilityFilter === 'available') return item.workloadTier === 'available';
      if (availabilityFilter === 'moderate') return item.workloadTier === 'moderate';
      if (availabilityFilter === 'busy') return item.workloadTier === 'busy';

      return true;
    });
  }, [coachRoster, searchTerm, availabilityFilter]);

  // Handle Quick Assign Booking to Coach
  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningCoach || !selectedBookingId) {
      onShowToast('Please select a booking to assign.');
      return;
    }

    setIsSubmittingAssign(true);
    try {
      const res = await VelocityAPI.assignPaidBooking(selectedBookingId, {
        assignedCoachId: assigningCoach.id,
        assignedCoachName: assigningCoach.name,
        assignedBy: 'Customer Support Desk',
        meetingLink: meetingLinkInput.trim() || undefined,
        coachNotes: coordinationNotes.trim() || undefined
      });

      if (res.success) {
        onShowToast(`Successfully assigned booking to ${assigningCoach.name}!`);
        setAssigningCoach(null);
        setSelectedBookingId('');
        setMeetingLinkInput('');
        setCoordinationNotes('');
        onBookingsUpdated();
      } else {
        onShowToast(res.error || 'Failed to assign booking to coach.');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Error assigning booking');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-[#111111] border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <UserCheck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black uppercase text-white tracking-wider">
              Coach Availability & Workload Roster
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Real-time coaching capacity overview. Monitor which coaches are actively training clients, who is available for immediate assignments, and delegate new bookings smoothly without overloading staff.
          </p>
        </div>

        {/* Unassigned Bookings Notification Pill */}
        <div className="flex items-center gap-3">
          {unassignedBookings.length > 0 ? (
            <div className="bg-amber-950/60 border border-amber-800/80 px-4 py-2.5 rounded-xl flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <p className="text-xs font-black uppercase text-amber-300">
                  {unassignedBookings.length} Unassigned Booking{unassignedBookings.length > 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-amber-400/80">Pending Coach Delegation</p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/40 border border-emerald-800/60 px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>All Bookings Assigned</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search coach by name, role or email..."
            className="w-full bg-[#141416] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00]"
          />
        </div>

        {/* Availability Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setAvailabilityFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
              availabilityFilter === 'all'
                ? 'bg-zinc-200 text-black font-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All Coaches ({coachRoster.length})
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter('available')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              availabilityFilter === 'available'
                ? 'bg-emerald-400 text-black font-black'
                : 'bg-zinc-900 text-emerald-400 hover:bg-emerald-950/50 border border-emerald-900/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Available ({coachRoster.filter(c => c.workloadTier === 'available').length})
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter('moderate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              availabilityFilter === 'moderate'
                ? 'bg-amber-400 text-black font-black'
                : 'bg-zinc-900 text-amber-400 hover:bg-amber-950/50 border border-amber-900/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Moderate ({coachRoster.filter(c => c.workloadTier === 'moderate').length})
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter('busy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              availabilityFilter === 'busy'
                ? 'bg-red-400 text-black font-black'
                : 'bg-zinc-900 text-red-400 hover:bg-red-950/50 border border-red-900/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            High Load ({coachRoster.filter(c => c.workloadTier === 'busy').length})
          </button>
        </div>
      </div>

      {/* Coach Cards Grid */}
      {filteredRoster.length === 0 ? (
        <div className="bg-[#111111] border border-dashed border-zinc-800 p-12 text-center rounded-2xl space-y-2">
          <Award className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-bold text-white">No Coaches Found</p>
          <p className="text-xs text-zinc-500">
            {searchTerm ? 'No coaches matched your search filter.' : 'No coaches registered in the system yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRoster.map(({
            coach,
            isHead,
            assignedBookings,
            activeBookings,
            completedBookings,
            totalSessionsDelivered,
            workloadTier
          }) => {
            const isExpanded = expandedCoachId === coach.id;

            return (
              <div
                key={coach.id}
                className="bg-[#111111] border border-zinc-800 hover:border-zinc-700 transition-all rounded-2xl p-5 space-y-4 relative overflow-hidden"
              >
                {/* Top Coach Info Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={coach.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(coach.name)}`}
                      alt={coach.name}
                      className="w-12 h-12 rounded-xl object-cover bg-zinc-900 border border-zinc-700 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black uppercase text-white">
                          {coach.name}
                        </h3>
                        {isHead && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30">
                            Head Coach
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 font-medium">
                        {coach.coachPosition || (isHead ? 'Head Coach & Athletic Architect' : 'Performance Coach')}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{coach.email}</p>
                    </div>
                  </div>

                  {/* Workload Pill */}
                  <div>
                    {workloadTier === 'available' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Available (0 Active)
                      </span>
                    ) : workloadTier === 'moderate' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950/80 text-amber-400 border border-amber-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Moderate ({activeBookings.length} Active)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        High Load ({activeBookings.length} Active)
                      </span>
                    )}
                  </div>
                </div>

                {/* Workload KPI Stats */}
                <div className="grid grid-cols-3 gap-2 bg-black/50 border border-zinc-800/80 p-3 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block">Active Athletes</span>
                    <span className="text-lg font-black text-white font-mono">{activeBookings.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block">Delivered</span>
                    <span className="text-lg font-black text-[#CCFF00] font-mono">{totalSessionsDelivered} Sess</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block">Completed Pkgs</span>
                    <span className="text-lg font-black text-zinc-300 font-mono">{completedBookings.length}</span>
                  </div>
                </div>

                {/* Expandable Current Bookings Drawer */}
                {assignedBookings.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedCoachId(isExpanded ? null : coach.id)}
                      className="w-full flex items-center justify-between py-1.5 text-xs text-zinc-400 hover:text-white transition-colors border-t border-zinc-800/60 pt-2"
                    >
                      <span className="font-bold flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#CCFF00]" />
                        Assigned Athletes & Packages ({assignedBookings.length})
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 mt-2 pt-2 border-t border-zinc-900">
                        {assignedBookings.map((b) => (
                          <div
                            key={b.id}
                            className="bg-black/60 border border-zinc-800/80 p-3 rounded-lg space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">{b.clientName}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                b.status === 'Completed'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30'
                              }`}>
                                {b.status}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span>{decodeHtmlEntities(b.packageName)}</span>
                              <span className="font-mono text-zinc-300">
                                {b.completedSessions || 0} / {b.totalSessions || 1} Sessions Done
                              </span>
                            </div>

                            {/* Meeting Link status */}
                            <div className="text-[11px] pt-1 border-t border-zinc-800/40 flex items-center justify-between">
                              <span className="text-zinc-500">Live Video:</span>
                              {b.meetingLink ? (
                                <a
                                  href={b.meetingLink.startsWith('http') ? b.meetingLink : `https://${b.meetingLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#CCFF00] hover:underline font-bold flex items-center gap-1"
                                >
                                  <Video className="w-3 h-3" />
                                  Video Link Set <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-amber-400/80">Pending Video Link</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Coordination & Quick Action Bar */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Quick Assign Action */}
                    {unassignedBookings.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningCoach(coach);
                          setSelectedBookingId(unassignedBookings[0]?.id || '');
                        }}
                        className="px-3 py-1.5 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(204,255,0,0.2)] transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                        Assign Athlete
                      </button>
                    )}

                    {/* Email Coach */}
                    <a
                      href={`mailto:${coach.email}?subject=BxStrength%20Athlete%20Coaching%20Coordination`}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                      title="Email Coach directly"
                    >
                      <Mail className="w-3 h-3" />
                      Email
                    </a>

                    {/* Phone / WhatsApp if available */}
                    {coach.phone && (
                      <a
                        href={`https://wa.me/${coach.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500">
                    ID: {coach.id.slice(0, 14)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK ASSIGN BOOKING MODAL */}
      {assigningCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30">
                  <UserCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black uppercase text-white tracking-wider">
                    Delegate Booking to {assigningCoach.name}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Assign a pending paid athlete booking directly to this coach.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmAssign} className="space-y-4">
              {/* Booking Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">
                  Select Unassigned Booking <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  required
                  className="w-full bg-[#18181b] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                >
                  <option value="" disabled>-- Select athlete booking --</option>
                  {unassignedBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {decodeHtmlEntities(b.clientName)} — {decodeHtmlEntities(b.packageName)} (£{b.totalPrice}) [Ref: {b.id}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Video Meeting URL */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">
                  Live Video Meeting URL (Google Meet / Zoom)
                </label>
                <div className="relative">
                  <Video className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={meetingLinkInput}
                    onChange={(e) => setMeetingLinkInput(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className="w-full bg-[#18181b] border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  This meeting URL will be immediately visible on the athlete's client dashboard.
                </p>
              </div>

              {/* Coordination Notes */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">
                  Coordination Notes for Coach & Client (Optional)
                </label>
                <textarea
                  value={coordinationNotes}
                  onChange={(e) => setCoordinationNotes(e.target.value)}
                  placeholder="e.g. Client requested 6:00 PM GMT slot. Focus on functional strength..."
                  rows={3}
                  className="w-full bg-[#18181b] border border-zinc-700 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAssigningCoach(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="px-5 py-2 bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmittingAssign ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachAvailabilityRoster;
