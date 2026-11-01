import React from 'react';
import { User, AthleteAssessment } from '../../types';
import {
  ClipboardCheck, CheckCircle2, Clock, ShieldCheck, User as UserIcon,
  ChevronRight, AlertCircle, HeartPulse, Sparkles, Activity, FileText
} from 'lucide-react';

interface MyAssessmentsViewProps {
  user: User;
  assessments: AthleteAssessment[];
  onOpenAssessment?: () => void;
  onNavigateTab: (tab: string) => void;
}

export const MyAssessmentsView: React.FC<MyAssessmentsViewProps> = ({
  user,
  assessments,
  onOpenAssessment,
  onNavigateTab
}) => {
  const latestAssessment = assessments[0];
  const hasAssessment = Boolean(latestAssessment);

  const isPending = latestAssessment?.status === 'Pending';
  const isAssigned = latestAssessment?.status === 'Assigned';
  const isReviewed = latestAssessment?.status === 'Reviewed' || latestAssessment?.status === 'Completed';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#111114] border border-gray-800 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-[#CCFF00] bg-[#CCFF00]/10 px-2 py-0.5 border border-[#CCFF00]/30 rounded uppercase">
              ATHLETIC DIAGNOSTIC PROFILE
            </span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">
              100% Free Assessment
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#CCFF00]" />
            MY ATHLETIC SELF-ASSESSMENT
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Your comprehensive 5-min movement diagnostic, training history, and personalized coaching recommendations directly reviewed by our coaching staff.
          </p>
        </div>

        {!hasAssessment && (
          <button
            onClick={onOpenAssessment}
            className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase px-6 py-3 rounded-xl transition-all shadow-xl shadow-[#CCFF00]/20 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>Start Free Assessment</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* STATE 1: NO ASSESSMENT YET */}
      {!hasAssessment && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-[#141417] to-zinc-950 border-2 border-emerald-500/40 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-xl">
                <Activity className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#CCFF00] font-mono">
                  DIAGNOSTIC ONBOARDING
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  You Haven't Submitted Your Athletic Assessment Yet!
                </h3>
                <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
                  Take 5 minutes to complete our diagnostic fitness assessment. Share your current training level, fat loss / strength goals, schedule constraints, and injury history so our Head Coach can build your tailored training roadmap.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenAssessment}
              className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-sm uppercase px-8 py-4 rounded-xl transition-all shadow-xl shadow-[#CCFF00]/25 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-5 h-5 fill-black" />
              <span>Start 5-Min Diagnostic Now</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <span className="text-[#CCFF00] font-black text-xs uppercase block mb-1">1. Movement &amp; Goal Audit</span>
              <p className="text-[11px] text-zinc-400">Specify your targets: fat loss, boxing technique, mobility, or progressive strength.</p>
            </div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <span className="text-[#CCFF00] font-black text-xs uppercase block mb-1">2. Injury Flagging</span>
              <p className="text-[11px] text-zinc-400">Ensure all workouts are safe and customized around joint or past medical history.</p>
            </div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <span className="text-[#CCFF00] font-black text-xs uppercase block mb-1">3. Direct Consultation</span>
              <p className="text-[11px] text-zinc-400">Our coaching and support team directly reviews your goals and reaches out via your preferred contact method.</p>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: ASSESSMENT SUBMITTED & IN RECORD */}
      {hasAssessment && latestAssessment && (
        <div className="space-y-6">
          <div className={`p-6 sm:p-8 rounded-2xl border shadow-2xl relative overflow-hidden transition-all ${
            isReviewed
              ? 'bg-[#121215] border-emerald-500/60 shadow-emerald-950/20'
              : isAssigned
              ? 'bg-[#121215] border-blue-500/60'
              : 'bg-[#121215] border-amber-500/60'
          }`}>
            <div className="space-y-5">
              {/* Header Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 border border-amber-800/80 rounded">
                    REF: {latestAssessment.id}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-3 py-0.5 rounded-full ${
                    isReviewed
                      ? 'bg-emerald-500 text-black'
                      : isAssigned
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-500 text-black'
                  }`}>
                    {isReviewed ? '✓ REVIEWED & CONTACTED' : '● PENDING COACH REVIEW'}
                  </span>
                </div>

                <span className="text-xs text-zinc-400 font-mono">
                  Submitted: {new Date(latestAssessment.createdAt).toLocaleDateString()} {new Date(latestAssessment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Status Explanation Card */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                {isReviewed ? (
                  <p className="text-emerald-300">
                    Your diagnostic profile has been reviewed by our coaching staff! We have reached out to you via your preferred contact method.
                  </p>
                ) : (
                  <p>
                    Your self-assessment has been received by our coaching team. We are currently analyzing your movement goals and will reach out to you directly via your preferred contact method ({latestAssessment.preferredContactMethod || 'Call'}).
                  </p>
                )}
              </div>

              {/* COACH FEEDBACK & RECOMMENDATIONS (IF AVAILABLE) */}
              {(latestAssessment.recommendedPlan || latestAssessment.coachFeedback) && (
                <div className="bg-emerald-950/20 border-2 border-emerald-500/50 p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      COACHING RECOMMENDATIONS &amp; PROTOCOL
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      Coach: {latestAssessment.assignedCoachName || 'BxStrength Coaching Team'}
                    </span>
                  </div>

                  {latestAssessment.recommendedPlan && (
                    <div className="bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Recommended Plan / Protocol</span>
                      <p className="text-sm font-black text-white">{latestAssessment.recommendedPlan}</p>
                    </div>
                  )}

                  {latestAssessment.coachFeedback && (
                    <div className="bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Coach Diagnostic Notes</span>
                      <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">{latestAssessment.coachFeedback}</p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onNavigateTab('subscription')}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase px-5 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>Explore Training Plans</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* DIAGNOSTIC PROFILE DETAILS */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  YOUR DIAGNOSTIC INTAKE PROFILE
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Primary Goal</span>
                    <span className="font-bold text-[#CCFF00] block mt-0.5">{latestAssessment.primaryGoal}</span>
                  </div>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Main Obstacle</span>
                    <span className="font-bold text-white block mt-0.5">{latestAssessment.mainObstacle || 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Experience Level</span>
                    <span className="font-bold text-white block mt-0.5">{latestAssessment.experienceLevel || 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Weekly Days</span>
                    <span className="font-bold text-white block mt-0.5">{latestAssessment.weeklyCommitment || 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Location</span>
                    <span className="font-bold text-white block mt-0.5">{latestAssessment.trainingLocation || 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Equipment</span>
                    <span className="font-bold text-white block mt-0.5">{latestAssessment.equipment || 'N/A'}</span>
                  </div>
                </div>

                {latestAssessment.hasInjury && latestAssessment.hasInjury.toLowerCase() !== 'no' && (
                  <div className="bg-amber-950/30 border border-amber-600/50 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-400 uppercase text-[10px] block">YOUR RECORDED INJURY / MEDICAL RESTRICTION:</strong>
                      <span>{latestAssessment.hasInjury}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
