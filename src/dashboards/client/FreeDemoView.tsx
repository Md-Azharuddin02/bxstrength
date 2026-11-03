import React from 'react';
import { User, ConsultationBooking } from '../../types';
import { Sparkles, Video, Clock, CheckCircle2, ShieldCheck, ChevronRight, ExternalLink, User as UserIcon, Calendar, Info, AlertCircle } from 'lucide-react';

interface FreeDemoViewProps {
  user: User;
  consultation?: ConsultationBooking | null;
  onOpenBooking?: () => void;
  onNavigateTab: (tab: string) => void;
}

export const FreeDemoView: React.FC<FreeDemoViewProps> = ({
  user,
  consultation,
  onOpenBooking,
  onNavigateTab
}) => {
  const isUnclaimed = !consultation || consultation.status === 'Cancelled';
  const isPending = consultation?.status === 'Pending';
  const isAssigned = consultation?.status === 'Assigned';
  const isConfirmed = consultation?.status === 'Confirmed';
  const isCompleted = consultation?.status === 'Completed';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#111114] border border-gray-800 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 border border-amber-800/80 rounded uppercase">
              SEPARATE PIPELINE • 1 PER ATHLETE
            </span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">
              100% Free Consultation
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            1-ON-1 FREE DEMO & STRATEGY SESSION
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Every registered athlete is entitled to strictly ONE complimentary 15-minute strategy demo session directly overseen by our Head Coaching team.
          </p>
        </div>

        {isUnclaimed && (
          <button
            onClick={onOpenBooking}
            className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-6 py-3 rounded-xl transition-all shadow-xl shadow-amber-500/20 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>Claim Free Demo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* STATE 1: UNCLAIMED (Athlete hasn't booked free demo yet) */}
      {isUnclaimed && (
        <div className="bg-gradient-to-r from-amber-500/10 via-[#141417] to-zinc-950 border-2 border-amber-500/40 p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-xl">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 font-mono">
                  COMPLIMENTARY WELCOME BENEFIT
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  You Haven't Claimed Your Free 15-Min Strategy Session Yet!
                </h3>
                <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
                  Kickstart your transformation with a direct 1-on-1 video call. Our Head Coaching team will evaluate your athletic background, discuss injury management, and tailor a personalized fitness strategy for your goals.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenBooking}
              className="bg-amber-400 hover:bg-amber-300 text-black font-black text-sm uppercase px-8 py-4 rounded-xl transition-all shadow-xl shadow-amber-500/25 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-5 h-5 fill-black" />
              <span>Claim Free 15-Min Session Now</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <span className="text-amber-400 font-black text-xs uppercase block mb-1">1. Direct Head Coach Review</span>
              <p className="text-[11px] text-zinc-400">All intake forms go directly to our Head Coach for specialist coach allocation.</p>
            </div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <span className="text-amber-400 font-black text-xs uppercase block mb-1">2. 1-on-1 Live Video Call</span>
              <p className="text-[11px] text-zinc-400">Conduct your consultation via Google Meet or Zoom from anywhere in the world.</p>
            </div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <span className="text-amber-400 font-black text-xs uppercase block mb-1">3. Zero Obligation</span>
              <p className="text-[11px] text-zinc-400">100% free with no credit card or purchase requirement.</p>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2, 3, 4: IN PROGRESS (Pending, Assigned, Confirmed) */}
      {!isUnclaimed && !isCompleted && consultation && (
        <div className="space-y-6">
          <div className={`p-6 sm:p-8 rounded-2xl border shadow-2xl relative overflow-hidden transition-all ${
            isConfirmed
              ? 'bg-[#121215] border-emerald-500/60 shadow-emerald-950/20'
              : isAssigned
              ? 'bg-[#121215] border-blue-500/60'
              : 'bg-[#121215] border-amber-500/60'
          }`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${
                  isConfirmed
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : isAssigned
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                }`}>
                  {isConfirmed ? (
                    <Video className="w-7 h-7 animate-pulse" />
                  ) : (
                    <Clock className="w-7 h-7 animate-pulse" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 border border-amber-800/80 rounded">
                      REF: {consultation.id}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full ${
                      isConfirmed
                        ? 'bg-emerald-500 text-black'
                        : isAssigned
                        ? 'bg-blue-600 text-white'
                        : 'bg-amber-500 text-black'
                    }`}>
                      {isConfirmed
                        ? '● SESSION CONFIRMED'
                        : isAssigned
                        ? '● COACH ASSIGNED'
                        : '● PENDING HEAD COACH REVIEW'}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      15-Min Free Consultation
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {isConfirmed
                      ? `Strategy Call Scheduled with Coach ${consultation.assignedCoachName || 'Assigned Coach'}`
                      : isAssigned
                      ? `Dedicated Coach Assigned: ${consultation.assignedCoachName || 'Assigned Coach'}`
                      : 'Free Demo Request Under Review by Head Coach'}
                  </h3>

                  <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                    {isConfirmed
                      ? consultation.meetingLink
                        ? 'Your video meeting link is ready! Click the button below to join the call at the scheduled time.'
                        : 'Your session has been approved. Your coach will share the video meeting link shortly.'
                      : isAssigned
                      ? `Head Coach has assigned your free demo to Coach ${consultation.assignedCoachName || 'Assigned Coach'}. The coach will generate and share your session link shortly.`
                      : 'Your free demo request has been received by our Head Coach. We are aligning a specialist coach to your requirements.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                    <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Assigned Coach</span>
                      <p className="text-white font-bold">{consultation.assignedCoachName || 'Pending Head Coach Allocation'}</p>
                    </div>
                    <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Service Goal</span>
                      <p className="text-white font-bold">{consultation.goal || 'Fitness Boxing'}</p>
                    </div>
                  </div>

                  {consultation.notes && (
                    <div className="bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-800 text-xs text-zinc-300">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Your Intake Notes:</span>
                      {consultation.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 shrink-0 sm:min-w-[200px]">
                {isConfirmed && consultation.meetingLink && (
                  <a
                    href={consultation.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase px-6 py-3.5 rounded-xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Video Call</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 5: COMPLETED (Session finished, 1-demo limit enforced) */}
      {isCompleted && consultation && (
        <div className="bg-[#121215] border border-emerald-900/60 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded">
                    DEMO SESSION COMPLETED
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-500">REF: {consultation.id}</span>
                  <span className="text-[10px] font-bold text-amber-400 uppercase">• 1 PER ATHLETE BENEFIT CLAIMED</span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1">
                  Complimentary 15-Min Strategy Session Completed
                </h3>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                  You have successfully claimed and completed your 1-time complimentary 15-minute strategy demo session. As per BxStrength protocol, each athlete is eligible for strictly 1 free demo.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('subscription')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase px-6 py-3.5 rounded-xl border border-zinc-700 shrink-0 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Explore Training Packages</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 flex items-center gap-3 text-xs text-zinc-400">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Ready to accelerate your physical transformation? Explore our core personal training packages, gym memberships, and custom nutrition programs.</span>
          </div>
        </div>
      )}
    </div>
  );
};
