import { decodeHtmlEntities } from '../../services/core/mappers';
import React from 'react';
import { User, BodyStat, Booking, WorkoutProgram, NutritionPlan, Announcement, Enquiry, ConsultationBooking } from '../../types';
import { Scale, Activity, Calendar, Dumbbell, Award, ShieldAlert, CheckCircle2, ChevronRight, Zap, Mail, Video, Sparkles, Clock, ExternalLink } from 'lucide-react';
import { getApiUrl } from '../../services/core/http';

interface DashboardOverviewProps {
  user: User;
  latestStat?: BodyStat;
  nextBooking?: Booking;
  activeProgram?: WorkoutProgram;
  nutritionPlan?: NutritionPlan;
  announcements: Announcement[];
  enquiries?: Enquiry[];
  consultations?: ConsultationBooking[];
  onOpenBooking?: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  latestStat,
  nextBooking,
  activeProgram,
  nutritionPlan,
  announcements,
  enquiries = [],
  consultations = [],
  onOpenBooking,
  onNavigateTab
}) => {
  const [activeJourney, setActiveJourney] = React.useState<any>(null);
  const [latestPaidPackage, setLatestPaidPackage] = React.useState<any>(null);

  React.useEffect(() => {
    if (!user?.email) return;
    const fetchPaid = () => {
      fetch(getApiUrl(`/api/paid-bookings?email=${encodeURIComponent(user.email)}`))
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setLatestPaidPackage(data[0]);
          }
        })
        .catch(() => {});
    };
    fetchPaid();
    const handleUpdate = () => fetchPaid();
    window.addEventListener('bxstrength_paid_bookings_updated', handleUpdate);
    return () => window.removeEventListener('bxstrength_paid_bookings_updated', handleUpdate);
  }, [user?.email]);

  React.useEffect(() => {
    if (!user?.email) return;

    const fetchJourney = () => {
      fetch(getApiUrl(`/api/journey/latest-by-email/${encodeURIComponent(user.email)}`))
        .then(res => res.json())
        .then(data => {
          if (data.success && data.record) {
            setActiveJourney(data.record);
          }
        })
        .catch(() => {});
    };

    fetchJourney();
    
    const interval = setInterval(() => { if (!document.hidden) fetchJourney(); }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user?.email]);

  // Active / Completed Free Demo Consultation state
  const activeConsultation = consultations.find(c => c.status !== 'Cancelled');
  const isConsultationCompleted = activeConsultation?.status === 'Completed';
  const isConsultationInProgress = Boolean(activeConsultation && ['Pending', 'Assigned', 'Confirmed'].includes(activeConsultation.status));
  const hasNoConsultation = !activeConsultation;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-gray-900 via-[#111111] to-black border border-gray-800 p-6 sm:p-8 rounded-none overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 bg-[radial-gradient(#E52165_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                alt={user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#E52165] p-0.5 shadow-xl"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-gray-900 rounded-full" title="Online & Verified"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                {user.isVerified && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Profile Verified
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
                WELCOME BACK, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-xs text-gray-400 max-w-lg mt-0.5">
                {user.fitnessGoals ? `Goal: "${user.fitnessGoals}"` : 'Track your body transformation, workouts, and nutrition progress in real-time.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('stats')}
              className="bg-[#E52165] hover:bg-[#c41551] text-white text-xs font-black tracking-widest px-5 py-3 uppercase transition-all shadow-md shadow-pink-500/20 flex items-center gap-2"
            >
              <Scale className="w-4 h-4" />
              <span>ADD BODY WEIGHT</span>
            </button>
            <button
              onClick={() => onNavigateTab('workouts')}
              className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-black tracking-widest px-5 py-3 uppercase transition-all border border-gray-700 flex items-center gap-2"
            >
              <Dumbbell className="w-4 h-4 text-pink-400" />
              <span>VIEW WORKOUTS</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE PURCHASED TRAINING PACKAGE BANNER */}
      {latestPaidPackage && (
        <div className="bg-gradient-to-r from-lime-500/10 via-[#141814] to-zinc-950 border-2 border-[#CCFF00]/50 p-5 sm:p-6 rounded-xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-full bg-gradient-to-l from-[#CCFF00]/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/20 border border-[#CCFF00]/40 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-[#CCFF00]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/40">
                    ACTIVE {latestPaidPackage.packageType} PACKAGE
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">REF: {latestPaidPackage.id}</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white mt-1">
                  {decodeHtmlEntities(latestPaidPackage.packageName)}
                </h3>
                <p className="text-xs text-zinc-300 mt-1">
                  Session Delivery: <strong className="text-white">{latestPaidPackage.completedSessions || 0} / {latestPaidPackage.totalSessions || 1} Sessions</strong>
                  {latestPaidPackage.assignedCoachName && (
                    <span> • Coach: <strong className="text-[#CCFF00]">{latestPaidPackage.assignedCoachName}</strong></span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {latestPaidPackage.meetingLink && (
                <a
                  href={latestPaidPackage.meetingLink.startsWith('http') ? latestPaidPackage.meetingLink : `https://${latestPaidPackage.meetingLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase px-4 py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Video className="w-4 h-4" /> Join Live Session
                </a>
              )}
              <button
                onClick={() => onNavigateTab('bookings')}
                className="bg-black/60 hover:bg-zinc-800 text-white border border-[#CCFF00]/40 font-black text-xs uppercase px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>View in My Bookings</span>
                <ChevronRight className="w-4 h-4 text-[#CCFF00]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15-MIN COMPLIMENTARY STRATEGY SESSION / FREE DEMO BANNER */}
      {hasNoConsultation && (
        <div className="bg-gradient-to-r from-amber-500/10 via-[#141417] to-zinc-950 border-2 border-amber-500/40 p-5 sm:p-6 rounded-xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black px-2.5 py-0.5 rounded-full font-mono">
                    COMPLIMENTARY ATHLETE BENEFIT
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 tracking-wide uppercase">
                    100% Free • 1-on-1 Strategy Call
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase mt-1 tracking-tight">
                  Claim Your 1-on-1 Free Demo &amp; Strategy Session
                </h3>
                <p className="text-xs text-zinc-300 max-w-xl mt-1 leading-relaxed">
                  As a registered BxStrength athlete, you are eligible for one complimentary 15-minute consultation directly overseen by our Head Coach. Discuss your athletic goals and receive a custom training roadmap.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center">
              <button
                onClick={onOpenBooking}
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-6 py-3.5 rounded-xl transition-all shadow-xl shadow-amber-500/20 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Claim Free Demo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isConsultationInProgress && activeConsultation && (
        <div className="bg-[#121215] border border-zinc-700 p-5 sm:p-6 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                activeConsultation.status === 'Confirmed' 
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
                  : activeConsultation.status === 'Assigned'
                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              }`}>
                {activeConsultation.status === 'Confirmed' ? (
                  <Video className="w-6 h-6 animate-pulse" />
                ) : (
                  <Clock className="w-6 h-6 animate-pulse" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                    REF: {activeConsultation.id}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    activeConsultation.status === 'Confirmed'
                      ? 'bg-emerald-500 text-black'
                      : activeConsultation.status === 'Assigned'
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-500 text-black'
                  }`}>
                    {activeConsultation.status === 'Confirmed'
                      ? '● SESSION CONFIRMED'
                      : activeConsultation.status === 'Assigned'
                      ? '● COACH ASSIGNED'
                      : '● PENDING HEAD COACH REVIEW'}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    15-Min Free Demo
                  </span>
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  {activeConsultation.status === 'Confirmed'
                    ? `Your Free Strategy Call is Ready with Coach ${activeConsultation.assignedCoachName || 'Assigned Coach'}`
                    : activeConsultation.status === 'Assigned'
                    ? `Dedicated Coach Assigned: ${activeConsultation.assignedCoachName || 'Assigned Coach'}`
                    : 'Complimentary Free Demo Session Under Review'}
                </h3>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                  {activeConsultation.status === 'Confirmed'
                    ? activeConsultation.meetingLink
                      ? 'Your video meeting link has been prepared. Click below to join your live 1-on-1 session at your scheduled time.'
                      : 'Your coaching session is confirmed. Your coach will upload the video meeting link shortly.'
                    : activeConsultation.status === 'Assigned'
                    ? `Head Coach has assigned your free demo to Specialist Coach ${activeConsultation.assignedCoachName || 'Assigned Coach'}. The coach will generate and share your session link shortly.`
                    : 'Your request has been delivered to the Head Coach. Our coaching team will assign your specialist coach and reach out shortly.'}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-3">
              {activeConsultation.status === 'Confirmed' && activeConsultation.meetingLink && (
                <a
                  href={activeConsultation.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Video Call</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => onNavigateTab('free-demo')}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase px-4 py-3 rounded-xl transition-all border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Demo Status</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isConsultationCompleted && activeConsultation && (
        <div className="bg-[#121215] border border-emerald-900/50 p-5 rounded-xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                    FREE DEMO COMPLETED
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-500">REF: {activeConsultation.id}</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">• ALREADY CLAIMED (1 PER ATHLETE)</span>
                </div>
                <h3 className="text-sm font-black text-white uppercase mt-1">
                  Complimentary 15-Min Strategy Session Completed
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
                  You have already claimed and completed your 1-on-1 complimentary 15-minute strategy demo session. Ready to begin your full athletic transformation?
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('subscription')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase px-4 py-2.5 rounded-lg border border-zinc-700 shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Explore Training Plans</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE TRAINING JOURNEY BANNER (STEP 4 / STEP 5 PERSISTENT DASHBOARD STATE) */}
      {activeJourney && activeJourney.journeyState === 'SCHEDULING_PENDING' && (
        <div className="bg-[#121214] border border-amber-500/40 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Calendar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                  STEP 4: WE'LL CONTACT YOU TO SCHEDULE
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400">REF: {activeJourney.id}</span>
              </div>
              <h3 className="text-sm font-black text-white uppercase mt-1">Coach Alignment &amp; Schedule Assignment Pending</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Your payment for <strong className="text-white">{activeJourney.serviceTitle}</strong> (£{activeJourney.amountGbp} GBP) is confirmed. Our Head Coaching team will contact you to confirm your schedule.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('bookings')}
            className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase px-4 py-2.5 rounded-lg shrink-0 transition-all cursor-pointer"
          >
            Check Schedule Status
          </button>
        </div>
      )}

      {activeJourney && activeJourney.journeyState === 'BOOKING_CONFIRMED' && (
        <div className="bg-[#121214] border border-[#CCFF00]/40 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#CCFF00] text-black font-extrabold px-2 py-0.5 rounded">
                  STEP 5: TRAINING SCHEDULE CONFIRMED
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400">REF: {activeJourney.id}</span>
              </div>
              <h3 className="text-sm font-black text-white uppercase mt-1">
                {activeJourney.serviceTitle} — {activeJourney.coachName || 'Coach Jordan Ellis'}
              </h3>
              <p className="text-xs text-zinc-300 mt-0.5">
                Confirmed Session: <strong className="text-white">{activeJourney.scheduledDate}</strong> at <strong className="text-[#CCFF00]">{activeJourney.scheduledTime}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={activeJourney.joinUrl || `https://bxstrength.com/join/${activeJourney.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase px-4 py-2.5 rounded-lg transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Join Live Room</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Current Weight */}
        <div className="bg-[#111111] border border-gray-800 p-5 relative overflow-hidden group hover:border-[#E52165]/50 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Current Weight</span>
            <Scale className="w-5 h-5 text-[#E52165]" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {latestStat ? `${latestStat.weightKg} kg` : '0 kg'}
          </div>
        </div>

        {/* Card 2: BMI Category */}
        <div className="bg-[#111111] border border-gray-800 p-5 relative overflow-hidden group hover:border-[#E52165]/50 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Calculated BMI</span>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {latestStat ? latestStat.bmi : '0'}
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Next Class & Active Workout Program */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Class Booking Widget */}
          <div className="bg-[#111111] border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E52165]" />
                UPCOMING CLASS SESSION
              </h3>
            </div>

            {nextBooking ? (
              <div className="bg-gray-900/90 border border-gray-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#E52165]">
                    CONFIRMED CLASS BOOKING
                  </span>
                  <h4 className="text-lg font-bold text-white uppercase">{nextBooking.className}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Coach: <span className="text-gray-200">{nextBooking.trainerName}</span> • Date: <span className="text-gray-200">{nextBooking.date}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Time: <span className="text-[#E52165] font-bold">{nextBooking.timeSlot}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-black px-3 py-2 border border-gray-800 text-center">
                    <span className="block text-[9px] uppercase font-bold text-gray-400">BOOKING CODE</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{nextBooking.bookingCode}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-900/40 border border-dashed border-gray-800">
                <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xl text-gray-400 mb-3">No upcoming class sessions booked yet.</p>
              </div>
            )}
          </div>

          {/* Active Workout Program Widget */}
          <div className="bg-[#111111] border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#E52165]" />
                TRAINING PROGRAM
              </h3>
            </div>

            {activeProgram ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white uppercase">{activeProgram.title}</h4>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-800 text-pink-400 border border-gray-700">
                    {activeProgram.level} • {activeProgram.durationWeeks} WEEKS
                  </span>
                </div>
                <p className="text-xs text-gray-400">{activeProgram.description}</p>

                <div className="bg-gray-900 p-4 border border-gray-800 space-y-2.5">
                  <div className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Today's Exercises:
                  </div>
                  {activeProgram.exercises.slice(0, 3).map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/80 last:border-none">
                      <span className="text-white font-medium flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${ex.isCompleted ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
                        {ex.name}
                      </span>
                      <span className="text-gray-400 font-mono">
                        {ex.sets} sets × {ex.reps} ({ex.targetMuscle})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-400">
                No active custom workout routine assigned yet. Ask your coach or create one in the workouts tab.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Announcements & Achievements */}
        <div className="space-y-6">
          {/* Gym Announcements */}
          <div className="bg-[#111111] border border-gray-800 p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-3">
              ANNOUNCEMENTS
            </h3>

            <div className="space-y-3">
              {announcements.length > 0 ? (
                announcements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className="bg-gray-900/80 border border-gray-800 p-3.5 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#CCFF00] bg-zinc-950 px-2 py-0.5 border border-zinc-800 rounded">
                        {ann.priority} priority
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">{ann.title}</h4>
                    <p className="text-[11px] text-gray-400 leading-snug">{ann.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 px-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-1.5">
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">No Active Announcements</p>
                </div>
              )}
            </div>
          </div>

          {/* My Inquiries & Live Support Ticket Status */}
          {enquiries.length > 0 && (
            <div className="bg-[#111111] border border-gray-800 p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2 border-b border-gray-800 pb-3">
                <Mail className="w-4 h-4 text-emerald-400" />
                MY INQUIRIES & SUPPORT TICKETS
              </h3>

              <div className="space-y-2.5">
                {enquiries.slice(0, 3).map((enq) => (
                  <div key={enq.id} className="bg-gray-900 border border-gray-800 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase text-[11px] truncate max-w-[150px]">{enq.subject}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 border ${
                        enq.status === 'resolved'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : enq.status === 'in_progress'
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-pink-950 text-pink-400 border-pink-800'
                      }`}>
                        {enq.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-400 text-[10px] line-clamp-1">{enq.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
