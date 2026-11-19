import React from "react";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { MONTHLY_OPTIONS } from "./constants";

interface MonthlyPlanStepProps {
  monthlySessions: string[];
  setMonthlySessions: (sessions: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export const MonthlyPlanStep: React.FC<MonthlyPlanStepProps> = ({
  monthlySessions,
  setMonthlySessions,
  onBack,
  onNext,
}) => {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className="text-[11px] sm:text-xs font-bold text-[#CCFF00] tracking-wider uppercase mb-1.5">
          Step 1 of 1
        </p>
        <div className="w-full h-1 bg-[#CCFF00] rounded-full mb-4 sm:mb-6" />
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
          MONTHLY COACHING SESSIONS
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 sm:mt-2">
          User gets 1 Guided Warm-Up, 1 chosen service, and 1
          Cool-Down &amp; Recovery in each of the 12 sessions.
        </p>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-[#101218] border border-zinc-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-300 block">
            12 Sessions Included
          </span>
          <span className="text-[11px] sm:text-xs font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2.5 py-1 rounded-full shrink-0">
            Save £40 Launch Offer
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 max-h-80 overflow-y-auto pr-1">
          {monthlySessions.map((sessionService, idx) => (
            <div
              key={idx}
              className="p-2.5 sm:p-3 rounded-xl bg-[#14151e] border border-zinc-800 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 shrink-0">
                <Calendar className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span className="font-bold text-white whitespace-nowrap shrink-0">
                  Session {idx + 1}
                </span>
              </div>

              <div className="flex items-center justify-between xs:justify-end gap-1.5 shrink-0 whitespace-nowrap">
                <span className="text-[11px] font-bold text-[#CCFF00] whitespace-nowrap shrink-0 inline-block">
                  Warm-Up&nbsp;+
                </span>

                <select
                  value={sessionService}
                  onChange={(e) => {
                    const updated = [...monthlySessions];
                    updated[idx] = e.target.value;
                    setMonthlySessions(updated);
                  }}
                  className="bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-lg px-2 py-1.5 focus:border-[#CCFF00] focus:outline-hidden min-w-[125px] max-w-[155px] truncate cursor-pointer shrink-0"
                >
                  {MONTHLY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <span className="text-[11px] font-bold text-[#CCFF00] whitespace-nowrap shrink-0 inline-block">
                  +&nbsp;Recovery
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-row items-center justify-between gap-2.5 sm:gap-3 pt-4 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={onBack}
          className="px-4 sm:px-5 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md"
        >
          <span>NEXT: CHECKOUT &amp; TERMS</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
