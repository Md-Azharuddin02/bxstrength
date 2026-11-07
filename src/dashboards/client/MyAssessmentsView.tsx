import React from 'react';
import { User, AthleteAssessment } from '../../types';
import {
  ClipboardCheck, CheckCircle2, Clock, Sparkles, ChevronRight
} from 'lucide-react';
import { decodeHtmlEntities } from '../../services/api';

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

  const isReviewed = latestAssessment?.status === 'Reviewed' || latestAssessment?.status === 'Completed';

  const formatSubmittedDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr || 'Recently';
    }
  };

  const formatContactMethod = (method?: string) => {
    if (!method) return 'Not specified';
    const m = method.toLowerCase().trim();
    if (m === 'whatsapp') return 'WhatsApp';
    if (m === 'email') return 'Email';
    if (m === 'call') return 'Phone Call';
    return method;
  };

  return (
    <div className="space-y-6 text-white font-sans">
      {/* STATE 1: NO ASSESSMENT YET (Clean, simple card without duplicate banners) */}
      {!hasAssessment && (
        <div className="bg-[#121215] border border-zinc-800 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00] shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#CCFF00] font-mono">
                ATHLETIC ONBOARDING
              </span>
              <h2 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">
                You Haven't Submitted Your Athletic Assessment Yet!
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Take 5 minutes to complete your diagnostic fitness assessment. Share your goals, training days, and injury history so our Head Coach can build your tailored training roadmap.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAssessment}
            className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase px-6 py-3.5 rounded-xl transition-all shadow-xl shadow-[#CCFF00]/20 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>Start Free Assessment</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STATE 2: ASSESSMENT SUBMITTED & IN RECORD (Only actual submitted answers) */}
      {hasAssessment && latestAssessment && (
        <div className="bg-[#121215] border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                isReviewed
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              }`}>
                {isReviewed ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <Clock className="w-7 h-7 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 border border-amber-800/80 rounded">
                    REF: {latestAssessment.id}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono ${
                    isReviewed
                      ? 'bg-emerald-500 text-black'
                      : 'bg-amber-500 text-black'
                  }`}>
                    {isReviewed ? '✓ REVIEWED BY HEAD COACH' : '● UNDER HEAD COACH REVIEW'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight mt-1">
                  Athletic Self-Assessment Profile
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 self-start sm:self-auto">
              Submitted: <strong className="text-white">{formatSubmittedDate(latestAssessment.createdAt)}</strong>
            </span>
          </div>

          {/* Coach Recommendations & Protocol (if reviewed and feedback added by coach) */}
          {(latestAssessment.recommendedPlan || latestAssessment.coachFeedback) && (
            <div className="bg-emerald-950/20 border-2 border-emerald-500/50 p-5 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  COACHING RECOMMENDATIONS & PROTOCOL
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  Coach: {latestAssessment.assignedCoachName || 'Head Coach'}
                </span>
              </div>

              {latestAssessment.recommendedPlan && (
                <div className="bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Recommended Plan / Protocol:</span>
                  <p className="text-sm font-black text-white">{decodeHtmlEntities(latestAssessment.recommendedPlan)}</p>
                </div>
              )}

              {latestAssessment.coachFeedback && (
                <div className="bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Coach Diagnostic Notes:</span>
                  <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">{decodeHtmlEntities(latestAssessment.coachFeedback)}</p>
                </div>
              )}
            </div>
          )}

          {/* Real Submitted Intake Details (Only fields actually filled in form) */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
              YOUR SUBMITTED INTAKE RESPONSES:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Primary Goal</span>
                <p className="font-bold text-[#CCFF00] truncate">{decodeHtmlEntities(latestAssessment.primaryGoal || 'General Fitness')}</p>
              </div>

              <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Experience Level</span>
                <p className="font-bold text-white truncate">{decodeHtmlEntities(latestAssessment.experienceLevel || 'Beginner')}</p>
              </div>

              <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Weekly Commitment</span>
                <p className="font-bold text-white truncate">{decodeHtmlEntities(latestAssessment.weeklyCommitment || '3 Days/Wk')}</p>
              </div>

              <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Training Location</span>
                <p className="font-bold text-white truncate">{decodeHtmlEntities(latestAssessment.trainingLocation || 'Home')}</p>
              </div>

              <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Equipment Available</span>
                <p className="font-bold text-white truncate">{decodeHtmlEntities(latestAssessment.equipment || 'Bodyweight / Dumbbells')}</p>
              </div>

              <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Mode of Contact</span>
                <p className="font-bold text-[#CCFF00] truncate">
                  {formatContactMethod(latestAssessment.preferredContactMethod)}
                </p>
              </div>
            </div>

            {/* Injury Row */}
            <div className="bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-800/80 space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Injury / Medical Restrictions</span>
              <p className={`font-bold ${latestAssessment.hasInjury && latestAssessment.hasInjury.toLowerCase() !== 'no' ? 'text-amber-400' : 'text-zinc-300'}`}>
                {latestAssessment.hasInjury && latestAssessment.hasInjury.toLowerCase() !== 'no'
                  ? decodeHtmlEntities(latestAssessment.hasInjury)
                  : 'No injuries or medical restrictions reported'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
