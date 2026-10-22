import React from 'react';
import { User, BodyStat, Booking, WorkoutProgram, NutritionPlan, Announcement, Enquiry } from '../../types';
import { Scale, Activity, Calendar, Dumbbell, Award, ShieldAlert, CheckCircle2, ChevronRight, Zap, Mail } from 'lucide-react';

interface DashboardOverviewProps {
  user: User;
  latestStat?: BodyStat;
  nextBooking?: Booking;
  activeProgram?: WorkoutProgram;
  nutritionPlan?: NutritionPlan;
  announcements: Announcement[];
  enquiries?: Enquiry[];
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
  onNavigateTab
}) => {
  const [activeJourney, setActiveJourney] = React.useState<any>(null);

  React.useEffect(() => {
    if (!user?.email) return;
    const getApiUrl = (path: string) => {
      const baseUrl = (import.meta as any).env?.VITE_API_URL || '';
      return `${baseUrl}${path}`;
    };

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
