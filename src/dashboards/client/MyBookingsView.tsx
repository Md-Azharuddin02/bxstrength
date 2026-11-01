import React, { useState, useEffect, useCallback } from 'react';
import { Booking, Enquiry, ClassSchedule, PaidPackageBooking, User } from '../../types';
import { VelocityAPI } from '../../services/api';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  FileText,
  Send,
  ShieldCheck,
  Video,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Flame,
  Layers,
  Info
} from 'lucide-react';

interface MyBookingsViewProps {
  user?: User;
  bookings: Booking[];
  enquiries?: Enquiry[];
  classSchedules?: ClassSchedule[];
  onBookingsUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  user,
  bookings,
  enquiries = [],
  classSchedules = [],
  onBookingsUpdated,
  onShowToast
}) => {
  const [paidBookings, setPaidBookings] = useState<PaidPackageBooking[]>([]);
  const [isLoadingPaid, setIsLoadingPaid] = useState<boolean>(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const loadPaidBookings = useCallback(async () => {
    if (!user?.email) return;
    setIsLoadingPaid(true);
    try {
      const data = await VelocityAPI.fetchPaidBookings({ email: user.email });
      setPaidBookings(data);
    } catch (err: any) {
      console.warn('Failed to load user paid bookings:', err?.message);
    } finally {
      setIsLoadingPaid(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadPaidBookings();
    const handleUpdate = () => loadPaidBookings();
    window.addEventListener('bxstrength_paid_bookings_updated', handleUpdate);
    return () => window.removeEventListener('bxstrength_paid_bookings_updated', handleUpdate);
  }, [loadPaidBookings]);

  const handleCancel = (id: string, code: string) => {
    try {
      VelocityAPI.cancelBooking(id);
      onShowToast(`Booking ${code} successfully cancelled.`);
      onBookingsUpdated();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to cancel booking');
    }
  };

  // Filter out any free consultation enquiries so this view remains strictly for paid sessions & assessments
  const assessmentEnquiries = enquiries.filter(e => 
    !e.subject?.toLowerCase().includes('consultation') && 
    !e.message?.toLowerCase().includes('[free consultation booked]')
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#CCFF00]" />
            MY BOOKED PACKAGES & TRAINING SESSIONS
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Track your active training packages, session progress, live meeting links, and scheduled classes.
          </p>
        </div>

        {paidBookings.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-black/60 border border-[#CCFF00]/30 px-3 py-1.5 rounded-lg">
            <Sparkles className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-xs font-mono font-bold text-white">
              {paidBookings.length} {paidBookings.length === 1 ? 'PACKAGE' : 'PACKAGES'} ACTIVE
            </span>
          </div>
        )}
      </div>

      {/* SECTION 1: ACTIVE PAID TRAINING PACKAGES & SESSIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-[#CCFF00]" />
            PURCHASED TRAINING PACKAGES & 1-ON-1 SESSIONS ({paidBookings.length})
          </h3>
          <span className="text-[11px] font-mono text-gray-400">
            Train Your Way • Personalised Support • Commit & Save
          </span>
        </div>

        {isLoadingPaid && paidBookings.length === 0 ? (
          <div className="bg-[#111111] border border-gray-800 p-8 text-center text-xs text-gray-400">
            <Clock className="w-6 h-6 text-[#CCFF00] animate-spin mx-auto mb-2" />
            <p>Loading your active training packages...</p>
          </div>
        ) : paidBookings.length === 0 ? (
          <div className="bg-[#111111] border border-dashed border-gray-800 p-8 text-center rounded-xl space-y-3">
            <Award className="w-10 h-10 text-gray-600 mx-auto" />
            <div>
              <p className="text-sm font-bold text-white">No Active Paid Packages Yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Select from our Train Your Way, Personalised Support, or Commit & Save plans to get 1-on-1 coaching, custom focus modules, and personalized schedules.
              </p>
            </div>
            <a
              href="/#train-your-way"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black uppercase tracking-wider rounded-lg transition-all"
            >
              <Flame className="w-3.5 h-3.5" /> Explore Training Packages
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {paidBookings.map((pkg) => {
              const totalSessions = pkg.totalSessions || 1;
              const completedSessions = pkg.completedSessions || 0;
              const remainingSessions = Math.max(0, totalSessions - completedSessions);
              const progressPercent = Math.min(100, Math.round((completedSessions / totalSessions) * 100));
              const isExpanded = expandedBookingId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className="bg-[#111111] border border-gray-800 hover:border-[#CCFF00]/40 transition-all rounded-xl p-5 sm:p-6 space-y-5 relative overflow-hidden shadow-lg"
                >
                  {/* Neon Accent Stripe */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#CCFF00] via-[#99CC00] to-transparent" />

                  {/* Top Bar: Title, Type & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30">
                          {pkg.packageType}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          REF: {pkg.id}
                        </span>
                        {pkg.createdAt && (
                          <span className="text-[10px] text-gray-500">
                            • Booked on {new Date(pkg.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xl font-black uppercase text-white mt-1.5 tracking-tight flex items-center gap-2">
                        {pkg.packageName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                          pkg.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : pkg.status === 'Scheduled'
                            ? 'bg-sky-950 text-sky-400 border-sky-800'
                            : 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/40'
                        }`}
                      >
                        {pkg.status}
                      </span>
                    </div>
                  </div>

                  {/* Session Progress Bar */}
                  <div className="bg-black/40 border border-gray-800/80 p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#CCFF00]" />
                        Session Progress
                      </span>
                      <span className="font-mono font-bold text-white">
                        {completedSessions} / {totalSessions} Completed ({remainingSessions} remaining)
                      </span>
                    </div>

                    <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#CCFF00] to-emerald-400 h-full transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Coach & Live Meeting Desk */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Coach Desk */}
                    <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-lg flex flex-col justify-between space-y-2">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                        Assigned Coach
                      </div>
                      {pkg.assignedCoachName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#CCFF00]/20 border border-[#CCFF00]/40 flex items-center justify-center text-[#CCFF00] font-black text-xs">
                            {pkg.assignedCoachName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">{pkg.assignedCoachName}</p>
                            <p className="text-[10px] text-[#CCFF00] font-semibold">Specialist Coach</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-amber-300">
                          <Info className="w-4 h-4 shrink-0" />
                          <span>Coach assignment in progress. Head Coach is reviewing your selections.</span>
                        </div>
                      )}
                      {pkg.coachNotes && (
                        <p className="text-[11px] text-zinc-300 bg-black/40 p-2 rounded border border-zinc-800/80 mt-1 italic">
                          "{pkg.coachNotes}"
                        </p>
                      )}
                    </div>

                    {/* Live Video Meeting Link */}
                    <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-lg flex flex-col justify-between space-y-2">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center justify-between">
                        <span>Live Session Meeting Link</span>
                        <Video className="w-3.5 h-3.5 text-[#CCFF00]" />
                      </div>

                      {pkg.meetingLink ? (
                        <div className="space-y-2">
                          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Meeting link ready
                          </p>
                          <a
                            href={pkg.meetingLink.startsWith('http') ? pkg.meetingLink : `https://${pkg.meetingLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.2)] transition-all cursor-pointer"
                          >
                            <Video className="w-4 h-4" />
                            JOIN LIVE COACHING SESSION
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 flex items-center gap-2 py-2">
                          <Clock className="w-4 h-4 text-gray-500 shrink-0" />
                          <span>Meeting link will appear here once scheduled by your coach.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customized Focus List & Details */}
                  {pkg.sessionFocusList && pkg.sessionFocusList.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-800/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Customized Focus / Modules Selected:
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedBookingId(isExpanded ? null : pkg.id)}
                          className="text-[11px] font-bold text-[#CCFF00] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? 'Hide Details' : 'View Full Customization Breakdown'}
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {pkg.sessionFocusList.map((focus, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700 px-2.5 py-1 rounded-md"
                          >
                            {focus}
                          </span>
                        ))}
                      </div>

                      {/* Expanded Details Breakdown */}
                      {isExpanded && pkg.customizedDetails && (
                        <div className="bg-black/60 border border-zinc-800 p-3.5 rounded-lg text-xs space-y-2 mt-2">
                          <p className="font-bold text-white uppercase text-[11px]">Plan Structure & Custom Elements:</p>
                          <pre className="text-[11px] text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(pkg.customizedDetails, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Stats: Total Paid, Duration, Validity */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 pt-3 border-t border-gray-800/80">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span>Duration: <strong className="text-white">{pkg.durationMinutes} Mins / Session</strong></span>
                      <span>Total Paid: <strong className="text-[#CCFF00]">£{pkg.totalPrice}</strong></span>
                      <span>Validity: <strong className="text-white">{pkg.validityDays} Days</strong></span>
                    </div>

                    <div className="text-[11px] text-gray-500 font-mono">
                      {pkg.currency || 'GBP'} • Secured Checkout
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: APPROVED CLASS SCHEDULES & TIMETABLE */}
      {classSchedules.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-800">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-gray-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            LIVE & APPROVED CLASS SCHEDULES ({classSchedules.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classSchedules.map((cls) => (
              <div
                key={cls.id}
                className="bg-[#111111] border border-emerald-900/60 p-6 flex flex-col justify-between transition-all hover:border-emerald-500/60 rounded"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 border border-amber-800 uppercase">
                      {cls.category}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-500 text-black rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Live & Approved
                    </span>
                  </div>

                  <h3 className="text-lg font-black uppercase text-white mb-1">{cls.title}</h3>
                  <p className="text-xs text-gray-300 flex items-center gap-1.5 mb-2 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-[#E52165]" />
                    <span>{cls.dayOfWeek} {cls.startTime} - {cls.endTime}</span>
                  </p>
                  
                  <div className="space-y-1.5 text-xs text-gray-400 border-t border-gray-800/80 pt-2.5 mt-2">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      <span>Assigned Coach / Trainer: <strong className="text-amber-300">{cls.trainerName}</strong></span>
                    </p>
                    {cls.instructions && (
                      <p className="text-[11px] text-zinc-300 bg-zinc-950 p-2 border border-zinc-800 rounded mt-1">
                        <strong className="text-amber-400 block text-[10px] uppercase">Instructions:</strong>
                        {cls.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: CONFIRMED CLASS SESSIONS */}
      <div className="space-y-4 pt-4 border-t border-gray-800">
        <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-gray-800 pb-2">
          <Clock className="w-4 h-4 text-[#E52165]" />
          CONFIRMED CLASS SESSIONS ({bookings.length})
        </h3>

        {bookings.length === 0 ? (
          <div className="bg-[#111111] border border-gray-800 p-8 text-center text-xs text-gray-400">
            <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>No group class bookings found under your account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className={`bg-[#111111] border p-6 flex flex-col justify-between transition-all ${
                  b.status === 'Confirmed'
                    ? 'border-gray-800 hover:border-[#E52165]/60'
                    : 'border-red-950/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 border border-emerald-800">
                      CODE: {b.bookingCode}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 ${
                        b.status === 'Confirmed'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-black uppercase text-white mb-1">{b.className}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#E52165]" />
                    <span>Date: {b.date} • Time: {b.timeSlot}</span>
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>Trainer: <strong className="text-gray-200">{b.trainerName}</strong></span>
                  </p>
                </div>

                {b.status === 'Confirmed' && (
                  <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end">
                    <button
                      onClick={() => handleCancel(b.id, b.bookingCode)}
                      className="text-xs font-bold text-red-400 hover:text-red-300 uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: CLIENT SUBMITTED ASSESSMENTS & FORM RECORDS */}
      <div className="space-y-4 pt-4 border-t border-gray-800">
        <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-gray-800 pb-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          MY SUBMITTED ASSESSMENTS & FORM RECORDS ({assessmentEnquiries.length})
        </h3>

        {assessmentEnquiries.length === 0 ? (
          <div className="bg-[#111111] border border-gray-800 p-8 text-center text-xs text-gray-400">
            <Send className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>No submitted assessments or form records found under your email.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assessmentEnquiries.map((enq) => (
              <div key={enq.id} className="bg-[#111111] border border-gray-800 p-5 rounded-none space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-800/60">
                      REF: {enq.id}
                    </span>
                    <span className="text-xs font-black uppercase text-white tracking-wider">
                      {enq.subject}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(enq.createdAt).toLocaleDateString()} {new Date(enq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                      enq.status === 'resolved'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : enq.status === 'in_progress'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}>
                      {enq.status ? enq.status.replace('_', ' ') : 'SUBMITTED TO COACH'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900/90 p-4 border border-gray-800 text-xs text-gray-300 font-sans whitespace-pre-line leading-relaxed">
                  {enq.message}
                </div>

                <div className="text-[10px] text-gray-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Received by BxStrength Coaching Team</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
